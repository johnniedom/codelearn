import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Code, Trophy, Clock } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/db';
import { useAuthStore } from '@/stores/authStore';
import { listInstalledCourses } from '@/lib/content';
import { cn } from '@/lib/utils';
import type { CourseListItem } from '@/types/content';
import { formatDuration } from '@/types/content';
import { SAMPLE_COURSES } from '@/data/sample-course';

/**
 * Stats Card Component
 *
 * Displays a single stat with icon, value, and label.
 */
interface StatCardProps {
  icon: React.ElementType;
  iconColorClass: string;
  value: number;
  label: string;
}

function StatCard({ icon: Icon, iconColorClass, value, label }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface">
        <Icon className={`h-5 w-5 ${iconColorClass}`} aria-hidden="true" />
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
    </Card>
  );
}

/**
 * Empty State Component
 *
 * Shown when no courses are downloaded.
 * Per audit: Positive framing about offline capability
 */
function EmptyCoursesState() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface/50 p-8 text-center">
      <BookOpen
        className="mx-auto mb-3 h-12 w-12 text-text-muted/50"
        aria-hidden="true"
      />
      <p className="mb-2 font-medium text-text">No courses downloaded yet</p>
      <p className="text-sm text-text-muted">
        Connect to your hub to download courses. Once downloaded, you can learn offline anytime.
      </p>
    </div>
  );
}

/**
 * Simple Course Card for HomePage
 */
interface HomeCourseCardProps {
  course: CourseListItem;
  onClick: () => void;
}

function HomeCourseCard({ course, onClick }: HomeCourseCardProps) {
  const difficultyColors = {
    beginner: 'bg-success/10 text-success',
    intermediate: 'bg-warning/10 text-warning',
    advanced: 'bg-error/10 text-error',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full text-left',
        'rounded-lg border border-border bg-surface',
        'transition-all duration-fast',
        'hover:border-border-focus hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'active:scale-[0.99]'
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-surface-hover">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            {course.icon ? (
              <span className="text-4xl">{course.icon}</span>
            ) : (
              <BookOpen className="h-12 w-12 text-text-muted/30" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-text line-clamp-1">
            {course.title}
          </h3>
          <Badge className={cn('flex-shrink-0 text-xs', difficultyColors[course.difficulty])}>
            {course.difficulty}
          </Badge>
        </div>

        <p className="mb-3 text-sm text-text-muted line-clamp-2">
          {course.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" aria-hidden="true" />
            {course.lessonsCount} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {formatDuration(course.estimatedHours * 60)}
          </span>
        </div>
      </div>
    </button>
  );
}

/**
 * Course Card Skeleton for loading state
 */
function CourseCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <Skeleton className="aspect-video w-full rounded-t-lg" />
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="mb-3 h-4 w-full" />
        <Skeleton className="mb-3 h-4 w-2/3" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * HomePage Component
 *
 * Main landing page for the CodeLearn PWA.
 *
 * Features:
 * - Welcome section with app description
 * - Quick stats grid (lessons, quizzes, exercises)
 * - Available courses grid with loading state
 *
 * Note: TopBar and BottomNav are now in App.tsx layout
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [stats, setStats] = useState({
    lessonsCompleted: 0,
    quizzesPassed: 0,
    exercisesSolved: 0,
  });
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  // Load user stats
  useEffect(() => {
    const loadStats = async () => {
      const userId = profile?.userId;
      if (!userId) return;

      try {
        const [progress, quizAttempts] = await Promise.all([
          db.progress.where('userId').equals(userId).toArray(),
          db.quizAttempts.where('userId').equals(userId).toArray(),
        ]);

        // Count unique completed lessons
        const lessonsCompleted = new Set(progress.map((p) => p.lessonId)).size;

        // Count quizzes with passing score (60% or higher)
        const quizzesPassed = quizAttempts.filter(
          (qa) => qa.maxScore > 0 && qa.score >= qa.maxScore * 0.6
        ).length;

        // Exercise tracking not yet implemented - show 0 for now
        const exercisesSolved = 0;

        setStats({
          lessonsCompleted,
          quizzesPassed,
          exercisesSolved,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    loadStats();
  }, [profile?.userId]);

  // Load courses
  useEffect(() => {
    async function loadCourses() {
      setIsLoadingCourses(true);

      try {
        // Try to load from Cache API first
        let loadedCourses = await listInstalledCourses();

        // If no cached courses, use sample data for demo
        if (loadedCourses.length === 0) {
          loadedCourses = SAMPLE_COURSES;
        }

        setCourses(loadedCourses);
      } catch (error) {
        console.error('Failed to load courses:', error);
        // Use sample data as fallback
        setCourses(SAMPLE_COURSES);
      } finally {
        setIsLoadingCourses(false);
      }
    }

    loadCourses();
  }, []);

  // Handle course selection
  const handleCourseClick = (courseSlug: string) => {
    navigate(`/courses/${courseSlug}`);
  };

  return (
    <div className="flex flex-col gap-6 py-6 sm:gap-8">
      {/* Welcome Section */}
      <section>
        <h1 className="mb-2 text-2xl font-bold text-text">
          Welcome to CodeLearn
        </h1>
        <p className="text-text-muted">
          Learn to code offline with interactive lessons, quizzes, and hands-on exercises.
        </p>
      </section>

      {/* Quick Stats */}
      <section
        className="grid grid-cols-2 gap-4 sm:grid-cols-3"
        aria-label="Learning statistics"
      >
        <StatCard
          icon={BookOpen}
          iconColorClass="text-primary"
          value={stats.lessonsCompleted}
          label="Lessons Completed"
        />
        <StatCard
          icon={Trophy}
          iconColorClass="text-success"
          value={stats.quizzesPassed}
          label="Quizzes Passed"
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            icon={Code}
            iconColorClass="text-warning"
            value={stats.exercisesSolved}
            label="Exercises Solved"
          />
        </div>
      </section>

      {/* Available Courses */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text">
          Available Courses
        </h2>
        {isLoadingCourses ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </div>
        ) : courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <HomeCourseCard
                key={course.id}
                course={course}
                onClick={() => handleCourseClick(course.slug)}
              />
            ))}
          </div>
        ) : (
          <EmptyCoursesState />
        )}
      </section>
    </div>
  );
}
