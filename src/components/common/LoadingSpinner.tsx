import { cn } from '@/lib/utils';

/**
 * Loading Spinner Component
 * Offline-First audit:
 * - Activity indicator for indeterminate loading (use sparingly)
 * - Should be used only when skeleton screens are not appropriate
 *
 * Prefer skeleton screens for content that will have predictable structure.
 * Use spinner for:
 * - Form submissions
 * - Quick actions (< 1s expected)
 * - When content structure is unknown
 */

interface LoadingSpinnerProps {
  /** Size variant of the spinner */
  size?: 'sm' | 'default' | 'lg';
  /** Optional additional class names */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
  /** Whether to center the spinner in its container */
  centered?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  default: 'h-8 w-8 border-4',
  lg: 'h-12 w-12 border-4',
};

/**
 * Spinning loader indicator
 *
 * Uses CSS animation for smooth performance.
 * Includes proper ARIA attributes for accessibility.
 */
export function LoadingSpinner({
  size = 'default',
  className,
  label = 'Loading',
  centered = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}...</span>
    </div>
  );

  if (centered) {
    return (
      <div className="flex items-center justify-center p-4">{spinner}</div>
    );
  }

  return spinner;
}

/**
 * Full-page loading overlay
 *
 * Use for route transitions or full-page loading states.
 * Blocks interaction while loading.
 */
interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Optional loading message */
  message?: string;
  /** Whether to show a semi-transparent backdrop */
  backdrop?: boolean;
}

export function LoadingOverlay({
  visible,
  message,
  backdrop = true,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center gap-4',
        backdrop && 'bg-background/80 backdrop-blur-sm'
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner size="lg" />
      {message && (
        <p className="text-sm font-medium text-text-muted">{message}</p>
      )}
    </div>
  );
}

/**
 * Button loading state
 *
 * Smaller spinner specifically for use inside buttons.
 * Replaces button content while action is in progress.
 */
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <LoadingSpinner
      size="sm"
      className={cn('text-current', className)}
      label="Processing"
    />
  );
}

/**
 * Inline loading indicator
 *
 * For use within text or alongside other content.
 */
export function InlineSpinner({
  label = 'Loading',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LoadingSpinner size="sm" label={label} />
      <span className="text-sm text-text-muted">{label}...</span>
    </span>
  );
}

export default LoadingSpinner;
