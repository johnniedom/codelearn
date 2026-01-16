/**
 * CMS Library
 *
 * Services and utilities for the Content Management System.
 */

// =============================================================================
// Avatar Service
// =============================================================================

export {
  storeAvatar,
  getAvatarUrl,
  deleteAvatar,
  hasAvatar,
  generateInitialsAvatar,
  validateAvatarFile,
  clearAllAvatars,
  getAvatarCacheInfo,
} from './avatar-service';

export type { AvatarResult, AvatarValidation } from './avatar-service';

// =============================================================================
// Draft Service
// =============================================================================

export {
  createDraft,
  getDraft,
  getDraftWithAssets,
  getAuthorDrafts,
  updateDraft,
  updateDraftStatus,
  deleteDraft,
  deleteAuthorDrafts,
  createAutoSaver,
  getDraftCounts,
  searchDrafts,
} from './draft-service';

// =============================================================================
// Content Index Service
// =============================================================================

export {
  indexContent,
  removeFromIndex,
  searchContent,
  getContentTree,
  getChildren,
  rebuildIndex,
  clearIndex,
  getIndexStats,
} from './content-index';

export type { SearchOptions, IndexStats } from './content-index';

// =============================================================================
// Asset Service
// =============================================================================

export {
  uploadAsset,
  getAsset,
  getAssetUrl,
  getAuthorAssets,
  deleteAsset,
  updateAssetTags,
  searchAssets,
  getAssetStorageUsed,
  validateAssetFile as validateAsset,
  generateThumbnail,
  getThumbnailUrl,
} from './asset-service';

export type { AssetValidation } from './asset-service';

// =============================================================================
// Publish Service
// =============================================================================

export {
  validateDraftForPublish,
  prepareDraftForPublish,
  generateManifest,
  createPackageZip,
  publishDraft,
  publishToHub,
  getPackageFilename,
  createDownloadablePackage,
  estimatePackageSize,
} from './publish-service';

export type {
  PublishableContent,
  PublishableContentType,
  AssetReference,
  PackageManifest,
  ValidationResult,
  PublishResult,
} from './publish-service';
