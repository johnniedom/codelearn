/**
 * Notification System Type Definitions
 */

// =============================================================================
// Notification Categories
// =============================================================================

/**
 * Notification category types
 */
export type NotificationCategory =
  | 'system'      // App updates, sync reminders, credential expiry
  | 'achievement' // Badges earned, streaks, milestones
  | 'progress'    // Lesson complete, quiz results, module unlocked
  | 'reminder'    // Study reminders, pending assignments
  | 'message'     // Teacher-student communications
  | 'alert';      // Critical issues, account problems

/**
 * Notification priority levels
 */
export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Notification source
 */
export type NotificationSource = 'local' | 'remote';

// =============================================================================
// Notification Data Types
// =============================================================================

/**
 * Core notification structure
 */
export interface NotificationData {
  /** Unique notification ID */
  id: string;
  /** User this notification belongs to */
  userId: string;
  /** Notification category */
  category: NotificationCategory;
  /** Priority level */
  priority: NotificationPriority;
  /** Source (local or from hub) */
  source: NotificationSource;
  /** Notification title */
  title: string;
  /** Notification body text */
  body: string;
  /** When the notification was created */
  createdAt: Date;
  /** When the notification was read (null if unread) */
  readAt: Date | null;
  /** When the notification expires (auto-dismiss) */
  expiresAt: Date;
  /** Optional action URL */
  actionUrl?: string;
  /** Optional icon name */
  icon?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Notification Preferences
// =============================================================================

/**
 * Per-category notification settings
 */
export interface CategorySettings {
  enabled: boolean;
  sound: boolean;
  toast: boolean;
}

/**
 * Quiet hours configuration
 */
export interface QuietHoursSettings {
  enabled: boolean;
  startTime: string; // "22:00"
  endTime: string;   // "07:00"
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  userId: string;
  /** Per-category settings */
  categories: Record<NotificationCategory, CategorySettings>;
  /** Quiet hours settings */
  quietHours: QuietHoursSettings;
  /** Daily study reminder settings */
  dailyReminder: {
    enabled: boolean;
    time: string; // "16:00"
  };
  /** Streak warning settings */
  streakWarning: {
    enabled: boolean;
    hoursBeforeReset: number;
  };
  /** Toast display duration in ms */
  toastDuration: number;
  /** Maximum number of visible toasts */
  maxVisibleToasts: number;
  /** Last updated */
  updatedAt: Date;
}

/**
 * Default notification preferences
 */
export const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'userId'> = {
  categories: {
    system: { enabled: true, sound: true, toast: true },
    achievement: { enabled: true, sound: true, toast: true },
    progress: { enabled: true, sound: false, toast: true },
    reminder: { enabled: true, sound: false, toast: true },
    message: { enabled: true, sound: true, toast: true },
    alert: { enabled: true, sound: true, toast: true },
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
  },
  dailyReminder: {
    enabled: false,
    time: '16:00',
  },
  streakWarning: {
    enabled: true,
    hoursBeforeReset: 4,
  },
  toastDuration: 5000,
  maxVisibleToasts: 3,
  updatedAt: new Date(),
};

// =============================================================================
// Notification Events
// =============================================================================

/**
 * Notification event types
 */
export type NotificationEventType =
  | 'notification_created'
  | 'notification_read'
  | 'notification_dismissed'
  | 'notification_expired'
  | 'unread_count_changed';

/**
 * Notification event
 */
export interface NotificationEvent {
  type: NotificationEventType;
  timestamp: Date;
  data?: unknown;
}

// =============================================================================
// Notification Triggers
// =============================================================================

/**
 * Progress notification trigger
 */
export interface ProgressNotificationTrigger {
  type: 'lesson_complete' | 'quiz_passed' | 'quiz_failed' | 'module_complete' | 'course_complete' | 'exercise_solved';
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  quizId?: string;
  exerciseId?: string;
  score?: number;
  maxScore?: number;
}

/**
 * Achievement notification trigger
 */
export interface AchievementNotificationTrigger {
  type: 'badge_earned' | 'streak_milestone' | 'points_threshold' | 'skill_mastered';
  achievementId?: string;
  badgeName?: string;
  streakDays?: number;
  pointsReached?: number;
  skillName?: string;
}

/**
 * System notification trigger
 */
export interface SystemNotificationTrigger {
  type: 'content_downloaded' | 'sync_reminder' | 'credential_expiry' | 'storage_warning' | 'app_update';
  contentName?: string;
  daysUntilExpiry?: number;
  storagePercentUsed?: number;
  version?: string;
}
