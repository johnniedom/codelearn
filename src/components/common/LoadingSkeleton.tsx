import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading Skeleton Components
 *
 * Use skeleton screens for < 2s expected load times.
 * Reduces perceived loading time by showing content structure.
 *
 * These provide visual feedback while content loads,
 * preventing layout shift (CLS) when content appears.
 */

interface LoadingSkeletonProps {
  className?: string;
}

/**
 * Card skeleton for lesson/course cards
 */
export function CardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface p-4',
        className
      )}
      role="status"
      aria-label="Loading content"
    >
      <div className="flex items-start gap-4">
        {/* Icon placeholder */}
        <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          {/* Title */}
          <Skeleton className="h-4 w-3/4" />
          {/* Description */}
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      {/* Progress bar placeholder */}
      <div className="mt-4">
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * List skeleton for multiple items
 */
export function ListSkeleton({
  count = 3,
  className,
}: LoadingSkeletonProps & { count?: number }) {
  return (
    <div
      className={cn('space-y-4', className)}
      role="status"
      aria-label="Loading list"
    >
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
      <span className="sr-only">Loading {count} items...</span>
    </div>
  );
}

/**
 * Text skeleton for paragraphs
 */
export function TextSkeleton({
  lines = 3,
  className,
}: LoadingSkeletonProps & { lines?: number }) {
  return (
    <div
      className={cn('space-y-2', className)}
      role="status"
      aria-label="Loading text"
    >
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'h-4',
            // Last line is shorter for natural text appearance
            index === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
      <span className="sr-only">Loading text...</span>
    </div>
  );
}

/**
 * Avatar skeleton for user profiles
 */
export function AvatarSkeleton({
  size = 'default',
  className,
}: LoadingSkeletonProps & { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  return (
    <Skeleton
      className={cn('rounded-full', sizeClasses[size], className)}
      role="status"
      aria-label="Loading user"
    />
  );
}

/**
 * Page header skeleton
 */
export function HeaderSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn('space-y-4', className)}
      role="status"
      aria-label="Loading header"
    >
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
      <span className="sr-only">Loading page header...</span>
    </div>
  );
}

/**
 * Stats grid skeleton (for dashboard)
 */
export function StatsSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4 sm:grid-cols-3',
        className
      )}
      role="status"
      aria-label="Loading statistics"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-border bg-surface p-4"
        >
          <Skeleton className="mb-2 h-10 w-10 rounded-full" />
          <Skeleton className="mb-1 h-6 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
      <span className="sr-only">Loading statistics...</span>
    </div>
  );
}

/**
 * Full page skeleton for initial load
 */
export function PageSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn('space-y-8 p-4', className)}
      role="status"
      aria-label="Loading page"
      aria-busy="true"
    >
      <HeaderSkeleton />
      <StatsSkeleton />
      <div>
        <Skeleton className="mb-4 h-5 w-32" />
        <ListSkeleton count={2} />
      </div>
      <span className="sr-only">Loading page content...</span>
    </div>
  );
}

export default {
  Card: CardSkeleton,
  List: ListSkeleton,
  Text: TextSkeleton,
  Avatar: AvatarSkeleton,
  Header: HeaderSkeleton,
  Stats: StatsSkeleton,
  Page: PageSkeleton,
};
