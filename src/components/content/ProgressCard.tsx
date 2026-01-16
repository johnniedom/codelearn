import { cn } from '@/lib/utils';
import { Progress as ProgressBar } from '@/components/ui/progress';
import type { CourseProgress } from '@/lib/content';

/**
 * ProgressCard Props
 */
export interface ProgressCardProps {
  /** Course title */
  title: string;
  /** Progress data */
  progress: CourseProgress;
  /** Called when the card is clicked */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ProgressCard Component
 *
 * Displays course progress with a visual progress bar.
 *
 * Features:
 * - Visual progress bar with percentage
 * - Lesson completion count
 * - Clickable for navigation to course
 * - Accessible with proper ARIA attributes
 */
export function ProgressCard({
  title,
  progress,
  onClick,
  className,
}: ProgressCardProps) {
  const { completedLessons, totalLessons, percentComplete } = progress;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && onClick) {
      event.preventDefault();
      handleClick();
    }
  };

  const CardWrapper = onClick ? 'button' : 'div';

  return (
    <CardWrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={cn(
        // Base styles
        'w-full rounded-lg border border-border bg-surface p-4 text-left',
        // Interactive states if clickable
        onClick && [
          'cursor-pointer',
          'transition-all duration-fast',
          'hover:border-border-focus hover:shadow-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        ],
        className
      )}
      aria-label={onClick ? `Continue ${title}. ${percentComplete}% complete.` : undefined}
    >
      {/* Course title */}
      <h2 className="mb-3 text-base font-semibold text-text">
        Current Course: {title}
      </h2>

      {/* Progress bar */}
      <div className="mb-2">
        <ProgressBar
          value={percentComplete}
          className="h-2"
          aria-label={`Progress: ${percentComplete}%`}
        />
      </div>

      {/* Progress text */}
      <p className="text-xs text-text-muted">
        {completedLessons} of {totalLessons} lessons completed
      </p>
    </CardWrapper>
  );
}

/**
 * ProgressCardSkeleton
 *
 * Loading skeleton for the ProgressCard component.
 */
export function ProgressCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-full rounded-lg border border-border bg-surface p-4',
        className
      )}
      aria-busy="true"
      aria-label="Loading progress..."
    >
      {/* Title skeleton */}
      <div className="mb-3 h-5 w-3/4 animate-pulse rounded bg-surface-hover" />

      {/* Progress bar skeleton */}
      <div className="mb-2 h-2 w-full animate-pulse rounded-full bg-surface-hover" />

      {/* Text skeleton */}
      <div className="h-4 w-1/2 animate-pulse rounded bg-surface-hover" />
    </div>
  );
}

export default ProgressCard;
