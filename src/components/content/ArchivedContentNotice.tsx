'use client';

import * as React from 'react';
import { Archive, ExternalLink, Calendar, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Replacement content link information
 */
interface ReplacementContent {
  /** Title of the replacement content */
  title: string;
  /** URL or route to the replacement content */
  href: string;
}

/**
 * ArchivedContentNotice Props
 */
export interface ArchivedContentNoticeProps {
  /** Date when the content was archived */
  archivedDate: Date | string;
  /** Reason for archiving (optional) */
  reason?: string;
  /** Link to replacement content if available */
  replacementContent?: ReplacementContent;
  /** Callback when replacement link is clicked (for SPA navigation) */
  onReplacementClick?: (href: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format the archived date for display
 */
function formatArchivedDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Unknown date';
  }

  // Format as "Month Day, Year" (e.g., "January 15, 2025")
  return dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * ArchivedContentNotice Component
 *
 * Displays a notice for archived content, showing when it was archived,
 * the reason (if provided), and a link to replacement content if available.
 *
 * Accessibility:
 * - Uses role="alert" to announce the archived status
 * - Clear labeling for screen readers
 * - Replacement link is keyboard accessible
 * - Icons are decorative (aria-hidden)
 *
 * @example
 * // Basic usage
 * <ArchivedContentNotice archivedDate={new Date('2024-12-01')} />
 *
 * // With reason
 * <ArchivedContentNotice
 *   archivedDate="2024-12-01"
 *   reason="Content has been superseded by updated curriculum"
 * />
 *
 * // With replacement content
 * <ArchivedContentNotice
 *   archivedDate={new Date()}
 *   reason="Updated version available"
 *   replacementContent={{
 *     title: "Introduction to React 19",
 *     href: "/lessons/react-19-intro"
 *   }}
 *   onReplacementClick={(href) => router.push(href)}
 * />
 */
export function ArchivedContentNotice({
  archivedDate,
  reason,
  replacementContent,
  onReplacementClick,
  className,
}: ArchivedContentNoticeProps) {
  const formattedDate = formatArchivedDate(archivedDate);

  const handleReplacementClick = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ) => {
    if (replacementContent && onReplacementClick) {
      e.preventDefault();
      onReplacementClick(replacementContent.href);
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-red-200 bg-red-50 p-4',
        className
      )}
      role="alert"
      aria-label="This content has been archived"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
          <Archive className="h-5 w-5 text-red-600" aria-hidden />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          {/* Title and date */}
          <div>
            <h3 className="text-base font-semibold text-red-800">
              Archived Content
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-red-600">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
              <span>Archived on {formattedDate}</span>
            </p>
          </div>

          {/* Reason */}
          {reason && (
            <div className="flex items-start gap-2 rounded-md bg-red-100/50 p-2">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600"
                aria-hidden
              />
              <p className="text-sm text-red-700">{reason}</p>
            </div>
          )}

          {/* Replacement content link */}
          {replacementContent && (
            <div className="mt-2 flex flex-col gap-2 rounded-md border border-red-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium uppercase tracking-wide text-red-600">
                  Replacement Available
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {replacementContent.title}
                </span>
              </div>
              {onReplacementClick ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReplacementClick}
                  className="flex-shrink-0 self-start sm:self-center"
                  aria-label={`View replacement content: ${replacementContent.title}`}
                >
                  <span>View Content</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex-shrink-0 self-start sm:self-center"
                >
                  <a
                    href={replacementContent.href}
                    aria-label={`View replacement content: ${replacementContent.title}`}
                  >
                    <span>View Content</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArchivedContentNotice;
