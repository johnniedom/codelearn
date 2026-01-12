import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { FillBlankQuestion as FillBlankQuestionType } from '@/types/content';
import { getLocalizedText } from '@/types/content';

/**
 * FillBlankQuestion Props
 */
export interface FillBlankQuestionProps {
  /** The question data */
  question: FillBlankQuestionType;
  /** Current answers keyed by blank ID */
  answers?: Record<string, string>;
  /** Called when an answer changes */
  onAnswerChange?: (blankId: string, value: string) => void;
  /** Whether the answer has been submitted (show feedback) */
  isSubmitted?: boolean;
  /** Whether to show the correct answers */
  showCorrectAnswers?: boolean;
  /** Current locale for translations */
  locale?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Check if an answer is correct for a blank
 */
function isAnswerCorrect(
  answer: string,
  blank: { acceptedAnswers: string[]; caseSensitive: boolean; allowPartial: boolean }
): boolean {
  if (!answer.trim()) return false;

  const normalizedAnswer = blank.caseSensitive ? answer.trim() : answer.trim().toLowerCase();

  return blank.acceptedAnswers.some((accepted) => {
    const normalizedAccepted = blank.caseSensitive
      ? accepted.trim()
      : accepted.trim().toLowerCase();

    if (blank.allowPartial) {
      return normalizedAnswer.includes(normalizedAccepted) ||
        normalizedAccepted.includes(normalizedAnswer);
    }
    return normalizedAnswer === normalizedAccepted;
  });
}

/**
 * Blank Input Component
 */
function BlankInput({
  blank,
  value,
  onChange,
  isSubmitted,
  showCorrectAnswer,
  index,
}: {
  blank: {
    id: string;
    acceptedAnswers: string[];
    caseSensitive: boolean;
    allowPartial: boolean;
    placeholder?: string;
  };
  value: string;
  onChange: (value: string) => void;
  isSubmitted: boolean;
  showCorrectAnswer: boolean;
  index: number;
}) {
  const isCorrect = isAnswerCorrect(value, blank);
  const correctAnswer = blank.acceptedAnswers[0];

  let state: 'default' | 'correct' | 'incorrect' = 'default';
  if (isSubmitted) {
    state = isCorrect ? 'correct' : 'incorrect';
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-xs text-text-muted">({index})</span>
      <span className="relative inline-flex items-center">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isSubmitted}
          placeholder={blank.placeholder || '...'}
          className={cn(
            'inline-block h-8 w-32 px-2 text-sm',
            state === 'correct' && 'border-success bg-success/10',
            state === 'incorrect' && 'border-error bg-error/10'
          )}
          aria-label={`Blank ${index}`}
        />

        {/* Status icon */}
        {isSubmitted && (
          <span
            className={cn(
              'ml-1',
              state === 'correct' ? 'text-success' : 'text-error'
            )}
          >
            {state === 'correct' ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <X className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
        )}
      </span>

      {/* Show correct answer if wrong */}
      {isSubmitted && !isCorrect && showCorrectAnswer && (
        <span className="ml-1 text-xs text-success">
          ({correctAnswer})
        </span>
      )}
    </span>
  );
}

/**
 * FillBlankQuestion Component
 *
 * Fill in the blank question with text inputs.
 *
 * The question text uses {{blank_id}} markers that are replaced with input fields.
 *
 * Accessibility:
 * - Each input has an aria-label
 * - Feedback is announced via role="alert"
 * - Keyboard navigation support
 */
export function FillBlankQuestion({
  question,
  answers = {},
  onAnswerChange,
  isSubmitted = false,
  showCorrectAnswers = false,
  locale,
  className,
}: FillBlankQuestionProps) {
  const questionText = getLocalizedText(question.question, locale);
  const questionWithBlanks = getLocalizedText(question.questionWithBlanks, locale);

  // Track all correct status
  const allCorrect = question.blanks.every((blank) =>
    isAnswerCorrect(answers[blank.id] || '', blank)
  );

  // Count correct blanks
  const correctCount = question.blanks.filter((blank) =>
    isAnswerCorrect(answers[blank.id] || '', blank)
  ).length;

  // Parse the question text and replace blanks with inputs
  const renderQuestionWithBlanks = useCallback(() => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let blankIndex = 0;

    // Find all {{blank_id}} patterns
    const regex = /\{\{(\w+)\}\}/g;
    let match;

    while ((match = regex.exec(questionWithBlanks)) !== null) {
      // Add text before the blank
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {questionWithBlanks.slice(lastIndex, match.index)}
          </span>
        );
      }

      // Find the blank configuration
      const blankId = match[1];
      const blank = question.blanks.find((b) => b.id === blankId);

      if (blank) {
        blankIndex++;
        parts.push(
          <BlankInput
            key={`blank-${blankId}`}
            blank={blank}
            value={answers[blankId] || ''}
            onChange={(value) => onAnswerChange?.(blankId, value)}
            isSubmitted={isSubmitted}
            showCorrectAnswer={showCorrectAnswers}
            index={blankIndex}
          />
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < questionWithBlanks.length) {
      parts.push(
        <span key={`text-end`}>
          {questionWithBlanks.slice(lastIndex)}
        </span>
      );
    }

    return parts;
  }, [questionWithBlanks, question.blanks, answers, onAnswerChange, isSubmitted, showCorrectAnswers]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Question prompt */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-base font-medium text-text">{questionText}</p>
      </div>

      {/* Question with blanks */}
      <div className="rounded-lg border border-border bg-surface-hover p-4">
        <p className="text-sm leading-loose text-text">
          {renderQuestionWithBlanks()}
        </p>
      </div>

      {/* Feedback box */}
      {isSubmitted && (
        <div
          role="alert"
          className={cn(
            'rounded-lg border p-3',
            allCorrect
              ? 'border-success bg-success/10 text-success'
              : 'border-warning bg-warning/10 text-warning'
          )}
        >
          <p className="text-sm font-medium">
            {allCorrect
              ? 'All answers correct!'
              : `${correctCount} of ${question.blanks.length} correct`}
          </p>

          {/* Explanation if available */}
          {question.explanation && (
            <p className="mt-2 text-sm text-text">
              {getLocalizedText(question.explanation, locale)}
            </p>
          )}
        </div>
      )}

      {/* Hint */}
      {!isSubmitted && question.hint && (
        <details className="text-sm text-text-muted">
          <summary className="cursor-pointer">Need a hint?</summary>
          <p className="mt-2 pl-4">{getLocalizedText(question.hint, locale)}</p>
        </details>
      )}
    </div>
  );
}

export default FillBlankQuestion;
