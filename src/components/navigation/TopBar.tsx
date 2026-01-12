import { Code, Wifi, WifiOff, Cloud, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncStore } from '@/stores/syncStore';
import { cn } from '@/lib/utils';

/**
 * Sync Status Types
 *
 * Per Offline-First audit requirements:
 * - Multi-signal indicators (color + icon + shape)
 * - User-friendly vocabulary (not technical jargon)
 */
type SyncStatusType = 'local' | 'pending' | 'syncing' | 'synced' | 'error' | 'offline';

interface SyncStatusConfig {
  label: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  ariaLabel: string;
}

/**
 * Sync status vocabulary per audit:
 * - "Saved here" (local)
 * - "Shared with class" (synced)
 * - "Waiting to share" (pending)
 * - "Working offline" (offline)
 */
const SYNC_STATUS_CONFIG: Record<SyncStatusType, SyncStatusConfig> = {
  local: {
    label: 'Saved here',
    icon: CloudOff,
    colorClass: 'text-info',
    bgClass: 'bg-info/10',
    borderClass: 'border-info/20',
    ariaLabel: 'Your progress is saved locally on this device',
  },
  pending: {
    label: 'Waiting to share',
    icon: Cloud,
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/20',
    ariaLabel: 'Changes are waiting to sync when connection is available',
  },
  syncing: {
    label: 'Sharing now',
    icon: RefreshCw,
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/20',
    ariaLabel: 'Syncing your progress with the hub',
  },
  synced: {
    label: 'Shared with class',
    icon: Cloud,
    colorClass: 'text-success',
    bgClass: 'bg-success/10',
    borderClass: 'border-success/20',
    ariaLabel: 'All changes are synced and shared',
  },
  error: {
    label: 'Problem sharing',
    icon: AlertTriangle,
    colorClass: 'text-error',
    bgClass: 'bg-error/10',
    borderClass: 'border-error/20',
    ariaLabel: 'There was a problem syncing. We will retry automatically',
  },
  offline: {
    label: 'Working offline',
    icon: WifiOff,
    colorClass: 'text-text-muted',
    bgClass: 'bg-surface',
    borderClass: 'border-border',
    ariaLabel: 'You are working offline. Your progress is saved locally',
  },
};

/**
 * Status indicator shape component
 *
 * Per audit: Multi-signal indicators with different shapes
 * - Circle: stable states (synced, local)
 * - Circle with notch: pending action
 * - Triangle: needs attention
 */
function StatusShape({ status }: { status: SyncStatusType }) {
  const baseClasses = 'h-2 w-2 shrink-0';

  switch (status) {
    case 'synced':
    case 'local':
      // Full circle for stable states
      return <div className={cn(baseClasses, 'rounded-full bg-current')} />;
    case 'pending':
      // Circle with notch (represented as ring)
      return (
        <div
          className={cn(
            baseClasses,
            'rounded-full border-2 border-current bg-transparent'
          )}
        />
      );
    case 'syncing':
      // Animated circle for active sync
      return (
        <div
          className={cn(
            baseClasses,
            'animate-pulse rounded-full bg-current'
          )}
        />
      );
    case 'error':
      // Triangle for attention states
      return (
        <div
          className={cn(
            'h-0 w-0 border-x-[4px] border-b-[7px] border-x-transparent border-b-current'
          )}
        />
      );
    case 'offline':
    default:
      return <div className={cn(baseClasses, 'rounded-full bg-current opacity-50')} />;
  }
}

/**
 * Sync Status Indicator Component
 *
 * Displays current sync status with:
 * - Multi-signal feedback (color + icon + shape)
 * - User-friendly text labels
 * - Proper ARIA attributes for accessibility
 */
function SyncStatusIndicator() {
  const isOnline = useOnlineStatus();
  const { syncStatus, pendingItemsCount, isHubReachable } = useSyncStore();

  // Determine the actual display status
  const getDisplayStatus = (): SyncStatusType => {
    if (!isOnline) return 'offline';
    if (syncStatus === 'error') return 'error';
    if (syncStatus === 'syncing') return 'syncing';
    if (pendingItemsCount > 0) return 'pending';
    if (isHubReachable) return 'synced';
    return 'local';
  };

  const displayStatus = getDisplayStatus();
  const config = SYNC_STATUS_CONFIG[displayStatus];
  const Icon = config.icon;

  return (
    <div
      role="status"
      aria-label={config.ariaLabel}
      aria-live="polite"
      className={cn(
        'flex items-center gap-2 rounded-full border px-2.5 py-1',
        config.bgClass,
        config.borderClass
      )}
    >
      <StatusShape status={displayStatus} />
      <Icon
        className={cn('h-3.5 w-3.5', config.colorClass, {
          'animate-spin': displayStatus === 'syncing',
        })}
        aria-hidden="true"
      />
      <span className={cn('text-xs font-medium', config.colorClass)}>
        {config.label}
      </span>
    </div>
  );
}

/**
 * Offline Banner Component
 *
 * Per audit: Show capability banner, not error modal
 * "Working offline - Your work is saved"
 */
function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-warning/10 px-4 py-1.5 text-sm"
    >
      <WifiOff className="h-4 w-4 text-warning" aria-hidden="true" />
      <span className="font-medium text-warning">
        Working offline - Your progress is saved
      </span>
    </div>
  );
}

/**
 * Online Status Indicator (subtle)
 *
 * Shows when online and connected to hub
 */
function OnlineIndicator() {
  const isOnline = useOnlineStatus();
  const { isHubReachable } = useSyncStore();

  if (!isOnline || !isHubReachable) return null;

  return (
    <div
      role="status"
      aria-label="Connected to hub"
      className="flex items-center gap-1.5 text-success"
    >
      <Wifi className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Connected</span>
    </div>
  );
}

/**
 * TopBar Props
 */
interface TopBarProps {
  /** App title to display */
  title?: string;
  /** Whether to show the offline banner at top */
  showOfflineBanner?: boolean;
  /** Whether to show the sync status indicator */
  showSyncStatus?: boolean;
  /** Optional right-side content */
  rightContent?: React.ReactNode;
  /** Optional additional class names */
  className?: string;
}

/**
 * TopBar Component
 *
 * Main navigation header for the CodeLearn PWA.
 *
 * Features:
 * - Offline indicator with aria-label, role="status"
 * - Multi-signal status (color + icon + shape)
 * - User-friendly text: "Working offline" not "No connection"
 *
 * Accessibility:
 * - Semantic HTML structure
 * - Proper ARIA attributes
 * - Focus-visible states on interactive elements
 * - 44px minimum touch targets
 */
export function TopBar({
  title = 'CodeLearn',
  showOfflineBanner = true,
  showSyncStatus = true,
  rightContent,
  className,
}: TopBarProps) {
  return (
    <header className={cn('fixed left-0 right-0 top-0 z-50', className)}>
      {/* Offline banner - shown above header when offline */}
      {showOfflineBanner && <OfflineBanner />}

      {/* Main header bar */}
      <div className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 safe-area-inset-top">
        {/* Left: App branding */}
        <div className="flex items-center gap-2">
          <Code className="h-6 w-6 text-primary" aria-hidden="true" />
          <h1 className="text-base font-semibold text-text">{title}</h1>
        </div>

        {/* Right: Status indicators and optional content */}
        <div className="flex items-center gap-3">
          {/* Online indicator (subtle when connected) */}
          <OnlineIndicator />

          {/* Sync status indicator */}
          {showSyncStatus && <SyncStatusIndicator />}

          {/* Optional right content (e.g., user menu) */}
          {rightContent}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
