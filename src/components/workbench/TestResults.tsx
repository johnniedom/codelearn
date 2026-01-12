/**
 * TestResults Component
 *
 * Displays test case results with pass/fail badges.
 *
 * Features:
 * - Pass/fail badges with color and icon
 * - Expandable details showing expected vs actual
 * - Hidden test status (pass count only)
 * - Score summary
 * - Screen reader announcements
 */

import { useState } from 'react';
import {
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Award,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { TestResults as TestResultsType, TestCaseResult } from '@/lib/execution';

// =============================================================================
// Types
// =============================================================================

interface TestResultsProps {
  /** Test results to display */
  results: TestResultsType | null;
  /** Whether tests are currently running */
  isRunning?: boolean;
  /** Show detailed diff for visible tests */
  showDiff?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface TestCaseItemProps {
  result: TestCaseResult;
  showDiff: boolean;
}

// =============================================================================
// TestCaseItem Component
// =============================================================================

function TestCaseItem({ result, showDiff }: TestCaseItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const canExpand = result.visible && showDiff && !result.passed;

  return (
    <li className="border-b border-border last:border-b-0">
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2',
          canExpand && 'cursor-pointer hover:bg-surface',
          !result.passed && 'bg-error/5'
        )}
        onClick={() => canExpand && setIsExpanded(!isExpanded)}
        role={canExpand ? 'button' : undefined}
        aria-expanded={canExpand ? isExpanded : undefined}
        tabIndex={canExpand ? 0 : undefined}
        onKeyDown={(e) => {
          if (canExpand && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        {/* Expand icon */}
        {canExpand && (
          <span className="text-text-muted" aria-hidden="true">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}

        {/* Pass/Fail icon */}
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full',
            result.passed ? 'bg-success text-white' : 'bg-error text-white'
          )}
          aria-hidden="true"
        >
          {result.passed ? (
            <Check className="h-3 w-3" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </span>

        {/* Test name */}
        <span className="flex-1 text-sm font-medium text-text">
          {result.testCaseName}
        </span>

        {/* Visibility badge */}
        {result.visible ? (
          <Badge variant="outline" className="gap-1 text-xs">
            <Eye className="h-3 w-3" />
            Visible
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-xs text-text-muted">
            <EyeOff className="h-3 w-3" />
            Hidden
          </Badge>
        )}

        {/* Points */}
        <span className="text-sm text-text-muted">
          {result.earnedPoints}/{result.points} pts
        </span>
      </div>

      {/* Expanded details */}
      {isExpanded && result.visible && (
        <div className="border-t border-border bg-surface px-3 py-3">
          {/* Error message */}
          {result.error && (
            <div className="mb-3">
              <p className="mb-1 text-xs font-medium text-error">Error:</p>
              <pre className="overflow-auto rounded bg-error/10 p-2 text-xs text-error">
                {result.error}
              </pre>
            </div>
          )}

          {/* Expected vs Actual */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-text-muted">Expected:</p>
              <pre className="overflow-auto rounded bg-background p-2 text-xs text-text">
                {result.expectedOutput || '(empty)'}
              </pre>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-text-muted">Actual:</p>
              <pre className="overflow-auto rounded bg-background p-2 text-xs text-text">
                {result.actualOutput || '(empty)'}
              </pre>
            </div>
          </div>

          {/* Feedback */}
          {result.feedback && (
            <div className="mt-3 rounded bg-warning/10 p-2">
              <p className="text-xs text-warning">
                <strong>Hint:</strong> {result.feedback}
              </p>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function TestResults({
  results,
  isRunning = false,
  showDiff = true,
  className,
}: TestResultsProps) {
  if (!results && !isRunning) {
    return (
      <div
        className={cn(
          'rounded-md border border-border bg-surface p-4 text-center',
          className
        )}
        role="status"
      >
        <p className="text-sm text-text-muted">
          Run your code to see test results.
        </p>
      </div>
    );
  }

  if (isRunning) {
    return (
      <div
        className={cn(
          'rounded-md border border-border bg-surface p-4 text-center',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-text-muted">Running tests...</span>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const { totalTests, passedTests, earnedPoints, totalPoints, allPassed } = results;
  const visibleResults = results.results.filter((r) => r.visible);
  const hiddenResults = results.results.filter((r) => !r.visible);
  const hiddenPassed = hiddenResults.filter((r) => r.passed).length;

  return (
    <div
      className={cn('rounded-md border border-border bg-surface', className)}
      role="region"
      aria-label="Test results"
    >
      {/* Summary Header */}
      <div
        className={cn(
          'flex items-center justify-between border-b border-border px-4 py-3',
          allPassed ? 'bg-success/10' : 'bg-error/10'
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          {allPassed ? (
            <Award className="h-5 w-5 text-success" aria-hidden="true" />
          ) : (
            <X className="h-5 w-5 text-error" aria-hidden="true" />
          )}
          <span className="font-medium text-text">
            {allPassed
              ? 'All tests passed!'
              : `${passedTests} of ${totalTests} tests passed`}
          </span>
        </div>

        <Badge
          variant={allPassed ? 'default' : 'destructive'}
          className="text-sm"
        >
          {earnedPoints}/{totalPoints} pts
        </Badge>
      </div>

      {/* Test List */}
      <ul className="divide-y divide-border" role="list" aria-label="Test cases">
        {/* Visible tests */}
        {visibleResults.map((result) => (
          <TestCaseItem
            key={result.testCaseId}
            result={result}
            showDiff={showDiff}
          />
        ))}

        {/* Hidden tests summary */}
        {hiddenResults.length > 0 && (
          <li className="flex items-center gap-3 bg-surface px-3 py-2">
            <span className="text-text-muted" aria-hidden="true">
              <EyeOff className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm text-text-muted">
              Hidden tests: {hiddenPassed} of {hiddenResults.length} passed
            </span>
          </li>
        )}
      </ul>

      {/* Screen reader summary */}
      <div className="sr-only" aria-live="polite">
        Test results: {passedTests} of {totalTests} tests passed.
        Score: {earnedPoints} out of {totalPoints} points.
        {allPassed ? 'Congratulations, all tests passed!' : 'Some tests failed. Review the results above.'}
      </div>
    </div>
  );
}

export default TestResults;
