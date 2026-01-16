/**
 * Draft Service
 *
 * Service for managing content drafts with auto-save functionality.
 * Provides CRUD operations for drafts and a debounced auto-saver
 * for seamless content editing experience.
 *
 * Features:
 * - Create, read, update, delete drafts
 * - Auto-save with configurable debounce
 * - Filter by author, content type, and status
 * - Search drafts by title
 * - Draft count aggregation by status
 */

import { db } from '@/lib/db';
import type { ContentDraft, ContentType, DraftStatus, LocalAsset } from '@/lib/db';
import { getAsset } from './asset-service';

/** Auto-save debounce time in ms */
const AUTO_SAVE_DELAY = 2000;

// =============================================================================
// Draft CRUD Operations
// =============================================================================

/**
 * Create a new draft
 *
 * @param authorId - The ID of the author creating the draft
 * @param contentType - The type of content being drafted
 * @param title - Optional initial title for the draft
 * @returns The newly created draft
 */
export async function createDraft(
  authorId: string,
  contentType: ContentType,
  title?: string
): Promise<ContentDraft> {
  const now = new Date();
  const draft: ContentDraft = {
    id: crypto.randomUUID(),
    authorId,
    contentType,
    targetId: null,
    title: title ?? 'Untitled',
    content: '',
    status: 'editing',
    createdAt: now,
    updatedAt: now,
    autoSavedAt: null,
  };

  await db.contentDrafts.add(draft);
  return draft;
}

/**
 * Get draft by ID
 *
 * @param id - The unique identifier of the draft
 * @returns The draft if found, undefined otherwise
 */
export async function getDraft(id: string): Promise<ContentDraft | undefined> {
  return db.contentDrafts.get(id);
}

/**
 * Get all drafts for an author
 *
 * Supports optional filtering by content type and status.
 * Results are sorted by most recently updated first.
 *
 * @param authorId - The ID of the author
 * @param contentType - Optional filter by content type
 * @param status - Optional filter by draft status
 * @returns Array of drafts matching the criteria
 */
export async function getAuthorDrafts(
  authorId: string,
  contentType?: ContentType,
  status?: DraftStatus
): Promise<ContentDraft[]> {
  let collection = db.contentDrafts.where('authorId').equals(authorId);

  // Apply additional filters if provided
  if (contentType !== undefined || status !== undefined) {
    collection = collection.and((draft) => {
      if (contentType !== undefined && draft.contentType !== contentType) {
        return false;
      }
      if (status !== undefined && draft.status !== status) {
        return false;
      }
      return true;
    });
  }

  // Sort by updatedAt descending (most recent first)
  const drafts = await collection.toArray();
  return drafts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

/**
 * Update draft content (used by auto-save)
 *
 * Updates the draft's title and/or content along with timestamps.
 * Both updatedAt and autoSavedAt are set to the current time.
 *
 * @param id - The unique identifier of the draft
 * @param updates - Object containing title, content, and/or status updates
 * @throws Error if the draft is not found
 */
export async function updateDraft(
  id: string,
  updates: Partial<Pick<ContentDraft, 'title' | 'content' | 'status'>>
): Promise<void> {
  const now = new Date();

  const updateCount = await db.contentDrafts.update(id, {
    ...updates,
    updatedAt: now,
    autoSavedAt: now,
  });

  if (updateCount === 0) {
    throw new Error(`Draft not found: ${id}`);
  }
}

/**
 * Update draft status
 *
 * Changes the workflow status of a draft (e.g., from editing to review).
 *
 * @param id - The unique identifier of the draft
 * @param status - The new status to set
 * @throws Error if the draft is not found
 */
export async function updateDraftStatus(
  id: string,
  status: DraftStatus
): Promise<void> {
  const updateCount = await db.contentDrafts.update(id, {
    status,
    updatedAt: new Date(),
  });

  if (updateCount === 0) {
    throw new Error(`Draft not found: ${id}`);
  }
}

/**
 * Delete draft
 *
 * Permanently removes a draft from storage.
 *
 * @param id - The unique identifier of the draft to delete
 */
export async function deleteDraft(id: string): Promise<void> {
  await db.contentDrafts.delete(id);
}

/**
 * Delete all drafts for an author
 *
 * Removes all drafts belonging to a specific author.
 * Useful for account cleanup or bulk operations.
 *
 * @param authorId - The ID of the author whose drafts to delete
 * @returns The number of drafts deleted
 */
export async function deleteAuthorDrafts(authorId: string): Promise<number> {
  return db.contentDrafts.where('authorId').equals(authorId).delete();
}

// =============================================================================
// Auto-Save Functionality
// =============================================================================

interface PendingSave {
  content: string;
  title?: string;
}

interface AutoSaver {
  save: (content: string, title?: string) => void;
  flush: () => Promise<void>;
  cancel: () => void;
}

/**
 * Auto-save hook for React components
 *
 * Returns a debounced save function that automatically persists
 * draft content after a delay. Useful for providing seamless
 * editing experience without manual save buttons.
 *
 * @param draftId - The ID of the draft to save to
 * @param onSave - Optional callback invoked after successful save
 * @param onError - Optional callback invoked on save error
 * @returns Object with save, flush, and cancel methods
 *
 * @example
 * ```tsx
 * const autoSaver = createAutoSaver(draftId, () => {
 *   console.log('Saved!');
 * });
 *
 * // In your onChange handler:
 * const handleChange = (content: string) => {
 *   setContent(content);
 *   autoSaver.save(content);
 * };
 *
 * // On unmount or before navigation:
 * useEffect(() => {
 *   return () => {
 *     autoSaver.flush();
 *   };
 * }, []);
 * ```
 */
export function createAutoSaver(
  draftId: string,
  onSave?: () => void,
  onError?: (error: Error) => void
): AutoSaver {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingSave: PendingSave | null = null;
  let isFlushing = false;

  /**
   * Perform the actual save operation
   */
  const performSave = async (): Promise<void> => {
    if (!pendingSave) {
      return;
    }

    const { content, title } = pendingSave;
    pendingSave = null;

    try {
      await updateDraft(draftId, {
        content,
        ...(title !== undefined && { title }),
      });
      onSave?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to save draft');
      console.error('[DraftService] Auto-save failed:', err);
      onError?.(err);
    }
  };

  /**
   * Queue a save operation with debounce
   */
  const save = (content: string, title?: string): void => {
    // Don't accept new saves while flushing
    if (isFlushing) {
      return;
    }

    // Store the pending save data
    pendingSave = { content, title };

    // Clear any existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Schedule new save
    timeoutId = setTimeout(() => {
      timeoutId = null;
      void performSave();
    }, AUTO_SAVE_DELAY);
  };

  /**
   * Immediately save any pending changes
   * Useful before navigation or component unmount
   */
  const flush = async (): Promise<void> => {
    isFlushing = true;

    // Clear pending timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // Perform save if there's pending data
    await performSave();

    isFlushing = false;
  };

  /**
   * Cancel any pending save without saving
   */
  const cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingSave = null;
  };

  return { save, flush, cancel };
}

// =============================================================================
// Draft with Assets
// =============================================================================

/**
 * Get draft with all referenced assets
 *
 * Fetches the draft and extracts asset references from the content.
 * Returns both the draft and the asset metadata.
 *
 * @param id - The draft ID
 * @returns Draft with assets or undefined if not found
 */
export async function getDraftWithAssets(id: string): Promise<{
  draft: ContentDraft;
  assets: LocalAsset[];
} | undefined> {
  // 1. Get the draft
  const draft = await getDraft(id);
  if (!draft) {
    return undefined;
  }

  // 2. Parse the content JSON to find asset references
  const assetIds = extractAssetIds(draft.content);

  // 3. Fetch each referenced asset's metadata
  const assetPromises = assetIds.map((assetId) => getAsset(assetId));
  const assetResults = await Promise.all(assetPromises);

  // Filter out undefined (assets that no longer exist)
  const assets = assetResults.filter((asset): asset is LocalAsset => asset !== undefined);

  // 4. Return both
  return { draft, assets };
}

/**
 * Extract asset IDs from content JSON
 *
 * Searches for UUID patterns in the content that represent asset references.
 * Assets are typically referenced by their ID in image blocks, file attachments, etc.
 *
 * @param content - JSON stringified content
 * @returns Array of unique asset IDs found in the content
 */
function extractAssetIds(content: string): string[] {
  if (!content) {
    return [];
  }

  // UUID v4 pattern to find asset IDs in the content
  // Asset IDs follow the format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

  const matches = content.match(uuidPattern);
  if (!matches) {
    return [];
  }

  // Return unique IDs only
  return [...new Set(matches)];
}

// =============================================================================
// Query Operations
// =============================================================================

/**
 * Get draft count by status
 *
 * Returns a count of drafts for each status value.
 * Useful for displaying dashboard statistics.
 *
 * @param authorId - The ID of the author
 * @returns Record mapping each DraftStatus to its count
 */
export async function getDraftCounts(
  authorId: string
): Promise<Record<DraftStatus, number>> {
  const drafts = await db.contentDrafts
    .where('authorId')
    .equals(authorId)
    .toArray();

  // Initialize counts for all statuses
  const counts: Record<DraftStatus, number> = {
    editing: 0,
    review: 0,
    approved: 0,
    published: 0,
  };

  // Count drafts by status
  for (const draft of drafts) {
    counts[draft.status]++;
  }

  return counts;
}

/**
 * Search drafts by title
 *
 * Performs a case-insensitive search on draft titles.
 * Results are sorted by relevance (exact matches first)
 * then by most recently updated.
 *
 * @param authorId - The ID of the author
 * @param query - The search query string
 * @returns Array of drafts matching the search query
 */
export async function searchDrafts(
  authorId: string,
  query: string
): Promise<ContentDraft[]> {
  // Normalize query for case-insensitive search
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return [];
  }

  const drafts = await db.contentDrafts
    .where('authorId')
    .equals(authorId)
    .filter((draft) => draft.title.toLowerCase().includes(normalizedQuery))
    .toArray();

  // Sort by relevance: exact matches first, then by updatedAt
  return drafts.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();

    // Exact match gets highest priority
    const aExact = aTitle === normalizedQuery;
    const bExact = bTitle === normalizedQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // Starts-with match gets second priority
    const aStarts = aTitle.startsWith(normalizedQuery);
    const bStarts = bTitle.startsWith(normalizedQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    // Otherwise sort by most recently updated
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}
