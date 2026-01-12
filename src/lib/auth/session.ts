/**
 * Session Management for CodeLearn Identity System
 *
 * Handles session creation, validation, lockouts, and activity tracking.
 *
 * Session timeouts:
 * - 30 min idle timeout = lock (require PIN)
 * - 8 hours active = full re-auth
 * - Tab hidden > 5 min = lock
 *
 * Lockout rules:
 * - 5 failed PIN attempts = 30min lockout
 * - 3 failed MFA attempts = 15min lockout
 */

import { db, type Session, type MfaData, type Profile, type Credential } from '@/lib/db';
import { verifyPIN, verifyPattern, type PINVerifier, type PatternVerifier } from './crypto';

// =============================================================================
// Types
// =============================================================================

export interface LoginAttemptResult {
  success: boolean;
  error?: string;
  remainingAttempts?: number;
  lockoutUntil?: Date;
  requiresMFA?: boolean;
  session?: Session;
}

export interface MFAVerificationResult {
  success: boolean;
  error?: string;
  remainingAttempts?: number;
  lockoutUntil?: Date;
  session?: Session;
}

export interface LockoutStatus {
  isLocked: boolean;
  lockoutUntil: Date | null;
  remainingMinutes: number;
  reason?: 'pin' | 'mfa';
}

// =============================================================================
// Constants
// =============================================================================

// Lockout configuration
const MAX_PIN_ATTEMPTS = 5;
const MAX_MFA_ATTEMPTS = 3;
const PIN_LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const MFA_LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Session timeouts
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const MAX_SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours
export const TAB_HIDDEN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Session validity
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

// =============================================================================
// Session Management
// =============================================================================

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: string,
  pinVerified: boolean = true,
  mfaVerified: boolean = false,
  mfaMethod: Session['mfaMethod'] = null
): Promise<Session> {
  const now = new Date();
  const session: Session = {
    sessionId: crypto.randomUUID(),
    userId,
    pinVerified,
    mfaVerified,
    mfaMethod,
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
    lastActivityAt: now,
    isActive: true,
  };

  await db.sessions.add(session);

  // Update profile last used time
  await db.profiles.update(userId, { lastUsedAt: now });

  // Log session creation
  await db.auditLogs.add({
    logId: crypto.randomUUID(),
    userId,
    eventType: 'session_created',
    timestamp: now,
    details: JSON.stringify({
      sessionId: session.sessionId,
      mfaMethod,
    }),
    synced: false,
  });

  return session;
}

/**
 * Get active session for a user
 */
export async function getActiveSession(userId: string): Promise<Session | null> {
  const now = new Date();

  const sessions = await db.sessions
    .where('userId')
    .equals(userId)
    .and((s) => s.isActive && s.expiresAt > now)
    .toArray();

  if (sessions.length === 0) {
    return null;
  }

  // Return most recent session
  return sessions.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )[0];
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  await db.sessions.update(sessionId, {
    lastActivityAt: new Date(),
  });
}

/**
 * Lock a session (requires PIN to unlock)
 */
export async function lockSession(sessionId: string): Promise<void> {
  await db.sessions.update(sessionId, {
    isActive: false,
  });

  const session = await db.sessions.get(sessionId);
  if (session) {
    await db.auditLogs.add({
      logId: crypto.randomUUID(),
      userId: session.userId,
      eventType: 'session_locked',
      timestamp: new Date(),
      details: JSON.stringify({ sessionId, reason: 'timeout' }),
      synced: false,
    });
  }
}

/**
 * End a session completely
 */
export async function endSession(sessionId: string): Promise<void> {
  const session = await db.sessions.get(sessionId);

  await db.sessions.update(sessionId, {
    isActive: false,
  });

  if (session) {
    await db.auditLogs.add({
      logId: crypto.randomUUID(),
      userId: session.userId,
      eventType: 'session_ended',
      timestamp: new Date(),
      details: JSON.stringify({ sessionId }),
      synced: false,
    });
  }
}

/**
 * Clear all sessions for a user
 */
export async function clearUserSessions(userId: string): Promise<void> {
  await db.sessions.where('userId').equals(userId).modify({ isActive: false });
}

/**
 * Check if session should be locked due to inactivity
 */
export function shouldLockSession(session: Session): boolean {
  const now = new Date();
  const idleTime = now.getTime() - session.lastActivityAt.getTime();
  return idleTime > IDLE_TIMEOUT_MS;
}

/**
 * Check if session has exceeded max duration
 */
export function isSessionExpired(session: Session): boolean {
  const now = new Date();
  return (
    now > session.expiresAt ||
    now.getTime() - session.createdAt.getTime() > MAX_SESSION_DURATION_MS
  );
}

// =============================================================================
// Lockout Management
// =============================================================================

/**
 * Get or create MFA data for a user
 */
async function getOrCreateMfaData(userId: string): Promise<MfaData> {
  const existing = await db.mfaData.get(userId);
  if (existing) {
    return existing;
  }

  const newMfaData: MfaData = {
    userId,
    primaryMethod: 'pattern',
    backupCodes: [],
    failedAttempts: 0,
    lockedUntil: null,
  };

  await db.mfaData.add(newMfaData);
  return newMfaData;
}

/**
 * Check if user is currently locked out
 */
export async function getLockoutStatus(userId: string): Promise<LockoutStatus> {
  const mfaData = await getOrCreateMfaData(userId);

  if (!mfaData.lockedUntil) {
    return {
      isLocked: false,
      lockoutUntil: null,
      remainingMinutes: 0,
    };
  }

  const now = new Date();
  if (now >= mfaData.lockedUntil) {
    // Lockout expired, reset
    await db.mfaData.update(userId, {
      failedAttempts: 0,
      lockedUntil: null,
    });

    return {
      isLocked: false,
      lockoutUntil: null,
      remainingMinutes: 0,
    };
  }

  const remainingMs = mfaData.lockedUntil.getTime() - now.getTime();
  return {
    isLocked: true,
    lockoutUntil: mfaData.lockedUntil,
    remainingMinutes: Math.ceil(remainingMs / (60 * 1000)),
  };
}

/**
 * Record a failed attempt and check for lockout
 */
async function recordFailedAttempt(
  userId: string,
  attemptType: 'pin' | 'mfa'
): Promise<{
  isLocked: boolean;
  remainingAttempts: number;
  lockoutUntil: Date | null;
}> {
  const mfaData = await getOrCreateMfaData(userId);
  const maxAttempts = attemptType === 'pin' ? MAX_PIN_ATTEMPTS : MAX_MFA_ATTEMPTS;
  const lockoutDuration =
    attemptType === 'pin' ? PIN_LOCKOUT_DURATION_MS : MFA_LOCKOUT_DURATION_MS;

  const newAttempts = mfaData.failedAttempts + 1;

  // Log failed attempt
  await db.auditLogs.add({
    logId: crypto.randomUUID(),
    userId,
    eventType: `${attemptType}_failed`,
    timestamp: new Date(),
    details: JSON.stringify({
      attemptNumber: newAttempts,
      maxAttempts,
    }),
    synced: false,
  });

  if (newAttempts >= maxAttempts) {
    // Lock the account
    const lockoutUntil = new Date(Date.now() + lockoutDuration);

    await db.mfaData.update(userId, {
      failedAttempts: newAttempts,
      lockedUntil: lockoutUntil,
    });

    // Log lockout
    await db.auditLogs.add({
      logId: crypto.randomUUID(),
      userId,
      eventType: 'account_locked',
      timestamp: new Date(),
      details: JSON.stringify({
        reason: attemptType,
        lockoutUntil: lockoutUntil.toISOString(),
        durationMinutes: lockoutDuration / (60 * 1000),
      }),
      synced: false,
    });

    return {
      isLocked: true,
      remainingAttempts: 0,
      lockoutUntil,
    };
  }

  await db.mfaData.update(userId, {
    failedAttempts: newAttempts,
  });

  return {
    isLocked: false,
    remainingAttempts: maxAttempts - newAttempts,
    lockoutUntil: null,
  };
}

/**
 * Reset failed attempts after successful login
 */
async function resetFailedAttempts(userId: string): Promise<void> {
  await db.mfaData.update(userId, {
    failedAttempts: 0,
    lockedUntil: null,
  });
}

// =============================================================================
// PIN Authentication
// =============================================================================

/**
 * Attempt PIN login for a user
 *
 * Returns success/failure and handles lockout logic
 */
export async function attemptPINLogin(
  userId: string,
  pin: string
): Promise<LoginAttemptResult> {
  // Check lockout status first
  const lockoutStatus = await getLockoutStatus(userId);
  if (lockoutStatus.isLocked) {
    return {
      success: false,
      error: `Account locked. Try again in ${lockoutStatus.remainingMinutes} minutes`,
      lockoutUntil: lockoutStatus.lockoutUntil ?? undefined,
    };
  }

  // Get user credentials
  const credential = await db.credentials.get(userId);
  if (!credential) {
    return {
      success: false,
      error: 'Invalid credentials',
    };
  }

  // Parse PIN verifier from stored credential
  let pinVerifier: PINVerifier;
  try {
    pinVerifier = JSON.parse(credential.pinVerifier) as PINVerifier;
  } catch {
    return {
      success: false,
      error: 'Invalid credential format',
    };
  }

  // Verify PIN
  const isValid = await verifyPIN(pin, userId, pinVerifier);

  if (!isValid) {
    const result = await recordFailedAttempt(userId, 'pin');

    if (result.isLocked) {
      return {
        success: false,
        error: `Too many failed attempts. Account locked for 30 minutes`,
        lockoutUntil: result.lockoutUntil ?? undefined,
      };
    }

    return {
      success: false,
      error: `Incorrect PIN. ${result.remainingAttempts} attempts remaining`,
      remainingAttempts: result.remainingAttempts,
    };
  }

  // PIN verified successfully
  await resetFailedAttempts(userId);

  // Check if MFA is required
  const mfaData = await getOrCreateMfaData(userId);
  const requiresMFA = !!(mfaData.patternVerifier || mfaData.totpSecret);

  if (requiresMFA) {
    // Create session with PIN verified but awaiting MFA
    const session = await createSession(userId, true, false, null);
    return {
      success: true,
      requiresMFA: true,
      session,
    };
  }

  // No MFA required, create full session
  const session = await createSession(userId, true, true, null);
  return {
    success: true,
    requiresMFA: false,
    session,
  };
}

// =============================================================================
// MFA Authentication
// =============================================================================

/**
 * Verify pattern lock MFA
 */
export async function verifyPatternMFA(
  userId: string,
  sessionId: string,
  pattern: number[]
): Promise<MFAVerificationResult> {
  // Check lockout status
  const lockoutStatus = await getLockoutStatus(userId);
  if (lockoutStatus.isLocked) {
    return {
      success: false,
      error: `Account locked. Try again in ${lockoutStatus.remainingMinutes} minutes`,
      lockoutUntil: lockoutStatus.lockoutUntil ?? undefined,
    };
  }

  // Get MFA data
  const mfaData = await db.mfaData.get(userId);
  if (!mfaData?.patternVerifier) {
    return {
      success: false,
      error: 'Pattern lock not set up',
    };
  }

  // Parse pattern verifier
  let patternVerifier: PatternVerifier;
  try {
    patternVerifier = JSON.parse(mfaData.patternVerifier) as PatternVerifier;
  } catch {
    return {
      success: false,
      error: 'Invalid MFA configuration',
    };
  }

  // Verify pattern
  const isValid = await verifyPattern(pattern, userId, patternVerifier);

  if (!isValid) {
    const result = await recordFailedAttempt(userId, 'mfa');

    if (result.isLocked) {
      return {
        success: false,
        error: `Too many failed attempts. Account locked for 15 minutes`,
        lockoutUntil: result.lockoutUntil ?? undefined,
      };
    }

    return {
      success: false,
      error: `Incorrect pattern. ${result.remainingAttempts} attempts remaining`,
      remainingAttempts: result.remainingAttempts,
    };
  }

  // Pattern verified successfully
  await resetFailedAttempts(userId);

  // Update session with MFA verified
  await db.sessions.update(sessionId, {
    mfaVerified: true,
    mfaMethod: 'pattern',
  });

  const session = await db.sessions.get(sessionId);
  if (!session) {
    return {
      success: false,
      error: 'Session not found',
    };
  }

  // Log successful MFA
  await db.auditLogs.add({
    logId: crypto.randomUUID(),
    userId,
    eventType: 'mfa_verified',
    timestamp: new Date(),
    details: JSON.stringify({ method: 'pattern', sessionId }),
    synced: false,
  });

  return {
    success: true,
    session,
  };
}

// =============================================================================
// Profile Management
// =============================================================================

/**
 * Get all profiles on this device (for profile selector)
 */
export async function getDeviceProfiles(): Promise<Profile[]> {
  return db.profiles.orderBy('lastUsedAt').reverse().toArray();
}

/**
 * Get profile by ID
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const profile = await db.profiles.get(userId);
  return profile ?? null;
}

/**
 * Get credential by user ID
 */
export async function getCredential(userId: string): Promise<Credential | null> {
  const credential = await db.credentials.get(userId);
  return credential ?? null;
}

/**
 * Check if user has MFA set up
 */
export async function hasMFASetup(userId: string): Promise<boolean> {
  const mfaData = await db.mfaData.get(userId);
  return !!(mfaData?.patternVerifier || mfaData?.totpSecret);
}

/**
 * Get MFA data for user
 */
export async function getMFAData(userId: string): Promise<MfaData | null> {
  const mfaData = await db.mfaData.get(userId);
  return mfaData ?? null;
}

// =============================================================================
// Cleanup
// =============================================================================

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const now = new Date();
  return db.sessions.where('expiresAt').below(now).delete();
}

/**
 * Clean up expired credentials
 */
export async function cleanupExpiredCredentials(): Promise<number> {
  const now = new Date();
  // Don't delete, just mark as expired - user data should remain for sync
  const expired = await db.credentials.where('expiresAt').below(now).toArray();

  for (const cred of expired) {
    await db.profiles.update(cred.userId, {
      accountStatus: 'archived',
    });
  }

  return expired.length;
}
