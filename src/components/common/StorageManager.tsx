/**
 * StorageManager Component
 *
 * Storage budget manager per audit requirements.
 * Shows storage usage and lets users choose what to keep/delete.
 *
 * Features:
 * - Show storage usage with visual indicator
 * - "Your learning bag is full" warning when quota approached
 * - Let user choose what content to keep/delete
 * - Accessible
 */

import { useState, useEffect, useCallback } from 'react';
import {
  HardDrive,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Book,
  FileCode,
  Image,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { updateStorageQuota } from '@/lib/db';

// =============================================================================
// Types
// =============================================================================

interface StorageManagerProps {
  /** Warning threshold percentage (default 80%) */
  warningThreshold?: number;
  /** Critical threshold percentage (default 95%) */
  criticalThreshold?: number;
  /** Show inline (not modal) */
  inline?: boolean;
  /** Additional class names */
  className?: string;
}

interface StorageInfo {
  used: number;
  quota: number;
  percentUsed: number;
}

interface CachedContent {
  name: string;
  type: 'course' | 'pyodide' | 'media';
  size: number;
  cacheName: string;
}

// =============================================================================
// Format Bytes
// =============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// =============================================================================
// Storage Warning Banner
// =============================================================================

interface StorageWarningBannerProps {
  percentUsed: number;
  onManage?: () => void;
  onDismiss?: () => void;
}

export function StorageWarningBanner({
  percentUsed,
  onManage,
  onDismiss,
}: StorageWarningBannerProps) {
  if (percentUsed < 80) return null;

  const isCritical = percentUsed >= 95;

  return (
    <div
      className={cn(
        'rounded-lg p-4',
        isCritical ? 'bg-red-50' : 'bg-yellow-50'
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={cn(
            'h-5 w-5 flex-shrink-0',
            isCritical ? 'text-red-600' : 'text-yellow-600'
          )}
        />
        <div className="flex-1">
          <p
            className={cn(
              'font-medium',
              isCritical ? 'text-red-800' : 'text-yellow-800'
            )}
          >
            {isCritical
              ? 'Your learning bag is full!'
              : 'Running low on storage'}
          </p>
          <p
            className={cn(
              'mt-1 text-sm',
              isCritical ? 'text-red-700' : 'text-yellow-700'
            )}
          >
            {isCritical
              ? 'Remove some content to continue downloading.'
              : 'Consider removing content you no longer need.'}
          </p>
          {onManage && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={onManage}
            >
              Manage Storage
            </Button>
          )}
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// StorageManager Component
// =============================================================================

export function StorageManager({
  warningThreshold = 80,
  criticalThreshold = 95,
  
  className,
}: StorageManagerProps) {
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [cachedContent, setCachedContent] = useState<CachedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Load storage info
  const loadStorage = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get storage quota
      const storageInfo = await updateStorageQuota();
      setStorage(storageInfo);

      // Get cached content (from Cache API)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const contentItems: CachedContent[] = [];

        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();

          // Estimate cache size (rough approximation)
          let totalSize = 0;
          for (const request of requests.slice(0, 10)) {
            try {
              const response = await cache.match(request);
              if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
              }
            } catch {
              // Ignore individual errors
            }
          }

          // Extrapolate if more than 10 items
          if (requests.length > 10) {
            totalSize = (totalSize / 10) * requests.length;
          }

          // Determine content type
          let type: CachedContent['type'] = 'course';
          let name = cacheName;

          if (cacheName.includes('pyodide')) {
            type = 'pyodide';
            name = 'Python Runtime';
          } else if (cacheName.includes('media')) {
            type = 'media';
            name = 'Media Files';
          } else if (cacheName.includes('content-')) {
            name = cacheName.replace('content-', 'Course: ');
          }

          if (totalSize > 0) {
            contentItems.push({
              name,
              type,
              size: totalSize,
              cacheName,
            });
          }
        }

        // Sort by size descending
        contentItems.sort((a, b) => b.size - a.size);
        setCachedContent(contentItems);
      }
    } catch (error) {
      console.error('Failed to load storage info:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStorage();
  }, [loadStorage]);

  // Delete cached content
  const handleDelete = async (cacheName: string) => {
    if (!confirm('Remove this content? You will need to download it again.')) {
      return;
    }

    setIsDeleting(cacheName);
    try {
      await caches.delete(cacheName);
      await loadStorage();
    } catch (error) {
      console.error('Failed to delete cache:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Get icon for content type
  const getContentIcon = (type: CachedContent['type']) => {
    switch (type) {
      case 'pyodide':
        return FileCode;
      case 'media':
        return Image;
      default:
        return Book;
    }
  };

  // Get storage status color
  const getStatusColor = (percent: number) => {
    if (percent >= criticalThreshold) return 'text-red-600';
    if (percent >= warningThreshold) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percent: number) => {
    if (percent >= criticalThreshold) return '[&>div]:bg-red-500';
    if (percent >= warningThreshold) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-green-500';
  };

  if (isLoading) {
    return (
      <div className={cn('animate-pulse space-y-4', className)}>
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-2 w-full rounded bg-gray-200" />
        <div className="space-y-2">
          <div className="h-12 w-full rounded bg-gray-200" />
          <div className="h-12 w-full rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Storage usage header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-text-muted" />
          <span className="font-medium text-text">Storage</span>
        </div>
        {storage && (
          <span className={cn('text-sm font-medium', getStatusColor(storage.percentUsed))}>
            {Math.round(storage.percentUsed)}% used
          </span>
        )}
      </div>

      {/* Progress bar */}
      {storage && (
        <div className="space-y-1">
          <Progress
            value={storage.percentUsed}
            className={cn('h-2', getProgressColor(storage.percentUsed))}
          />
          <div className="flex justify-between text-xs text-text-muted">
            <span>{formatBytes(storage.used)}</span>
            <span>{formatBytes(storage.quota)}</span>
          </div>
        </div>
      )}

      {/* Warning if needed */}
      {storage && storage.percentUsed >= warningThreshold && (
        <div
          className={cn(
            'rounded-lg p-3',
            storage.percentUsed >= criticalThreshold
              ? 'bg-red-50'
              : 'bg-yellow-50'
          )}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={cn(
                'h-4 w-4',
                storage.percentUsed >= criticalThreshold
                  ? 'text-red-600'
                  : 'text-yellow-600'
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                storage.percentUsed >= criticalThreshold
                  ? 'text-red-800'
                  : 'text-yellow-800'
              )}
            >
              {storage.percentUsed >= criticalThreshold
                ? 'Your learning bag is full!'
                : 'Storage getting low'}
            </span>
          </div>
        </div>
      )}

      {/* Cached content list */}
      {cachedContent.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-muted">
            Downloaded Content
          </p>
          <ul className="space-y-2">
            {cachedContent.map((content) => {
              const Icon = getContentIcon(content.type);
              return (
                <li
                  key={content.cacheName}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-text-muted" />
                    <div>
                      <p className="font-medium text-text">{content.name}</p>
                      <p className="text-xs text-text-muted">
                        {formatBytes(content.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(content.cacheName)}
                    disabled={isDeleting === content.cacheName}
                    aria-label={`Delete ${content.name}`}
                  >
                    <Trash2
                      className={cn(
                        'h-4 w-4 text-red-600',
                        isDeleting === content.cacheName && 'animate-spin'
                      )}
                    />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {cachedContent.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <p className="mt-2 font-medium text-text">No cached content</p>
          <p className="text-sm text-text-muted">
            Downloaded content will appear here
          </p>
        </div>
      )}
    </div>
  );
}

export default StorageManager;
