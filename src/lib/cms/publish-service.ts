/**
 * Publish Service
 *
 * Core publishing logic for the CMS. Handles validation, packaging,
 * and uploading content drafts to the learning hub.
 *
 * Features:
 * - Draft validation before publishing
 * - Content packaging with manifest generation
 * - SHA-256 checksums for integrity verification
 * - ZIP package creation using native Blob/ArrayBuffer APIs
 * - Upload to hub API with retry support
 *
 * Package Structure:
 * ```
 * {slug}-v{version}.zip
 * ├── manifest.json
 * ├── content.json
 * └── assets/
 *     ├── image-001.png
 *     └── audio-001.mp3
 * ```
 */

import { db } from '@/lib/db';
import type { ContentDraft } from '@/lib/db';
import { sha256 } from 'hash-wasm';
import { getAsset, getAssetUrl } from './asset-service';

// =============================================================================
// Constants
// =============================================================================

/** Current manifest schema version */
const SCHEMA_VERSION = '1.0.0' as const;

/** Default titles that indicate incomplete content */
const DEFAULT_TITLES = ['Untitled', 'New Lesson', 'New Quiz', 'New Exercise', ''];

/** Minimum content length to be considered substantial */
const MIN_CONTENT_LENGTH = 50;

/** Maximum retries for upload */
const MAX_UPLOAD_RETRIES = 3;

/** Retry delay in milliseconds */
const RETRY_DELAY_MS = 1000;

// =============================================================================
// Types
// =============================================================================

/** Content types that can be published */
export type PublishableContentType = 'lesson' | 'quiz' | 'exercise' | 'course';

/**
 * Publishable content structure
 *
 * Represents content that has been prepared for publishing,
 * including all assets and metadata.
 */
export interface PublishableContent {
  type: PublishableContentType;
  id: string;
  slug: string;
  content: unknown;
  assets: AssetReference[];
}

/**
 * Reference to an asset included in a package
 */
export interface AssetReference {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Package manifest containing metadata and checksums
 *
 * This is the authoritative record of package contents
 * used for integrity verification on the hub.
 */
export interface PackageManifest {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  slug: string;
  type: PublishableContentType;
  version: string;
  createdAt: string;
  author: { id: string; name: string };
  contentHash: string;
  assetsHash: string;
  totalSizeBytes: number;
}

/**
 * Result of draft validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Result of publish operation
 */
export interface PublishResult {
  success: boolean;
  contentId?: string;
  publishedAt?: string;
  error?: string;
  validationErrors?: string[];
}

/** Internal type for fetched asset with binary data */
interface FetchedAsset extends AssetReference {
  data: ArrayBuffer;
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate a draft before publishing
 *
 * Checks that all required fields are present and have meaningful content.
 * Returns both errors (blocking) and warnings (advisory).
 *
 * @param draft - The content draft to validate
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```ts
 * const result = validateDraftForPublish(draft);
 * if (!result.valid) {
 *   console.error('Cannot publish:', result.errors);
 * }
 * ```
 */
export function validateDraftForPublish(draft: ContentDraft): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for valid draft object
  if (!draft) {
    return {
      valid: false,
      errors: ['Draft is required'],
      warnings: [],
    };
  }

  // Validate title
  if (!draft.title || draft.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (DEFAULT_TITLES.includes(draft.title.trim())) {
    errors.push('Title must be changed from the default value');
  } else if (draft.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  } else if (draft.title.trim().length > 200) {
    warnings.push('Title is longer than recommended (200 characters)');
  }

  // Validate content exists and has substance
  if (!draft.content || draft.content.trim().length === 0) {
    errors.push('Content is required');
  } else {
    // Try to parse content as JSON to check structure
    try {
      const parsedContent = JSON.parse(draft.content);

      // Check for minimum content based on type
      if (!hasSubstantialContent(parsedContent, draft.contentType)) {
        errors.push('Content does not have enough substance to publish');
      }

      // Type-specific validations
      const typeErrors = validateContentByType(parsedContent, draft.contentType);
      errors.push(...typeErrors.errors);
      warnings.push(...typeErrors.warnings);
    } catch {
      errors.push('Content is not valid JSON');
    }
  }

  // Validate content type is publishable
  const publishableTypes: PublishableContentType[] = [
    'lesson',
    'quiz',
    'exercise',
    'course',
  ];
  if (!publishableTypes.includes(draft.contentType as PublishableContentType)) {
    // Modules and packages are not directly publishable
    if (draft.contentType === 'module') {
      warnings.push('Modules should be published as part of a course');
    } else if (draft.contentType === 'package') {
      warnings.push('Packages should be published as part of a course');
    }
  }

  // Check draft status
  if (draft.status === 'published') {
    warnings.push('This draft has already been published');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if content has sufficient substance
 */
function hasSubstantialContent(
  content: unknown,
  contentType: string
): boolean {
  if (!content || typeof content !== 'object') {
    return false;
  }

  const contentObj = content as Record<string, unknown>;

  switch (contentType) {
    case 'lesson': {
      // Lessons need body content
      const body = contentObj.body ?? contentObj.content ?? '';
      if (typeof body === 'string') {
        return body.length >= MIN_CONTENT_LENGTH;
      }
      // If body is an array (blocks), check total length
      if (Array.isArray(body)) {
        const totalLength = body.reduce((sum, block) => {
          if (typeof block === 'string') return sum + block.length;
          if (typeof block === 'object' && block !== null) {
            const text = (block as Record<string, unknown>).text ?? '';
            return sum + (typeof text === 'string' ? text.length : 0);
          }
          return sum;
        }, 0);
        return totalLength >= MIN_CONTENT_LENGTH;
      }
      return false;
    }

    case 'quiz': {
      // Quizzes need at least one question
      const questions = contentObj.questions;
      return Array.isArray(questions) && questions.length > 0;
    }

    case 'exercise': {
      // Exercises need instructions and expected output or test cases
      const instructions = contentObj.instructions ?? contentObj.prompt ?? '';
      const hasTests =
        Array.isArray(contentObj.testCases) && contentObj.testCases.length > 0;
      const hasExpected = Boolean(contentObj.expectedOutput);

      return (
        typeof instructions === 'string' &&
        instructions.length >= MIN_CONTENT_LENGTH &&
        (hasTests || hasExpected)
      );
    }

    case 'course': {
      // Courses need a description and at least structure
      const description = contentObj.description ?? '';
      const hasModules =
        Array.isArray(contentObj.modules) && contentObj.modules.length > 0;
      const hasLessons =
        Array.isArray(contentObj.lessons) && contentObj.lessons.length > 0;

      return (
        typeof description === 'string' &&
        description.length >= 20 &&
        (hasModules || hasLessons)
      );
    }

    default:
      return true;
  }
}

/**
 * Type-specific content validation
 */
function validateContentByType(
  content: unknown,
  contentType: string
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content || typeof content !== 'object') {
    return { errors, warnings };
  }

  const contentObj = content as Record<string, unknown>;

  switch (contentType) {
    case 'quiz': {
      const questions = contentObj.questions;
      if (Array.isArray(questions)) {
        questions.forEach((q, index) => {
          const question = q as Record<string, unknown>;
          if (!question.question && !question.text) {
            errors.push(`Question ${index + 1} is missing question text`);
          }
          if (!question.options && !question.answers && !question.answer) {
            errors.push(`Question ${index + 1} has no answer options`);
          }
          if (question.correctAnswer === undefined && question.correct === undefined) {
            warnings.push(`Question ${index + 1} may be missing correct answer indicator`);
          }
        });

        if (questions.length === 1) {
          warnings.push('Quiz has only one question - consider adding more');
        }
      }
      break;
    }

    case 'exercise': {
      if (!contentObj.language && !contentObj.programmingLanguage) {
        warnings.push('Exercise does not specify a programming language');
      }
      if (!contentObj.starterCode && !contentObj.template) {
        warnings.push('Exercise has no starter code template');
      }
      break;
    }

    case 'lesson': {
      if (!contentObj.summary && !contentObj.description) {
        warnings.push('Lesson has no summary/description for search results');
      }
      break;
    }
  }

  return { errors, warnings };
}

// =============================================================================
// Content Preparation
// =============================================================================

/**
 * Prepare a draft for publishing
 *
 * Converts a draft into a publishable format by:
 * - Fetching all referenced assets
 * - Generating a URL-safe slug
 * - Structuring content for packaging
 *
 * @param draftId - The ID of the draft to prepare
 * @returns Publishable content or throws if preparation fails
 *
 * @throws Error if draft not found or content invalid
 */
export async function prepareDraftForPublish(
  draftId: string
): Promise<PublishableContent> {
  // Fetch the draft
  const draft = await db.contentDrafts.get(draftId);
  if (!draft) {
    throw new Error(`Draft not found: ${draftId}`);
  }

  // Validate before preparing
  const validation = validateDraftForPublish(draft);
  if (!validation.valid) {
    throw new Error(`Draft validation failed: ${validation.errors.join(', ')}`);
  }

  // Parse content
  let parsedContent: unknown;
  try {
    parsedContent = JSON.parse(draft.content);
  } catch {
    throw new Error('Failed to parse draft content as JSON');
  }

  // Generate slug from title
  const slug = generateSlug(draft.title);

  // Extract and fetch asset references from content
  const assetIds = extractAssetIds(parsedContent);
  const assets = await fetchAssetReferences(assetIds, draft.authorId);

  // Ensure content type is publishable
  const publishableTypes: PublishableContentType[] = [
    'lesson',
    'quiz',
    'exercise',
    'course',
  ];
  if (!publishableTypes.includes(draft.contentType as PublishableContentType)) {
    throw new Error(`Content type '${draft.contentType}' cannot be published directly`);
  }

  return {
    type: draft.contentType as PublishableContentType,
    id: draft.id,
    slug,
    content: parsedContent,
    assets,
  };
}

/**
 * Generate URL-safe slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extract asset IDs referenced in content
 *
 * Searches for asset references in various formats:
 * - Direct asset ID fields
 * - Image/media URLs containing asset IDs
 * - Asset arrays
 */
function extractAssetIds(content: unknown): string[] {
  const ids = new Set<string>();

  function traverse(obj: unknown): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach(traverse);
      return;
    }

    const record = obj as Record<string, unknown>;

    // Check common asset reference patterns
    const assetFields = [
      'assetId',
      'imageId',
      'audioId',
      'videoId',
      'fileId',
      'mediaId',
    ];

    for (const field of assetFields) {
      const value = record[field];
      if (typeof value === 'string' && isValidUUID(value)) {
        ids.add(value);
      }
    }

    // Check asset arrays
    if (Array.isArray(record.assets)) {
      for (const asset of record.assets) {
        if (typeof asset === 'string' && isValidUUID(asset)) {
          ids.add(asset);
        } else if (typeof asset === 'object' && asset !== null) {
          const assetObj = asset as Record<string, unknown>;
          if (typeof assetObj.id === 'string') {
            ids.add(assetObj.id);
          }
        }
      }
    }

    // Recursively traverse nested objects
    for (const value of Object.values(record)) {
      traverse(value);
    }
  }

  traverse(content);
  return Array.from(ids);
}

/**
 * Validate UUID format
 */
function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Fetch asset references for given IDs
 */
async function fetchAssetReferences(
  assetIds: string[],
  authorId: string
): Promise<AssetReference[]> {
  const references: AssetReference[] = [];

  for (const id of assetIds) {
    const asset = await getAsset(id);

    // Only include assets owned by the author
    if (asset && asset.authorId === authorId) {
      references.push({
        id: asset.id,
        filename: asset.filename,
        mimeType: asset.mimeType,
        size: asset.size,
      });
    }
  }

  return references;
}

// =============================================================================
// Manifest Generation
// =============================================================================

/**
 * Generate package manifest with checksums
 *
 * Creates a manifest containing all package metadata and
 * SHA-256 checksums for integrity verification.
 *
 * @param content - The publishable content
 * @param assets - Asset references with binary data
 * @param author - Author information
 * @param version - Package version string (defaults to '1.0.0')
 * @returns Package manifest
 */
export async function generateManifest(
  content: PublishableContent,
  assets: FetchedAsset[],
  author: { id: string; name: string },
  version: string = '1.0.0'
): Promise<PackageManifest> {
  // Serialize content for hashing
  const contentJson = JSON.stringify(content.content, null, 2);
  const contentHash = await sha256(contentJson);

  // Calculate combined hash of all assets
  const assetsHash = await calculateAssetsHash(assets);

  // Calculate total size
  const contentSize = new TextEncoder().encode(contentJson).length;
  const assetsSize = assets.reduce((sum, asset) => sum + asset.size, 0);
  const totalSizeBytes = contentSize + assetsSize;

  return {
    schemaVersion: SCHEMA_VERSION,
    id: content.id,
    slug: content.slug,
    type: content.type,
    version,
    createdAt: new Date().toISOString(),
    author,
    contentHash,
    assetsHash,
    totalSizeBytes,
  };
}

/**
 * Calculate combined hash of all assets
 *
 * Concatenates all asset hashes in sorted order (by ID)
 * and hashes the result to create a single integrity value.
 */
async function calculateAssetsHash(assets: FetchedAsset[]): Promise<string> {
  if (assets.length === 0) {
    // Hash of empty string for no assets
    return sha256('');
  }

  // Sort by ID for consistent ordering
  const sortedAssets = [...assets].sort((a, b) => a.id.localeCompare(b.id));

  // Hash each asset and concatenate
  const hashes: string[] = [];
  for (const asset of sortedAssets) {
    const assetBytes = new Uint8Array(asset.data);
    const hash = await sha256(assetBytes);
    hashes.push(`${asset.id}:${hash}`);
  }

  // Hash the combined string
  return sha256(hashes.join('\n'));
}

// =============================================================================
// Package Creation
// =============================================================================

/**
 * Create a package ZIP file
 *
 * Bundles the manifest, content, and assets into a downloadable
 * ZIP file using native Blob/ArrayBuffer APIs.
 *
 * For MVP simplicity, this creates a JSON bundle that includes
 * base64-encoded assets. A true ZIP implementation would require
 * more complex binary manipulation.
 *
 * @param manifest - Package manifest
 * @param content - Content JSON string
 * @param assets - Assets with binary data
 * @returns Blob containing the package
 */
export async function createPackageZip(
  manifest: PackageManifest,
  content: string,
  assets: FetchedAsset[]
): Promise<Blob> {
  // For MVP, create a JSON bundle instead of a true ZIP
  // This is simpler and still allows for download/upload
  const packageBundle = await createPackageBundle(manifest, content, assets);

  return new Blob([JSON.stringify(packageBundle, null, 2)], {
    type: 'application/json',
  });
}

/**
 * Package bundle structure for JSON-based packaging
 */
interface PackageBundle {
  manifest: PackageManifest;
  content: unknown;
  assets: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    data: string; // Base64 encoded
  }>;
}

/**
 * Create package bundle object
 */
async function createPackageBundle(
  manifest: PackageManifest,
  contentJson: string,
  assets: FetchedAsset[]
): Promise<PackageBundle> {
  // Encode assets as base64
  const encodedAssets = await Promise.all(
    assets.map(async (asset) => ({
      id: asset.id,
      filename: asset.filename,
      mimeType: asset.mimeType,
      size: asset.size,
      data: arrayBufferToBase64(asset.data),
    }))
  );

  return {
    manifest,
    content: JSON.parse(contentJson),
    assets: encodedAssets,
  };
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// =============================================================================
// Publishing
// =============================================================================

/**
 * Publish content to the learning hub
 *
 * Full publishing workflow:
 * 1. Prepare draft for publishing
 * 2. Fetch all assets
 * 3. Generate manifest with checksums
 * 4. Create package bundle
 * 5. Upload to hub API
 * 6. Update draft status on success
 *
 * @param draftId - ID of the draft to publish
 * @param hubUrl - Base URL of the hub API
 * @param deviceId - Device ID for authentication
 * @param authorId - Author's user ID
 * @returns Publish result
 *
 * @example
 * ```ts
 * const result = await publishDraft(
 *   'draft-123',
 *   'https://hub.example.com',
 *   'device-456',
 *   'author-789'
 * );
 *
 * if (result.success) {
 *   console.log('Published as:', result.contentId);
 * }
 * ```
 */
export async function publishDraft(
  draftId: string,
  hubUrl: string,
  deviceId: string,
  authorId: string
): Promise<PublishResult> {
  try {
    // Prepare content
    const publishableContent = await prepareDraftForPublish(draftId);

    // Fetch author info
    const authorProfile = await db.authorProfiles.get(authorId);
    const author = {
      id: authorId,
      name: authorProfile?.displayName ?? 'Unknown Author',
    };

    // Fetch asset binary data
    const assetsWithData = await fetchAssetBinaryData(publishableContent.assets);

    // Generate manifest
    const manifest = await generateManifest(
      publishableContent,
      assetsWithData,
      author
    );

    // Create package
    const contentJson = JSON.stringify(publishableContent.content, null, 2);
    const packageBlob = await createPackageZip(manifest, contentJson, assetsWithData);

    // Upload to hub
    const uploadResult = await publishToHub(
      hubUrl,
      packageBlob,
      manifest,
      deviceId,
      authorId
    );

    if (uploadResult.success) {
      // Update draft status
      await db.contentDrafts.update(draftId, {
        status: 'published',
        updatedAt: new Date(),
      });

      // Log activity
      await db.authorActivity.add({
        id: crypto.randomUUID(),
        authorId,
        action: 'published',
        targetType: publishableContent.type as 'lesson' | 'quiz' | 'exercise',
        targetId: draftId,
        targetTitle: manifest.slug,
        details: JSON.stringify({
          contentId: uploadResult.contentId,
          version: manifest.version,
        }),
        timestamp: new Date(),
      });
    }

    return uploadResult;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during publishing';

    console.error('[PublishService] Publish failed:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Fetch binary data for assets
 */
async function fetchAssetBinaryData(
  assets: AssetReference[]
): Promise<FetchedAsset[]> {
  const fetchedAssets: FetchedAsset[] = [];

  for (const asset of assets) {
    try {
      // Get asset URL from cache
      const url = await getAssetUrl(asset.id);
      if (!url) {
        console.warn(`[PublishService] Asset not found in cache: ${asset.id}`);
        continue;
      }

      // Fetch the blob
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();

      // Revoke the blob URL to prevent memory leak
      URL.revokeObjectURL(url);

      fetchedAssets.push({
        ...asset,
        data: arrayBuffer,
      });
    } catch (error) {
      console.warn(`[PublishService] Failed to fetch asset ${asset.id}:`, error);
    }
  }

  return fetchedAssets;
}

/**
 * Upload package to hub API
 *
 * Sends the package to the hub's publish endpoint with retry support.
 *
 * @param hubUrl - Base URL of the hub
 * @param packageBlob - The package blob to upload
 * @param manifest - Package manifest for metadata
 * @param deviceId - Device ID for authentication
 * @param authorId - Author's user ID
 * @returns Publish result from hub
 */
export async function publishToHub(
  hubUrl: string,
  packageBlob: Blob,
  manifest: PackageManifest,
  deviceId: string,
  authorId: string
): Promise<PublishResult> {
  const endpoint = `${hubUrl.replace(/\/$/, '')}/api/content/publish`;

  // Create form data for upload
  const formData = new FormData();
  formData.append('package', packageBlob, `${manifest.slug}-v${manifest.version}.json`);
  formData.append('manifest', JSON.stringify(manifest));
  formData.append('deviceId', deviceId);
  formData.append('authorId', authorId);

  let lastError: Error | null = null;

  // Retry loop
  for (let attempt = 0; attempt < MAX_UPLOAD_RETRIES; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Device-ID': deviceId,
          'X-Author-ID': authorId,
        },
      });

      // Parse response
      const responseData = await parsePublishResponse(response);
      return responseData;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Network error');
      console.warn(
        `[PublishService] Upload attempt ${attempt + 1} failed:`,
        lastError.message
      );

      // Wait before retry (exponential backoff)
      if (attempt < MAX_UPLOAD_RETRIES - 1) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message ?? 'Failed to upload after multiple attempts',
  };
}

/**
 * Parse publish API response
 */
async function parsePublishResponse(response: Response): Promise<PublishResult> {
  if (!response.ok) {
    // Handle error responses
    try {
      const errorBody = await response.json();

      if (response.status === 400 && errorBody.validationErrors) {
        return {
          success: false,
          error: 'Validation failed on server',
          validationErrors: errorBody.validationErrors,
        };
      }

      return {
        success: false,
        error: errorBody.message ?? errorBody.error ?? `HTTP ${response.status}`,
      };
    } catch {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  }

  // Parse success response
  try {
    const data = await response.json();
    return {
      success: true,
      contentId: data.contentId ?? data.id,
      publishedAt: data.publishedAt ?? new Date().toISOString(),
    };
  } catch {
    // Response OK but no JSON body
    return {
      success: true,
      publishedAt: new Date().toISOString(),
    };
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the download filename for a package
 *
 * @param manifest - Package manifest
 * @returns Formatted filename
 */
export function getPackageFilename(manifest: PackageManifest): string {
  return `${manifest.slug}-v${manifest.version}.json`;
}

/**
 * Create a downloadable package for offline use
 *
 * Prepares a package for download without uploading to hub.
 * Useful for backup or manual transfer.
 *
 * @param draftId - ID of the draft to package
 * @param authorId - Author's user ID
 * @returns Object URL for download (must be revoked after use)
 */
export async function createDownloadablePackage(
  draftId: string,
  authorId: string
): Promise<{ url: string; filename: string; manifest: PackageManifest }> {
  // Prepare content
  const publishableContent = await prepareDraftForPublish(draftId);

  // Fetch author info
  const authorProfile = await db.authorProfiles.get(authorId);
  const author = {
    id: authorId,
    name: authorProfile?.displayName ?? 'Unknown Author',
  };

  // Fetch asset binary data
  const assetsWithData = await fetchAssetBinaryData(publishableContent.assets);

  // Generate manifest
  const manifest = await generateManifest(
    publishableContent,
    assetsWithData,
    author
  );

  // Create package
  const contentJson = JSON.stringify(publishableContent.content, null, 2);
  const packageBlob = await createPackageZip(manifest, contentJson, assetsWithData);

  // Create object URL for download
  const url = URL.createObjectURL(packageBlob);
  const filename = getPackageFilename(manifest);

  return { url, filename, manifest };
}

/**
 * Estimate package size before publishing
 *
 * Calculates the approximate size of the final package
 * without actually creating it.
 *
 * @param draftId - ID of the draft
 * @returns Estimated size in bytes
 */
export async function estimatePackageSize(draftId: string): Promise<number> {
  const draft = await db.contentDrafts.get(draftId);
  if (!draft) {
    return 0;
  }

  // Content size (with some overhead for JSON formatting)
  const contentSize = new TextEncoder().encode(draft.content).length * 1.2;

  // Parse content to find asset references
  let parsedContent: unknown;
  try {
    parsedContent = JSON.parse(draft.content);
  } catch {
    return Math.ceil(contentSize);
  }

  // Get asset sizes
  const assetIds = extractAssetIds(parsedContent);
  let assetSize = 0;

  for (const id of assetIds) {
    const asset = await getAsset(id);
    if (asset) {
      // Base64 encoding increases size by ~33%
      assetSize += asset.size * 1.34;
    }
  }

  // Add manifest overhead (~500 bytes)
  return Math.ceil(contentSize + assetSize + 500);
}
