/**
 * CMS Type Definitions
 *
 * Types specific to the Content Management System functionality,
 * including drafts, content indexing, and local asset management.
 */

// =============================================================================
// Content Types
// =============================================================================

/** Content types that can be created in CMS */
export type ContentType = 'lesson' | 'quiz' | 'exercise';

/** Draft status */
export type DraftStatus = 'editing' | 'review' | 'approved' | 'published';

/** Asset types */
export type AssetType = 'image' | 'audio' | 'video' | 'document';

// =============================================================================
// Database Entity Interfaces
// =============================================================================

/** Content draft for local editing */
export interface ContentDraft {
  id: string;
  authorId: string;
  contentType: ContentType;
  targetId: string | null;      // ID of existing content being edited, null for new
  title: string;
  content: string;              // JSON stringified content data
  status: DraftStatus;
  createdAt: Date;
  updatedAt: Date;
  autoSavedAt: Date | null;
}

/** Content index entry for search/browse */
export interface ContentIndexEntry {
  id: string;
  packageSlug: string;
  type: 'course' | 'module' | 'lesson' | 'quiz' | 'exercise';
  title: string;
  keywords: string;             // Space-separated keywords for search
  parentId: string | null;
  orderIndex: number;
  status: string;
  authorId: string | null;
  cachedAt: Date;
  checksum: string;
}

/** Local asset metadata */
export interface LocalAsset {
  id: string;
  authorId: string;
  filename: string;
  mimeType: string;
  size: number;
  assetType: AssetType;
  cachePath: string;            // Path in Cache API
  thumbnailPath: string | null;
  createdAt: Date;
  tags: string;                 // JSON stringified array
}
