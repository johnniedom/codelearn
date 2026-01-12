/**
 * ExerciseInstructions Component
 *
 * Displays exercise problem description, examples, and hints.
 *
 * Features:
 * - Problem description with Markdown rendering
 * - Input/output format specifications
 * - Example cases with expected output
 * - Progressive hints (unlock after attempts)
 * - Constraints and time limits
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Lock,
  Clock,
  AlertTriangle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/components/content/MarkdownRenderer';
import type { CodeExercise, LocalizedString, DifficultyLevel } from '@/types/content';

// =============================================================================
// Types
// =============================================================================

interface ExerciseInstructionsProps {
  /** Exercise data */
  exercise: CodeExercise;
  /** Number of attempts made (for hint unlocking) */
  attemptCount?: number;
  /** Time spent in seconds (for hint unlocking) */
  timeSpentSeconds?: number;
  /** Callback when a hint is used (may deduct points) */
  onUseHint?: (hintId: string, penalty: number) => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function getLocalizedText(str: LocalizedString | undefined): string {
  if (!str) return '';
  return str.default;
}

function getDifficultyColor(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-success/10 text-success';
    case 'intermediate':
      return 'bg-warning/10 text-warning';
    case 'advanced':
      return 'bg-error/10 text-error';
    default:
      return 'bg-surface text-text-muted';
  }
}

function getDifficultyLabel(difficulty: DifficultyLevel): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

// =============================================================================
// Component
// =============================================================================

export function ExerciseInstructions({
  exercise,
  attemptCount = 0,
  timeSpentSeconds = 0,
  onUseHint,
  className,
}: ExerciseInstructionsProps) {
  const [expandedHints, setExpandedHints] = useState<Set<string>>(new Set());
  const [usedHints, setUsedHints] = useState<Set<string>>(new Set());

  /**
   * Check if a hint is unlocked based on conditions
   */
  const isHintUnlocked = (hint: CodeExercise['hints'][number]): boolean => {
    switch (hint.unlockCondition) {
      case 'always':
        return true;
      case 'after-attempts':
        return attemptCount >= (hint.attemptsRequired ?? 1);
      case 'after-time':
        return timeSpentSeconds >= (hint.timeRequired ?? 60);
      default:
        return false;
    }
  };

  /**
   * Toggle hint expansion and trigger penalty if first use
   */
  const toggleHint = (hint: CodeExercise['hints'][number]) => {
    const hintId = hint.id;
    const isExpanded = expandedHints.has(hintId);

    if (!isExpanded && !usedHints.has(hintId)) {
      // First time using this hint - apply penalty
      setUsedHints((prev) => new Set([...prev, hintId]));
      onUseHint?.(hintId, hint.pointPenalty);
    }

    setExpandedHints((prev) => {
      const next = new Set(prev);
      if (isExpanded) {
        next.delete(hintId);
      } else {
        next.add(hintId);
      }
      return next;
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-text">
            {getLocalizedText(exercise.title)}
          </h2>
          <Badge className={cn('text-xs', getDifficultyColor(exercise.difficulty))}>
            {getDifficultyLabel(exercise.difficulty)}
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="h-3 w-3" />
            ~{exercise.estimatedMinutes} min
          </Badge>
        </div>
        <p className="text-sm text-text-muted">
          {getLocalizedText(exercise.description)}
        </p>
      </div>

      {/* Problem Description */}
      <section>
        <h3 className="mb-2 font-medium text-text">Problem</h3>
        <div className="prose prose-sm max-w-none text-text">
          <MarkdownRenderer content={getLocalizedText(exercise.problem.description)} />
        </div>
      </section>

      {/* Input/Output Format */}
      {(exercise.problem.inputFormat || exercise.problem.outputFormat) && (
        <section className="grid gap-4 sm:grid-cols-2">
          {exercise.problem.inputFormat && (
            <div>
              <h4 className="mb-1 text-sm font-medium text-text">Input Format</h4>
              <div className="prose prose-sm max-w-none text-text-muted">
                <MarkdownRenderer content={getLocalizedText(exercise.problem.inputFormat)} />
              </div>
            </div>
          )}
          {exercise.problem.outputFormat && (
            <div>
              <h4 className="mb-1 text-sm font-medium text-text">Output Format</h4>
              <div className="prose prose-sm max-w-none text-text-muted">
                <MarkdownRenderer content={getLocalizedText(exercise.problem.outputFormat)} />
              </div>
            </div>
          )}
        </section>
      )}

      {/* Constraints */}
      {exercise.problem.constraints && exercise.problem.constraints.length > 0 && (
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-text">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Constraints
          </h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-text-muted">
            {exercise.problem.constraints.map((constraint, idx) => (
              <li key={idx}>{getLocalizedText(constraint)}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Examples */}
      {exercise.problem.examples.length > 0 && (
        <section>
          <h3 className="mb-3 font-medium text-text">Examples</h3>
          <div className="space-y-4">
            {exercise.problem.examples.map((example, idx) => (
              <div
                key={idx}
                className="rounded-md border border-border bg-surface p-4"
              >
                <div className="mb-1 text-xs font-medium text-text-muted">
                  Example {idx + 1}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs text-text-muted">Input:</p>
                    <pre className="overflow-auto rounded bg-background p-2 text-sm text-text">
                      {example.input || '(no input)'}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-text-muted">Output:</p>
                    <pre className="overflow-auto rounded bg-background p-2 text-sm text-text">
                      {example.output}
                    </pre>
                  </div>
                </div>
                {example.explanation && (
                  <div className="mt-3 rounded bg-primary/5 p-2">
                    <p className="text-xs text-text-muted">
                      <strong>Explanation:</strong>{' '}
                      {getLocalizedText(example.explanation)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hints */}
      {exercise.hints.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 font-medium text-text">
            <Lightbulb className="h-4 w-4 text-warning" />
            Hints
          </h3>
          <div className="space-y-2">
            {exercise.hints.map((hint, idx) => {
              const unlocked = isHintUnlocked(hint);
              const isExpanded = expandedHints.has(hint.id);
              const isUsed = usedHints.has(hint.id);

              return (
                <div
                  key={hint.id}
                  className={cn(
                    'rounded-md border',
                    unlocked ? 'border-border' : 'border-border bg-surface/50'
                  )}
                >
                  <button
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 text-left',
                      unlocked && 'hover:bg-surface'
                    )}
                    onClick={() => unlocked && toggleHint(hint)}
                    disabled={!unlocked}
                    aria-expanded={isExpanded}
                  >
                    {unlocked ? (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-text-muted" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-text-muted" />
                      )
                    ) : (
                      <Lock className="h-4 w-4 text-text-muted" />
                    )}

                    <span className="flex-1 text-sm font-medium text-text">
                      Hint {idx + 1}
                    </span>

                    {hint.pointPenalty > 0 && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          isUsed ? 'text-warning' : 'text-text-muted'
                        )}
                      >
                        {isUsed ? 'Used' : `-${hint.pointPenalty} pts`}
                      </Badge>
                    )}

                    {!unlocked && (
                      <span className="text-xs text-text-muted">
                        {hint.unlockCondition === 'after-attempts' &&
                          `Unlocks after ${hint.attemptsRequired} attempts`}
                        {hint.unlockCondition === 'after-time' &&
                          `Unlocks after ${Math.round((hint.timeRequired ?? 60) / 60)} min`}
                      </span>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border bg-warning/5 px-4 py-3">
                      <p className="text-sm text-text">
                        {getLocalizedText(hint.content)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Execution Limits Info */}
      <section className="rounded-md bg-surface p-3">
        <p className="text-xs text-text-muted">
          <strong>Limits:</strong> {exercise.limits.timeoutMs / 1000}s timeout,{' '}
          max {exercise.limits.maxSubmissions} submissions
        </p>
      </section>
    </div>
  );
}

export default ExerciseInstructions;
