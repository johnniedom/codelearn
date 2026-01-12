/**
 * Notifications Module Exports
 */

// Types
export type {
  NotificationCategory,
  NotificationPriority,
  NotificationSource,
  NotificationData,
  NotificationPreferences,
  NotificationEvent,
  NotificationEventType,
  CategorySettings,
  QuietHoursSettings,
  ProgressNotificationTrigger,
  AchievementNotificationTrigger,
  SystemNotificationTrigger,
} from './types';

export { DEFAULT_PREFERENCES } from './types';

// Notification Service
export {
  NotificationService,
  getNotificationService,
} from './notification-service';
