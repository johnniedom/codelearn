/**
 * SyncButton Component
 *
 * Manual sync trigger button with status indication.
 * Per audit: Provides clear visual feedback during sync operations.
 *
 * Features:
 * - Shows current sync status
 * - Triggers manual sync on click
 * - Disabled when offline or already syncing
 * - Accessible with proper ARIA attributes
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Cloud, CloudOff, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getSyncService, type SyncEvent } from '@/lib/sync';
import useOnlineStatus from '@/hooks/useOnlineStatus';

// =============================================================================
// Types
// =============================================================================

interface SyncButtonProps {
  /** Size variant */
  variant?: 'default' | 'compact' | 'icon';
  /** Additional class names */
  className?: string;
  /** Callback when sync completes */
  onSyncComplete?: (success: boolean) => void;
}

type SyncState = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

// =============================================================================
// SyncButton Component
// =============================================================================

export function SyncButton({
  variant = 'default',
  className,
  onSyncComplete,
}: SyncButtonProps) {
  const isOnline = useOnlineStatus();
  const [syncState, setSyncState] = useState<SyncState>(isOnline ? 'idle' : 'offline');
  const [pendingCount, setPendingCount] = useState(0);

  // Subscribe to sync events
  useEffect(() => {
    const syncService = getSyncService();

    const handleSyncEvent = (event: SyncEvent) => {
      switch (event.type) {
        case 'sync_started':
          setSyncState('syncing');
          break;
        case 'sync_completed':
          setSyncState('success');
          onSyncComplete?.(true);
          // Reset to idle after showing success
          setTimeout(() => {
            setSyncState(isOnline ? 'idle' : 'offline');
          }, 2000);
          break;
        case 'sync_error':
          setSyncState('error');
          onSyncComplete?.(false);
          // Reset to idle after showing error
          setTimeout(() => {
            setSyncState(isOnline ? 'idle' : 'offline');
          }, 3000);
          break;
        case 'online_status_changed':
          const data = event.data as { isOnline: boolean };
          setSyncState(data.isOnline ? 'idle' : 'offline');
          break;
      }
    };

    const unsubscribe = syncService.subscribe(handleSyncEvent);

    // Get initial pending count
    syncService.getOverallSyncStatus().then((status) => {
      setPendingCount(status.pendingCount);
    });

    return unsubscribe;
  }, [isOnline, onSyncComplete]);

  // Update offline state when online status changes
  useEffect(() => {
    if (!isOnline && syncState !== 'syncing') {
      setSyncState('offline');
    } else if (isOnline && syncState === 'offline') {
      setSyncState('idle');
    }
  }, [isOnline, syncState]);

  // Handle sync button click
  const handleSync = useCallback(async () => {
    if (syncState === 'syncing' || !isOnline) return;

    const syncService = getSyncService();
    await syncService.performSync();
  }, [syncState, isOnline]);

  // Get button content based on state and variant
  const getContent = () => {
    const iconClass = variant === 'icon' ? 'h-5 w-5' : 'h-4 w-4';

    switch (syncState) {
      case 'syncing':
        return (
          <>
            <RefreshCw className={cn(iconClass, 'animate-spin')} aria-hidden="true" />
            {variant === 'default' && <span>Syncing...</span>}
          </>
        );
      case 'success':
        return (
          <>
            <Check className={cn(iconClass, 'text-green-600')} aria-hidden="true" />
            {variant === 'default' && <span>Synced!</span>}
          </>
        );
      case 'error':
        return (
          <>
            <AlertTriangle className={cn(iconClass, 'text-orange-600')} aria-hidden="true" />
            {variant === 'default' && <span>Sync failed</span>}
          </>
        );
      case 'offline':
        return (
          <>
            <CloudOff className={cn(iconClass, 'text-text-muted')} aria-hidden="true" />
            {variant === 'default' && <span>Offline</span>}
          </>
        );
      default:
        return (
          <>
            <Cloud className={iconClass} aria-hidden="true" />
            {variant === 'default' && (
              <span>
                Sync{pendingCount > 0 ? ` (${pendingCount})` : ''}
              </span>
            )}
            {variant === 'compact' && pendingCount > 0 && (
              <span className="text-xs font-medium">{pendingCount}</span>
            )}
          </>
        );
    }
  };

  // Get aria-label based on state
  const getAriaLabel = () => {
    switch (syncState) {
      case 'syncing':
        return 'Syncing your changes with the class hub';
      case 'success':
        return 'Sync completed successfully';
      case 'error':
        return 'Sync failed. Tap to retry.';
      case 'offline':
        return 'You are offline. Sync will happen when you reconnect.';
      default:
        return pendingCount > 0
          ? `Sync ${pendingCount} pending changes with the class hub`
          : 'Sync with the class hub';
    }
  };

  // Button variants
  const buttonVariants = {
    default: 'gap-2',
    compact: 'gap-1.5 px-3',
    icon: 'w-10 h-10 p-0',
  };

  return (
    <Button
      type="button"
      variant={syncState === 'error' ? 'outline' : 'ghost'}
      size={variant === 'icon' ? 'icon' : 'sm'}
      onClick={handleSync}
      disabled={syncState === 'syncing' || syncState === 'offline'}
      aria-label={getAriaLabel()}
      aria-busy={syncState === 'syncing'}
      className={cn(
        'relative transition-all duration-200',
        buttonVariants[variant],
        syncState === 'error' && 'border-orange-300 hover:border-orange-400',
        syncState === 'success' && 'text-green-600',
        className
      )}
    >
      {getContent()}

      {/* Pending indicator badge (for icon variant) */}
      {variant === 'icon' && pendingCount > 0 && syncState === 'idle' && (
        <span
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white"
          aria-hidden="true"
        >
          {pendingCount > 9 ? '9+' : pendingCount}
        </span>
      )}
    </Button>
  );
}

// =============================================================================
// SyncStatusBar Component
// =============================================================================

interface SyncStatusBarProps {
  className?: string;
}

/**
 * Full-width sync status bar
 * Shows sync status with progress indication
 */
export function SyncStatusBar({ className }: SyncStatusBarProps) {
  const isOnline = useOnlineStatus();
  const [syncState, setSyncState] = useState<SyncState>(isOnline ? 'idle' : 'offline');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const syncService = getSyncService();

    const handleSyncEvent = (event: SyncEvent) => {
      switch (event.type) {
        case 'sync_started':
          setSyncState('syncing');
          setProgress(0);
          setMessage('Preparing sync...');
          break;
        case 'sync_progress': {
          const data = event.data as { phase: string; count?: number };
          setMessage(
            data.phase === 'sending'
              ? `Sharing ${data.count} changes...`
              : `Receiving updates...`
          );
          setProgress(data.phase === 'sending' ? 50 : 75);
          break;
        }
        case 'sync_completed': {
          const data = event.data as { deltasSent: number; deltasReceived: number };
          setSyncState('success');
          setProgress(100);
          setMessage(
            `Shared ${data.deltasSent} changes, received ${data.deltasReceived} updates`
          );
          setTimeout(() => {
            setSyncState(isOnline ? 'idle' : 'offline');
            setProgress(0);
            setMessage('');
          }, 3000);
          break;
        }
        case 'sync_error': {
          const data = event.data as { error: string };
          setSyncState('error');
          setMessage(data.error || 'Problem sharing your work');
          setTimeout(() => {
            setSyncState(isOnline ? 'idle' : 'offline');
            setMessage('');
          }, 5000);
          break;
        }
        case 'online_status_changed':
          const online = (event.data as { isOnline: boolean }).isOnline;
          setSyncState(online ? 'idle' : 'offline');
          setMessage(online ? '' : 'Working offline - your work is saved here');
          break;
      }
    };

    const unsubscribe = syncService.subscribe(handleSyncEvent);
    return unsubscribe;
  }, [isOnline]);

  // Don't show bar when idle
  if (syncState === 'idle') return null;

  const getBarColor = () => {
    switch (syncState) {
      case 'syncing':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-orange-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed left-0 right-0 top-16 z-40',
        'bg-surface/95 backdrop-blur-sm',
        'border-b border-border',
        className
      )}
    >
      {/* Progress bar */}
      {syncState === 'syncing' && (
        <div className="h-1 w-full bg-gray-200">
          <div
            className={cn('h-full transition-all duration-300', getBarColor())}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Message */}
      <div className="flex items-center gap-2 px-4 py-2 text-sm">
        {syncState === 'syncing' && (
          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
        )}
        {syncState === 'success' && (
          <Check className="h-4 w-4 text-green-600" />
        )}
        {syncState === 'error' && (
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        )}
        {syncState === 'offline' && (
          <CloudOff className="h-4 w-4 text-gray-500" />
        )}
        <span className="text-text-muted">{message}</span>
      </div>
    </div>
  );
}

export default SyncButton;
