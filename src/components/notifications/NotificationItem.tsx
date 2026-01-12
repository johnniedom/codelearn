/**
 * NotificationItem Component
 *
 * Individual notification display with category styling and actions.
 *
 * Features:
 * - Category-specific icons and colors
 * - Read/unread state styling
 * - Relative time display
 * - Action navigation
 * - Accessible with proper ARIA attributes
 */

import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Trophy,
  TrendingUp,
  Clock,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Award,
  Download,
  Key,
  HardDrive,
  Cloud,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { NotificationData, NotificationCategory, NotificationPriority } from '@/lib/notifications';

// =============================================================================
// Types
// =============================================================================

interface NotificationItemProps {
  notification: NotificationData;
  onRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  showDismiss?: boolean;
  className?: string;
}

// =============================================================================
// Category Configuration
// =============================================================================

interface CategoryConfig {
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

const CATEGORY_CONFIG: Record<NotificationCategory, CategoryConfig> = {
  system: {
    icon: Bell,
    colorClass: 'text-gray-600',
    bgClass: 'bg-gray-100',
  },
  achievement: {
    icon: Trophy,
    colorClass: 'text-yellow-600',
    bgClass: 'bg-yellow-100',
  },
  progress: {
    icon: TrendingUp,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-100',
  },
  reminder: {
    icon: Clock,
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-100',
  },
  message: {
    icon: MessageSquare,
    colorClass: 'text-green-600',
    bgClass: 'bg-green-100',
  },
  alert: {
    icon: AlertTriangle,
    colorClass: 'text-orange-600',
    bgClass: 'bg-orange-100',
  },
};

// =============================================================================
// Icon Mapping (for custom icons in notifications)
// =============================================================================

const ICON_MAP: Record<string, React.ElementType> = {
  'check-circle': CheckCircle,
  award: Award,
  'refresh-cw': Clock,
  'folder-check': CheckCircle,
  trophy: Trophy,
  code: TrendingUp,
  'trending-up': TrendingUp,
  flame: Trophy,
  star: Award,
  zap: TrendingUp,
  download: Download,
  cloud: Cloud,
  key: Key,
  'hard-drive': HardDrive,
  'download-cloud': Download,
  info: Bell,
};

// =============================================================================
// Priority Styles
// =============================================================================

const PRIORITY_STYLES: Record<NotificationPriority, string> = {
  critical: 'border-l-4 border-l-red-500',
  high: 'border-l-4 border-l-orange-500',
  medium: 'border-l-2 border-l-blue-400',
  low: '',
};

// =============================================================================
// Relative Time Formatter
// =============================================================================

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// =============================================================================
// NotificationItem Component
// =============================================================================

export function NotificationItem({
  notification,
  onRead,
  onDismiss,
  showDismiss = true,
  className,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const isUnread = notification.readAt === null;

  const categoryConfig = CATEGORY_CONFIG[notification.category];
  const CustomIcon = notification.icon
    ? ICON_MAP[notification.icon] || categoryConfig.icon
    : categoryConfig.icon;

  const handleClick = () => {
    // Mark as read
    if (isUnread && onRead) {
      onRead(notification.id);
    }

    // Navigate if action URL exists
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.(notification.id);
  };

  return (
    <div
      role="article"
      aria-label={`${notification.title}: ${notification.body}`}
      aria-live={isUnread ? 'polite' : 'off'}
      className={cn(
        'group relative flex gap-3 rounded-lg p-4 transition-colors',
        // Unread styling
        isUnread ? 'bg-blue-50/50' : 'bg-surface',
        // Hover
        notification.actionUrl && 'cursor-pointer hover:bg-gray-50',
        // Priority indicator
        PRIORITY_STYLES[notification.priority],
        className
      )}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={notification.actionUrl ? 0 : undefined}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
          categoryConfig.bgClass
        )}
      >
        <CustomIcon
          className={cn('h-5 w-5', categoryConfig.colorClass)}
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Title and time */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              'text-sm font-medium text-text',
              isUnread && 'font-semibold'
            )}
          >
            {notification.title}
          </h3>
          <span className="flex-shrink-0 text-xs text-text-muted">
            {getRelativeTime(notification.createdAt)}
          </span>
        </div>

        {/* Body */}
        <p className="mt-1 text-sm text-text-muted line-clamp-2">
          {notification.body}
        </p>

        {/* Action hint */}
        {notification.actionUrl && (
          <p className="mt-1 text-xs text-primary">Tap to view</p>
        )}
      </div>

      {/* Unread indicator */}
      {isUnread && (
        <div
          className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary"
          aria-label="Unread"
        />
      )}

      {/* Dismiss button */}
      {showDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute right-2 top-2 h-6 w-6 opacity-0 transition-opacity',
            'group-hover:opacity-100 focus:opacity-100'
          )}
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// NotificationItemSkeleton
// =============================================================================

export function NotificationItemSkeleton() {
  return (
    <div className="flex gap-3 rounded-lg p-4">
      {/* Icon skeleton */}
      <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-gray-200" />

      {/* Content skeleton */}
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-12 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default NotificationItem;
