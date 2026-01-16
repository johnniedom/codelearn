'use client';

import * as React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  GripVertical,
  HelpCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type {
  EditorQuizQuestion,
  EditorQuestionType,
  QuestionOption,
} from './types';

// =============================================================================
// Types
// =============================================================================

interface QuestionEditorProps {
  /** The question data to edit */
  question: EditorQuizQuestion;
  /** Callback when question data changes */
  onChange: (question: EditorQuizQuestion) => void;
  /** Callback when delete is requested */
  onDelete: () => void;
  /** Question number for display (1-indexed) */
  questionNumber?: number;
}

interface QuestionTypeOption {
  value: EditorQuestionType;
  label: string;
  description: string;
}

// =============================================================================
// Constants
// =============================================================================

const QUESTION_TYPES: QuestionTypeOption[] = [
  {
    value: 'multiple-choice',
    label: 'Multiple Choice',
    description: 'Four options, one correct answer',
  },
  {
    value: 'true-false',
    label: 'True/False',
    description: 'Binary choice question',
  },
  {
    value: 'fill-blank',
    label: 'Fill in the Blank',
    description: 'Text input answer',
  },
];

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Creates default options for a multiple choice question
 */
function createDefaultOptions(): QuestionOption[] {
  return OPTION_LABELS.map((_, index) => ({
    id: crypto.randomUUID(),
    text: '',
    isCorrect: index === 0, // First option is correct by default
  }));
}

/**
 * Gets a human-readable label for the question type
 */
function getQuestionTypeLabel(type: EditorQuestionType): string {
  const typeOption = QUESTION_TYPES.find((t) => t.value === type);
  return typeOption?.label ?? type;
}

// =============================================================================
// Sub-Components
// =============================================================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

/**
 * Simple textarea component since one doesn't exist in the UI library
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-base',
          'placeholder:text-text-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'resize-y md:text-sm',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

/**
 * Simple native select component
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-base',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'md:text-sm',
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

// =============================================================================
// Multiple Choice Editor
// =============================================================================

interface MultipleChoiceEditorProps {
  options: QuestionOption[];
  onChange: (options: QuestionOption[]) => void;
}

const MultipleChoiceEditor: React.FC<MultipleChoiceEditorProps> = ({
  options,
  onChange,
}) => {
  const handleOptionTextChange = (optionId: string, text: string) => {
    const updated = options.map((opt) =>
      opt.id === optionId ? { ...opt, text } : opt
    );
    onChange(updated);
  };

  const handleCorrectAnswerChange = (optionId: string) => {
    const updated = options.map((opt) => ({
      ...opt,
      isCorrect: opt.id === optionId,
    }));
    onChange(updated);
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-text mb-2">
        Answer Options
      </legend>
      {options.map((option, index) => {
        const label = OPTION_LABELS[index] ?? `Option ${index + 1}`;
        const inputId = `option-${option.id}`;
        const radioId = `radio-${option.id}`;

        return (
          <div key={option.id} className="flex items-start gap-3">
            <div className="flex items-center gap-2 pt-2.5">
              <input
                type="radio"
                id={radioId}
                name={`correct-answer-${options[0]?.id}`}
                checked={option.isCorrect}
                onChange={() => handleCorrectAnswerChange(option.id)}
                className="h-4 w-4 text-primary focus:ring-border-focus focus:ring-2 focus:ring-offset-2"
                aria-label={`Mark option ${label} as correct`}
              />
              <Label
                htmlFor={radioId}
                className="w-6 text-center font-semibold text-text-muted"
              >
                {label}
              </Label>
            </div>
            <div className="flex-1">
              <Label htmlFor={inputId} className="sr-only">
                Option {label} text
              </Label>
              <Input
                id={inputId}
                type="text"
                value={option.text}
                onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                placeholder={`Enter option ${label}...`}
                aria-describedby={option.isCorrect ? 'correct-indicator' : undefined}
              />
            </div>
            {option.isCorrect && (
              <span
                id="correct-indicator"
                className="pt-2.5 text-xs font-medium text-success whitespace-nowrap"
                aria-live="polite"
              >
                Correct
              </span>
            )}
          </div>
        );
      })}
      <p className="text-xs text-text-muted mt-2">
        Select the radio button next to the correct answer.
      </p>
    </fieldset>
  );
};

// =============================================================================
// True/False Editor
// =============================================================================

interface TrueFalseEditorProps {
  correctAnswer: string;
  onChange: (answer: string) => void;
}

const TrueFalseEditor: React.FC<TrueFalseEditorProps> = ({
  correctAnswer,
  onChange,
}) => {
  const isTrue = correctAnswer === 'true';

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-text mb-2">
        Correct Answer
      </legend>
      <div className="flex gap-4" role="radiogroup" aria-label="Select correct answer">
        <label
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-md border cursor-pointer transition-colors',
            isTrue
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-border hover:bg-surface'
          )}
        >
          <input
            type="radio"
            name="true-false-answer"
            value="true"
            checked={isTrue}
            onChange={() => onChange('true')}
            className="h-4 w-4 text-primary focus:ring-border-focus focus:ring-2 focus:ring-offset-2"
          />
          <span className="font-medium">True</span>
        </label>
        <label
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-md border cursor-pointer transition-colors',
            !isTrue
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-border hover:bg-surface'
          )}
        >
          <input
            type="radio"
            name="true-false-answer"
            value="false"
            checked={!isTrue}
            onChange={() => onChange('false')}
            className="h-4 w-4 text-primary focus:ring-border-focus focus:ring-2 focus:ring-offset-2"
          />
          <span className="font-medium">False</span>
        </label>
      </div>
    </fieldset>
  );
};

// =============================================================================
// Fill in the Blank Editor
// =============================================================================

interface FillBlankEditorProps {
  correctAnswer: string;
  onChange: (answer: string) => void;
}

const FillBlankEditor: React.FC<FillBlankEditorProps> = ({
  correctAnswer,
  onChange,
}) => {
  const answerId = React.useId();

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-3 bg-surface rounded-md border border-border">
        <HelpCircle className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
        <p className="text-sm text-text-muted">
          Use <code className="px-1 py-0.5 bg-background rounded text-xs font-mono">[BLANK]</code> in
          your question text to indicate where the blank should appear.
          For example: &quot;The capital of France is [BLANK].&quot;
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={answerId}>Expected Answer</Label>
        <Input
          id={answerId}
          type="text"
          value={correctAnswer}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter the correct answer..."
        />
        <p className="text-xs text-text-muted">
          This is the answer that learners must type to complete the blank.
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  onChange,
  onDelete,
  questionNumber = 1,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const questionTextId = React.useId();
  const typeSelectId = React.useId();
  const hintId = React.useId();
  const explanationId = React.useId();
  const pointsId = React.useId();

  // Handle question type change with data transformation
  const handleTypeChange = (newType: EditorQuestionType) => {
    if (newType === question.type) return;

    const updatedQuestion: EditorQuizQuestion = {
      ...question,
      type: newType,
      // Reset type-specific fields
      options: newType === 'multiple-choice' ? createDefaultOptions() : [],
      correctAnswer: newType === 'true-false' ? 'true' : '',
    };

    onChange(updatedQuestion);
  };

  // Handle question text change
  const handleTextChange = (text: string) => {
    onChange({ ...question, text });
  };

  // Handle options change (multiple choice)
  const handleOptionsChange = (options: QuestionOption[]) => {
    onChange({ ...question, options });
  };

  // Handle correct answer change (true-false or fill-blank)
  const handleCorrectAnswerChange = (correctAnswer: string) => {
    onChange({ ...question, correctAnswer });
  };

  // Handle hint change
  const handleHintChange = (hint: string) => {
    onChange({ ...question, hint: hint || undefined });
  };

  // Handle explanation change
  const handleExplanationChange = (explanation: string) => {
    onChange({ ...question, explanation: explanation || undefined });
  };

  // Handle points change
  const handlePointsChange = (points: number) => {
    onChange({ ...question, points: Math.max(1, points) });
  };

  return (
    <Card className="relative group">
      {/* Drag handle indicator - hidden on mobile */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 bg-transparent group-hover:bg-border/50 rounded-l-lg transition-colors cursor-grab hidden sm:block"
        aria-hidden="true"
      >
        <GripVertical className="absolute top-1/2 -translate-y-1/2 -left-1 h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <CardHeader className="pb-3 p-3 sm:p-6 sm:pb-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
            <CardTitle className="text-sm sm:text-base shrink-0">
              Q{questionNumber}
            </CardTitle>
            <span className="px-2 py-0.5 text-xs font-medium bg-surface rounded-full text-text-muted hidden sm:inline">
              {getQuestionTypeLabel(question.type)}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls={`question-content-${question.id}`}
              className="h-10 w-10 sm:h-8 sm:w-auto sm:px-3"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-1">Collapse</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-1">Expand</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-error hover:text-error hover:bg-error/10 h-10 w-10 sm:h-8 sm:w-auto sm:px-3"
              aria-label={`Delete question ${questionNumber}`}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Delete</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent
          id={`question-content-${question.id}`}
          className="space-y-4 sm:space-y-6 pt-0 p-3 sm:p-6 sm:pt-0"
        >
          {/* Question Type Selector */}
          <div className="space-y-2">
            <Label htmlFor={typeSelectId}>Question Type</Label>
            <Select
              id={typeSelectId}
              value={question.type}
              onChange={(e) => handleTypeChange(e.target.value as EditorQuestionType)}
            >
              {QUESTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor={questionTextId}>Question Text</Label>
            <Textarea
              id={questionTextId}
              value={question.text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={
                question.type === 'fill-blank'
                  ? 'Enter question with [BLANK] placeholder...'
                  : 'Enter your question...'
              }
              rows={3}
            />
          </div>

          {/* Type-Specific Editor */}
          {question.type === 'multiple-choice' && (
            <MultipleChoiceEditor
              options={question.options}
              onChange={handleOptionsChange}
            />
          )}

          {question.type === 'true-false' && (
            <TrueFalseEditor
              correctAnswer={question.correctAnswer}
              onChange={handleCorrectAnswerChange}
            />
          )}

          {question.type === 'fill-blank' && (
            <FillBlankEditor
              correctAnswer={question.correctAnswer}
              onChange={handleCorrectAnswerChange}
            />
          )}

          {/* Additional Fields */}
          <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-border">
            {/* Points */}
            <div className="space-y-2">
              <Label htmlFor={pointsId}>Points</Label>
              <Input
                id={pointsId}
                type="number"
                min={1}
                value={question.points}
                onChange={(e) => handlePointsChange(parseInt(e.target.value, 10) || 1)}
              />
            </div>

            {/* Hint */}
            <div className="space-y-2">
              <Label htmlFor={hintId}>Hint (optional)</Label>
              <Input
                id={hintId}
                type="text"
                value={question.hint ?? ''}
                onChange={(e) => handleHintChange(e.target.value)}
                placeholder="Provide a hint for learners..."
              />
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label htmlFor={explanationId}>Explanation (optional)</Label>
            <Textarea
              id={explanationId}
              value={question.explanation ?? ''}
              onChange={(e) => handleExplanationChange(e.target.value)}
              placeholder="Explain the correct answer..."
              rows={2}
            />
            <p className="text-xs text-text-muted">
              This explanation is shown to learners after they answer the question.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export type { QuestionEditorProps };
