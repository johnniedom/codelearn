/**
 * Asset Service
 *
 * Manages local assets (images, videos, audio, documents) for the CMS.
 * Uses the Cache API for efficient binary storage and IndexedDB for metadata.
 *
 * Storage Strategy:
 * - Binary files are stored in Cache API for efficient blob handling
 * - Metadata (filename, tags, size, etc.) stored in IndexedDB
 * - Thumbnails generated for images using canvas API
 * - Maximum file size: 50MB
 *
 * This enables authors to work with assets offline and sync to hub later.
 */

import { db } from '@/lib/db';
import type { LocalAsset, AssetType } from '@/lib/db';

// =============================================================================
// Constants
// =============================================================================

const ASSET_CACHE_NAME = 'codelearn-assets-v1';
const THUMBNAIL_CACHE_NAME = 'codelearn-thumbnails-v1';
const MAX_ASSET_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_THUMBNAIL_SIZE = 200; // Max dimension for thumbnails

/** MIME type to AssetType mapping */
const MIME_TYPE_MAP: Record<string, AssetType> = {
  // Images
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  'image/bmp': 'image',
  'image/tiff': 'image',

  // Video
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/ogg': 'video',
  'video/quicktime': 'video',
  'video/x-msvideo': 'video',

  // Audio
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/webm': 'audio',
  'audio/aac': 'audio',
  'audio/flac': 'audio',

  // Documents
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'document',
  'application/vnd.ms-excel': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    'document',
  'application/vnd.ms-powerpoint': 'document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'document',
  'text/plain': 'document',
  'text/markdown': 'document',
  'text/csv': 'document',
  'application/json': 'document',
};

// =============================================================================
// Types
// =============================================================================

/** Result of file validation */
export interface AssetValidation {
  valid: boolean;
  error?: string;
  assetType?: AssetType;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate cache path for an asset
 */
function getAssetCachePath(id: string): string {
  return `/assets/${id}`;
}

/**
 * Generate cache path for a thumbnail
 */
function getThumbnailCachePath(assetId: string): string {
  return `/thumbnails/${assetId}`;
}

/**
 * Determine asset type from MIME type
 */
function getAssetTypeFromMime(mimeType: string): AssetType {
  return MIME_TYPE_MAP[mimeType] ?? 'other';
}

/**
 * Check if a MIME type supports thumbnails
 */
function supportsThumbnail(mimeType: string): boolean {
  // Only generate thumbnails for raster images
  const thumbnailTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
  ];
  return thumbnailTypes.includes(mimeType);
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate file before upload
 *
 * Checks file size and type to ensure it can be stored as an asset.
 * Returns the detected asset type if valid.
 *
 * @param file - The file to validate
 * @returns Validation result with asset type
 */
export function validateAssetFile(file: File): AssetValidation {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (file.size > MAX_ASSET_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const maxMB = (MAX_ASSET_SIZE / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File too large (${sizeMB}MB). Maximum size is ${maxMB}MB.`,
    };
  }

  const assetType = getAssetTypeFromMime(file.type);

  return {
    valid: true,
    assetType,
  };
}

// =============================================================================
// Upload and Storage
// =============================================================================

/**
 * Upload and store an asset
 *
 * Stores the file in Cache API and metadata in IndexedDB.
 * For images, automatically generates a thumbnail.
 *
 * @param authorId - The author's user ID
 * @param file - The file to upload
 * @param tags - Optional tags for organization
 * @returns The created asset metadata
 */
export async function uploadAsset(
  authorId: string,
  file: File,
  tags: string[] = []
): Promise<LocalAsset> {
  // Validate inputs
  if (!authorId || typeof authorId !== 'string') {
    throw new Error('Author ID is required');
  }

  const validation = validateAssetFile(file);
  if (!validation.valid) {
    throw new Error(validation.error ?? 'Invalid file');
  }

  // Check Cache API availability
  if (typeof caches === 'undefined') {
    throw new Error('Cache API not available in this browser');
  }

  // Generate unique ID
  const id = crypto.randomUUID();
  const cachePath = getAssetCachePath(id);
  const now = new Date();

  try {
    // Store file in Cache API
    const cache = await caches.open(ASSET_CACHE_NAME);
    const arrayBuffer = await file.arrayBuffer();
    const response = new Response(arrayBuffer, {
      headers: {
        'Content-Type': file.type,
        'Content-Length': String(file.size),
        'X-Asset-Filename': encodeURIComponent(file.name),
        'X-Asset-Stored-At': now.toISOString(),
      },
    });

    await cache.put(cachePath, response);

    // Generate thumbnail for images
    let thumbnailPath: string | null = null;
    if (supportsThumbnail(file.type)) {
      thumbnailPath = await generateThumbnail(id, file);
    }

    // Create metadata record
    const asset: LocalAsset = {
      id,
      authorId,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      assetType: validation.assetType!,
      tags: JSON.stringify(tags),
      thumbnailPath,
      cachePath,
      createdAt: now,
      updatedAt: now,
    };

    // Store metadata in IndexedDB
    await db.localAssets.put(asset);

    return asset;
  } catch (error) {
    // Clean up on failure
    try {
      const cache = await caches.open(ASSET_CACHE_NAME);
      await cache.delete(cachePath);
    } catch {
      // Ignore cleanup errors
    }

    console.error('[AssetService] Failed to upload asset:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to upload asset'
    );
  }
}

// =============================================================================
// Retrieval
// =============================================================================

/**
 * Get asset metadata
 *
 * @param id - The asset ID
 * @returns Asset metadata or undefined if not found
 */
export async function getAsset(id: string): Promise<LocalAsset | undefined> {
  if (!id || typeof id !== 'string') {
    return undefined;
  }

  return db.localAssets.get(id);
}

/**
 * Get asset URL from cache
 *
 * Returns a blob URL that can be used as an image/video/audio src.
 * The caller is responsible for revoking the URL when done using
 * URL.revokeObjectURL() to prevent memory leaks.
 *
 * @param id - The asset ID
 * @returns Blob URL string or null if not found
 */
export async function getAssetUrl(id: string): Promise<string | null> {
  if (!id || typeof id !== 'string') {
    return null;
  }

  try {
    if (typeof caches === 'undefined') {
      return null;
    }

    // Get metadata first to get cache path
    const asset = await db.localAssets.get(id);
    if (!asset) {
      return null;
    }

    const cache = await caches.open(ASSET_CACHE_NAME);
    const response = await cache.match(asset.cachePath);

    if (!response) {
      return null;
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('[AssetService] Failed to get asset URL:', error);
    return null;
  }
}

/**
 * Get all assets for an author
 *
 * @param authorId - The author's user ID
 * @param assetType - Optional filter by asset type
 * @returns Array of asset metadata
 */
export async function getAuthorAssets(
  authorId: string,
  assetType?: AssetType
): Promise<LocalAsset[]> {
  if (!authorId || typeof authorId !== 'string') {
    return [];
  }

  let assets: LocalAsset[];

  if (assetType) {
    assets = await db.localAssets
      .where('[authorId+assetType]')
      .equals([authorId, assetType])
      .toArray();
  } else {
    assets = await db.localAssets.where('authorId').equals(authorId).toArray();
  }

  // Sort by creation date (newest first)
  return assets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// =============================================================================
// Deletion
// =============================================================================

/**
 * Delete asset
 *
 * Removes both the cached file and metadata.
 *
 * @param id - The asset ID to delete
 */
export async function deleteAsset(id: string): Promise<void> {
  if (!id || typeof id !== 'string') {
    return;
  }

  try {
    // Get metadata first
    const asset = await db.localAssets.get(id);
    if (!asset) {
      return;
    }

    // Delete from Cache API
    if (typeof caches !== 'undefined') {
      const cache = await caches.open(ASSET_CACHE_NAME);
      await cache.delete(asset.cachePath);

      // Delete thumbnail if exists
      if (asset.thumbnailPath) {
        const thumbnailCache = await caches.open(THUMBNAIL_CACHE_NAME);
        await thumbnailCache.delete(asset.thumbnailPath);
      }
    }

    // Delete metadata
    await db.localAssets.delete(id);
  } catch (error) {
    console.error('[AssetService] Failed to delete asset:', error);
    // Don't throw - deletion should be idempotent
  }
}

// =============================================================================
// Update Operations
// =============================================================================

/**
 * Update asset tags
 *
 * @param id - The asset ID
 * @param tags - New tags array
 */
export async function updateAssetTags(
  id: string,
  tags: string[]
): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('Asset ID is required');
  }

  const asset = await db.localAssets.get(id);
  if (!asset) {
    throw new Error('Asset not found');
  }

  await db.localAssets.update(id, {
    tags: JSON.stringify(tags),
    updatedAt: new Date(),
  });
}

// =============================================================================
// Search
// =============================================================================

/**
 * Search assets by filename or tags
 *
 * Performs case-insensitive search across filename and tags.
 *
 * @param authorId - The author's user ID
 * @param query - Search query string
 * @returns Matching assets
 */
export async function searchAssets(
  authorId: string,
  query: string
): Promise<LocalAsset[]> {
  if (!authorId || typeof authorId !== 'string') {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) {
    return [];
  }

  // Get all assets for author
  const assets = await db.localAssets
    .where('authorId')
    .equals(authorId)
    .toArray();

  // Filter by search term
  const matches = assets.filter((asset) => {
    // Check filename
    if (asset.filename.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Check tags
    try {
      const tags: string[] = JSON.parse(asset.tags);
      return tags.some((tag) => tag.toLowerCase().includes(searchTerm));
    } catch {
      return false;
    }
  });

  // Sort by relevance (filename matches first, then by date)
  return matches.sort((a, b) => {
    const aFilename = a.filename.toLowerCase().includes(searchTerm);
    const bFilename = b.filename.toLowerCase().includes(searchTerm);

    if (aFilename && !bFilename) return -1;
    if (!aFilename && bFilename) return 1;

    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

// =============================================================================
// Storage Statistics
// =============================================================================

/**
 * Get total storage used by assets
 *
 * Calculates the sum of all asset file sizes for an author.
 *
 * @param authorId - The author's user ID
 * @returns Total bytes used
 */
export async function getAssetStorageUsed(authorId: string): Promise<number> {
  if (!authorId || typeof authorId !== 'string') {
    return 0;
  }

  const assets = await db.localAssets
    .where('authorId')
    .equals(authorId)
    .toArray();

  return assets.reduce((total, asset) => total + asset.size, 0);
}

// =============================================================================
// Thumbnail Generation
// =============================================================================

/**
 * Generate thumbnail for images
 *
 * Creates a smaller version of an image for preview purposes.
 * Maximum dimension is 200px while maintaining aspect ratio.
 *
 * @param assetId - The asset ID
 * @param file - The image file
 * @returns Cache path to thumbnail or null if generation failed
 */
export async function generateThumbnail(
  assetId: string,
  file: File
): Promise<string | null> {
  // Only generate for supported image types
  if (!supportsThumbnail(file.type)) {
    return null;
  }

  try {
    if (typeof caches === 'undefined') {
      return null;
    }

    // Create image element
    const imageUrl = URL.createObjectURL(file);

    try {
      const img = await loadImage(imageUrl);

      // Calculate thumbnail dimensions
      let { width, height } = img;
      const maxSize = MAX_THUMBNAIL_SIZE;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      // Create canvas and draw scaled image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (b) => resolve(b),
          'image/jpeg',
          0.8 // Quality for JPEG
        );
      });

      if (!blob) {
        return null;
      }

      // Store thumbnail in cache
      const thumbnailPath = getThumbnailCachePath(assetId);
      const cache = await caches.open(THUMBNAIL_CACHE_NAME);
      const response = new Response(blob, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': String(blob.size),
        },
      });

      await cache.put(thumbnailPath, response);

      return thumbnailPath;
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  } catch (error) {
    console.error('[AssetService] Failed to generate thumbnail:', error);
    return null;
  }
}

/**
 * Helper to load an image and wait for it to be ready
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Get thumbnail URL
 *
 * Returns a blob URL for the thumbnail if it exists.
 * The caller is responsible for revoking the URL when done.
 *
 * @param assetId - The asset ID
 * @returns Blob URL string or null if no thumbnail
 */
export async function getThumbnailUrl(assetId: string): Promise<string | null> {
  if (!assetId || typeof assetId !== 'string') {
    return null;
  }

  try {
    if (typeof caches === 'undefined') {
      return null;
    }

    const asset = await db.localAssets.get(assetId);
    if (!asset?.thumbnailPath) {
      return null;
    }

    const cache = await caches.open(THUMBNAIL_CACHE_NAME);
    const response = await cache.match(asset.thumbnailPath);

    if (!response) {
      return null;
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('[AssetService] Failed to get thumbnail URL:', error);
    return null;
  }
}
