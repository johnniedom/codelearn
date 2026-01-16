import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressCard } from '@/components/content';
import { listInstalledCourses, getCourseProgress } from '@/lib/content';
import { useAuthStore } from '@/stores/authStore';
import type { CourseListItem } from '@/types/content';
import type { CourseProgress } from '@/lib/content';
import { formatDuration } from '@/types/content';

// Import sample data for demo
import { SAMPLE_COURSES } from '@/data/sample-course';

/**
 * Course Card Component
 */
interface CourseCardProps {
  course: CourseListItem;
  progress?: CourseProgress;
  onClick: () => void;
}

function CourseCard({ course, progress, onClick }: CourseCardProps) {
  const percentComplete = progress?.percentComplete ?? 0;
  const hasStarted = percentComplete > 0;

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

        {/* Progress overlay */}
        {hasStarted && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${percentComplete}%` }}
            />
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
          {hasStarted && (
            <span className="flex items-center gap-1 text-primary">
              <BarChart2 className="h-3 w-3" aria-hidden="true" />
              {percentComplete}%
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Course Card Skeleton
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
 * Empty State Component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface/50 p-8 text-center">
      <BookOpen
        className="mb-3 h-12 w-12 text-text-muted/50"
        aria-hidden="true"
      />
      <h3 className="mb-2 font-medium text-text">No courses available</h3>
      <p className="text-sm text-text-muted">
        Connect to a hub to download courses. Once downloaded, you can learn offline anytime.
      </p>
    </div>
  );
}

/**
 * CoursesPage Component
 *
 * Displays all available courses with progress tracking.
 *
 * Features:
 * - Lists installed courses from Cache API
 * - Shows progress for each course
 * - Highlights current/in-progress course
 * - Navigation to individual courses
 */
export default function CoursesPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load courses and progress
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      try {
        // Try to load from Cache API first
        let loadedCourses = await listInstalledCourses();

        // If no cached courses, use sample data for demo
        if (loadedCourses.length === 0) {
          loadedCourses = SAMPLE_COURSES;
        }

        setCourses(loadedCourses);

        // Load progress for each course
        if (profile?.userId) {
          const progressEntries = await Promise.all(
            loadedCourses.map(async (course) => {
              const progress = await getCourseProgress(
                profile.userId,
                course.id,
                course.lessonsCount
              );
              return [course.id, progress] as [string, CourseProgress];
            })
          );

          setProgressMap(Object.fromEntries(progressEntries));
        }
      } catch (error) {
        console.error('Failed to load courses:', error);
        // Use sample data as fallback
        setCourses(SAMPLE_COURSES);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [profile?.userId]);

  // Find in-progress course (most recently active)
  const inProgressCourse = courses.find((course) => {
    const progress = progressMap[course.id];
    return progress && progress.percentComplete > 0 && progress.percentComplete < 100;
  });

  // Handle course selection
  const handleCourseClick = (courseSlug: string) => {
    navigate(`/courses/${courseSlug}`);
  };

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Page header */}
      <section>
        <h1 className="mb-2 text-2xl font-bold text-text">Courses</h1>
        <p className="text-text-muted">
          Browse available courses and track your learning progress.
        </p>
      </section>

      {/* In-progress course card */}
      {!isLoading && inProgressCourse && progressMap[inProgressCourse.id] && (
        <section>
          <h2 className="sr-only">Continue Learning</h2>
          <ProgressCard
            title={inProgressCourse.title}
            progress={progressMap[inProgressCourse.id]}
            onClick={() => handleCourseClick(inProgressCourse.slug)}
          />
        </section>
      )}

      {/* All courses grid */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text">
          {inProgressCourse ? 'All Courses' : 'Available Courses'}
        </h2>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </div>
        ) : courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                progress={progressMap[course.id]}
                onClick={() => handleCourseClick(course.slug)}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}
