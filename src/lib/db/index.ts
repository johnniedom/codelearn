import Dexie, { type EntityTable } from 'dexie';

/**
 * CodeLearn IndexedDB Schema
 *
 * This database handles all local persistence for the offline-first PWA,
 * including user profiles, credentials, progress tracking, and sync queue.
 */

// =============================================================================
// Type Definitions
// =============================================================================

/** User profile information (non-sensitive, display data) */
export interface Profile {
  userId: string;
  preferredName: string;
  profileIcon: string;
  profileColor: string;
  gradeLevel: string;
  lastUsedAt: Date;
  accountStatus: 'active' | 'suspended' | 'archived';
  createdAt: Date;
}

/** Encrypted authentication bundle for offline login */
export interface Credential {
  userId: string;
  /** Encrypted offline auth bundle (AES-256-GCM) */
  offlineAuthBundle: string;
  /** Argon2id hash of PIN for verification */
  pinVerifier: string;
  /** Selected security image ID for anti-phishing */
  securityImageId: string;
  issuedAt: Date;
  expiresAt: Date;
  lastUsedAt: Date;
}

/** Active user session */
export interface Session {
  sessionId: string;
  userId: string;
  pinVerified: boolean;
  mfaVerified: boolean;
  mfaMethod: 'pattern' | 'totp' | 'backup' | null;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
}

/** MFA enrollment and verification data */
export interface MfaData {
  userId: string;
  primaryMethod: 'pattern' | 'totp';
  /** TOTP secret (encrypted with AES-256-GCM) */
  totpSecret?: string;
  /** SHA-256 hash of pattern for verification */
  patternVerifier?: string;
  /** Remaining backup codes (hashed) */
  backupCodes: string[];
  failedAttempts: number;
  lockedUntil: Date | null;
}

/** Learning progress record with integrity signature */
export interface Progress {
  id?: number; // Auto-incremented
  userId: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  completedAt: Date;
  score: number | null;
  timeSpentSeconds: number;
  /** Monotonically increasing for hash chain */
  sequenceNumber: number;
  /** HMAC signature for integrity */
  signature: string;
  /** SHA-256 hash of previous record */
  previousHash?: string;
}

/** Quiz attempt with answers and scoring */
export interface QuizAttempt {
  attemptId: string;
  userId: string;
  quizId: string;
  courseId: string;
  moduleId: string;
  score: number;
  maxScore: number;
  startedAt: Date;
  completedAt: Date;
  /** Serialized answers object */
  answers: string;
  /** HMAC signature for integrity */
  signature: string;
}

/** Sync queue item for offline-first operations */
export interface SyncQueueItem {
  packageId: string;
  userId: string;
  type: 'progress' | 'quiz' | 'exercise' | 'message' | 'settings' | 'audit';
  /** JSON stringified payload */
  payload: string;
  createdAt: Date;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  lastAttemptAt?: Date;
  errorMessage?: string;
}

/** User notification */
export interface Notification {
  notificationId: string;
  userId: string;
  type: 'system' | 'achievement' | 'progress' | 'reminder' | 'message' | 'alert';
  title: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
  actionUrl?: string;
  metadata?: string;
}

/** Device state singleton (hub connection, sync status) */
export interface DeviceState {
  id: 'device'; // Singleton key
  deviceId: string;
  hubUrl: string | null;
  lastSyncAt: Date | null;
  installedCourses: string[];
  storageUsed: number;
  storageQuota: number;
  publicKey?: string; // Hub's Ed25519 public key for content verification
}

/** Audit log for security events */
export interface AuditLog {
  logId: string;
  userId: string;
  eventType: string;
  timestamp: Date;
  details: string;
  synced: boolean;
}

// =============================================================================
// Database Class
// =============================================================================

export class CodeLearnDB extends Dexie {
  // Declare tables with their entity types
  profiles!: EntityTable<Profile, 'userId'>;
  credentials!: EntityTable<Credential, 'userId'>;
  sessions!: EntityTable<Session, 'sessionId'>;
  mfaData!: EntityTable<MfaData, 'userId'>;
  progress!: EntityTable<Progress, 'id'>;
  quizAttempts!: EntityTable<QuizAttempt, 'attemptId'>;
  syncQueue!: EntityTable<SyncQueueItem, 'packageId'>;
  notifications!: EntityTable<Notification, 'notificationId'>;
  deviceState!: EntityTable<DeviceState, 'id'>;
  auditLogs!: EntityTable<AuditLog, 'logId'>;

  constructor() {
    super('CodeLearnDB');

    // Schema version 1 - Initial schema
    this.version(1).stores({
      // profiles: PK = userId, index on lastUsedAt for sorting
      profiles: 'userId, lastUsedAt, accountStatus',

      // credentials: PK = userId, index on expiresAt for cleanup
      credentials: 'userId, expiresAt',

      // sessions: PK = sessionId, indexes for user lookup and expiry
      sessions: 'sessionId, userId, expiresAt, isActive',

      // mfaData: PK = userId
      mfaData: 'userId',

      // progress: PK = auto-increment id, compound indexes for queries
      progress: '++id, userId, lessonId, courseId, [userId+courseId], [userId+lessonId]',

      // quizAttempts: PK = attemptId, indexes for user and quiz lookup
      quizAttempts: 'attemptId, userId, quizId, [userId+quizId]',

      // syncQueue: PK = packageId, indexes for processing
      syncQueue: 'packageId, status, createdAt, [status+createdAt]',

      // notifications: PK = notificationId, indexes for user and read status
      notifications: 'notificationId, userId, readAt, [userId+readAt]',

      // deviceState: singleton with fixed key 'device'
      deviceState: 'id',

      // auditLogs: PK = logId, indexes for user and sync status
      auditLogs: 'logId, userId, synced, timestamp',
    });
  }
}

// =============================================================================
// Database Instance
// =============================================================================

/** Singleton database instance */
export const db = new CodeLearnDB();

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get or create device state record
 */
export async function getDeviceState(): Promise<DeviceState> {
  const existing = await db.deviceState.get('device');
  if (existing) {
    return existing;
  }

  // Create new device state with generated ID
  const newState: DeviceState = {
    id: 'device',
    deviceId: crypto.randomUUID(),
    hubUrl: null,
    lastSyncAt: null,
    installedCourses: [],
    storageUsed: 0,
    storageQuota: 0,
  };

  await db.deviceState.add(newState);
  return newState;
}

/**
 * Update device state
 */
export async function updateDeviceState(
  updates: Partial<Omit<DeviceState, 'id'>>
): Promise<void> {
  await db.deviceState.update('device', updates);
}

/**
 * Get active session for a user
 */
export async function getActiveSession(userId: string): Promise<Session | undefined> {
  const now = new Date();
  return db.sessions
    .where('userId')
    .equals(userId)
    .and((session) => session.isActive && session.expiresAt > now)
    .first();
}

/**
 * Add item to sync queue
 */
export async function queueForSync(
  userId: string,
  type: SyncQueueItem['type'],
  payload: unknown
): Promise<string> {
  const packageId = crypto.randomUUID();

  await db.syncQueue.add({
    packageId,
    userId,
    type,
    payload: JSON.stringify(payload),
    createdAt: new Date(),
    retryCount: 0,
    status: 'pending',
  });

  return packageId;
}

/**
 * Get pending sync items for a user
 */
export async function getPendingSyncItems(userId: string): Promise<SyncQueueItem[]> {
  return db.syncQueue
    .where('status')
    .equals('pending')
    .and((item) => item.userId === userId)
    .sortBy('createdAt');
}

/**
 * Clear expired sessions
 */
export async function clearExpiredSessions(): Promise<number> {
  const now = new Date();
  return db.sessions.where('expiresAt').below(now).delete();
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return db.notifications
    .where('userId')
    .equals(userId)
    .and((n) => n.readAt === null)
    .count();
}

/**
 * Check and update storage quota information
 */
export async function updateStorageQuota(): Promise<{
  used: number;
  quota: number;
  percentUsed: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;

    await updateDeviceState({
      storageUsed: used,
      storageQuota: quota,
    });

    return {
      used,
      quota,
      percentUsed: quota > 0 ? (used / quota) * 100 : 0,
    };
  }

  return { used: 0, quota: 0, percentUsed: 0 };
}

export default db;
