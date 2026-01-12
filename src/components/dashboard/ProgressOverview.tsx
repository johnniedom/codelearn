/**
 * ProgressOverview Component
 *
 * Displays overall learning progress across all courses.
 *
 * Features:
 * - Total progress percentage
 * - Courses breakdown
 * - Visual progress ring
 * - Accessible
 */

import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { db } from '@/lib/db';
import { useAuthStore } from '@/stores/authStore';

// =============================================================================
// Types
// =============================================================================

interface ProgressOverviewProps {
  /** Variant display */
  variant?: 'default' | 'compact' | 'detailed';
  /** Additional class names */
  className?: string;
}

interface CourseProgress {
  courseId: string;
  courseName: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
}

interface OverallProgress {
  totalCourses: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
  totalXP: number;
  averageScore: number;
  courses: CourseProgress[];
}

// =============================================================================
// Progress Ring Component
// =============================================================================

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 10,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-500"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-text">{Math.round(percentage)}%</span>
        <span className="text-xs text-text-muted">Complete</span>
      </div>
    </div>
  );
}

// =============================================================================
// Calculate Progress
// =============================================================================

async function calculateProgress(userId: string): Promise<OverallProgress> {
  const progress = await db.progress.where('userId').equals(userId).toArray();
  const quizAttempts = await db.quizAttempts.where('userId').equals(userId).toArray();

  // Group by course
  const courseMap = new Map<string, { lessons: Set<string>; scores: number[] }>();

  for (const p of progress) {
    if (!courseMap.has(p.courseId)) {
      courseMap.set(p.courseId, { lessons: new Set(), scores: [] });
    }
    courseMap.get(p.courseId)!.lessons.add(p.lessonId);
    if (p.score !== null) {
      courseMap.get(p.courseId)!.scores.push(p.score);
    }
  }

  // Calculate XP from quiz attempts
  const totalXP = quizAttempts.reduce((sum, qa) => sum + qa.score * 10, 0);

  // For demo purposes, assume 10 lessons per course
  const LESSONS_PER_COURSE = 10;

  const courses: CourseProgress[] = Array.from(courseMap.entries()).map(
    ([courseId, data]) => ({
      courseId,
      courseName: `Course ${courseId}`,
      completedLessons: data.lessons.size,
      totalLessons: LESSONS_PER_COURSE,
      percentage: Math.min(100, (data.lessons.size / LESSONS_PER_COURSE) * 100),
    })
  );

  const totalLessons = courses.length * LESSONS_PER_COURSE;
  const completedLessons = courses.reduce((sum, c) => sum + c.completedLessons, 0);
  const completedCourses = courses.filter((c) => c.percentage === 100).length;

  const allScores = Array.from(courseMap.values()).flatMap((c) => c.scores);
  const averageScore =
    allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;

  return {
    totalCourses: courses.length || 1,
    completedCourses,
    totalLessons: totalLessons || 1,
    completedLessons,
    totalXP,
    averageScore,
    courses,
  };
}

// =============================================================================
// ProgressOverview Component
// =============================================================================

export function ProgressOverview({
  variant = 'default',
  className,
}: ProgressOverviewProps) {
  const { profile } = useAuthStore();
  const [progress, setProgress] = useState<OverallProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile?.userId) return;

    const loadProgress = async () => {
      setIsLoading(true);
      try {
        const data = await calculateProgress(profile.userId);
        setProgress(data);
      } catch (error) {
        console.error('Failed to load progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [profile?.userId]);

  if (isLoading || !progress) {
    return (
      <div
        className={cn(
          'animate-pulse rounded-xl border border-border bg-surface p-6',
          className
        )}
      >
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-6 w-24 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  const overallPercentage =
    progress.totalLessons > 0
      ? (progress.completedLessons / progress.totalLessons) * 100
      : 0;

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <ProgressRing percentage={overallPercentage} size={60} strokeWidth={6} />
        <div>
          <p className="text-sm text-text-muted">Overall Progress</p>
          <p className="text-lg font-semibold text-text">
            {progress.completedLessons}/{progress.totalLessons} lessons
          </p>
        </div>
      </div>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <div
        className={cn(
          'rounded-xl border border-border bg-surface p-6',
          className
        )}
      >
        <h2 className="text-lg font-semibold text-text">Learning Progress</h2>

        <div className="mt-6 flex items-center gap-8">
          <ProgressRing percentage={overallPercentage} />
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm text-text-muted">Lessons Completed</p>
              <p className="text-xl font-bold text-text">
                {progress.completedLessons} / {progress.totalLessons}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Total XP Earned</p>
              <p className="text-xl font-bold text-text">{progress.totalXP} XP</p>
            </div>
          </div>
        </div>

        {/* Course breakdown */}
        {progress.courses.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-medium text-text-muted">By Course</h3>
            {progress.courses.map((course) => (
              <div key={course.courseId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-text-muted" />
                    {course.courseName}
                  </span>
                  <span className="text-text-muted">
                    {course.completedLessons}/{course.totalLessons}
                  </span>
                </div>
                <Progress value={course.percentage} className="h-2" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface p-6',
        className
      )}
    >
      <div className="flex items-center gap-6">
        <ProgressRing percentage={overallPercentage} />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-text">Overall Progress</h2>
          <p className="mt-1 text-sm text-text-muted">
            {progress.completedLessons} of {progress.totalLessons} lessons completed
          </p>

          <div className="mt-4 flex gap-6">
            <div>
              <p className="text-2xl font-bold text-text">{progress.totalXP}</p>
              <p className="text-xs text-text-muted">XP Earned</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {progress.completedCourses}/{progress.totalCourses}
              </p>
              <p className="text-xs text-text-muted">Courses Done</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressOverview;
