import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LessonCard,
  PrerequisiteList,
  ContentStatusBadge,
  AuthorCard,
  BloomLevelBadge,
} from '@/components/content';
import { getCourseProgress, getCompletedLessonIds } from '@/lib/content';
import { useAuthStore } from '@/stores/authStore';
import type { Course, Module, LessonListItem, LessonStatus } from '@/types/content';
import { getLocalizedText, formatDuration } from '@/types/content';

// Import sample data for demo
import {
  SAMPLE_COURSES,
  SAMPLE_COURSE,
  SAMPLE_MODULE,
  SAMPLE_LESSON_LIST,
} from '@/data/sample-course';

// =============================================================================
// Types
// =============================================================================

interface ModuleWithLessons {
  module: Module;
  lessons: LessonListItem[];
}

interface CourseData {
  course: Course;
  modules: ModuleWithLessons[];
}

// =============================================================================
// Skeleton Components
// =============================================================================

function CourseDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>

      {/* Progress skeleton */}
      <Skeleton className="h-16 w-full rounded-lg" />

      {/* Modules skeleton */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  );
}

// =============================================================================
// Module Accordion Component
// =============================================================================

interface ModuleAccordionProps {
  module: Module;
  lessons: LessonListItem[];
  courseSlug: string;
  isExpanded: boolean;
  onToggle: () => void;
  completedLessonIds: Set<string>;
}

function ModuleAccordion({
  module,
  lessons,
  courseSlug,
  isExpanded,
  onToggle,
  completedLessonIds,
}: ModuleAccordionProps) {
  const navigate = useNavigate();
  const completedCount = lessons.filter((l) => completedLessonIds.has(l.id)).length;
  const totalCount = lessons.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleLessonSelect = (lesson: LessonListItem) => {
    navigate(`/lessons/${courseSlug}/${module.id}/${lesson.id}`);
  };

  const getLessonStatus = (lesson: LessonListItem, index: number): LessonStatus => {
    if (completedLessonIds.has(lesson.id)) {
      return 'completed';
    }

    // First uncompleted lesson is available, rest are locked
    const firstUncompletedIndex = lessons.findIndex((l) => !completedLessonIds.has(l.id));
    if (index === firstUncompletedIndex) {
      return 'available';
    }

    // For non-linear courses, all lessons would be available
    // But for linear courses (like our sample), lessons after the first uncompleted are locked
    return index < firstUncompletedIndex ? 'completed' : 'locked';
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      {/* Module header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className={cn(
          'flex w-full items-center justify-between gap-3 p-4 text-left',
          'transition-colors duration-fast',
          'hover:bg-surface-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-inset focus-visible:ring-offset-surface'
        )}
      >
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-2">
            {module.icon && (
              <span className="text-lg" aria-hidden="true">
                {module.icon}
              </span>
            )}
            <h3 className="truncate font-semibold text-text">
              {getLocalizedText(module.title)}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span>{totalCount} lessons</span>
            <span>{formatDuration(module.estimatedMinutes)}</span>
            {completedCount > 0 && (
              <span className="text-success">{progressPercent}% complete</span>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          {completedCount > 0 && (
            <div className="h-2 w-16 overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-success transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-text-muted" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-5 w-5 text-text-muted" aria-hidden="true" />
          )}
        </div>
      </button>

      {/* Lessons list */}
      {isExpanded && (
        <div className="border-t border-border bg-background p-2">
          <ul className="flex flex-col gap-2" role="list">
            {lessons.map((lesson, index) => (
              <li key={lesson.id}>
                <LessonCard
                  title={lesson.title}
                  duration={lesson.duration}
                  status={getLessonStatus(lesson, index)}
                  onSelect={() => handleLessonSelect(lesson)}
                />
              </li>
            ))}
          </ul>

          {/* Module quiz link (if available) */}
          {module.assessment && (
            <div className="mt-2 border-t border-border pt-2">
              <Link
                to={`/quizzes/${courseSlug}/${module.id}/${module.assessment.quizId}`}
                className={cn(
                  'flex items-center justify-between rounded-lg border border-border bg-surface p-3',
                  'transition-all duration-fast',
                  'hover:border-border-focus hover:shadow-sm',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-background'
                )}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-text">Module Quiz</span>
                  <span className="text-xs text-text-muted">
                    {module.assessment.passingScore}% to pass
                  </span>
                </div>
                <Badge variant="secondary">Assessment</Badge>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Error State
// =============================================================================

function ErrorState({ message }: { message: string }) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-8">
      <div className="mb-4 text-4xl">:(</div>
      <h1 className="mb-2 text-xl font-bold text-text">Course Not Found</h1>
      <p className="mb-6 text-center text-sm text-text-muted">{message}</p>
      <button
        type="button"
        onClick={() => navigate('/courses')}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
      >
        Back to Courses
      </button>
    </div>
  );
}

// =============================================================================
// Course Detail Page
// =============================================================================

/**
 * CourseDetailPage Component
 *
 * Displays detailed course information with modules and lessons.
 *
 * Features:
 * - Course header with metadata (title, description, difficulty, duration)
 * - Progress tracking bar
 * - Expandable module sections
 * - Lesson list with completion status
 * - Navigation to individual lessons
 *
 * URL: /courses/:courseSlug
 */
export default function CourseDetailPage() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<string>>(new Set());
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [overallProgress, setOverallProgress] = useState(0);

  // Load course data
  useEffect(() => {
    async function loadCourseData() {
      if (!courseSlug) {
        setError('No course specified');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Find the course from sample data
        const courseListItem = SAMPLE_COURSES.find((c) => c.slug === courseSlug);

        if (!courseListItem) {
          setError('This course is not available. It may not be downloaded yet.');
          setIsLoading(false);
          return;
        }

        // For demo, use sample course if it matches, otherwise create a mock
        let course: Course;
        let modules: ModuleWithLessons[];

        if (courseSlug === SAMPLE_COURSE.slug) {
          course = SAMPLE_COURSE;
          // Use sample module and lessons
          modules = [
            {
              module: SAMPLE_MODULE,
              lessons: SAMPLE_LESSON_LIST,
            },
            // Add placeholder modules for demo
            {
              module: {
                ...SAMPLE_MODULE,
                id: 'mod-002',
                orderIndex: 1,
                title: { default: 'Control Flow' },
                shortTitle: { default: 'Control Flow' },
                description: { default: 'Learn about conditionals and loops in Python.' },
                icon: '🔄',
                estimatedMinutes: 120,
                lessons: [],
              },
              lessons: [
                {
                  id: 'les-004',
                  title: 'If Statements',
                  duration: 20,
                  status: 'locked',
                  moduleId: 'mod-002',
                  courseId: course.id,
                },
                {
                  id: 'les-005',
                  title: 'For Loops',
                  duration: 25,
                  status: 'locked',
                  moduleId: 'mod-002',
                  courseId: course.id,
                },
                {
                  id: 'les-006',
                  title: 'While Loops',
                  duration: 20,
                  status: 'locked',
                  moduleId: 'mod-002',
                  courseId: course.id,
                },
              ],
            },
            {
              module: {
                ...SAMPLE_MODULE,
                id: 'mod-003',
                orderIndex: 2,
                title: { default: 'Functions' },
                shortTitle: { default: 'Functions' },
                description: { default: 'Master Python functions and parameters.' },
                icon: '🧩',
                estimatedMinutes: 150,
                lessons: [],
              },
              lessons: [
                {
                  id: 'les-007',
                  title: 'Defining Functions',
                  duration: 25,
                  status: 'locked',
                  moduleId: 'mod-003',
                  courseId: course.id,
                },
                {
                  id: 'les-008',
                  title: 'Parameters and Arguments',
                  duration: 30,
                  status: 'locked',
                  moduleId: 'mod-003',
                  courseId: course.id,
                },
                {
                  id: 'les-009',
                  title: 'Return Values',
                  duration: 20,
                  status: 'locked',
                  moduleId: 'mod-003',
                  courseId: course.id,
                },
                {
                  id: 'les-010',
                  title: 'Scope and Lifetime',
                  duration: 25,
                  status: 'locked',
                  moduleId: 'mod-003',
                  courseId: course.id,
                },
              ],
            },
          ];
        } else {
          // Create a mock course based on the list item
          course = {
            ...SAMPLE_COURSE,
            id: courseListItem.id,
            slug: courseListItem.slug,
            title: { default: courseListItem.title },
            shortTitle: { default: courseListItem.title },
            description: { default: courseListItem.description },
            icon: courseListItem.icon,
            difficulty: courseListItem.difficulty,
            duration: {
              totalHours: courseListItem.estimatedHours,
              weeklyHours: 4,
              weeksToComplete: Math.ceil(courseListItem.estimatedHours / 4),
            },
            structure: {
              moduleCount: 3,
              lessonCount: courseListItem.lessonsCount,
              assessmentCount: 3,
              exerciseCount: 10,
            },
          };

          // Generate mock modules
          modules = [
            {
              module: {
                ...SAMPLE_MODULE,
                id: `${courseSlug}-mod-001`,
                courseId: course.id,
                title: { default: 'Getting Started' },
                shortTitle: { default: 'Getting Started' },
                icon: '🚀',
              },
              lessons: [
                {
                  id: `${courseSlug}-les-001`,
                  title: 'Introduction',
                  duration: 15,
                  status: 'available',
                  moduleId: `${courseSlug}-mod-001`,
                  courseId: course.id,
                },
                {
                  id: `${courseSlug}-les-002`,
                  title: 'Core Concepts',
                  duration: 20,
                  status: 'locked',
                  moduleId: `${courseSlug}-mod-001`,
                  courseId: course.id,
                },
              ],
            },
          ];
        }

        setCourseData({ course, modules });

        // Expand first module by default
        if (modules.length > 0) {
          setExpandedModuleIds(new Set([modules[0].module.id]));
        }

        // Load progress
        if (profile?.userId) {
          const [progress, completedIds] = await Promise.all([
            getCourseProgress(profile.userId, course.id, course.structure.lessonCount),
            getCompletedLessonIds(profile.userId, course.id),
          ]);
          setOverallProgress(progress.percentComplete);
          setCompletedLessonIds(completedIds);
        }
      } catch (err) {
        console.error('Failed to load course:', err);
        setError('Failed to load course data.');
      } finally {
        setIsLoading(false);
      }
    }

    loadCourseData();
  }, [courseSlug, profile?.userId]);

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  // Loading state
  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  // Error state
  if (error || !courseData) {
    return <ErrorState message={error || 'Course data not available.'} />;
  }

  const { course, modules } = courseData;
  const difficultyColors = {
    beginner: 'bg-success/10 text-success',
    intermediate: 'bg-warning/10 text-warning',
    advanced: 'bg-error/10 text-error',
  };

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Back navigation */}
      <nav>
        <button
          type="button"
          onClick={() => navigate('/courses')}
          className={cn(
            'inline-flex items-center gap-2 text-sm text-text-muted',
            'transition-colors duration-fast',
            'hover:text-text',
            'focus-visible:outline-none focus-visible:text-text focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md'
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Courses
        </button>
      </nav>

      {/* Course header */}
      <header className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          {/* Course icon */}
          {course.icon && (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-surface text-3xl">
              {course.icon}
            </div>
          )}

          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge className={cn('text-xs', difficultyColors[course.difficulty])}>
                {course.difficulty}
              </Badge>
              {/* Show status badge for non-published content */}
              {course.status && course.status !== 'published' && (
                <ContentStatusBadge status={course.status} showLabel />
              )}
            </div>
            <h1 className="text-2xl font-bold text-text">
              {getLocalizedText(course.title)}
            </h1>
          </div>
        </div>

        <p className="text-text-muted">{getLocalizedText(course.description)}</p>

        {/* Course meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {course.structure.lessonCount} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {course.duration.totalHours} hours
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" aria-hidden="true" />
            {course.structure.moduleCount} modules
          </span>
        </div>
      </header>

      {/* Progress section */}
      <section
        className="rounded-lg border border-border bg-surface p-4"
        aria-label="Course progress"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-text">Your Progress</span>
          <span className="text-sm font-semibold text-primary">{overallProgress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
            role="progressbar"
            aria-valuenow={overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        {overallProgress === 0 && (
          <p className="mt-2 text-xs text-text-muted">
            Start learning to track your progress
          </p>
        )}
      </section>

      {/* Learning objectives (collapsed by default for mobile) */}
      {course.learningObjectives.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">What you will learn</h2>
          <ul className="flex flex-col gap-2">
            {course.learningObjectives.map((objective) => (
              <li
                key={objective.id}
                className="flex items-start gap-2 text-sm text-text-muted"
              >
                <span className="mt-0.5 text-success">&#10003;</span>
                <div className="flex-1">
                  <span>{getLocalizedText(objective.description)}</span>
                  {objective.level && (
                    <BloomLevelBadge
                      level={objective.level}
                      size="sm"
                      className="ml-2"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Prerequisites Section */}
      {course.prerequisites && course.prerequisites.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-text mb-3">Prerequisites</h2>
          <PrerequisiteList
            prerequisites={course.prerequisites}
            completedIds={new Set<string>()} // TODO: Get from user progress
          />
        </section>
      )}

      {/* Modules */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text">Course Content</h2>
        <div className="flex flex-col gap-3">
          {modules.map(({ module, lessons }) => (
            <ModuleAccordion
              key={module.id}
              module={module}
              lessons={lessons}
              courseSlug={courseSlug || ''}
              isExpanded={expandedModuleIds.has(module.id)}
              onToggle={() => toggleModule(module.id)}
              completedLessonIds={completedLessonIds}
            />
          ))}
        </div>
      </section>

      {/* About the Author Section */}
      {course.authors && course.authors.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-text mb-4">About the Author</h2>
          <div className="space-y-4">
            {course.authors.map((author, index) => (
              <AuthorCard
                key={author.email || index}
                author={author}
                variant="full"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
