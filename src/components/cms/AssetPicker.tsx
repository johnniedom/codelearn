'use client';

import * as React from 'react';
import { cn, formatBytes } from '@/lib/utils';
import { Button, Input, Skeleton } from '@/components/ui';
import {
  getAuthorAssets,
  uploadAsset,
  getThumbnailUrl,
  getAssetUrl,
  searchAssets,
} from '@/lib/cms/asset-service';
import type { LocalAsset, AssetType } from '@/lib/db';

// =============================================================================
// Types
// =============================================================================

interface AssetPickerProps {
  /** Whether the picker modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when an asset is selected */
  onSelect: (asset: LocalAsset) => void;
  /** Filter by asset type */
  assetType?: AssetType;
  /** Author ID for fetching assets */
  authorId: string;
  /** Additional class names for the overlay */
  className?: string;
}

interface AssetThumbnailProps {
  asset: LocalAsset;
  isSelected: boolean;
  onClick: () => void;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Asset type icons for non-image assets
 */
const ASSET_TYPE_ICONS: Record<AssetType, string> = {
  image: '\u{1F5BC}',   // Image icon
  video: '\u{1F3AC}',   // Video icon
  audio: '\u{1F3B5}',   // Audio icon
  document: '\u{1F4C4}', // Document icon
  other: '\u{1F4C1}',   // Folder icon
};

/**
 * Asset type labels
 */
const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  document: 'Document',
  other: 'File',
};

/**
 * Accepted file types by asset type
 */
const ACCEPTED_FILE_TYPES: Record<AssetType, string> = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
  document: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.json',
  other: '*',
};

// =============================================================================
// AssetThumbnail Component
// =============================================================================

/**
 * Individual asset thumbnail with preview
 */
function AssetThumbnail({ asset, isSelected, onClick }: AssetThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load thumbnail URL for images
  React.useEffect(() => {
    let mounted = true;

    async function loadThumbnail() {
      if (asset.assetType !== 'image') {
        setIsLoading(false);
        return;
      }

      try {
        // Try thumbnail first, fall back to full asset
        let url = await getThumbnailUrl(asset.id);
        if (!url) {
          url = await getAssetUrl(asset.id);
        }

        if (mounted && url) {
          setThumbnailUrl(url);
        }
      } catch (error) {
        console.error('[AssetPicker] Failed to load thumbnail:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadThumbnail();

    return () => {
      mounted = false;
      // Revoke URL on unmount to prevent memory leaks
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [asset.id, asset.assetType]);

  // Clean up URL on unmount
  React.useEffect(() => {
    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [thumbnailUrl]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Base styles
        'group flex flex-col overflow-hidden rounded-lg border transition-all duration-200',
        // Focus states
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        // Selected state
        isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary'
          : 'border-border hover:border-border-focus hover:shadow-sm'
      )}
      aria-pressed={isSelected}
      aria-label={`Select ${asset.filename}`}
    >
      {/* Thumbnail area */}
      <div className="relative aspect-square w-full overflow-hidden bg-surface-secondary">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : asset.assetType === 'image' && thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={asset.filename}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl" role="img" aria-hidden="true">
              {ASSET_TYPE_ICONS[asset.assetType]}
            </span>
          </div>
        )}

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Asset info */}
      <div className="flex flex-col gap-0.5 p-2">
        <span
          className="truncate text-xs font-medium text-text"
          title={asset.filename}
        >
          {asset.filename}
        </span>
        <span className="text-xs text-text-muted">
          {formatBytes(asset.size)}
        </span>
      </div>
    </button>
  );
}

// =============================================================================
// AssetPicker Component
// =============================================================================

/**
 * AssetPicker Component
 *
 * Modal dialog for selecting or uploading assets in the CMS.
 *
 * Features:
 * - Header with title and close button
 * - Upload new asset button
 * - Search input for filtering assets
 * - Grid of existing assets with thumbnails
 * - Click to select functionality
 * - Displays filename and size for each asset
 * - Loading state while fetching
 * - Empty state when no assets match
 *
 * Accessibility:
 * - Modal dialog with proper ARIA attributes
 * - Focus trap within modal
 * - Escape key to close
 * - Click outside to close
 * - Screen reader announcements
 *
 * @example
 * ```tsx
 * <AssetPicker
 *   isOpen={showPicker}
 *   onClose={() => setShowPicker(false)}
 *   onSelect={(asset) => handleAssetSelect(asset)}
 *   authorId={currentAuthorId}
 *   assetType="image"
 * />
 * ```
 */
export function AssetPicker({
  isOpen,
  onClose,
  onSelect,
  assetType,
  authorId,
  className,
}: AssetPickerProps) {
  // State
  const [assets, setAssets] = React.useState<LocalAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = React.useState<LocalAsset[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedAssetId, setSelectedAssetId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Refs
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  /**
   * Load assets when modal opens
   */
  React.useEffect(() => {
    if (!isOpen || !authorId) return;

    let mounted = true;

    async function loadAssets() {
      setIsLoading(true);
      setError(null);

      try {
        const loadedAssets = await getAuthorAssets(authorId, assetType);
        if (mounted) {
          setAssets(loadedAssets);
          setFilteredAssets(loadedAssets);
        }
      } catch (err) {
        console.error('[AssetPicker] Failed to load assets:', err);
        if (mounted) {
          setError('Failed to load assets. Please try again.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadAssets();

    return () => {
      mounted = false;
    };
  }, [isOpen, authorId, assetType]);

  /**
   * Debounced search using a ref to track timeout
   */
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = React.useCallback(
    (query: string) => {
      // Clear any pending search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set a new timeout for the search
      searchTimeoutRef.current = setTimeout(async () => {
        if (!query.trim()) {
          setFilteredAssets(assets);
          return;
        }

        try {
          const results = await searchAssets(authorId, query);
          // Filter by asset type if specified
          const filtered = assetType
            ? results.filter((a) => a.assetType === assetType)
            : results;
          setFilteredAssets(filtered);
        } catch (err) {
          console.error('[AssetPicker] Search failed:', err);
          // Fall back to client-side filtering
          const lowerQuery = query.toLowerCase();
          const filtered = assets.filter((a) =>
            a.filename.toLowerCase().includes(lowerQuery)
          );
          setFilteredAssets(filtered);
        }
      }, 300);
    },
    [assets, authorId, assetType]
  );

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle search input change
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  /**
   * Handle file upload
   */
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setError(null);

    try {
      const newAsset = await uploadAsset(authorId, file);
      // Add to assets list and select it
      setAssets((prev) => [newAsset, ...prev]);
      setFilteredAssets((prev) => [newAsset, ...prev]);
      setSelectedAssetId(newAsset.id);
    } catch (err) {
      console.error('[AssetPicker] Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Handle asset selection
   */
  const handleAssetClick = (asset: LocalAsset) => {
    setSelectedAssetId(asset.id);
  };

  /**
   * Handle confirm selection
   */
  const handleConfirm = () => {
    const selectedAsset = assets.find((a) => a.id === selectedAssetId);
    if (selectedAsset) {
      onSelect(selectedAsset);
      onClose();
    }
  };

  /**
   * Handle escape key and focus management
   */
  React.useEffect(() => {
    if (!isOpen) return;

    // Store current focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the modal
    modalRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  /**
   * Handle click outside to close
   */
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Determine accepted file types
  const acceptedTypes = assetType
    ? ACCEPTED_FILE_TYPES[assetType]
    : Object.values(ACCEPTED_FILE_TYPES).join(',');

  return (
    <div
      className={cn(
        // Overlay styles
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4',
        className
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-picker-title"
    >
      {/* Modal content */}
      <div
        ref={modalRef}
        className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-background shadow-xl"
        tabIndex={-1}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="asset-picker-title" className="text-lg font-semibold text-text">
            Select Asset
            {assetType && (
              <span className="ml-2 text-sm font-normal text-text-muted">
                ({ASSET_TYPE_LABELS[assetType]}s)
              </span>
            )}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close asset picker"
            className="h-8 w-8"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </header>

        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          {/* Upload button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes}
              onChange={handleUpload}
              className="sr-only"
              id="asset-upload-input"
              aria-label="Upload new asset"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Upload
                </>
              )}
            </Button>
          </div>

          {/* Search input */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              type="search"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-9 pl-9"
              aria-label="Search assets"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="border-b border-error/20 bg-error/10 px-4 py-2">
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4" aria-busy={isLoading}>
          {isLoading ? (
            // Loading skeleton grid
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-border">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-2">
                    <Skeleton className="mb-1 h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAssets.length === 0 ? (
            // Empty state
            <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
              <span className="mb-2 text-4xl" role="img" aria-hidden="true">
                {assetType ? ASSET_TYPE_ICONS[assetType] : '\u{1F4C2}'}
              </span>
              <p className="text-sm text-text-muted">
                {searchQuery
                  ? 'No assets match your search'
                  : assetType
                    ? `No ${ASSET_TYPE_LABELS[assetType].toLowerCase()}s found`
                    : 'No assets found'}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Upload a new asset to get started
              </p>
            </div>
          ) : (
            // Asset grid
            <div
              className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5"
              role="listbox"
              aria-label="Available assets"
            >
              {filteredAssets.map((asset) => (
                <AssetThumbnail
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedAssetId === asset.id}
                  onClick={() => handleAssetClick(asset)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-3 border-t border-border px-4 py-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedAssetId}
            aria-disabled={!selectedAssetId}
          >
            Select
          </Button>
        </footer>
      </div>
    </div>
  );
}

export type { AssetPickerProps };
export default AssetPicker;
