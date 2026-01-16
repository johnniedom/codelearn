import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import type { MultipleChoiceQuestion } from '@/types/content';
import { getLocalizedText } from '@/types/content';

/**
 * MCQQuestion Props
 */
export interface MCQQuestionProps {
  /** The question data */
  question: MultipleChoiceQuestion;
  /** Currently selected option ID */
  selectedOptionId?: string;
  /** Called when an option is selected */
  onSelect?: (optionId: string) => void;
  /** Whether the answer has been submitted (show feedback) */
  isSubmitted?: boolean;
  /** Whether to show the correct answer */
  showCorrectAnswer?: boolean;
  /** Current locale for translations */
  locale?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get option state for styling
 */
function getOptionState(
  optionId: string,
  selectedId: string | undefined,
  isSubmitted: boolean,
  isCorrect: boolean,
  showCorrectAnswer: boolean
): 'default' | 'selected' | 'correct' | 'incorrect' {
  if (!isSubmitted) {
    return selectedId === optionId ? 'selected' : 'default';
  }

  // After submission
  if (showCorrectAnswer && isCorrect) {
    return 'correct';
  }
  if (selectedId === optionId) {
    return isCorrect ? 'correct' : 'incorrect';
  }
  return 'default';
}

/**
 * Quiz Option Component
 *
 * Individual option within a multiple choice question.
 */
function QuizOption({
  text,
  state,
  isSelected,
  disabled,
  onSelect,
  index,
}: {
  text: string;
  state: 'default' | 'selected' | 'correct' | 'incorrect';
  isSelected: boolean;
  disabled: boolean;
  onSelect: () => void;
  index: number;
}) {
  const stateStyles = {
    default: 'border-border bg-surface hover:border-border-focus',
    selected: 'border-primary bg-primary/5',
    correct: 'border-success bg-success/10',
    incorrect: 'border-error bg-error/10',
  };

  const optionLabel = String.fromCharCode(65 + index); // A, B, C, D...

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        // Base styles
        'group flex w-full items-center gap-3 rounded-lg border p-3 text-left',
        // Minimum touch target
        'min-h-[48px]',
        // Transitions
        'transition-all duration-fast',
        // State-specific styles
        stateStyles[state],
        // Interactive states
        !disabled && 'cursor-pointer',
        disabled && 'cursor-not-allowed opacity-70',
        // Focus states
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
    >
      {/* Option letter indicator */}
      <div
        className={cn(
          'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-sm font-medium',
          state === 'default' && 'border-border text-text-muted',
          state === 'selected' && 'border-primary bg-primary text-white',
          state === 'correct' && 'border-success bg-success text-white',
          state === 'incorrect' && 'border-error bg-error text-white'
        )}
      >
        {state === 'correct' ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : state === 'incorrect' ? (
          <X className="h-4 w-4" aria-hidden="true" />
        ) : (
          optionLabel
        )}
      </div>

      {/* Option text */}
      <span className="flex-1 text-sm text-text">{text}</span>
    </button>
  );
}

/**
 * MCQQuestion Component
 *
 * Multiple choice question with single correct answer.
 *
 * Accessibility:
 * - Uses role="radiogroup" for the option group
 * - Each option has role="radio" with aria-checked
 * - Keyboard navigation support
 * - Feedback announced to screen readers
 *
 * - QuizView: role="radiogroup", role="radio", aria-checked
 */
export function MCQQuestion({
  question,
  selectedOptionId,
  onSelect,
  isSubmitted = false,
  showCorrectAnswer = false,
  locale,
  className,
}: MCQQuestionProps) {
  const questionText = getLocalizedText(question.question, locale);
  const correctOption = question.options.find((opt) => opt.correct);
  const selectedOption = question.options.find((opt) => opt.id === selectedOptionId);
  const isCorrect = selectedOption?.correct ?? false;

  // Get feedback for selected option
  const feedback =
    isSubmitted && selectedOption?.feedback
      ? getLocalizedText(selectedOption.feedback, locale)
      : null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Question text */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-base font-medium text-text">{questionText}</p>

        {/* Question image if present */}
        {question.image && (
          <img
            src={question.image.path}
            alt={getLocalizedText(question.image.altText, locale) || 'Question image'}
            className="mt-3 h-auto max-w-full rounded-lg"
          />
        )}
      </div>

      {/* Options */}
      <div
        role="radiogroup"
        aria-label={questionText}
        className="flex flex-col gap-2"
      >
        {question.options.map((option, index) => (
          <QuizOption
            key={option.id}
            text={getLocalizedText(option.text, locale)}
            state={getOptionState(
              option.id,
              selectedOptionId,
              isSubmitted,
              option.correct,
              showCorrectAnswer
            )}
            isSelected={selectedOptionId === option.id}
            disabled={isSubmitted}
            onSelect={() => onSelect?.(option.id)}
            index={index}
          />
        ))}
      </div>

      {/* Feedback box */}
      {isSubmitted && (
        <div
          role="alert"
          className={cn(
            'rounded-lg border p-3',
            isCorrect
              ? 'border-success bg-success/10 text-success'
              : 'border-error bg-error/10 text-error'
          )}
        >
          <p className="text-sm font-medium">
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </p>

          {/* Option-specific feedback */}
          {feedback && (
            <p className="mt-1 text-sm text-text">{feedback}</p>
          )}

          {/* Show correct answer if wrong and allowed */}
          {!isCorrect && showCorrectAnswer && correctOption && (
            <p className="mt-1 text-sm text-text">
              The correct answer is:{' '}
              <strong>{getLocalizedText(correctOption.text, locale)}</strong>
            </p>
          )}

          {/* Explanation if available */}
          {question.explanation && (
            <p className="mt-2 text-sm text-text">
              {getLocalizedText(question.explanation, locale)}
            </p>
          )}
        </div>
      )}

      {/* Hint (shown before submission) */}
      {!isSubmitted && question.hint && (
        <details className="text-sm text-text-muted">
          <summary className="cursor-pointer">Need a hint?</summary>
          <p className="mt-2 pl-4">{getLocalizedText(question.hint, locale)}</p>
        </details>
      )}
    </div>
  );
}

export default MCQQuestion;
