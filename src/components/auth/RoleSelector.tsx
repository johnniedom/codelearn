'use client';

import * as React from 'react';
import { ROLES, ALL_ROLES, type RoleInfo, type UserRole } from '@/types/roles';
import { cn } from '@/lib/utils';

/**
 * Props for the RoleSelector component
 */
interface RoleSelectorProps {
  /** Currently selected role, null if none selected */
  selectedRole: UserRole | null;
  /** Callback fired when a role is selected */
  onSelectRole: (role: UserRole) => void;
  /** Whether the selector is disabled (e.g., during form submission) */
  disabled?: boolean;
}

/**
 * RoleSelector Component
 *
 * Displays selectable role cards for the CodeLearn registration flow.
 * Users can choose between Student, Teacher, and Author roles.
 *
 * Features:
 * - Keyboard navigation with arrow keys and Enter/Space to select
 * - ARIA labels and roles for screen reader accessibility
 * - 44px minimum touch targets for mobile usability
 * - Responsive grid: vertical on mobile, horizontal on desktop
 * - Visual feedback for selected, hover, and focus states
 */
export const RoleSelector = ({
  selectedRole,
  onSelectRole,
  disabled = false,
}: RoleSelectorProps): React.ReactElement => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  /**
   * Handle keyboard navigation within the role group.
   * Arrow keys move focus, Enter/Space selects the focused role.
   */
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, currentRole: UserRole) => {
      const currentIndex = ALL_ROLES.indexOf(currentRole);

      let nextIndex: number | null = null;

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          nextIndex = (currentIndex + 1) % ALL_ROLES.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          nextIndex = (currentIndex - 1 + ALL_ROLES.length) % ALL_ROLES.length;
          break;
        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          nextIndex = ALL_ROLES.length - 1;
          break;
        default:
          return;
      }

      if (nextIndex !== null && containerRef.current) {
        const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>(
          '[role="radio"]'
        );
        buttons[nextIndex]?.focus();
      }
    },
    []
  );

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="Select your role"
      aria-disabled={disabled}
      className="grid grid-cols-1 gap-4 md:grid-cols-3"
    >
      {ALL_ROLES.map((roleId) => {
        const roleInfo = ROLES[roleId];
        const isSelected = selectedRole === roleId;

        return (
          <RoleCard
            key={roleId}
            roleInfo={roleInfo}
            isSelected={isSelected}
            disabled={disabled}
            onSelect={() => onSelectRole(roleId)}
            onKeyDown={(e) => handleKeyDown(e, roleId)}
          />
        );
      })}
    </div>
  );
};

/**
 * Props for the internal RoleCard component
 */
interface RoleCardProps {
  roleInfo: RoleInfo;
  isSelected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}

/**
 * Individual role card component
 * Renders as a button for accessibility (keyboard + click interaction)
 */
const RoleCard = ({
  roleInfo,
  isSelected,
  disabled,
  onSelect,
  onKeyDown,
}: RoleCardProps): React.ReactElement => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${roleInfo.label}: ${roleInfo.description}`}
      disabled={disabled}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        // Base styles - using Card-like appearance
        'group relative flex w-full cursor-pointer flex-col items-center rounded-lg border-2 bg-surface p-6 text-center transition-all duration-200',
        // Minimum touch target: 44px (achieved via padding + content)
        'min-h-[120px]',
        // Focus styles for keyboard navigation
        'outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        // Hover state (only when not disabled)
        !disabled && 'hover:shadow-md hover:shadow-black/10',
        // Selected state
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/50',
        // Disabled state
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      {/* Role icon - using emoji from role config */}
      <span
        className="mb-3 text-4xl"
        role="img"
        aria-hidden="true"
      >
        {roleInfo.icon}
      </span>

      {/* Role title */}
      <span
        className={cn(
          'text-lg font-semibold leading-tight',
          isSelected ? 'text-primary' : 'text-text'
        )}
      >
        {roleInfo.label}
      </span>

      {/* Role description */}
      <span className="mt-2 text-sm leading-snug text-text-muted">
        {roleInfo.description}
      </span>

      {/* Visual selection indicator */}
      <span
        className={cn(
          'absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
          isSelected
            ? 'border-primary bg-primary'
            : 'border-border bg-background'
        )}
        aria-hidden="true"
      >
        {isSelected && (
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </span>
    </button>
  );
};

export type { RoleSelectorProps };
