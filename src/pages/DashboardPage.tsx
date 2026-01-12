/**
 * DashboardPage
 *
 * Progress dashboard showing overall learning statistics.
 *
 * Features:
 * - Overall progress across courses
 * - Streak counter (consecutive days learning)
 * - Recent activity
 * - Time spent learning
 * - Sync status
 */

import { useEffect, useState } from 'react';
import { Clock, Target, BookOpen, Award } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/db';
import {
  ProgressOverview,
  StreakCounter,
  RecentActivity,
  StatsCard,
  StatsGrid,
} from '@/components/dashboard';
import { SyncButton } from '@/components/sync';

// =============================================================================
// Stats Calculation
// =============================================================================

interface DashboardStats {
  totalTimeMinutes: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  averageScore: number;
}

async function calculateStats(userId: string): Promise<DashboardStats> {
  const progress = await db.progress.where('userId').equals(userId).toArray();
  const quizAttempts = await db.quizAttempts.where('userId').equals(userId).toArray();

  const totalTimeMinutes = Math.round(
    progress.reduce((sum, p) => sum + (p.timeSpentSeconds || 0), 0) / 60
  );

  const lessonsCompleted = new Set(progress.map((p) => p.lessonId)).size;

  const passedQuizzes = quizAttempts.filter(
    (qa) => qa.score >= qa.maxScore * 0.6
  );

  const quizScores = quizAttempts.map((qa) =>
    qa.maxScore > 0 ? (qa.score / qa.maxScore) * 100 : 0
  );
  const averageScore =
    quizScores.length > 0
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : 0;

  return {
    totalTimeMinutes,
    lessonsCompleted,
    quizzesPassed: passedQuizzes.length,
    averageScore,
  };
}

// =============================================================================
// Format Time
// =============================================================================

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// =============================================================================
// DashboardPage Component
// =============================================================================

export function DashboardPage() {
  const { profile } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile?.userId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await calculateStats(profile.userId);
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [profile?.userId]);

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-sm text-text-muted">
            Welcome back, {profile?.preferredName || 'Learner'}!
          </p>
        </div>
        <SyncButton variant="compact" />
      </header>

      {/* Progress Overview */}
      <section aria-labelledby="progress-heading">
        <h2 id="progress-heading" className="sr-only">
          Progress Overview
        </h2>
        <ProgressOverview />
      </section>

      {/* Streak Counter */}
      <section aria-labelledby="streak-heading">
        <h2 id="streak-heading" className="sr-only">
          Learning Streak
        </h2>
        <StreakCounter variant="large" />
      </section>

      {/* Quick Stats */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="mb-4 text-lg font-semibold text-text">
          Your Stats
        </h2>
        <StatsGrid>
          <StatsCard
            label="Time Learning"
            value={isLoading ? '-' : formatTime(stats?.totalTimeMinutes || 0)}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatsCard
            label="Lessons Done"
            value={isLoading ? '-' : stats?.lessonsCompleted || 0}
            icon={<BookOpen className="h-5 w-5" />}
          />
          <StatsCard
            label="Quizzes Passed"
            value={isLoading ? '-' : stats?.quizzesPassed || 0}
            icon={<Target className="h-5 w-5" />}
          />
          <StatsCard
            label="Average Score"
            value={isLoading ? '-' : `${stats?.averageScore || 0}%`}
            icon={<Award className="h-5 w-5" />}
          />
        </StatsGrid>
      </section>

      {/* Recent Activity */}
      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="mb-4 text-lg font-semibold text-text">
          Recent Activity
        </h2>
        <div className="rounded-xl border border-border bg-surface">
          <RecentActivity maxItems={5} />
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
