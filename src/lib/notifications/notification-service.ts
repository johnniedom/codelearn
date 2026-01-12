/**
 * Notification Service
 *
 * Manages in-app notifications with IndexedDB storage.
 *
 * Features:
 * - Store notifications in IndexedDB (per user)
 * - Full offline support
 * - Badge count management
 * - Notification preferences
 * - Auto-expiry of old notifications
 */

import { db } from '@/lib/db';
import type {
  NotificationData,
  NotificationCategory,
  NotificationPriority,
  NotificationPreferences,
  NotificationEvent,
  NotificationEventType,
  ProgressNotificationTrigger,
  AchievementNotificationTrigger,
  SystemNotificationTrigger,
} from './types';
import { DEFAULT_PREFERENCES } from './types';

// =============================================================================
// Event Types
// =============================================================================

type NotificationEventListener = (event: NotificationEvent) => void;

// =============================================================================
// Retention Periods (per priority)
// =============================================================================

const RETENTION_DAYS: Record<NotificationPriority, number> = {
  critical: 30,  // Until acknowledged
  high: 7,
  medium: 14,
  low: 3,
};

// =============================================================================
// Notification Service Class
// =============================================================================

/**
 * Notification Service
 *
 * Handles all notification operations including creation, storage,
 * retrieval, and preference management.
 */
export class NotificationService {
  private listeners: Set<NotificationEventListener> = new Set();
  private preferencesCache: Map<string, NotificationPreferences> = new Map();

  /**
   * Subscribe to notification events
   */
  subscribe(listener: NotificationEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit a notification event to all listeners
   */
  private emit(type: NotificationEventType, data?: unknown): void {
    const event: NotificationEvent = {
      type,
      timestamp: new Date(),
      data,
    };
    this.listeners.forEach((listener) => listener(event));
  }

  // ===========================================================================
  // Core Notification Operations
  // ===========================================================================

  /**
   * Create a new notification
   */
  async create(
    userId: string,
    data: Omit<NotificationData, 'id' | 'userId' | 'createdAt' | 'readAt' | 'expiresAt'>
  ): Promise<NotificationData> {
    // Check if notifications are enabled for this category
    const prefs = await this.getPreferences(userId);
    if (!prefs.categories[data.category].enabled) {
      throw new Error(`Notifications disabled for category: ${data.category}`);
    }

    // Check quiet hours
    if (prefs.quietHours.enabled && this.isQuietHours(prefs.quietHours)) {
      // Still create but don't show toast
      data = { ...data };
    }

    const now = new Date();
    const retention = RETENTION_DAYS[data.priority];
    const expiresAt = new Date(now.getTime() + retention * 24 * 60 * 60 * 1000);

    const notification: NotificationData = {
      id: crypto.randomUUID(),
      userId,
      ...data,
      createdAt: now,
      readAt: null,
      expiresAt,
    };

    // Store in IndexedDB using existing db
    await db.notifications.add({
      notificationId: notification.id,
      userId: notification.userId,
      type: notification.category,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
      actionUrl: notification.actionUrl,
      metadata: JSON.stringify({
        priority: notification.priority,
        source: notification.source,
        icon: notification.icon,
        expiresAt: notification.expiresAt,
        ...notification.metadata,
      }),
    });

    this.emit('notification_created', notification);
    await this.emitUnreadCountChange(userId);

    return notification;
  }

  /**
   * Get all notifications for a user
   */
  async getAll(userId: string): Promise<NotificationData[]> {
    const items = await db.notifications
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');

    return items.map(this.mapFromDb);
  }

  /**
   * Get unread notifications for a user
   */
  async getUnread(userId: string): Promise<NotificationData[]> {
    const items = await db.notifications
      .where('[userId+readAt]')
      .equals(userId).filter((n) => n.readAt === null)
      .reverse()
      .sortBy('createdAt');

    return items.map(this.mapFromDb);
  }

  /**
   * Get notification by ID
   */
  async getById(notificationId: string): Promise<NotificationData | null> {
    const item = await db.notifications.get(notificationId);
    return item ? this.mapFromDb(item) : null;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = await db.notifications.get(notificationId);
    if (!notification) return;

    await db.notifications.update(notificationId, {
      readAt: new Date(),
    });

    this.emit('notification_read', { notificationId });
    await this.emitUnreadCountChange(notification.userId);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const now = new Date();
    await db.notifications
      .where('userId')
      .equals(userId)
      .filter((n) => n.readAt === null)
      .modify({ readAt: now });

    this.emit('notification_read', { userId, all: true });
    await this.emitUnreadCountChange(userId);
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string): Promise<void> {
    const notification = await db.notifications.get(notificationId);
    if (!notification) return;

    await db.notifications.delete(notificationId);
    this.emit('notification_dismissed', { notificationId });
    await this.emitUnreadCountChange(notification.userId);
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return db.notifications
      .where('userId')
      .equals(userId)
      .filter((n) => n.readAt === null)
      .count();
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpired(): Promise<number> {
    const now = new Date();
    let deletedCount = 0;

    const allNotifications = await db.notifications.toArray();

    for (const notification of allNotifications) {
      const metadata = notification.metadata
        ? JSON.parse(notification.metadata)
        : {};
      const expiresAt = metadata.expiresAt
        ? new Date(metadata.expiresAt)
        : null;

      if (expiresAt && expiresAt < now) {
        await db.notifications.delete(notification.notificationId);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // ===========================================================================
  // Notification Triggers
  // ===========================================================================

  /**
   * Trigger a progress notification
   */
  async triggerProgress(
    userId: string,
    trigger: ProgressNotificationTrigger
  ): Promise<NotificationData> {
    const { title, body, icon } = this.getProgressNotificationContent(trigger);

    return this.create(userId, {
      category: 'progress',
      priority: 'medium',
      source: 'local',
      title,
      body,
      icon,
      actionUrl: this.getProgressActionUrl(trigger),
      metadata: trigger as unknown as Record<string, unknown>,
    });
  }

  /**
   * Trigger an achievement notification
   */
  async triggerAchievement(
    userId: string,
    trigger: AchievementNotificationTrigger
  ): Promise<NotificationData> {
    const { title, body, icon } = this.getAchievementNotificationContent(trigger);

    return this.create(userId, {
      category: 'achievement',
      priority: 'medium',
      source: 'local',
      title,
      body,
      icon,
      metadata: trigger as unknown as Record<string, unknown>,
    });
  }

  /**
   * Trigger a system notification
   */
  async triggerSystem(
    userId: string,
    trigger: SystemNotificationTrigger
  ): Promise<NotificationData> {
    const { title, body, icon, priority } = this.getSystemNotificationContent(trigger);

    return this.create(userId, {
      category: 'system',
      priority,
      source: 'local',
      title,
      body,
      icon,
      metadata: trigger as unknown as Record<string, unknown>,
    });
  }

  // ===========================================================================
  // Preferences Management
  // ===========================================================================

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    // Check cache first
    const cached = this.preferencesCache.get(userId);
    if (cached) return cached;

    // In a real app, this would be stored in IndexedDB
    // For now, return defaults
    const prefs: NotificationPreferences = {
      userId,
      ...DEFAULT_PREFERENCES,
    };

    this.preferencesCache.set(userId, prefs);
    return prefs;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<Omit<NotificationPreferences, 'userId'>>
  ): Promise<NotificationPreferences> {
    const current = await this.getPreferences(userId);
    const updated: NotificationPreferences = {
      ...current,
      ...updates,
      updatedAt: new Date(),
    };

    this.preferencesCache.set(userId, updated);
    return updated;
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  /**
   * Map database record to NotificationData
   */
  private mapFromDb(record: {
    notificationId: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    createdAt: Date;
    readAt: Date | null;
    actionUrl?: string;
    metadata?: string;
  }): NotificationData {
    const metadata = record.metadata ? JSON.parse(record.metadata) : {};

    return {
      id: record.notificationId,
      userId: record.userId,
      category: record.type as NotificationCategory,
      priority: metadata.priority || 'medium',
      source: metadata.source || 'local',
      title: record.title,
      body: record.body,
      createdAt: record.createdAt,
      readAt: record.readAt,
      expiresAt: metadata.expiresAt ? new Date(metadata.expiresAt) : new Date(),
      actionUrl: record.actionUrl,
      icon: metadata.icon,
      metadata,
    };
  }

  /**
   * Check if currently in quiet hours
   */
  private isQuietHours(settings: { startTime: string; endTime: string }): boolean {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = settings.startTime.split(':').map(Number);
    const [endHour, endMin] = settings.endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes <= endMinutes) {
      // Same day range (e.g., 09:00 - 17:00)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight range (e.g., 22:00 - 07:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  /**
   * Emit unread count change event
   */
  private async emitUnreadCountChange(userId: string): Promise<void> {
    const count = await this.getUnreadCount(userId);
    this.emit('unread_count_changed', { userId, count });
  }

  /**
   * Get content for progress notifications
   */
  private getProgressNotificationContent(trigger: ProgressNotificationTrigger): {
    title: string;
    body: string;
    icon: string;
  } {
    switch (trigger.type) {
      case 'lesson_complete':
        return {
          title: 'Lesson Complete!',
          body: 'Great job! Keep up the learning momentum.',
          icon: 'check-circle',
        };
      case 'quiz_passed':
        return {
          title: 'Quiz Passed!',
          body: `You scored ${trigger.score}/${trigger.maxScore}. Well done!`,
          icon: 'award',
        };
      case 'quiz_failed':
        return {
          title: 'Keep Trying!',
          body: `You scored ${trigger.score}/${trigger.maxScore}. Review and try again.`,
          icon: 'refresh-cw',
        };
      case 'module_complete':
        return {
          title: 'Module Complete!',
          body: 'Excellent progress! You finished a full module.',
          icon: 'folder-check',
        };
      case 'course_complete':
        return {
          title: 'Course Complete!',
          body: 'Congratulations! You have completed the entire course.',
          icon: 'trophy',
        };
      case 'exercise_solved':
        return {
          title: 'Exercise Solved!',
          body: 'Your code passed all tests. Great coding!',
          icon: 'code',
        };
      default:
        return {
          title: 'Progress Update',
          body: 'You made progress in your learning.',
          icon: 'trending-up',
        };
    }
  }

  /**
   * Get content for achievement notifications
   */
  private getAchievementNotificationContent(trigger: AchievementNotificationTrigger): {
    title: string;
    body: string;
    icon: string;
  } {
    switch (trigger.type) {
      case 'badge_earned':
        return {
          title: 'Badge Earned!',
          body: `You earned the "${trigger.badgeName}" badge!`,
          icon: 'award',
        };
      case 'streak_milestone':
        return {
          title: `${trigger.streakDays} Day Streak!`,
          body: `Amazing! You've been learning for ${trigger.streakDays} days in a row.`,
          icon: 'flame',
        };
      case 'points_threshold':
        return {
          title: 'Points Milestone!',
          body: `You reached ${trigger.pointsReached} XP! Keep going.`,
          icon: 'star',
        };
      case 'skill_mastered':
        return {
          title: 'Skill Mastered!',
          body: `You mastered "${trigger.skillName}"!`,
          icon: 'zap',
        };
      default:
        return {
          title: 'Achievement Unlocked!',
          body: 'You earned a new achievement.',
          icon: 'award',
        };
    }
  }

  /**
   * Get content for system notifications
   */
  private getSystemNotificationContent(trigger: SystemNotificationTrigger): {
    title: string;
    body: string;
    icon: string;
    priority: NotificationPriority;
  } {
    switch (trigger.type) {
      case 'content_downloaded':
        return {
          title: 'Content Ready!',
          body: `"${trigger.contentName}" is now available offline.`,
          icon: 'download',
          priority: 'low',
        };
      case 'sync_reminder':
        return {
          title: 'Sync Reminder',
          body: 'Connect to the hub to share your progress with your class.',
          icon: 'cloud',
          priority: 'medium',
        };
      case 'credential_expiry':
        return {
          title: 'Login Expiring Soon',
          body: `Your login expires in ${trigger.daysUntilExpiry} days. Please sync to renew.`,
          icon: 'key',
          priority: 'high',
        };
      case 'storage_warning':
        return {
          title: 'Storage Almost Full',
          body: `Your device is ${trigger.storagePercentUsed}% full. Consider removing some content.`,
          icon: 'hard-drive',
          priority: 'high',
        };
      case 'app_update':
        return {
          title: 'Update Available',
          body: `Version ${trigger.version} is available with new features.`,
          icon: 'download-cloud',
          priority: 'low',
        };
      default:
        return {
          title: 'System Notice',
          body: 'There is a system update.',
          icon: 'info',
          priority: 'medium',
        };
    }
  }

  /**
   * Get action URL for progress notifications
   */
  private getProgressActionUrl(trigger: ProgressNotificationTrigger): string {
    if (trigger.lessonId) {
      return `/lessons/${trigger.courseId}/${trigger.moduleId}/${trigger.lessonId}`;
    }
    if (trigger.quizId) {
      return `/quizzes/${trigger.courseId}/${trigger.moduleId}/${trigger.quizId}`;
    }
    if (trigger.exerciseId) {
      return `/exercises/${trigger.courseId}/${trigger.moduleId}/${trigger.exerciseId}`;
    }
    return `/courses/${trigger.courseId}`;
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let notificationServiceInstance: NotificationService | null = null;

/**
 * Get the notification service singleton instance
 */
export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
  }
  return notificationServiceInstance;
}

export default NotificationService;
