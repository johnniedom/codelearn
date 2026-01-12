import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LessonViewer } from '@/components/content';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';
import { loadLesson, getAssetUrl, recordLessonCompletion, getCompletedLessonIds } from '@/lib/content';
import { useAuthStore } from '@/stores/authStore';
import type { Lesson } from '@/types/content';

// Import sample data for demo
import {
  SAMPLE_LESSON,
  SAMPLE_LESSON_2,
  SAMPLE_LESSON_3,
  SAMPLE_COURSE_SLUG,
} from '@/data/sample-course';

/**
 * Get sample lesson by ID
 * Returns the matching sample lesson or null if not found
 */
function getSampleLesson(lessonId: string) {
  switch (lessonId) {
    case 'les-001':
      return SAMPLE_LESSON;
    case 'les-002':
      return SAMPLE_LESSON_2;
    case 'les-003':
      return SAMPLE_LESSON_3;
    default:
      return null;
  }
}

/**
 * Error State Component
 */
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-8">
      <div className="mb-4 text-4xl">:(</div>
      <h1 className="mb-2 text-xl font-bold text-text">Failed to Load Lesson</h1>
      <p className="mb-6 text-center text-sm text-text-muted">{message}</p>
      <button
        type="button"
        onClick={onBack}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
      >
        Go Back
      </button>
    </div>
  );
}

/**
 * LessonPage Component
 *
 * Displays a single lesson with content viewer.
 *
 * Features:
 * - Loads lesson from Cache API
 * - Tracks lesson completion
 * - Navigation between lessons
 * - Progress persistence
 *
 * URL: /lessons/:courseSlug/:moduleId/:lessonId
 */
export default function LessonPage() {
  const { courseSlug, moduleId, lessonId } = useParams<{
    courseSlug: string;
    moduleId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  // Load lesson data
  useEffect(() => {
    async function loadData() {
      if (!courseSlug || !moduleId || !lessonId) {
        setError('Invalid lesson URL');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Try to load from Cache API
        let loadedLesson = await loadLesson(courseSlug, moduleId, lessonId);

        // If not found in cache, use sample data for demo
        if (!loadedLesson) {
          loadedLesson = getSampleLesson(lessonId);
        }

        if (!loadedLesson) {
          setError('Lesson not found. It may not be downloaded yet.');
          setIsLoading(false);
          return;
        }

        setLesson(loadedLesson);

        // Check if already completed
        if (profile?.userId) {
          const completedIds = await getCompletedLessonIds(
            profile.userId,
            loadedLesson.courseId
          );
          setIsCompleted(completedIds.has(lessonId));
        }
      } catch (err) {
        console.error('Failed to load lesson:', err);
        setError('Failed to load lesson content.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [courseSlug, moduleId, lessonId, profile?.userId]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (lesson?.navigation.previousLessonId && moduleId && courseSlug) {
      navigate(`/lessons/${courseSlug}/${moduleId}/${lesson.navigation.previousLessonId}`);
    } else if (courseSlug) {
      navigate(`/courses/${courseSlug}`);
    } else {
      navigate('/courses');
    }
  }, [lesson, navigate, moduleId, courseSlug]);

  // Handle next navigation
  const handleNext = useCallback(() => {
    if (lesson?.navigation.nextLessonId && moduleId && courseSlug) {
      navigate(`/lessons/${courseSlug}/${moduleId}/${lesson.navigation.nextLessonId}`);
    } else if (courseSlug) {
      navigate(`/courses/${courseSlug}`);
    }
  }, [lesson, navigate, moduleId, courseSlug]);

  // Handle lesson completion
  const handleComplete = useCallback(async () => {
    if (!lesson || !profile?.userId) return;

    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);

    try {
      await recordLessonCompletion(
        profile.userId,
        lesson.courseId,
        lesson.moduleId,
        lesson.id,
        timeSpentSeconds
      );
      setIsCompleted(true);
    } catch (err) {
      console.error('Failed to record completion:', err);
      // Still mark as completed in UI even if save fails
      setIsCompleted(true);
    }
  }, [lesson, profile?.userId, startTime]);

  // Loading state
  if (isLoading) {
    return (
      <div className="py-4">
        <PageSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return <ErrorState message={error} onBack={() => navigate('/courses')} />;
  }

  // No lesson loaded
  if (!lesson) {
    return <ErrorState message="Lesson data not available." onBack={() => navigate('/courses')} />;
  }

  // Asset base URL for the package
  const assetBaseUrl = getAssetUrl(courseSlug || SAMPLE_COURSE_SLUG, '');

  return (
    <LessonViewer
      lesson={lesson}
      assetBaseUrl={assetBaseUrl}
      isCompleted={isCompleted}
      onBack={handleBack}
      onNext={lesson.navigation.nextLessonId ? handleNext : undefined}
      onComplete={handleComplete}
    />
  );
}
