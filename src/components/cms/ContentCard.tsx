'use client';

import * as React from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Card, Badge, Button } from '@/components/ui';
import type { ContentIndexEntry, ContentType, DraftStatus } from '@/lib/db';

// =============================================================================
// Types
// =============================================================================

interface ContentCardProps {
  /** The content item to display */
  item: ContentIndexEntry;
  /** Callback when the card is clicked */
  onClick?: () => void;
  /** Callback for edit action */
  onEdit?: () => void;
  /** Callback for delete action */
  onDelete?: () => void;
  /** Optional status to display (from draft if available) */
  status?: DraftStatus;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Content type icons using Unicode emoji
 */
const CONTENT_TYPE_ICONS: Record<ContentType, string> = {
  package: '\u{1F4DA}', // course
  module: '\u{1F4E6}',  // module
  lesson: '\u{1F4D6}',  // lesson
  quiz: '\u{2753}',     // quiz
  exercise: '\u{1F4BB}', // exercise
};

/**
 * Content type labels for badges
 */
const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  package: 'Course',
  module: 'Module',
  lesson: 'Lesson',
  quiz: 'Quiz',
  exercise: 'Exercise',
};

/**
 * Status badge variants
 */
const STATUS_VARIANTS: Record<DraftStatus, 'default' | 'secondary' | 'success' | 'warning'> = {
  editing: 'secondary',
  review: 'warning',
  approved: 'default',
  published: 'success',
};

/**
 * Status labels for display
 */
const STATUS_LABELS: Record<DraftStatus, string> = {
  editing: 'Draft',
  review: 'In Review',
  approved: 'Approved',
  published: 'Published',
};

// =============================================================================
// ContentCard Component
// =============================================================================

/**
 * ContentCard Component
 *
 * Displays a content index entry as a card with type icon, title, status,
 * last updated time, and action buttons.
 *
 * Features:
 * - Type icon/badge for visual identification
 * - Title with truncation for long text
 * - Status badge (when available)
 * - Last updated time using relative formatting
 * - Action buttons for edit and delete
 * - Hover state for the card
 * - Click handler for card selection
 *
 * Accessibility:
 * - Semantic article element
 * - Proper button labeling for actions
 * - Focus-visible states for keyboard navigation
 * - Screen reader friendly labels
 *
 * @example
 * ```tsx
 * <ContentCard
 *   item={contentItem}
 *   onClick={() => handleSelect(contentItem)}
 *   onEdit={() => handleEdit(contentItem)}
 *   onDelete={() => handleDelete(contentItem)}
 *   status="published"
 * />
 * ```
 */
export function ContentCard({
  item,
  onClick,
  onEdit,
  onDelete,
  status,
  className,
}: ContentCardProps) {
  // Format the last updated time
  const lastUpdatedText = React.useMemo(() => {
    return formatRelativeTime(item.cachedAt);
  }, [item.cachedAt]);

  /**
   * Handle edit button click - prevent propagation to card
   */
  const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onEdit?.();
  };

  /**
   * Handle delete button click - prevent propagation to card
   */
  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete?.();
  };

  /**
   * Handle keyboard navigation on the card
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && onClick) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      className={cn(
        // Base styles
        'group relative transition-all duration-200',
        // Hover state
        'hover:border-border-focus hover:shadow-md',
        // Clickable cursor when onClick is provided
        onClick && 'cursor-pointer',
        // Focus states for keyboard navigation
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `Select ${CONTENT_TYPE_LABELS[item.type]}: ${item.title}` : undefined}
    >
      <article className="p-4">
        {/* Header: Type icon and badges */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Type icon */}
            <span
              className="text-xl"
              role="img"
              aria-label={CONTENT_TYPE_LABELS[item.type]}
            >
              {CONTENT_TYPE_ICONS[item.type]}
            </span>

            {/* Type badge */}
            <Badge variant="outline" className="text-xs">
              {CONTENT_TYPE_LABELS[item.type]}
            </Badge>
          </div>

          {/* Status badge (if available) */}
          {status && (
            <Badge variant={STATUS_VARIANTS[status]} className="text-xs">
              {STATUS_LABELS[status]}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3
          className="mb-2 line-clamp-2 text-base font-semibold text-text"
          title={item.title}
        >
          {item.title}
        </h3>

        {/* Summary (if available) */}
        {item.summary && (
          <p className="mb-3 line-clamp-2 text-sm text-text-muted">
            {item.summary}
          </p>
        )}

        {/* Footer: Last updated and actions */}
        <div className="flex items-center justify-between">
          {/* Last updated time */}
          <time
            dateTime={item.cachedAt.toISOString()}
            className="text-xs text-text-muted"
          >
            Updated {lastUpdatedText}
          </time>

          {/* Action buttons - always visible for better discoverability */}
          <div
            className={cn(
              'flex items-center gap-1',
              // Show with reduced opacity normally, full opacity on hover
              'opacity-60 transition-opacity duration-150',
              'group-hover:opacity-100 group-focus-within:opacity-100'
            )}
          >
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                aria-label={`Edit ${item.title}`}
                className="h-8 w-8 p-0"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                aria-label={`Delete ${item.title}`}
                className="h-8 w-8 p-0 text-error hover:bg-error/10 hover:text-error"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </article>
    </Card>
  );
}

export type { ContentCardProps };
export default ContentCard;
