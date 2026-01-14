'use client';

import { Bell, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * ComingSoonBanner Props
 */
export interface ComingSoonBannerProps {
  /** Optional expected release date */
  expectedDate?: Date | string;
  /** Callback when "Notify Me" button is clicked */
  onNotifyMe?: () => void;
  /** Whether the user has already signed up for notifications */
  isSubscribed?: boolean;
  /** Loading state for the notify button */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format the expected date for display
 */
function formatExpectedDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  // Format as "Month Day, Year" (e.g., "January 15, 2025")
  return dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * ComingSoonBanner Component
 *
 * Displays a banner for draft/upcoming content with an expected release date
 * and a "Notify Me" button to subscribe to updates.
 *
 * Accessibility:
 * - Uses role="status" for announcements
 * - Button has proper aria-label
 * - Loading state is communicated via aria-busy
 * - Disabled state when already subscribed
 *
 * @example
 * // Basic usage
 * <ComingSoonBanner onNotifyMe={() => subscribeToUpdates()} />
 *
 * // With expected date
 * <ComingSoonBanner
 *   expectedDate={new Date('2025-02-01')}
 *   onNotifyMe={handleNotify}
 * />
 *
 * // Already subscribed
 * <ComingSoonBanner
 *   expectedDate="2025-02-01"
 *   isSubscribed={true}
 * />
 */
export function ComingSoonBanner({
  expectedDate,
  onNotifyMe,
  isSubscribed = false,
  isLoading = false,
  className,
}: ComingSoonBannerProps) {
  const formattedDate = expectedDate ? formatExpectedDate(expectedDate) : null;

  const handleNotifyClick = () => {
    if (!isLoading && !isSubscribed && onNotifyMe) {
      onNotifyMe();
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
      role="status"
      aria-label="Coming soon content"
    >
      {/* Content section */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
          <Clock className="h-5 w-5 text-gray-600" aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-gray-800">Coming Soon</h3>
          {formattedDate ? (
            <p className="flex items-center gap-1.5 text-sm text-gray-600">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
              <span>Expected: {formattedDate}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              This content is currently being prepared.
            </p>
          )}
        </div>
      </div>

      {/* Action section */}
      {onNotifyMe && (
        <Button
          variant={isSubscribed ? 'secondary' : 'default'}
          size="sm"
          onClick={handleNotifyClick}
          disabled={isSubscribed || isLoading}
          aria-busy={isLoading}
          aria-label={
            isSubscribed
              ? 'You will be notified when this content is available'
              : 'Get notified when this content is available'
          }
          className={cn(
            'flex-shrink-0 self-start sm:self-center',
            isSubscribed && 'cursor-default'
          )}
        >
          <Bell className="h-4 w-4" aria-hidden />
          {isLoading ? (
            <span>Subscribing...</span>
          ) : isSubscribed ? (
            <span>Subscribed</span>
          ) : (
            <span>Notify Me</span>
          )}
        </Button>
      )}
    </div>
  );
}

export default ComingSoonBanner;
