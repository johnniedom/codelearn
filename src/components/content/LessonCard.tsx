import { CheckCircle, Lock, PlayCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LessonStatus } from '@/types/content';
import { formatDuration } from '@/types/content';

/**
 * LessonCard Props
 */
export interface LessonCardProps {
  /** Lesson title */
  title: string;
  /** Duration in minutes */
  duration: number;
  /** Current status of the lesson */
  status: LessonStatus;
  /** Called when the card is clicked/activated */
  onSelect?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get status icon and styling for each lesson status
 */
function getStatusConfig(status: LessonStatus) {
  switch (status) {
    case 'completed':
      return {
        Icon: CheckCircle,
        iconClass: 'text-success',
        label: 'Completed',
        bgClass: 'bg-success/10',
      };
    case 'in-progress':
      return {
        Icon: PlayCircle,
        iconClass: 'text-warning',
        label: 'In progress',
        bgClass: 'bg-warning/10',
      };
    case 'available':
      return {
        Icon: PlayCircle,
        iconClass: 'text-primary',
        label: 'Available',
        bgClass: 'bg-primary/10',
      };
    case 'locked':
      return {
        Icon: Lock,
        iconClass: 'text-text-muted/50',
        label: 'Locked - Complete previous lessons first',
        bgClass: 'bg-surface',
      };
  }
}

/**
 * LessonCard Component
 *
 * Displays a lesson item in a list with status indicator.
 *
 * Accessibility:
 * - Uses <button> element for clickable cards (not <div>)
 * - aria-disabled for locked lessons
 * - Status communicated via sr-only text
 * - 44px minimum touch target
 * - Focus-visible ring
 */
export function LessonCard({
  title,
  duration,
  status,
  onSelect,
  className,
}: LessonCardProps) {
  const { Icon, iconClass, label, bgClass } = getStatusConfig(status);
  const isLocked = status === 'locked';
  const isClickable = !isLocked && onSelect !== undefined;

  const handleClick = () => {
    if (isClickable && onSelect) {
      onSelect();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isLocked}
      aria-disabled={isLocked}
      className={cn(
        // Base styles
        'group flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 text-left',
        // Minimum touch target (44px height ensured by padding)
        'min-h-[56px]',
        // Transitions
        'transition-all duration-fast',
        // Interactive states for non-locked cards
        !isLocked && [
          'cursor-pointer',
          'hover:border-border-focus hover:shadow-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2',
          'active:scale-[0.99]',
        ],
        // Locked state styling
        isLocked && [
          'cursor-not-allowed',
          'opacity-60',
        ],
        className
      )}
    >
      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <h3 className="truncate text-sm font-semibold text-text">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Clock className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Status indicator */}
      <div
        className={cn(
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
          bgClass
        )}
        aria-hidden="true"
      >
        <Icon className={cn('h-5 w-5', iconClass)} />
      </div>

      {/* Screen reader status */}
      <span className="sr-only">{label}</span>
    </button>
  );
}

export default LessonCard;
