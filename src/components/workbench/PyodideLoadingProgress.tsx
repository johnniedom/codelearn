/**
 * PyodideLoadingProgress Component
 *
 * Shows download progress when loading Pyodide Python runtime.
 *
 * Features:
 * - Progress bar with percentage
 * - Download size and speed info
 * - Cancel button
 * - Memory warning for low-end devices
 * - Accessible status announcements
 */

import { useState, useEffect } from 'react';
import { Download, AlertTriangle, X, Wifi, WifiOff } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DownloadProgress } from '@/components/common/ProgressBar';
import type { PyodideLoadProgress, MemoryCheckResult } from '@/lib/execution';
import { checkMemoryPressure, cancelPyodideLoad } from '@/lib/execution';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

// =============================================================================
// Types
// =============================================================================

interface PyodideLoadingProgressProps {
  /** Current loading progress */
  progress: PyodideLoadProgress | null;
  /** Whether loading is active */
  isLoading: boolean;
  /** Callback when user cancels */
  onCancel?: () => void;
  /** Callback when loading completes */
  onComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PyodideLoadingProgress({
  progress,
  isLoading,
  onCancel,
  onComplete,
  className,
}: PyodideLoadingProgressProps) {
  const [memoryCheck, setMemoryCheck] = useState<MemoryCheckResult | null>(null);
  const isOnline = useOnlineStatus();

  // Check memory on mount
  useEffect(() => {
    const check = checkMemoryPressure();
    setMemoryCheck(check);
  }, []);

  // Notify on completion
  useEffect(() => {
    if (progress?.stage === 'ready') {
      onComplete?.();
    }
  }, [progress?.stage, onComplete]);

  /**
   * Handle cancel button click
   */
  const handleCancel = () => {
    cancelPyodideLoad();
    onCancel?.();
  };

  // Not loading and no progress - don't show anything
  if (!isLoading && !progress) {
    return null;
  }

  // Error state
  if (progress?.stage === 'error') {
    return (
      <div
        className={cn(
          'rounded-md border border-error/50 bg-error/10 p-4',
          className
        )}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-error" />
          <div className="flex-1">
            <p className="font-medium text-error">Failed to load Python runtime</p>
            <p className="mt-1 text-sm text-text-muted">{progress.message}</p>
            {!isOnline && (
              <p className="mt-2 flex items-center gap-2 text-sm text-warning">
                <WifiOff className="h-4 w-4" />
                You appear to be offline. Python runtime requires an initial download.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading complete
  if (progress?.stage === 'ready') {
    return null; // Component will unmount or parent will hide it
  }

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-surface p-4',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          <span className="font-medium text-text">Loading Python Runtime</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-8 w-8 p-0"
          aria-label="Cancel download"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Memory warning */}
      {memoryCheck?.warning && (
        <div className="mb-3 flex items-start gap-2 rounded bg-warning/10 p-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-warning" />
          <p className="text-xs text-warning">{memoryCheck.warning}</p>
        </div>
      )}

      {/* Offline warning */}
      {!isOnline && progress?.stage === 'downloading' && (
        <div className="mb-3 flex items-start gap-2 rounded bg-warning/10 p-2">
          <WifiOff className="h-4 w-4 flex-shrink-0 text-warning" />
          <p className="text-xs text-warning">
            Download paused - waiting for network connection.
          </p>
        </div>
      )}

      {/* Progress bar */}
      <DownloadProgress
        value={progress?.progress ?? 0}
        label={progress?.message ?? 'Preparing...'}
        downloadedBytes={progress?.downloadedBytes}
        totalBytes={progress?.totalBytes}
      />

      {/* Stage-specific messages */}
      <div className="mt-3 text-xs text-text-muted">
        {progress?.stage === 'checking' && (
          <p>Checking device compatibility and storage space...</p>
        )}
        {progress?.stage === 'downloading' && (
          <p>
            This is a one-time download (~25 MB). Python will work offline after
            this.
          </p>
        )}
        {progress?.stage === 'loading' && (
          <p>Initializing Python environment...</p>
        )}
      </div>

      {/* Online status indicator */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3 text-success" />
            <span className="text-text-muted">Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 text-warning" />
            <span className="text-warning">Offline</span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Compact loading indicator for inline use
 */
export function PyodideLoadingIndicator({
  progress,
  className,
}: {
  progress: PyodideLoadProgress | null;
  className?: string;
}) {
  if (!progress || progress.stage === 'ready') {
    return null;
  }

  return (
    <div
      className={cn('flex items-center gap-2 text-sm text-text-muted', className)}
      role="status"
      aria-live="polite"
    >
      {progress.stage === 'error' ? (
        <>
          <AlertTriangle className="h-4 w-4 text-error" />
          <span className="text-error">Failed to load Python</span>
        </>
      ) : (
        <>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>{progress.message}</span>
          {progress.progress > 0 && (
            <span className="font-medium">{Math.round(progress.progress)}%</span>
          )}
        </>
      )}
    </div>
  );
}

export default PyodideLoadingProgress;
