/**
 * Content Index Service
 *
 * Provides indexing and search functionality for CMS content.
 * Content entries are stored in IndexedDB for fast local search
 * and hierarchical navigation (content trees).
 *
 * The index supports:
 * - Full-text keyword search across titles, keywords, and summaries
 * - Hierarchical content trees for package navigation
 * - Filtering by type, package, and author
 * - Statistics for dashboard metrics
 */

import { db } from '@/lib/db';
import type { ContentIndexEntry, ContentType } from '@/lib/db';

// =============================================================================
// Types
// =============================================================================

/** Options for searching content */
export interface SearchOptions {
  type?: ContentType;
  packageSlug?: string;
  authorId?: string;
  limit?: number;
}

/** Index statistics */
export interface IndexStats {
  totalItems: number;
  byType: Record<string, number>;
}

// =============================================================================
// Indexing Functions
// =============================================================================

/**
 * Index a content item
 *
 * Adds or updates a content entry in the search index.
 * The `cachedAt` timestamp is automatically set to the current time.
 *
 * @param entry - Content entry data (without cachedAt)
 */
export async function indexContent(
  entry: Omit<ContentIndexEntry, 'cachedAt'>
): Promise<void> {
  if (!entry.id || typeof entry.id !== 'string') {
    throw new Error('Content entry must have a valid id');
  }

  if (!entry.packageSlug || typeof entry.packageSlug !== 'string') {
    throw new Error('Content entry must have a valid packageSlug');
  }

  const fullEntry: ContentIndexEntry = {
    ...entry,
    cachedAt: new Date(),
  };

  // Use put to insert or update (upsert behavior)
  await db.contentIndex.put(fullEntry);
}

/**
 * Remove content from index
 *
 * Deletes a content entry by its ID. Silently succeeds if the
 * entry doesn't exist.
 *
 * @param id - The content ID to remove
 */
export async function removeFromIndex(id: string): Promise<void> {
  if (!id || typeof id !== 'string') {
    return;
  }

  await db.contentIndex.delete(id);
}

/**
 * Rebuild index for a package
 *
 * Clears all existing entries for a package and re-indexes
 * with the provided items. This is useful when syncing a
 * package from a hub or performing bulk updates.
 *
 * @param packageSlug - The package to rebuild
 * @param items - New content entries to index
 */
export async function rebuildIndex(
  packageSlug: string,
  items: Omit<ContentIndexEntry, 'cachedAt'>[]
): Promise<void> {
  if (!packageSlug || typeof packageSlug !== 'string') {
    throw new Error('Package slug is required');
  }

  // Use a transaction for atomic rebuild
  await db.transaction('rw', db.contentIndex, async () => {
    // Delete all existing entries for this package
    await db.contentIndex.where('packageSlug').equals(packageSlug).delete();

    // Add all new entries with timestamp
    const now = new Date();
    const fullEntries: ContentIndexEntry[] = items.map((item) => ({
      ...item,
      cachedAt: now,
    }));

    if (fullEntries.length > 0) {
      await db.contentIndex.bulkPut(fullEntries);
    }
  });
}

/**
 * Clear entire index
 *
 * Removes all content entries from the index.
 * Use with caution - this is typically only needed for
 * factory reset or testing scenarios.
 */
export async function clearIndex(): Promise<void> {
  await db.contentIndex.clear();
}

// =============================================================================
// Search Functions
// =============================================================================

/**
 * Search content by keywords
 *
 * Performs a case-insensitive search across title, keywords, and summary.
 * Results are ranked by relevance (title matches first, then keywords,
 * then summary).
 *
 * @param query - Search query string
 * @param options - Optional filters and limits
 * @returns Matching content entries sorted by relevance
 */
export async function searchContent(
  query: string,
  options: SearchOptions = {}
): Promise<ContentIndexEntry[]> {
  const { type, packageSlug, authorId, limit = 50 } = options;

  // Normalize search terms
  const searchTerms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  if (searchTerms.length === 0) {
    return [];
  }

  // Start with base query - apply index filters first for performance
  let collection = db.contentIndex.toCollection();

  // Apply indexed filters when available
  if (packageSlug) {
    collection = db.contentIndex.where('packageSlug').equals(packageSlug);
  }

  // Get all potential matches
  let entries = await collection.toArray();

  // Apply additional filters
  if (type) {
    entries = entries.filter((entry) => entry.type === type);
  }

  if (authorId) {
    entries = entries.filter((entry) => entry.authorId === authorId);
  }

  // Score and filter by search terms
  const scored = entries
    .map((entry) => {
      const titleLower = entry.title.toLowerCase();
      const keywordsLower = entry.keywords.toLowerCase();
      const summaryLower = (entry.summary ?? '').toLowerCase();

      let score = 0;

      for (const term of searchTerms) {
        // Title matches are most valuable
        if (titleLower.includes(term)) {
          score += 10;
          // Exact title match bonus
          if (titleLower === term) {
            score += 5;
          }
        }

        // Keyword matches
        if (keywordsLower.includes(term)) {
          score += 5;
        }

        // Summary matches
        if (summaryLower.includes(term)) {
          score += 2;
        }
      }

      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry);

  return scored;
}

// =============================================================================
// Tree/Hierarchy Functions
// =============================================================================

/**
 * Get content tree for a package
 *
 * Returns all content entries for a package, sorted hierarchically
 * by parent-child relationships and order within each level.
 * Root items (parentId === null) come first, followed by their children.
 *
 * @param packageSlug - The package to get the tree for
 * @returns Content entries sorted in tree order
 */
export async function getContentTree(
  packageSlug: string
): Promise<ContentIndexEntry[]> {
  if (!packageSlug || typeof packageSlug !== 'string') {
    return [];
  }

  // Get all entries for this package
  const entries = await db.contentIndex
    .where('packageSlug')
    .equals(packageSlug)
    .toArray();

  // Build a map for efficient lookups
  const entriesById = new Map<string, ContentIndexEntry>();
  const childrenByParent = new Map<string | null, ContentIndexEntry[]>();

  for (const entry of entries) {
    entriesById.set(entry.id, entry);

    const parentKey = entry.parentId;
    if (!childrenByParent.has(parentKey)) {
      childrenByParent.set(parentKey, []);
    }
    childrenByParent.get(parentKey)!.push(entry);
  }

  // Sort children by order
  for (const children of childrenByParent.values()) {
    children.sort((a, b) => a.order - b.order);
  }

  // Build tree in depth-first order
  const result: ContentIndexEntry[] = [];

  function addWithChildren(entry: ContentIndexEntry): void {
    result.push(entry);
    const children = childrenByParent.get(entry.id) ?? [];
    for (const child of children) {
      addWithChildren(child);
    }
  }

  // Start with root items (no parent)
  const roots = childrenByParent.get(null) ?? [];
  for (const root of roots) {
    addWithChildren(root);
  }

  return result;
}

/**
 * Get children of a parent
 *
 * Returns all direct children of a content entry, sorted by order.
 *
 * @param parentId - The parent content ID
 * @returns Child content entries sorted by order
 */
export async function getChildren(
  parentId: string
): Promise<ContentIndexEntry[]> {
  if (!parentId || typeof parentId !== 'string') {
    return [];
  }

  const children = await db.contentIndex
    .where('parentId')
    .equals(parentId)
    .toArray();

  // Sort by order
  return children.sort((a, b) => a.order - b.order);
}

// =============================================================================
// Statistics Functions
// =============================================================================

/**
 * Get index statistics
 *
 * Returns aggregate statistics about the content index including
 * total item count and breakdown by content type.
 *
 * @returns Index statistics object
 */
export async function getIndexStats(): Promise<IndexStats> {
  const entries = await db.contentIndex.toArray();

  const byType: Record<string, number> = {};

  for (const entry of entries) {
    byType[entry.type] = (byType[entry.type] ?? 0) + 1;
  }

  return {
    totalItems: entries.length,
    byType,
  };
}
