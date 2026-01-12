/**
 * Progress Tracker
 *
 * Tracks learning progress in IndexedDB with hash chain integrity.
 *
 * Features:
 * - Track lesson completions, quiz scores, time spent
 * - Hash chain for integrity verification
 * - Integration with existing Dexie schema
 * - Sync queue integration
 */

import { db, type Progress, type QuizAttempt, queueForSync } from '@/lib/db';
import type { QuizResult } from '@/types/content';

// =============================================================================
// Types
// =============================================================================

/** Progress summary for a course */
export interface CourseProgress {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  percentComplete: number;
  totalTimeSpentSeconds: number;
  averageQuizScore: number | null;
  lastActivityAt: Date | null;
}

/** Progress summary for a module */
export interface ModuleProgress {
  moduleId: string;
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  percentComplete: number;
  quizScore: number | null;
  quizPassed: boolean | null;
}

/** Lesson progress record */
export interface LessonProgress {
  lessonId: string;
  moduleId: string;
  courseId: string;
  completed: boolean;
  timeSpentSeconds: number;
  lastViewedAt: Date | null;
}

// =============================================================================
// Hash Chain Implementation
// =============================================================================

/**
 * Compute SHA-256 hash of a string
 */
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute HMAC-SHA256 signature
 *
 * Used for progress record integrity verification.
 */
async function computeSignature(
  data: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  return signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get the user's signing secret
 *
 * In production, this would be derived from the user's credentials.
 * For now, we use a simple device-based secret.
 */
async function getSigningSecret(userId: string): Promise<string> {
  // In production, derive from user's credential bundle
  // For MVP, use a simple combination
  return `codelearn-progress-${userId}`;
}

/**
 * Get the last progress record for a user (for hash chain)
 */
async function getLastProgressRecord(userId: string): Promise<Progress | undefined> {
  return db.progress
    .where('userId')
    .equals(userId)
    .reverse()
    .sortBy('sequenceNumber')
    .then((records) => records[0]);
}

/**
 * Compute hash of a progress record
 */
async function computeRecordHash(record: Omit<Progress, 'signature'>): Promise<string> {
  const dataString = JSON.stringify({
    userId: record.userId,
    courseId: record.courseId,
    moduleId: record.moduleId,
    lessonId: record.lessonId,
    completedAt: record.completedAt.toISOString(),
    score: record.score,
    timeSpentSeconds: record.timeSpentSeconds,
    sequenceNumber: record.sequenceNumber,
    previousHash: record.previousHash,
  });

  return sha256(dataString);
}

// =============================================================================
// Progress Recording
// =============================================================================

/**
 * Record lesson completion
 *
 * Creates a signed progress record with hash chain link.
 */
export async function recordLessonCompletion(
  userId: string,
  courseId: string,
  moduleId: string,
  lessonId: string,
  timeSpentSeconds: number,
  score?: number
): Promise<void> {
  try {
    // Get the last record for hash chain
    const lastRecord = await getLastProgressRecord(userId);
    const sequenceNumber = (lastRecord?.sequenceNumber ?? 0) + 1;
    const previousHash = lastRecord
      ? await computeRecordHash(lastRecord)
      : undefined;

    // Create the new record
    const record: Omit<Progress, 'id' | 'signature'> = {
      userId,
      courseId,
      moduleId,
      lessonId,
      completedAt: new Date(),
      score: score ?? null,
      timeSpentSeconds,
      sequenceNumber,
      previousHash,
    };

    // Compute signature
    const secret = await getSigningSecret(userId);
    const recordHash = await computeRecordHash(record);
    const signature = await computeSignature(recordHash, secret);

    // Store in IndexedDB
    await db.progress.add({
      ...record,
      signature,
    });

    // Queue for sync
    await queueForSync(userId, 'progress', {
      type: 'lesson_completion',
      ...record,
      signature,
    });
  } catch (error) {
    console.error('Failed to record lesson completion:', error);
    throw error;
  }
}

/**
 * Record quiz attempt
 *
 * Stores quiz results with integrity signature.
 */
export async function recordQuizAttempt(
  userId: string,
  courseId: string,
  moduleId: string,
  quizId: string,
  result: QuizResult
): Promise<void> {
  try {
    const attemptId = crypto.randomUUID();

    // Compute signature
    const dataString = JSON.stringify({
      attemptId,
      userId,
      quizId,
      courseId,
      moduleId,
      score: result.score,
      maxScore: result.maxScore,
      startedAt: result.completedAt.toISOString(), // We don't track start time separately
      completedAt: result.completedAt.toISOString(),
      answers: result.answers,
    });

    const secret = await getSigningSecret(userId);
    const signature = await computeSignature(dataString, secret);

    const attempt: QuizAttempt = {
      attemptId,
      userId,
      quizId,
      courseId,
      moduleId,
      score: result.score,
      maxScore: result.maxScore,
      startedAt: result.completedAt, // Simplified for now
      completedAt: result.completedAt,
      answers: JSON.stringify(result.answers),
      signature,
    };

    // Store in IndexedDB
    await db.quizAttempts.add(attempt);

    // Queue for sync
    await queueForSync(userId, 'quiz', attempt);
  } catch (error) {
    console.error('Failed to record quiz attempt:', error);
    throw error;
  }
}

// =============================================================================
// Progress Queries
// =============================================================================

/**
 * Get course progress for a user
 */
export async function getCourseProgress(
  userId: string,
  courseId: string,
  totalLessons: number
): Promise<CourseProgress> {
  try {
    // Get all progress records for this course
    const progressRecords = await db.progress
      .where('[userId+courseId]')
      .equals([userId, courseId])
      .toArray();

    // Get unique completed lessons
    const completedLessonIds = new Set(progressRecords.map((r) => r.lessonId));
    const completedLessons = completedLessonIds.size;

    // Calculate total time spent
    const totalTimeSpentSeconds = progressRecords.reduce(
      (sum, r) => sum + r.timeSpentSeconds,
      0
    );

    // Get quiz attempts for average score
    const quizAttempts = await db.quizAttempts
      .where('userId')
      .equals(userId)
      .and((a) => a.courseId === courseId)
      .toArray();

    const averageQuizScore =
      quizAttempts.length > 0
        ? quizAttempts.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) /
          quizAttempts.length
        : null;

    // Get last activity date
    const lastRecord = progressRecords.sort(
      (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
    )[0];

    return {
      courseId,
      completedLessons,
      totalLessons,
      percentComplete:
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      totalTimeSpentSeconds,
      averageQuizScore,
      lastActivityAt: lastRecord?.completedAt ?? null,
    };
  } catch (error) {
    console.error('Failed to get course progress:', error);
    return {
      courseId,
      completedLessons: 0,
      totalLessons,
      percentComplete: 0,
      totalTimeSpentSeconds: 0,
      averageQuizScore: null,
      lastActivityAt: null,
    };
  }
}

/**
 * Get module progress for a user
 */
export async function getModuleProgress(
  userId: string,
  courseId: string,
  moduleId: string,
  totalLessons: number
): Promise<ModuleProgress> {
  try {
    // Get progress records for this module
    const progressRecords = await db.progress
      .where('userId')
      .equals(userId)
      .and((r) => r.courseId === courseId && r.moduleId === moduleId)
      .toArray();

    const completedLessonIds = new Set(progressRecords.map((r) => r.lessonId));
    const completedLessons = completedLessonIds.size;

    // Get quiz attempt for this module
    const quizAttempt = await db.quizAttempts
      .where('userId')
      .equals(userId)
      .and((a) => a.moduleId === moduleId)
      .last();

    return {
      moduleId,
      courseId,
      completedLessons,
      totalLessons,
      percentComplete:
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      quizScore: quizAttempt ? (quizAttempt.score / quizAttempt.maxScore) * 100 : null,
      quizPassed: quizAttempt ? quizAttempt.score >= quizAttempt.maxScore * 0.7 : null,
    };
  } catch (error) {
    console.error('Failed to get module progress:', error);
    return {
      moduleId,
      courseId,
      completedLessons: 0,
      totalLessons,
      percentComplete: 0,
      quizScore: null,
      quizPassed: null,
    };
  }
}

/**
 * Get lesson progress for a user
 */
export async function getLessonProgress(
  userId: string,
  lessonId: string
): Promise<LessonProgress | null> {
  try {
    const record = await db.progress
      .where('[userId+lessonId]')
      .equals([userId, lessonId])
      .last();

    if (!record) return null;

    return {
      lessonId: record.lessonId,
      moduleId: record.moduleId,
      courseId: record.courseId,
      completed: true,
      timeSpentSeconds: record.timeSpentSeconds,
      lastViewedAt: record.completedAt,
    };
  } catch (error) {
    console.error('Failed to get lesson progress:', error);
    return null;
  }
}

/**
 * Get all completed lesson IDs for a course
 */
export async function getCompletedLessonIds(
  userId: string,
  courseId: string
): Promise<Set<string>> {
  try {
    const records = await db.progress
      .where('[userId+courseId]')
      .equals([userId, courseId])
      .toArray();

    return new Set(records.map((r) => r.lessonId));
  } catch (error) {
    console.error('Failed to get completed lesson IDs:', error);
    return new Set();
  }
}

/**
 * Get quiz attempts for a user
 */
export async function getQuizAttempts(
  userId: string,
  quizId: string
): Promise<QuizAttempt[]> {
  try {
    return db.quizAttempts
      .where('[userId+quizId]')
      .equals([userId, quizId])
      .sortBy('completedAt');
  } catch (error) {
    console.error('Failed to get quiz attempts:', error);
    return [];
  }
}

/**
 * Get best quiz score for a user
 */
export async function getBestQuizScore(
  userId: string,
  quizId: string
): Promise<number | null> {
  try {
    const attempts = await getQuizAttempts(userId, quizId);
    if (attempts.length === 0) return null;

    const scores = attempts.map((a) => (a.score / a.maxScore) * 100);
    return Math.max(...scores);
  } catch (error) {
    console.error('Failed to get best quiz score:', error);
    return null;
  }
}

// =============================================================================
// Statistics
// =============================================================================

/**
 * Get overall learning statistics for a user
 */
export async function getLearningStats(userId: string): Promise<{
  totalLessonsCompleted: number;
  totalQuizzesPassed: number;
  totalTimeSpentMinutes: number;
  averageQuizScore: number | null;
  streakDays: number;
}> {
  try {
    // Get all progress records
    const progressRecords = await db.progress
      .where('userId')
      .equals(userId)
      .toArray();

    // Get unique completed lessons
    const uniqueLessons = new Set(progressRecords.map((r) => r.lessonId));

    // Calculate total time
    const totalTimeSpentSeconds = progressRecords.reduce(
      (sum, r) => sum + r.timeSpentSeconds,
      0
    );

    // Get all quiz attempts
    const quizAttempts = await db.quizAttempts
      .where('userId')
      .equals(userId)
      .toArray();

    // Count passed quizzes (70% threshold)
    const passedQuizzes = quizAttempts.filter(
      (a) => a.score >= a.maxScore * 0.7
    );

    // Calculate average quiz score
    const averageQuizScore =
      quizAttempts.length > 0
        ? quizAttempts.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) /
          quizAttempts.length
        : null;

    // Calculate streak (simplified - count consecutive days with activity)
    const dates = progressRecords
      .map((r) => r.completedAt.toDateString())
      .filter((d, i, arr) => arr.indexOf(d) === i)
      .sort()
      .reverse();

    let streakDays = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (dates[0] === today || dates[0] === yesterday) {
      streakDays = 1;
      for (let i = 1; i < dates.length; i++) {
        const currentDate = new Date(dates[i - 1]);
        const prevDate = new Date(dates[i]);
        const dayDiff = Math.round(
          (currentDate.getTime() - prevDate.getTime()) / 86400000
        );
        if (dayDiff === 1) {
          streakDays++;
        } else {
          break;
        }
      }
    }

    return {
      totalLessonsCompleted: uniqueLessons.size,
      totalQuizzesPassed: passedQuizzes.length,
      totalTimeSpentMinutes: Math.round(totalTimeSpentSeconds / 60),
      averageQuizScore,
      streakDays,
    };
  } catch (error) {
    console.error('Failed to get learning stats:', error);
    return {
      totalLessonsCompleted: 0,
      totalQuizzesPassed: 0,
      totalTimeSpentMinutes: 0,
      averageQuizScore: null,
      streakDays: 0,
    };
  }
}

// =============================================================================
// Integrity Verification
// =============================================================================

/**
 * Verify the integrity of the progress hash chain
 *
 * Returns true if all records in the chain are valid.
 */
export async function verifyProgressChain(userId: string): Promise<{
  valid: boolean;
  invalidRecords: number[];
}> {
  try {
    const records = await db.progress
      .where('userId')
      .equals(userId)
      .sortBy('sequenceNumber');

    const invalidRecords: number[] = [];
    let previousHash: string | undefined;

    for (const record of records) {
      // Verify hash chain link
      if (record.previousHash !== previousHash) {
        if (record.id !== undefined) {
          invalidRecords.push(record.id);
        }
      }

      // Verify signature
      const secret = await getSigningSecret(userId);
      const recordWithoutSignature: Omit<Progress, 'id' | 'signature'> = {
        userId: record.userId,
        courseId: record.courseId,
        moduleId: record.moduleId,
        lessonId: record.lessonId,
        completedAt: record.completedAt,
        score: record.score,
        timeSpentSeconds: record.timeSpentSeconds,
        sequenceNumber: record.sequenceNumber,
        previousHash: record.previousHash,
      };

      const recordHash = await computeRecordHash(recordWithoutSignature);
      const expectedSignature = await computeSignature(recordHash, secret);

      if (record.signature !== expectedSignature) {
        if (record.id !== undefined && !invalidRecords.includes(record.id)) {
          invalidRecords.push(record.id);
        }
      }

      // Update previous hash for next iteration
      previousHash = await computeRecordHash(recordWithoutSignature);
    }

    return {
      valid: invalidRecords.length === 0,
      invalidRecords,
    };
  } catch (error) {
    console.error('Failed to verify progress chain:', error);
    return { valid: false, invalidRecords: [] };
  }
}
