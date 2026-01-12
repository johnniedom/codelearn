/**
 * TypeScript Type Definitions
 *
 * Central export for all shared types used across the application.
 * Re-exports types from specific modules for convenience.
 */

// Re-export database types
export type {
  Profile,
  Credential,
  Session,
  MfaData,
  Progress,
  QuizAttempt,
  SyncQueueItem,
  Notification,
  DeviceState,
  AuditLog,
} from '@/lib/db';

// =============================================================================
// Common Types
// =============================================================================

/** Standard API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

/** Pagination parameters */
export interface PaginationParams {
  page: number;
  limit: number;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// =============================================================================
// User Types
// =============================================================================

/** User role in the system */
export type UserRole = 'student' | 'teacher' | 'admin';

/** Account status */
export type AccountStatus = 'active' | 'suspended' | 'archived';

/** MFA method type */
export type MfaMethod = 'pattern' | 'totp' | 'backup';

// =============================================================================
// Content Types
// =============================================================================

/** Course structure */
export interface Course {
  courseId: string;
  title: string;
  description: string;
  version: string;
  modules: Module[];
  estimatedDuration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  thumbnail?: string;
}

/** Module within a course */
export interface Module {
  moduleId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

/** Lesson within a module */
export interface Lesson {
  lessonId: string;
  title: string;
  type: 'reading' | 'video' | 'audio' | 'interactive';
  duration: number; // in minutes
  order: number;
  content?: string; // Markdown content
  mediaUrl?: string; // For video/audio
}

/** Quiz structure */
export interface Quiz {
  quizId: string;
  title: string;
  moduleId: string;
  questions: Question[];
  passingScore: number;
  timeLimit?: number; // in minutes
}

/** Question types */
export type QuestionType = 'mcq' | 'fill-blank' | 'matching' | 'ordering' | 'code';

/** Base question interface */
export interface BaseQuestion {
  questionId: string;
  type: QuestionType;
  prompt: string;
  points: number;
  explanation?: string;
}

/** Multiple choice question */
export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: string[];
  correctOptionIndex: number;
}

/** Fill in the blank question */
export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill-blank';
  blanks: {
    id: string;
    acceptedAnswers: string[];
    caseSensitive: boolean;
  }[];
}

/** Union type for all questions */
export type Question = MCQQuestion | FillBlankQuestion;

// =============================================================================
// Sync Types
// =============================================================================

/** Sync package type */
export type SyncPackageType =
  | 'progress'
  | 'quiz'
  | 'exercise'
  | 'message'
  | 'settings'
  | 'audit';

/** Sync status */
export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed';

/** Sync conflict resolution strategy */
export type ConflictResolution = 'client-wins' | 'server-wins' | 'highest-score' | 'latest';

// =============================================================================
// UI Types
// =============================================================================

/** Theme preference */
export type Theme = 'light' | 'dark' | 'system';

/** Toast notification type */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Modal configuration */
export interface ModalConfig {
  type: string;
  title?: string;
  props?: Record<string, unknown>;
}

// =============================================================================
// Utility Types
// =============================================================================

/** Make specific properties optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific properties required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Extract the element type from an array type */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/** Async function type */
export type AsyncFunction<T = void> = () => Promise<T>;
