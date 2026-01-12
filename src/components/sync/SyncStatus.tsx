/**
 * SyncStatus Component
 *
 * Multi-signal sync indicator per audit requirements.
 * Uses color + icon + shape for accessibility.
 *
 * States (per audit):
 * - "Saved here" (blue, device icon, circle)
 * - "Waiting to share" (yellow, cloud+clock, circle+notch)
 * - "Sharing now" (blue, cloud+arrows, animated)
 * - "Shared with class" (green, cloud+check, full circle)
 * - "Problem sharing" (orange, warning, triangle)
 *
 * Accessibility:
 * - aria-live region for status changes
 * - Screen reader friendly labels
 */

import { useEffect, useState } from 'react';
import {
  Smartphone,
  Cloud,
  Check,
  Clock,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserFriendlySyncStatus } from '@/lib/sync';

// =============================================================================
// Types
// =============================================================================

interface SyncStatusProps {
  /** Current sync status */
  status: UserFriendlySyncStatus;
  /** Whether to show text label */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Status Configuration
// =============================================================================

interface StatusConfig {
  /** User-friendly label */
  label: string;
  /** Screen reader description */
  ariaLabel: string;
  /** Icon component */
  icon: React.ElementType;
  /** Secondary icon (for composite icons) */
  secondaryIcon?: React.ElementType;
  /** Background/border color */
  colorClass: string;
  /** Icon color */
  iconColorClass: string;
  /** Whether icon should animate */
  animate?: boolean;
}

const STATUS_CONFIG: Record<UserFriendlySyncStatus, StatusConfig> = {
  saved_here: {
    label: 'Saved here',
    ariaLabel: 'Your work is saved on this device',
    icon: Smartphone,
    colorClass: 'bg-blue-100 border-blue-300',
    iconColorClass: 'text-blue-600',
  },
  waiting_to_share: {
    label: 'Waiting to share',
    ariaLabel: 'Your work is saved and waiting to sync when connected',
    icon: Cloud,
    secondaryIcon: Clock,
    colorClass: 'bg-yellow-100 border-yellow-300',
    iconColorClass: 'text-yellow-600',
  },
  sharing_now: {
    label: 'Sharing now',
    ariaLabel: 'Your work is currently syncing',
    icon: Cloud,
    secondaryIcon: RefreshCw,
    colorClass: 'bg-blue-100 border-blue-300',
    iconColorClass: 'text-blue-600',
    animate: true,
  },
  shared_with_class: {
    label: 'Shared with class',
    ariaLabel: 'Your work has been synced and is available to your class',
    icon: Cloud,
    secondaryIcon: Check,
    colorClass: 'bg-green-100 border-green-300',
    iconColorClass: 'text-green-600',
  },
  problem_sharing: {
    label: 'Problem sharing',
    ariaLabel: 'There was a problem syncing your work. It is still saved locally.',
    icon: AlertTriangle,
    colorClass: 'bg-orange-100 border-orange-300',
    iconColorClass: 'text-orange-600',
  },
};

// =============================================================================
// Size Configuration
// =============================================================================

const SIZE_CONFIG = {
  sm: {
    container: 'h-6 px-2 gap-1',
    icon: 'h-3.5 w-3.5',
    secondaryIcon: 'h-2.5 w-2.5',
    text: 'text-xs',
  },
  md: {
    container: 'h-8 px-3 gap-1.5',
    icon: 'h-4 w-4',
    secondaryIcon: 'h-3 w-3',
    text: 'text-sm',
  },
  lg: {
    container: 'h-10 px-4 gap-2',
    icon: 'h-5 w-5',
    secondaryIcon: 'h-3.5 w-3.5',
    text: 'text-base',
  },
};

// =============================================================================
// SyncStatus Component
// =============================================================================

export function SyncStatus({
  status,
  showLabel = true,
  size = 'md',
  className,
}: SyncStatusProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  // Track previous status for aria announcements
  const [previousStatus, setPreviousStatus] = useState(status);
  const [announced, setAnnounced] = useState(false);

  useEffect(() => {
    if (status !== previousStatus) {
      setPreviousStatus(status);
      setAnnounced(true);
      // Reset announced after a short delay
      const timer = setTimeout(() => setAnnounced(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [status, previousStatus]);

  const Icon = config.icon;
  const SecondaryIcon = config.secondaryIcon;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        // Base styles
        'inline-flex items-center rounded-full border',
        // Color
        config.colorClass,
        // Size
        sizeConfig.container,
        className
      )}
    >
      {/* Icon container */}
      <span className="relative flex items-center justify-center">
        <Icon
          className={cn(
            sizeConfig.icon,
            config.iconColorClass,
            config.animate && 'animate-pulse'
          )}
          aria-hidden="true"
        />
        {SecondaryIcon && (
          <SecondaryIcon
            className={cn(
              'absolute -bottom-0.5 -right-0.5 rounded-full bg-white',
              sizeConfig.secondaryIcon,
              config.iconColorClass,
              config.animate && SecondaryIcon === RefreshCw && 'animate-spin'
            )}
            aria-hidden="true"
          />
        )}
      </span>

      {/* Label */}
      {showLabel && (
        <span
          className={cn(
            'font-medium',
            sizeConfig.text,
            config.iconColorClass
          )}
        >
          {config.label}
        </span>
      )}

      {/* Screen reader announcement */}
      <span className="sr-only">
        {announced ? `Status changed: ${config.ariaLabel}` : config.ariaLabel}
      </span>
    </div>
  );
}

// =============================================================================
// SyncStatusIcon (Icon Only Variant)
// =============================================================================

interface SyncStatusIconProps {
  status: UserFriendlySyncStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Icon-only sync status indicator
 * For use in tight spaces like table cells or lists
 */
export function SyncStatusIcon({
  status,
  size = 'md',
  className,
}: SyncStatusIconProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  const Icon = config.icon;
  const SecondaryIcon = config.secondaryIcon;

  return (
    <span
      role="status"
      aria-label={config.ariaLabel}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full p-1',
        config.colorClass,
        className
      )}
    >
      <Icon
        className={cn(
          sizeConfig.icon,
          config.iconColorClass,
          config.animate && 'animate-pulse'
        )}
        aria-hidden="true"
      />
      {SecondaryIcon && (
        <SecondaryIcon
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full bg-white',
            sizeConfig.secondaryIcon,
            config.iconColorClass,
            config.animate && SecondaryIcon === RefreshCw && 'animate-spin'
          )}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the user-friendly label for a sync status
 */
export function getSyncStatusLabel(status: UserFriendlySyncStatus): string {
  return STATUS_CONFIG[status].label;
}

/**
 * Get the aria-label for a sync status
 */
export function getSyncStatusAriaLabel(status: UserFriendlySyncStatus): string {
  return STATUS_CONFIG[status].ariaLabel;
}

export default SyncStatus;
