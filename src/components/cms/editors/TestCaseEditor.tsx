'use client';

import * as React from 'react';
import { Trash2, Eye, EyeOff, FlaskConical } from 'lucide-react';

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

import type { EditorTestCase } from './types';

// =============================================================================
// Types
// =============================================================================

interface TestCaseEditorProps {
  /** The test case data to edit */
  testCase: EditorTestCase;
  /** Callback when test case data changes */
  onChange: (testCase: EditorTestCase) => void;
  /** Callback when delete is requested */
  onDelete: () => void;
  /** Test case index for display (0-indexed, will be displayed as 1-indexed) */
  index: number;
}

// =============================================================================
// Sub-Components
// =============================================================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

/**
 * Simple textarea component for code input/output
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-base font-mono',
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

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

/**
 * Simple checkbox with label component
 */
const Checkbox: React.FC<CheckboxProps> = ({
  id,
  label,
  description,
  className,
  ...props
}) => {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-start gap-3 cursor-pointer select-none',
        className
      )}
    >
      <input
        type="checkbox"
        id={id}
        className={cn(
          'mt-0.5 h-4 w-4 rounded border-border text-primary',
          'focus:ring-border-focus focus:ring-2 focus:ring-offset-2 focus:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
        {...props}
      />
      <div className="space-y-0.5">
        <span className="text-sm font-medium leading-none">{label}</span>
        {description && (
          <p className="text-xs text-text-muted">{description}</p>
        )}
      </div>
    </label>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const TestCaseEditor: React.FC<TestCaseEditorProps> = ({
  testCase,
  onChange,
  onDelete,
  index,
}) => {
  // Generate stable IDs for form elements
  const nameId = React.useId();
  const inputId = React.useId();
  const outputId = React.useId();
  const hiddenId = React.useId();

  // Display number is 1-indexed
  const displayNumber = index + 1;

  // Handle field changes
  const handleNameChange = (name: string) => {
    onChange({ ...testCase, name });
  };

  const handleInputChange = (input: string) => {
    onChange({ ...testCase, input });
  };

  const handleOutputChange = (expectedOutput: string) => {
    onChange({ ...testCase, expectedOutput });
  };

  const handleHiddenChange = (isHidden: boolean) => {
    onChange({ ...testCase, isHidden });
  };

  return (
    <Card
      className={cn(
        'relative transition-colors',
        testCase.isHidden && 'border-dashed border-text-muted/50'
      )}
    >
      <CardHeader className="pb-3 p-3 sm:p-6 sm:pb-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <FlaskConical
              className={cn(
                'h-5 w-5 shrink-0',
                testCase.isHidden ? 'text-text-muted' : 'text-primary'
              )}
              aria-hidden="true"
            />
            <CardTitle className="text-sm sm:text-base">
              Test #{displayNumber}
            </CardTitle>
            {testCase.isHidden && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-surface rounded-full text-text-muted">
                <EyeOff className="h-3 w-3" aria-hidden="true" />
                <span className="hidden sm:inline">Hidden</span>
              </span>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-error hover:text-error hover:bg-error/10 shrink-0 h-10 w-10 sm:h-8 sm:w-auto sm:px-3"
            aria-label={`Delete test case ${displayNumber}`}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Delete</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 pt-0 p-3 sm:p-6 sm:pt-0">
        {/* Test Name */}
        <div className="space-y-2">
          <Label htmlFor={nameId}>Test Name</Label>
          <Input
            id={nameId}
            type="text"
            value={testCase.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Test basic addition, Handle empty input..."
          />
          <p className="text-xs text-text-muted">
            A descriptive name helps learners understand what the test is checking.
          </p>
        </div>

        {/* Input and Output Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Input */}
          <div className="space-y-2">
            <Label htmlFor={inputId}>Input</Label>
            <Textarea
              id={inputId}
              value={testCase.input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Enter test input..."
              rows={4}
              aria-describedby={`${inputId}-help`}
            />
            <p id={`${inputId}-help`} className="text-xs text-text-muted">
              The input passed to the learner&apos;s function. Use newlines for multiple arguments.
            </p>
          </div>

          {/* Expected Output */}
          <div className="space-y-2">
            <Label htmlFor={outputId}>Expected Output</Label>
            <Textarea
              id={outputId}
              value={testCase.expectedOutput}
              onChange={(e) => handleOutputChange(e.target.value)}
              placeholder="Enter expected output..."
              rows={4}
              aria-describedby={`${outputId}-help`}
            />
            <p id={`${outputId}-help`} className="text-xs text-text-muted">
              The expected return value or printed output from the function.
            </p>
          </div>
        </div>

        {/* Hidden Test Toggle */}
        <div
          className={cn(
            'p-3 rounded-md border transition-colors',
            testCase.isHidden
              ? 'border-primary/30 bg-primary/5'
              : 'border-border bg-surface/50'
          )}
        >
          <Checkbox
            id={hiddenId}
            checked={testCase.isHidden}
            onChange={(e) => handleHiddenChange(e.target.checked)}
            label="Hidden Test Case"
            description="Hidden tests are not shown to learners until after they submit their solution. Use these to prevent hard-coding answers."
          />
        </div>

        {/* Preview of what learners will see */}
        {!testCase.isHidden && testCase.name && (
          <div className="p-3 bg-surface rounded-md border border-border">
            <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
              <Eye className="h-3 w-3" aria-hidden="true" />
              <span>Learner preview</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">{testCase.name}</span>
              {testCase.input && (
                <span className="text-text-muted">
                  {' '}
                  - Input: <code className="font-mono text-xs">{testCase.input.split('\n')[0]}</code>
                  {testCase.input.includes('\n') && '...'}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export type { TestCaseEditorProps };
