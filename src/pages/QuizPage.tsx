import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QuizPlayer } from '@/components/quiz';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';
import { loadQuiz, recordQuizAttempt } from '@/lib/content';
import { useAuthStore } from '@/stores/authStore';
import type { Quiz, QuizResult } from '@/types/content';

// Import sample data for demo
import { SAMPLE_QUIZ } from '@/data/sample-course';

/**
 * Error State Component
 */
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-8">
      <div className="mb-4 text-4xl">:(</div>
      <h1 className="mb-2 text-xl font-bold text-text">Failed to Load Quiz</h1>
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
 * QuizPage Component
 *
 * Displays a quiz with the QuizPlayer component.
 *
 * Features:
 * - Loads quiz from Cache API
 * - Records quiz attempts
 * - Score calculation
 * - Navigation back to course
 *
 * URL: /quizzes/:courseSlug/:moduleId/:quizId
 */
export default function QuizPage() {
  const { courseSlug, moduleId, quizId } = useParams<{
    courseSlug: string;
    moduleId: string;
    quizId: string;
  }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load quiz data
  useEffect(() => {
    async function loadData() {
      if (!courseSlug || !moduleId || !quizId) {
        setError('Invalid quiz URL');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Try to load from Cache API
        let loadedQuiz = await loadQuiz(courseSlug, moduleId, quizId);

        // If not found in cache, use sample data for demo
        if (!loadedQuiz && quizId === SAMPLE_QUIZ.id) {
          loadedQuiz = SAMPLE_QUIZ;
        }

        if (!loadedQuiz) {
          setError('Quiz not found. It may not be downloaded yet.');
          setIsLoading(false);
          return;
        }

        setQuiz(loadedQuiz);
      } catch (err) {
        console.error('Failed to load quiz:', err);
        setError('Failed to load quiz content.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [courseSlug, moduleId, quizId]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (courseSlug) {
      navigate(`/courses/${courseSlug}`);
    } else {
      navigate('/courses');
    }
  }, [navigate, courseSlug]);

  // Handle quiz completion
  const handleComplete = useCallback(
    async (result: QuizResult) => {
      if (!quiz || !profile?.userId || !moduleId) return;

      try {
        await recordQuizAttempt(
          profile.userId,
          quiz.courseId,
          moduleId,
          quiz.id,
          result
        );
      } catch (err) {
        console.error('Failed to record quiz attempt:', err);
        // Quiz still completes even if save fails
      }
    },
    [quiz, profile?.userId, moduleId]
  );

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

  // No quiz loaded
  if (!quiz) {
    return <ErrorState message="Quiz data not available." onBack={() => navigate('/courses')} />;
  }

  return (
    <QuizPlayer
      quiz={quiz}
      onBack={handleBack}
      onComplete={handleComplete}
    />
  );
}
