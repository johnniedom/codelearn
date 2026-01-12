/**
 * StreakCounter Component
 *
 * Displays the user's learning streak (consecutive days).
 *
 * Features:
 * - Current streak display
 * - Flame icon animation
 * - Daily completion indicator
 * - Streak milestone celebration
 */

import { useEffect, useState } from 'react';
import { Flame, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/db';
import { useAuthStore } from '@/stores/authStore';

// =============================================================================
// Types
// =============================================================================

interface StreakCounterProps {
  /** Variant size */
  variant?: 'default' | 'compact' | 'large';
  /** Show weekly view */
  showWeekView?: boolean;
  /** Additional class names */
  className?: string;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  weekActivity: boolean[]; // Last 7 days, starting from Sunday
}

// =============================================================================
// Streak Calculation
// =============================================================================

async function calculateStreak(userId: string): Promise<StreakData> {
  const progress = await db.progress
    .where('userId')
    .equals(userId)
    .sortBy('completedAt');

  if (progress.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      todayCompleted: false,
      weekActivity: [false, false, false, false, false, false, false],
    };
  }

  // Get unique dates with activity
  const activityDates = new Set<string>();
  progress.forEach((p) => {
    const date = new Date(p.completedAt);
    activityDates.add(date.toISOString().split('T')[0]);
  });

  // const sortedDates = Array.from(activityDates).sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const todayCompleted = activityDates.has(today);

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date();

  // If no activity today, start from yesterday
  if (!todayCompleted) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (activityDates.has(checkDate.toISOString().split('T')[0])) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  const sortedAsc = Array.from(activityDates).sort();
  for (const dateStr of sortedAsc) {
    const date = new Date(dateStr);
    if (prevDate) {
      const diffDays = Math.floor(
        (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    prevDate = date;
  }

  // Calculate week activity (last 7 days)
  const weekActivity: boolean[] = [];
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start from Sunday

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + i);
    weekActivity.push(activityDates.has(dayDate.toISOString().split('T')[0]));
  }

  return {
    currentStreak,
    longestStreak,
    todayCompleted,
    weekActivity,
  };
}

// =============================================================================
// Day Labels
// =============================================================================

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// =============================================================================
// StreakCounter Component
// =============================================================================

export function StreakCounter({
  variant = 'default',
  showWeekView = true,
  className,
}: StreakCounterProps) {
  const { profile } = useAuthStore();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile?.userId) return;

    const loadStreak = async () => {
      setIsLoading(true);
      try {
        const data = await calculateStreak(profile.userId);
        setStreak(data);
      } catch (error) {
        console.error('Failed to load streak:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStreak();
  }, [profile?.userId]);

  if (isLoading || !streak) {
    return (
      <div
        className={cn(
          'animate-pulse rounded-xl border border-border bg-surface p-4',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-6 w-12 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Flame
          className={cn(
            'h-5 w-5',
            streak.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'
          )}
        />
        <span className="font-bold text-text">{streak.currentStreak}</span>
      </div>
    );
  }

  // Large variant
  if (variant === 'large') {
    return (
      <div
        className={cn(
          'rounded-xl border border-border bg-gradient-to-br from-orange-50 to-yellow-50 p-6',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-muted">Current Streak</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-text">
                {streak.currentStreak}
              </span>
              <span className="text-lg text-text-muted">days</span>
            </div>
            <p className="mt-2 text-sm text-text-muted">
              Best: {streak.longestStreak} days
            </p>
          </div>
          <div
            className={cn(
              'flex h-20 w-20 items-center justify-center rounded-full',
              streak.currentStreak > 0
                ? 'bg-orange-100'
                : 'bg-gray-100'
            )}
          >
            <Flame
              className={cn(
                'h-10 w-10',
                streak.currentStreak > 0
                  ? 'text-orange-500 animate-pulse'
                  : 'text-gray-400'
              )}
            />
          </div>
        </div>

        {/* Week view */}
        {showWeekView && (
          <div className="mt-6">
            <div className="flex justify-between">
              {DAY_LABELS.map((day, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-text-muted">{day}</span>
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full',
                      streak.weekActivity[index]
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    )}
                  >
                    {streak.weekActivity[index] ? (
                      <CheckCircle className="h-4 w-4 text-white" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-gray-300" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's status */}
        <div className="mt-4 flex items-center gap-2 text-sm">
          {streak.todayCompleted ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-700">Today completed!</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-700">
                Complete a lesson to keep your streak!
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface p-4',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            streak.currentStreak > 0 ? 'bg-orange-100' : 'bg-gray-100'
          )}
        >
          <Flame
            className={cn(
              'h-6 w-6',
              streak.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'
            )}
          />
        </div>
        <div>
          <p className="text-sm text-text-muted">Learning Streak</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-text">
              {streak.currentStreak}
            </span>
            <span className="text-sm text-text-muted">days</span>
          </div>
        </div>
      </div>

      {/* Week view */}
      {showWeekView && (
        <div className="mt-4 flex justify-between">
          {DAY_LABELS.map((day, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
              <span className="text-xs text-text-muted">{day}</span>
              <div
                className={cn(
                  'h-6 w-6 rounded-full',
                  streak.weekActivity[index] ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StreakCounter;
