'use client';

import * as React from 'react';
import { FileEdit, Clock, CheckCircle, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Content status types
 */
type ContentStatus = 'draft' | 'review' | 'published' | 'archived';

/**
 * ContentStatusBadge Props
 */
export interface ContentStatusBadgeProps {
  /** The current status of the content */
  status: ContentStatus;
  /** Whether to show the status label text */
  showLabel?: boolean;
  /** Display variant */
  variant?: 'badge' | 'banner' | 'inline';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Status configuration for styling and icons
 */
interface StatusConfig {
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

/**
 * Get configuration for each status type
 */
function getStatusConfig(status: ContentStatus): StatusConfig {
  switch (status) {
    case 'draft':
      return {
        Icon: FileEdit,
        label: 'Draft',
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-600',
        borderClass: 'border-gray-200',
      };
    case 'review':
      return {
        Icon: Clock,
        label: 'In Review',
        bgClass: 'bg-yellow-100',
        textClass: 'text-yellow-700',
        borderClass: 'border-yellow-200',
      };
    case 'published':
      return {
        Icon: CheckCircle,
        label: 'Published',
        bgClass: 'bg-green-100',
        textClass: 'text-green-700',
        borderClass: 'border-green-200',
      };
    case 'archived':
      return {
        Icon: Archive,
        label: 'Archived',
        bgClass: 'bg-red-100',
        textClass: 'text-red-600',
        borderClass: 'border-red-200',
      };
  }
}

/**
 * Badge variant - small pill badge
 */
function BadgeVariant({
  status,
  showLabel = true,
  className,
}: Omit<ContentStatusBadgeProps, 'variant'>) {
  const { Icon, label, bgClass, textClass } = getStatusConfig(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        bgClass,
        textClass,
        className
      )}
      role="status"
      aria-label={`Content status: ${label}`}
    >
      <Icon className="h-3 w-3 flex-shrink-0" aria-hidden />
      {showLabel && <span>{label}</span>}
    </span>
  );
}

/**
 * Banner variant - full-width banner with icon and text
 */
function BannerVariant({
  status,
  showLabel = true,
  className,
}: Omit<ContentStatusBadgeProps, 'variant'>) {
  const { Icon, label, bgClass, textClass, borderClass } = getStatusConfig(status);

  return (
    <div
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border p-3',
        bgClass,
        borderClass,
        className
      )}
      role="status"
      aria-label={`Content status: ${label}`}
    >
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
          'bg-white/60'
        )}
      >
        <Icon className={cn('h-4 w-4', textClass)} aria-hidden />
      </div>
      {showLabel && (
        <span className={cn('text-sm font-medium', textClass)}>{label}</span>
      )}
    </div>
  );
}

/**
 * Inline variant - icon only with tooltip
 */
function InlineVariant({
  status,
  className,
}: Omit<ContentStatusBadgeProps, 'variant' | 'showLabel'>) {
  const { Icon, label, textClass } = getStatusConfig(status);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex cursor-default items-center justify-center',
              className
            )}
            role="status"
            aria-label={`Content status: ${label}`}
          >
            <Icon className={cn('h-4 w-4', textClass)} aria-hidden />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * ContentStatusBadge Component
 *
 * Displays the current status of content with visual indicators.
 * Supports three display variants:
 * - badge: Small pill badge with optional label (default)
 * - banner: Full-width banner with icon and text
 * - inline: Icon only with tooltip for compact displays
 *
 * Accessibility:
 * - Uses role="status" for screen reader announcements
 * - aria-label provides full context for each status
 * - Icons are marked aria-hidden
 * - Tooltip provides hover context for inline variant
 *
 * @example
 * // Badge variant (default)
 * <ContentStatusBadge status="published" />
 *
 * // Banner variant
 * <ContentStatusBadge status="draft" variant="banner" />
 *
 * // Inline variant (icon only with tooltip)
 * <ContentStatusBadge status="review" variant="inline" />
 */
export function ContentStatusBadge({
  status,
  showLabel = true,
  variant = 'badge',
  className,
}: ContentStatusBadgeProps) {
  switch (variant) {
    case 'banner':
      return (
        <BannerVariant
          status={status}
          showLabel={showLabel}
          className={className}
        />
      );
    case 'inline':
      return <InlineVariant status={status} className={className} />;
    case 'badge':
    default:
      return (
        <BadgeVariant
          status={status}
          showLabel={showLabel}
          className={className}
        />
      );
  }
}

export default ContentStatusBadge;
