/**
 * NotificationCenter Component
 *
 * Displays a list of notifications with grouping and actions.
 *
 * Features:
 * - Grouped by date (Today, Yesterday, Earlier)
 * - Mark all as read action
 * - Empty state handling
 * - Loading state with skeletons
 * - Accessible with proper ARIA attributes
 */

import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationItem, NotificationItemSkeleton } from './NotificationItem';
import { getNotificationService, type NotificationData, type NotificationEvent } from '@/lib/notifications';
import { useAuthStore } from '@/stores/authStore';

// =============================================================================
// Types
// =============================================================================

interface NotificationCenterProps {
  /** Maximum notifications to display */
  maxItems?: number;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Callback when a notification is clicked */
  onNotificationClick?: (notification: NotificationData) => void;
  /** Additional class names */
  className?: string;
}

interface GroupedNotifications {
  today: NotificationData[];
  yesterday: NotificationData[];
  earlier: NotificationData[];
}

// =============================================================================
// Date Grouping Helper
// =============================================================================

function groupNotificationsByDate(notifications: NotificationData[]): GroupedNotifications {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  return notifications.reduce(
    (groups, notification) => {
      const notifDate = new Date(notification.createdAt);
      const notifDay = new Date(
        notifDate.getFullYear(),
        notifDate.getMonth(),
        notifDate.getDate()
      );

      if (notifDay.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (notifDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else {
        groups.earlier.push(notification);
      }

      return groups;
    },
    { today: [], yesterday: [], earlier: [] } as GroupedNotifications
  );
}

// =============================================================================
// NotificationCenter Component
// =============================================================================

export function NotificationCenter({
  maxItems = 50,
  showHeader = true,
  onNotificationClick,
  className,
}: NotificationCenterProps) {
  const { profile } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!profile?.userId) return;

    setIsLoading(true);
    try {
      const service = getNotificationService();
      const all = await service.getAll(profile.userId);
      setNotifications(all.slice(0, maxItems));

      const count = await service.getUnreadCount(profile.userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.userId, maxItems]);

  // Initial load and subscribe to changes
  useEffect(() => {
    loadNotifications();

    const service = getNotificationService();
    const unsubscribe = service.subscribe((event: NotificationEvent) => {
      if (
        event.type === 'notification_created' ||
        event.type === 'notification_read' ||
        event.type === 'notification_dismissed'
      ) {
        loadNotifications();
      }
      if (event.type === 'unread_count_changed') {
        const data = event.data as { count: number };
        setUnreadCount(data.count);
      }
    });

    return unsubscribe;
  }, [loadNotifications]);

  // Mark notification as read
  const handleRead = useCallback(
    async (notificationId: string) => {
      const service = getNotificationService();
      await service.markAsRead(notificationId);

      const notification = notifications.find((n) => n.id === notificationId);
      if (notification) {
        onNotificationClick?.(notification);
      }
    },
    [notifications, onNotificationClick]
  );

  // Dismiss notification
  const handleDismiss = useCallback(async (notificationId: string) => {
    const service = getNotificationService();
    await service.delete(notificationId);
  }, []);

  // Mark all as read
  const handleMarkAllRead = useCallback(async () => {
    if (!profile?.userId) return;

    const service = getNotificationService();
    await service.markAllAsRead(profile.userId);
  }, [profile?.userId]);

  // Group notifications by date
  const grouped = groupNotificationsByDate(notifications);

  // Render notification group
  const renderGroup = (title: string, items: NotificationData[]) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-1">
        <h3 className="px-4 py-2 text-xs font-semibold uppercase text-text-muted">
          {title}
        </h3>
        <div className="space-y-1">
          {items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={handleRead}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {showHeader && (
          <div className="flex items-center justify-between px-4">
            <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        )}
        <div className="space-y-1">
          <NotificationItemSkeleton />
          <NotificationItemSkeleton />
          <NotificationItemSkeleton />
        </div>
      </div>
    );
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Inbox className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-text">No notifications</h3>
        <p className="mt-1 text-sm text-text-muted">
          You&apos;re all caught up! Check back later.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-text" />
            <h2 className="text-lg font-semibold text-text">Notifications</h2>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="gap-1.5 text-primary"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      )}

      {/* Notification groups */}
      <div
        className="space-y-4"
        role="feed"
        aria-label="Notifications"
        aria-busy={isLoading}
      >
        {renderGroup('Today', grouped.today)}
        {renderGroup('Yesterday', grouped.yesterday)}
        {renderGroup('Earlier', grouped.earlier)}
      </div>
    </div>
  );
}

// =============================================================================
// NotificationBadge Component
// =============================================================================

interface NotificationBadgeProps {
  /** Additional class names */
  className?: string;
}

/**
 * Notification badge that shows unread count
 * For use in navigation elements
 */
export function NotificationBadge({ className }: NotificationBadgeProps) {
  const { profile } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile?.userId) return;

    const loadCount = async () => {
      const service = getNotificationService();
      const count = await service.getUnreadCount(profile.userId);
      setUnreadCount(count);
    };

    loadCount();

    const service = getNotificationService();
    const unsubscribe = service.subscribe((event) => {
      if (event.type === 'unread_count_changed') {
        const data = event.data as { count: number };
        setUnreadCount(data.count);
      }
    });

    return unsubscribe;
  }, [profile?.userId]);

  return (
    <span
      className={cn(
        'absolute -left-1 -top-1 flex h-4 min-w-4 items-center justify-center',
        'rounded-full bg-red-500 px-1 text-[10px] font-bold text-white',
        className
      )}
      aria-label={`${unreadCount} unread notifications`}
    >
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}

export default NotificationCenter;
