/**
 * ProfileCard Component
 *
 * Displays a user profile for the profile selector on shared devices.
 *
 * Features:
 * - Shows icon + color band + name + last activity
 * - Visually distinct for each profile
 * - Accessible with keyboard navigation
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { PROFILE_ICONS, PROFILE_COLORS } from '@/lib/auth/validators';
import type { Profile } from '@/lib/db';

interface ProfileCardProps {
  /** Profile data to display */
  profile: Profile;
  /** Called when profile is selected */
  onSelect: (profile: Profile) => void;
  /** Whether this profile is currently selected */
  selected?: boolean;
  /** Disable selection */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Format last activity time in a human-readable way
 */
function formatLastActivity(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  // Format as date
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export const ProfileCard = React.forwardRef<HTMLButtonElement, ProfileCardProps>(
  ({ profile, onSelect, selected = false, disabled = false, className }, ref) => {
    // Get icon and color data
    const iconData = PROFILE_ICONS.find((i) => i.id === profile.profileIcon);
    const colorData = PROFILE_COLORS.find((c) => c.id === profile.profileColor);

    const emoji = iconData?.emoji ?? '👤';
    const iconLabel = iconData?.label ?? 'Profile';
    const colorHex = colorData?.hex ?? '#6B7280';

    const lastActive = profile.lastUsedAt
      ? formatLastActivity(new Date(profile.lastUsedAt))
      : 'Never';

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => onSelect(profile)}
        disabled={disabled || profile.accountStatus !== 'active'}
        aria-pressed={selected}
        aria-label={`Select profile ${profile.preferredName}`}
        className={cn(
          // Base styles
          'relative flex w-full flex-col items-center gap-2 rounded-xl p-4',
          'border-2 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          // Normal state
          !selected && 'border-border bg-surface hover:border-primary/50 hover:shadow-md',
          // Selected state
          selected && 'border-primary bg-primary/5 shadow-md',
          // Disabled/suspended state
          (disabled || profile.accountStatus !== 'active') &&
            'cursor-not-allowed opacity-60',
          className
        )}
      >
        {/* Color band at top */}
        <div
          className="absolute left-0 right-0 top-0 h-2 rounded-t-lg"
          style={{ backgroundColor: colorHex }}
          aria-hidden="true"
        />

        {/* Avatar with icon */}
        <div
          className="mt-2 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${colorHex}20` }}
          aria-hidden="true"
        >
          <span className="text-4xl" role="img" aria-label={iconLabel}>
            {emoji}
          </span>
        </div>

        {/* Name */}
        <div className="text-center">
          <p className="text-lg font-semibold text-text">{profile.preferredName}</p>
          <p className="text-xs text-text-muted">{lastActive}</p>
        </div>

        {/* Status badge for suspended/archived */}
        {profile.accountStatus !== 'active' && (
          <span className="absolute right-2 top-4 rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning">
            {profile.accountStatus === 'suspended' ? 'Suspended' : 'Archived'}
          </span>
        )}

        {/* Selection indicator */}
        {selected && (
          <div
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
            aria-hidden="true"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </button>
    );
  }
);

ProfileCard.displayName = 'ProfileCard';

/**
 * AddProfileCard Component
 *
 * Card for adding a new profile on the device
 */
interface AddProfileCardProps {
  /** Called when clicked */
  onClick: () => void;
  /** Disable interaction */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

export const AddProfileCard = React.forwardRef<
  HTMLButtonElement,
  AddProfileCardProps
>(({ onClick, disabled = false, className }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Add new profile"
      className={cn(
        // Base styles
        'flex w-full flex-col items-center justify-center gap-2 rounded-xl p-4',
        'border-2 border-dashed border-border',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        // Hover state
        !disabled && 'hover:border-primary hover:bg-primary/5',
        // Disabled state
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      style={{ minHeight: '150px' }}
    >
      {/* Plus icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
        <svg
          className="h-8 w-8 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>

      {/* Label */}
      <p className="text-sm font-medium text-text-muted">Add new profile</p>
    </button>
  );
});

AddProfileCard.displayName = 'AddProfileCard';

export default ProfileCard;
