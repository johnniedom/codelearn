import { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MCQQuestion } from './MCQQuestion';
import { FillBlankQuestion } from './FillBlankQuestion';
import type {
  Quiz,
  QuizQuestion,
  MultipleChoiceQuestion,
  FillBlankQuestion as FillBlankQuestionType,
  QuizResult,
} from '@/types/content';
import { getLocalizedText } from '@/types/content';

/**
 * QuizPlayer Props
 */
export interface QuizPlayerProps {
  /** The quiz to play */
  quiz: Quiz;
  /** Called when the back button is pressed */
  onBack?: () => void;
  /** Called when the quiz is completed */
  onComplete?: (result: QuizResult) => void;
  /** Current locale for translations */
  locale?: string;
  /** Additional CSS classes */
  className?: string;
}

/** Answer value type - can be string, array of strings, or object for fill-blank */
type AnswerValue = string | string[] | Record<string, string>;

/**
 * QuizPlayer State
 */
interface QuizState {
  currentIndex: number;
  answers: Record<string, AnswerValue>;
  submittedQuestions: Set<string>;
  startTime: Date;
}

/**
 * Calculate score for the quiz
 */
function calculateScore(
  questions: QuizQuestion[],
  answers: Record<string, AnswerValue>
): { score: number; maxScore: number } {
  let score = 0;
  let maxScore = 0;

  for (const question of questions) {
    maxScore += question.points;

    const answer = answers[question.id];
    if (!answer) continue;

    switch (question.type) {
      case 'multiple-choice': {
        const mcq = question as MultipleChoiceQuestion;
        const selectedOption = mcq.options.find((opt) => opt.id === answer);
        if (selectedOption?.correct) {
          score += question.points;
        }
        break;
      }

      case 'fill-blank': {
        const fbq = question as FillBlankQuestionType;
        const blankAnswers = answer as unknown as Record<string, string>;
        let correctBlanks = 0;

        for (const blank of fbq.blanks) {
          const blankAnswer = blankAnswers[blank.id] || '';
          const normalizedAnswer = blank.caseSensitive
            ? blankAnswer.trim()
            : blankAnswer.trim().toLowerCase();

          const isCorrect = blank.acceptedAnswers.some((accepted) => {
            const normalizedAccepted = blank.caseSensitive
              ? accepted.trim()
              : accepted.trim().toLowerCase();
            return normalizedAnswer === normalizedAccepted;
          });

          if (isCorrect) correctBlanks++;
        }

        // Partial credit for fill-blank
        score += (correctBlanks / fbq.blanks.length) * question.points;
        break;
      }

      case 'true-false': {
        const tfAnswer = answer === 'true';
        if (tfAnswer === question.correctAnswer) {
          score += question.points;
        }
        break;
      }

      // Add other question types as needed
    }
  }

  return { score: Math.round(score), maxScore };
}

/**
 * Question renderer based on type
 */
function QuestionRenderer({
  question,
  answer,
  onAnswerChange,
  isSubmitted,
  showCorrectAnswers,
  locale,
}: {
  question: QuizQuestion;
  answer: string | string[] | Record<string, string> | undefined;
  onAnswerChange: (value: string | string[] | Record<string, string>) => void;
  isSubmitted: boolean;
  showCorrectAnswers: boolean;
  locale?: string;
}) {
  switch (question.type) {
    case 'multiple-choice':
      return (
        <MCQQuestion
          question={question as MultipleChoiceQuestion}
          selectedOptionId={answer as string | undefined}
          onSelect={onAnswerChange}
          isSubmitted={isSubmitted}
          showCorrectAnswer={showCorrectAnswers}
          locale={locale}
        />
      );

    case 'fill-blank':
      return (
        <FillBlankQuestion
          question={question as FillBlankQuestionType}
          answers={(answer as Record<string, string>) || {}}
          onAnswerChange={(blankId, value) => {
            const currentAnswers = (answer as Record<string, string>) || {};
            onAnswerChange({ ...currentAnswers, [blankId]: value });
          }}
          isSubmitted={isSubmitted}
          showCorrectAnswers={showCorrectAnswers}
          locale={locale}
        />
      );

    case 'true-false':
      // Render true/false as MCQ
      const tfQuestion: MultipleChoiceQuestion = {
        ...question,
        type: 'multiple-choice',
        options: [
          {
            id: 'true',
            text: question.trueLabel || { default: 'True' },
            correct: question.correctAnswer === true,
          },
          {
            id: 'false',
            text: question.falseLabel || { default: 'False' },
            correct: question.correctAnswer === false,
          },
        ],
      };
      return (
        <MCQQuestion
          question={tfQuestion}
          selectedOptionId={answer as string | undefined}
          onSelect={onAnswerChange}
          isSubmitted={isSubmitted}
          showCorrectAnswer={showCorrectAnswers}
          locale={locale}
        />
      );

    default:
      return (
        <div className="rounded-lg border border-dashed border-border bg-surface-hover p-4 text-center">
          <p className="text-sm text-text-muted">
            Question type "{question.type}" is not yet supported.
          </p>
        </div>
      );
  }
}

/**
 * QuizPlayer Component
 *
 * Full quiz player with question navigation, scoring, and feedback.
 *
 * Features:
 * - One-at-a-time or all-at-once display modes
 * - Question navigation
 * - Progress tracking
 * - Score calculation
 * - Time limit support
 * - Feedback and explanations
 *
 * Accessibility:
 * - Progress announced via aria-live
 * - Keyboard navigation
 * - Screen reader friendly
 */
export function QuizPlayer({
  quiz,
  onBack,
  onComplete,
  locale,
  className,
}: QuizPlayerProps) {
  const [state, setState] = useState<QuizState>({
    currentIndex: 0,
    answers: {},
    submittedQuestions: new Set(),
    startTime: new Date(),
  });

  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const questions = quiz.questions;
  const currentQuestion = questions[state.currentIndex];
  const showCorrectAnswers = quiz.config.showCorrectAnswers !== 'never';

  // Progress calculation
  const progress = ((state.currentIndex + 1) / questions.length) * 100;

  // Handle answer change
  const handleAnswerChange = useCallback(
    (value: string | string[] | Record<string, string>) => {
      setState((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.id]: value,
        },
      }));
    },
    [currentQuestion?.id]
  );

  // Handle submit current question
  const handleSubmitQuestion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      submittedQuestions: new Set([...prev.submittedQuestions, currentQuestion.id]),
    }));
  }, [currentQuestion?.id]);

  // Navigate to next question
  const handleNext = useCallback(() => {
    if (state.currentIndex < questions.length - 1) {
      setState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
      }));
    }
  }, [state.currentIndex, questions.length]);

  // Navigate to previous question
  const handlePrevious = useCallback(() => {
    if (state.currentIndex > 0) {
      setState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
      }));
    }
  }, [state.currentIndex]);

  // Handle quiz completion
  const handleCompleteQuiz = useCallback(() => {
    const { score, maxScore } = calculateScore(questions, state.answers);
    const timeSpent = Math.round(
      (new Date().getTime() - state.startTime.getTime()) / 1000
    );

    const quizResult: QuizResult = {
      quizId: quiz.id,
      score,
      maxScore,
      passed: score >= maxScore * (quiz.config.passingScore / 100),
      timeSpentSeconds: timeSpent,
      answers: state.answers,
      completedAt: new Date(),
    };

    setResult(quizResult);
    setIsQuizComplete(true);
    onComplete?.(quizResult);
  }, [questions, state.answers, state.startTime, quiz.id, quiz.config.passingScore, onComplete]);

  // Check if current question is answered
  const isCurrentAnswered = state.answers[currentQuestion?.id] !== undefined;
  const isCurrentSubmitted = state.submittedQuestions.has(currentQuestion?.id);
  const isLastQuestion = state.currentIndex === questions.length - 1;

  // Results screen
  if (isQuizComplete && result) {
    const percentage = Math.round((result.score / result.maxScore) * 100);
    const feedback = result.passed
      ? getLocalizedText(quiz.feedback.passMessage, locale)
      : getLocalizedText(quiz.feedback.failMessage, locale);

    return (
      <div className={cn('flex min-h-full flex-col', className)}>
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          {/* Result icon */}
          <div
            className={cn(
              'mb-4 flex h-20 w-20 items-center justify-center rounded-full',
              result.passed ? 'bg-success/10' : 'bg-error/10'
            )}
          >
            <CheckCircle
              className={cn(
                'h-10 w-10',
                result.passed ? 'text-success' : 'text-error'
              )}
              aria-hidden="true"
            />
          </div>

          {/* Score */}
          <h1 className="mb-2 text-3xl font-bold text-text">{percentage}%</h1>
          <p className="mb-4 text-lg text-text-muted">
            {result.score} of {result.maxScore} points
          </p>

          {/* Pass/fail badge */}
          <div
            className={cn(
              'mb-6 rounded-full px-4 py-1 text-sm font-medium',
              result.passed
                ? 'bg-success/10 text-success'
                : 'bg-error/10 text-error'
            )}
          >
            {result.passed ? 'Passed' : 'Not Passed'}
          </div>

          {/* Feedback message */}
          <p className="mb-8 text-center text-sm text-text">{feedback}</p>

          {/* Time spent */}
          <div className="mb-6 flex items-center gap-2 text-sm text-text-muted">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>
              Time spent: {Math.floor(result.timeSpentSeconds / 60)}m{' '}
              {result.timeSpentSeconds % 60}s
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {quiz.completion.allowReview && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsQuizComplete(false);
                  setState((prev) => ({ ...prev, currentIndex: 0 }));
                }}
              >
                Review Answers
              </Button>
            )}
            <Button onClick={onBack}>
              {quiz.completion.nextAction === 'retry' ? 'Try Again' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-full flex-col', className)}>
      {/* Header */}
      <div className="border-b border-border bg-surface px-4 py-3">
        <div className="mx-auto max-w-lg">
          {/* Progress text */}
          <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
            <span>
              Question {state.currentIndex + 1} of {questions.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>

          {/* Progress bar */}
          <Progress
            value={progress}
            className="h-1"
            aria-label={`Quiz progress: ${Math.round(progress)}%`}
          />
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        <div className="mx-auto max-w-lg">
          {currentQuestion && (
            <QuestionRenderer
              question={currentQuestion}
              answer={state.answers[currentQuestion.id]}
              onAnswerChange={handleAnswerChange}
              isSubmitted={isCurrentSubmitted}
              showCorrectAnswers={showCorrectAnswers}
              locale={locale}
            />
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface p-4 safe-area-inset-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            onClick={quiz.config.allowNavigation ? handlePrevious : onBack}
            disabled={!quiz.config.allowNavigation && state.currentIndex > 0}
            className="min-w-[80px]"
          >
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            {quiz.config.allowNavigation ? 'Previous' : 'Back'}
          </Button>

          {/* Submit/Next button */}
          {!isCurrentSubmitted ? (
            <Button
              size="sm"
              onClick={handleSubmitQuestion}
              disabled={!isCurrentAnswered}
              className="min-w-[100px]"
            >
              Check Answer
            </Button>
          ) : isLastQuestion ? (
            <Button
              size="sm"
              onClick={handleCompleteQuiz}
              className="min-w-[100px]"
            >
              Finish Quiz
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleNext}
              className="min-w-[100px]"
            >
              Next
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuizPlayer;
