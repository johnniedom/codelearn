'use client';

/**
 * AssetManager Page
 *
 * Manage media assets for CMS content.
 *
 * Features:
 * - Upload button (file input, uses uploadAsset)
 * - Search input
 * - Filter tabs: All, Images, Audio, Video, Documents
 * - Asset grid with thumbnails
 * - Click asset for details/actions
 * - Delete asset button
 * - Show total storage used (getAssetStorageUsed)
 */

import { useState, useEffect, useCallback, useRef, useId } from 'react';
import {
  Search,
  Upload,
  Trash2,
  Image,
  FileAudio,
  FileVideo,
  FileText,
  FolderOpen,
  X,
  Loader2,
  Download,
  Copy,
  Check,
  HardDrive,
} from 'lucide-react';

import { cn, formatBytes, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

import {
  getAuthorAssets,
  uploadAsset,
  deleteAsset,
  getAssetStorageUsed,
  getAssetUrl,
  getThumbnailUrl,
} from '@/lib/cms/asset-service';
import { useAuthStore } from '@/stores';
import type { LocalAsset, AssetType } from '@/lib/db';

// =============================================================================
// Types
// =============================================================================

type FilterTab = 'all' | 'image' | 'audio' | 'video' | 'document';

interface AssetDetailsModalProps {
  asset: LocalAsset;
  assetUrl: string | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

// =============================================================================
// Constants
// =============================================================================

const FILTER_TABS: { value: FilterTab; label: string; icon: typeof Image }[] = [
  { value: 'all', label: 'All', icon: FolderOpen },
  { value: 'image', label: 'Images', icon: Image },
  { value: 'audio', label: 'Audio', icon: FileAudio },
  { value: 'video', label: 'Video', icon: FileVideo },
  { value: 'document', label: 'Documents', icon: FileText },
];

const ASSET_TYPE_ICONS: Record<AssetType, typeof Image> = {
  image: Image,
  audio: FileAudio,
  video: FileVideo,
  document: FileText,
  other: FileText,
};

const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  image: 'bg-blue-100 text-blue-800',
  audio: 'bg-purple-100 text-purple-800',
  video: 'bg-red-100 text-red-800',
  document: 'bg-green-100 text-green-800',
  other: 'bg-gray-100 text-gray-800',
};

// Accepted file types per category
const ACCEPTED_TYPES: Record<FilterTab, string> = {
  all: '*/*',
  image: 'image/*',
  audio: 'audio/*',
  video: 'video/*',
  document: '.pdf,.doc,.docx,.txt,.md',
};

// =============================================================================
// Asset Details Modal
// =============================================================================

function AssetDetailsModal({ asset, assetUrl, onClose, onDelete }: AssetDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const Icon = ASSET_TYPE_ICONS[asset.assetType] ?? FileText;
  const colorClass = ASSET_TYPE_COLORS[asset.assetType] ?? 'bg-gray-100 text-gray-800';

  const handleCopyUrl = useCallback(async () => {
    if (!assetUrl) return;
    try {
      await navigator.clipboard.writeText(assetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy URL');
    }
  }, [assetUrl]);

  const handleDelete = useCallback(async () => {
    if (!confirm(`Are you sure you want to delete "${asset.filename}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(asset.id);
      onClose();
    } catch {
      setIsDeleting(false);
    }
  }, [asset, onDelete, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-details-title"
    >
      <div
        className="w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-background rounded-t-xl sm:rounded-lg shadow-xl overflow-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border shrink-0">
          <h2 id="asset-details-title" className="text-base sm:text-lg font-semibold truncate pr-2">
            {asset.filename}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="h-10 w-10 sm:h-9 sm:w-9 shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Preview */}
        <div className="p-3 sm:p-4 border-b border-border shrink-0">
          {asset.assetType === 'image' && assetUrl ? (
            <img
              src={assetUrl}
              alt={asset.filename}
              className="w-full max-h-48 sm:max-h-64 object-contain rounded-md bg-surface"
            />
          ) : (
            <div className="flex items-center justify-center h-24 sm:h-32 bg-surface rounded-md">
              <div className={cn('p-3 sm:p-4 rounded-full', colorClass)}>
                <Icon className="h-10 w-10 sm:h-12 sm:w-12" aria-hidden="true" />
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-3 sm:p-4 space-y-3 flex-1 overflow-auto">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div>
              <span className="text-text-muted text-xs sm:text-sm">Type</span>
              <p className="font-medium capitalize">{asset.assetType}</p>
            </div>
            <div>
              <span className="text-text-muted text-xs sm:text-sm">Size</span>
              <p className="font-medium">{formatBytes(asset.size)}</p>
            </div>
            <div>
              <span className="text-text-muted text-xs sm:text-sm">MIME Type</span>
              <p className="font-medium text-xs sm:text-sm break-all">{asset.mimeType}</p>
            </div>
            <div>
              <span className="text-text-muted text-xs sm:text-sm">Uploaded</span>
              <p className="font-medium">{formatRelativeTime(asset.createdAt)}</p>
            </div>
          </div>

          {/* URL */}
          {assetUrl && (
            <div className="space-y-2">
              <span className="text-xs sm:text-sm text-text-muted">URL</span>
              <div className="flex gap-2">
                <Input
                  value={assetUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                  aria-label={copied ? 'Copied' : 'Copy URL'}
                  className="h-10 w-10 sm:h-9 sm:w-9 shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between p-3 sm:p-4 border-t border-border shrink-0 gap-2">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2 min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </Button>

          {assetUrl && (
            <Button variant="outline" asChild className="gap-2 min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial">
              <a href={assetUrl} download={asset.filename} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
                Download
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Asset Card
// =============================================================================

interface AssetCardProps {
  asset: LocalAsset;
  thumbnailUrl: string | null;
  onClick: () => void;
}

function AssetCard({ asset, thumbnailUrl, onClick }: AssetCardProps) {
  const Icon = ASSET_TYPE_ICONS[asset.assetType] ?? FileText;
  const colorClass = ASSET_TYPE_COLORS[asset.assetType] ?? 'bg-gray-100 text-gray-800';

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`View ${asset.filename} - ${asset.assetType}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-surface flex items-center justify-center overflow-hidden">
        {asset.assetType === 'image' && thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={asset.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={cn('p-4 rounded-full', colorClass)}>
            <Icon className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Info */}
      <CardContent className="p-3">
        <p className="text-sm font-medium truncate" title={asset.filename}>
          {asset.filename}
        </p>
        <div className="flex items-center justify-between mt-1">
          <Badge variant="secondary" className="text-xs capitalize">
            {asset.assetType}
          </Badge>
          <span className="text-xs text-text-muted">
            {formatBytes(asset.size)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function AssetManager() {
  const profile = useAuthStore((state) => state.profile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [assets, setAssets] = useState<LocalAsset[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<LocalAsset | null>(null);
  const [selectedAssetUrl, setSelectedAssetUrl] = useState<string | null>(null);
  const [totalStorage, setTotalStorage] = useState(0);

  // Get user ID
  const userId = profile?.userId ?? 'anonymous';

  // ==========================================================================
  // Load Assets
  // ==========================================================================

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load assets
      const assetType = activeFilter === 'all' ? undefined : activeFilter as AssetType;
      const assetList = await getAuthorAssets(userId, assetType);

      // Filter by search query
      let filtered = assetList;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = assetList.filter(
          (asset: LocalAsset) =>
            asset.filename.toLowerCase().includes(query) ||
            asset.mimeType.toLowerCase().includes(query)
        );
      }

      setAssets(filtered);

      // Load thumbnail URLs for image assets
      const urls: Record<string, string | null> = {};
      await Promise.all(
        filtered.map(async (asset: LocalAsset) => {
          if (asset.assetType === 'image' && asset.thumbnailPath) {
            urls[asset.id] = await getThumbnailUrl(asset.id);
          }
        })
      );
      setThumbnailUrls(urls);

      // Load storage info
      const storage = await getAssetStorageUsed(userId);
      setTotalStorage(storage);
    } catch (err) {
      console.error('[AssetManager] Failed to load assets:', err);
      setError('Failed to load assets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, activeFilter, searchQuery]);

  // Load assets on mount and when filters change
  useEffect(() => {
    const timeoutId = setTimeout(loadAssets, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [loadAssets]);

  // ==========================================================================
  // Upload Handler
  // ==========================================================================

  const handleUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      setError(null);

      try {
        // Upload all files
        const uploadPromises = Array.from(files).map((file) =>
          uploadAsset(userId, file)
        );

        await Promise.all(uploadPromises);

        // Reload assets
        await loadAssets();
      } catch (err) {
        console.error('[AssetManager] Upload failed:', err);
        setError('Failed to upload files. Please try again.');
      } finally {
        setIsUploading(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [userId, loadAssets]
  );

  // ==========================================================================
  // Delete Handler
  // ==========================================================================

  const handleDelete = useCallback(
    async (assetId: string) => {
      try {
        await deleteAsset(assetId);
        // Remove from local state
        setAssets((prev) => prev.filter((a) => a.id !== assetId));
        // Update storage
        const storage = await getAssetStorageUsed(userId);
        setTotalStorage(storage);
      } catch (err) {
        console.error('[AssetManager] Delete failed:', err);
        throw err; // Re-throw to be caught by modal
      }
    },
    [userId]
  );

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Manager</h1>
          <p className="text-text-muted">Manage images, audio, video, and documents.</p>
        </div>

        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            multiple
            accept={ACCEPTED_TYPES[activeFilter]}
            onChange={handleUpload}
            className="sr-only"
            disabled={isUploading}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload Files
          </Button>
        </div>
      </div>

      {/* Storage Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <HardDrive className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Storage Used</p>
              <p className="text-xl font-bold">{formatBytes(totalStorage)}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm text-text-muted">Total Assets</p>
              <p className="text-xl font-bold">{assets.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search assets"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs
        value={activeFilter}
        onValueChange={(value) => setActiveFilter(value as FilterTab)}
      >
        <TabsList>
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Error */}
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error" role="alert">
          {error}
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="sr-only">Loading assets...</span>
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg bg-surface/50">
          <FolderOpen className="h-12 w-12 text-text-muted mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold mb-2">No assets found</h2>
          <p className="text-text-muted text-center max-w-md mb-6">
            {searchQuery
              ? `No assets match "${searchQuery}". Try a different search term.`
              : 'Upload your first asset to get started.'}
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload Files
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              thumbnailUrl={thumbnailUrls[asset.id] ?? null}
              onClick={async () => {
                setSelectedAsset(asset);
                const url = await getAssetUrl(asset.id);
                setSelectedAssetUrl(url);
              }}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {!isLoading && assets.length > 0 && (
        <p className="text-sm text-text-muted">
          Showing {assets.length} asset{assets.length !== 1 ? 's' : ''}
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      )}

      {/* Asset Details Modal */}
      {selectedAsset && (
        <AssetDetailsModal
          asset={selectedAsset}
          assetUrl={selectedAssetUrl}
          onClose={() => {
            setSelectedAsset(null);
            setSelectedAssetUrl(null);
          }}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
