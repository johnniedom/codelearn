/**
 * ExercisePage Component
 *
 * Code Workbench page for interactive coding exercises.
 *
 * Features:
 * - Split view: instructions + editor + output
 * - Run button for testing code
 * - Submit button for grading
 * - Reset button to restore starter code
 * - Test results display
 * - Pyodide lazy loading with progress
 * - Mobile-responsive layout
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play,
  RotateCcw,
  Send,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CodeEditor,
  OutputPanel,
  TestResults,
  ExerciseInstructions,
  PyodideLoadingProgress,
  createOutputEntry,
  type OutputEntry,
} from '@/components/workbench';
import {
  pythonRunner,
  javascriptRunner,
  runVisibleTests,
  runAllTests,
  type PyodideLoadProgress,
  type TestResults as TestResultsType,
  type TestCase,
} from '@/lib/execution';
import { getSampleExercise } from '@/data/sample-exercises';
import type { CodeExercise, LocalizedString } from '@/types/content';

// =============================================================================
// Types
// =============================================================================

type ExecutionState = 'idle' | 'loading-runtime' | 'running' | 'testing' | 'submitting';

interface ExerciseState {
  code: string;
  attemptCount: number;
  startTime: number;
  hintPenalties: number;
  submitted: boolean;
  finalScore: number | null;
}

/**
 * Helper to get text from LocalizedString
 */
function getLocalizedText(str: LocalizedString | undefined): string {
  if (!str) return '';
  return str.default;
}

/**
 * Convert CodeExercise test cases to TestCase format for execution
 */
function convertTestCases(exercise: CodeExercise): TestCase[] {
  return exercise.testCases.map((tc) => ({
    id: tc.id,
    name: tc.name,
    visible: tc.visible,
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    outputPattern: tc.outputPattern,
    points: tc.points,
    failureFeedback: tc.failureFeedback ? getLocalizedText(tc.failureFeedback) : undefined,
    timeoutMs: tc.timeoutMs,
  }));
}

// =============================================================================
// Component
// =============================================================================

export function ExercisePage() {
  const { courseSlug, exerciseId } = useParams<{
    courseSlug: string;
    moduleId: string;
    exerciseId: string;
  }>();

  // Exercise data
  const [exercise, setExercise] = useState<CodeExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor state
  const [code, setCode] = useState('');

  // Execution state
  const [executionState, setExecutionState] = useState<ExecutionState>('idle');
  const [pyodideProgress, setPyodideProgress] = useState<PyodideLoadProgress | null>(null);
  const [outputEntries, setOutputEntries] = useState<OutputEntry[]>([]);
  const [testResults, setTestResults] = useState<TestResultsType | null>(null);

  // Exercise progress state
  const [exerciseState, setExerciseState] = useState<ExerciseState>({
    code: '',
    attemptCount: 0,
    startTime: Date.now(),
    hintPenalties: 0,
    submitted: false,
    finalScore: null,
  });

  // UI state
  const [instructionsExpanded, setInstructionsExpanded] = useState(true);
  const [outputExpanded, setOutputExpanded] = useState(true);

  // ==========================================================================
  // Load Exercise
  // ==========================================================================

  useEffect(() => {
    if (!exerciseId) {
      setError('Exercise ID not provided');
      setLoading(false);
      return;
    }

    // Load from sample data for now
    const ex = getSampleExercise(exerciseId);
    if (ex) {
      setExercise(ex);
      setCode(ex.editor.starterCode);
      setExerciseState((prev) => ({
        ...prev,
        code: ex.editor.starterCode,
        startTime: Date.now(),
      }));
    } else {
      setError(`Exercise not found: ${exerciseId}`);
    }
    setLoading(false);
  }, [exerciseId]);

  // ==========================================================================
  // Get Executor
  // ==========================================================================

  const getExecutor = useCallback(() => {
    if (!exercise) return null;

    switch (exercise.language) {
      case 'python':
        return pythonRunner;
      case 'javascript':
        return javascriptRunner;
      default:
        return null;
    }
  }, [exercise]);

  // ==========================================================================
  // Run Code
  // ==========================================================================

  const handleRun = useCallback(async () => {
    if (!exercise) return;

    const executor = getExecutor();
    if (!executor) {
      setOutputEntries((prev) => [
        ...prev,
        createOutputEntry('error', `Unsupported language: ${exercise.language}`),
      ]);
      return;
    }

    setExecutionState('running');
    setOutputEntries([]);
    setTestResults(null);

    try {
      // Initialize executor (may trigger Pyodide download)
      if (!executor.isReady) {
        setExecutionState('loading-runtime');

        if (exercise.language === 'python') {
          pythonRunner.setLoadingCallbacks({
            onProgress: (progress) => setPyodideProgress(progress as PyodideLoadProgress),
          });
        }

        await executor.initialize();
        setPyodideProgress(null);
      }

      setExecutionState('testing');

      // Run visible tests
      const testCases = convertTestCases(exercise);
      const results = await runVisibleTests(
        code,
        testCases,
        exercise.language,
        {
          timeoutMs: exercise.limits.timeoutMs,
          memoryBytes: exercise.limits.memoryBytes,
          maxOutputChars: exercise.limits.maxOutputChars,
        }
      );

      setTestResults(results);

      // Update attempt count
      setExerciseState((prev) => ({
        ...prev,
        attemptCount: prev.attemptCount + 1,
      }));

      // Show output from first test
      if (results.results.length > 0) {
        const firstResult = results.results[0];
        if (firstResult.actualOutput) {
          setOutputEntries([createOutputEntry('stdout', firstResult.actualOutput)]);
        }
        if (firstResult.error) {
          setOutputEntries((prev) => [
            ...prev,
            createOutputEntry('error', firstResult.error!),
          ]);
        }
      }
    } catch (err) {
      setOutputEntries([
        createOutputEntry(
          'error',
          err instanceof Error ? err.message : 'An unexpected error occurred'
        ),
      ]);
    } finally {
      setExecutionState('idle');
    }
  }, [exercise, code, getExecutor]);

  // ==========================================================================
  // Submit for Grading
  // ==========================================================================

  const handleSubmit = useCallback(async () => {
    if (!exercise || exerciseState.submitted) return;

    const executor = getExecutor();
    if (!executor) return;

    setExecutionState('submitting');
    setTestResults(null);

    try {
      // Initialize if needed
      if (!executor.isReady) {
        setExecutionState('loading-runtime');
        if (exercise.language === 'python') {
          pythonRunner.setLoadingCallbacks({
            onProgress: (progress) => setPyodideProgress(progress as PyodideLoadProgress),
          });
        }
        await executor.initialize();
        setPyodideProgress(null);
      }

      setExecutionState('submitting');

      // Run ALL tests (including hidden)
      const testCases = convertTestCases(exercise);
      const results = await runAllTests(
        code,
        testCases,
        exercise.language,
        {
          timeoutMs: exercise.limits.timeoutMs,
          memoryBytes: exercise.limits.memoryBytes,
          maxOutputChars: exercise.limits.maxOutputChars,
        }
      );

      setTestResults(results);

      // Calculate final score with hint penalties
      const rawScore = results.earnedPoints;
      const finalScore = Math.max(0, rawScore - exerciseState.hintPenalties);

      setExerciseState((prev) => ({
        ...prev,
        submitted: true,
        finalScore,
      }));

      // Show completion message
      if (results.allPassed) {
        setOutputEntries([
          createOutputEntry('info', 'All tests passed! Great work!'),
        ]);
      } else {
        setOutputEntries([
          createOutputEntry(
            'info',
            `${results.passedTests} of ${results.totalTests} tests passed.`
          ),
        ]);
      }
    } catch (err) {
      setOutputEntries([
        createOutputEntry(
          'error',
          err instanceof Error ? err.message : 'Submission failed'
        ),
      ]);
    } finally {
      setExecutionState('idle');
    }
  }, [exercise, exerciseState, code, getExecutor]);

  // ==========================================================================
  // Reset Code
  // ==========================================================================

  const handleReset = useCallback(() => {
    if (!exercise) return;

    if (window.confirm('Reset code to starter code? Your current code will be lost.')) {
      setCode(exercise.editor.starterCode);
      setOutputEntries([]);
      setTestResults(null);
    }
  }, [exercise]);

  // ==========================================================================
  // Handle Hint Usage
  // ==========================================================================

  const handleUseHint = useCallback((_hintId: string, penalty: number) => {
    setExerciseState((prev) => ({
      ...prev,
      hintPenalties: prev.hintPenalties + penalty,
    }));
  }, []);

  // ==========================================================================
  // Clear Output
  // ==========================================================================

  const clearOutput = useCallback(() => {
    setOutputEntries([]);
  }, []);

  // ==========================================================================
  // Loading & Error States
  // ==========================================================================

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-text-muted">Loading exercise...</p>
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-error" />
        <h1 className="text-xl font-semibold text-text">Exercise Not Found</h1>
        <p className="text-text-muted">{error}</p>
        <Button asChild>
          <Link to={courseSlug ? `/courses/${courseSlug}` : '/courses'}>
            Back to Course
          </Link>
        </Button>
      </div>
    );
  }

  // ==========================================================================
  // Calculate Time Spent
  // ==========================================================================

  const timeSpentSeconds = Math.floor((Date.now() - exerciseState.startTime) / 1000);

  // ==========================================================================
  // Render
  // ==========================================================================

  const isRunning = executionState !== 'idle';
  const canSubmit = !exerciseState.submitted && exerciseState.attemptCount > 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1"
          >
            <Link to={courseSlug ? `/courses/${courseSlug}` : '/courses'}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-sm font-medium text-text">
            {exercise.title.default}
          </h1>
          <Badge variant="outline" className="text-xs">
            {exercise.language}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isRunning}
            className="gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className="gap-1"
          >
            {isRunning && executionState !== 'submitting' ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant={exerciseState.submitted ? 'outline' : 'default'}
            onClick={handleSubmit}
            disabled={isRunning || !canSubmit || exerciseState.submitted}
            className="gap-1"
          >
            <Send className="h-4 w-4" />
            {exerciseState.submitted ? 'Submitted' : 'Submit'}
          </Button>
        </div>
      </header>

      {/* Pyodide Loading Progress */}
      {executionState === 'loading-runtime' && pyodideProgress && (
        <div className="border-b border-border p-4">
          <PyodideLoadingProgress
            progress={pyodideProgress}
            isLoading={true}
            onCancel={() => setExecutionState('idle')}
          />
        </div>
      )}

      {/* Main Content - Split View */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left Panel - Instructions (collapsible on mobile) */}
        <aside
          className={cn(
            'flex flex-col border-b border-border bg-background lg:w-[400px] lg:border-b-0 lg:border-r',
            !instructionsExpanded && 'max-h-12'
          )}
        >
          {/* Instructions Header */}
          <button
            className="flex items-center justify-between px-4 py-3 lg:hidden"
            onClick={() => setInstructionsExpanded(!instructionsExpanded)}
            aria-expanded={instructionsExpanded}
          >
            <span className="font-medium text-text">Instructions</span>
            {instructionsExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Instructions Content */}
          <div
            className={cn(
              'flex-1 overflow-auto px-4 pb-4 lg:pt-4',
              !instructionsExpanded && 'hidden lg:block'
            )}
          >
            <ExerciseInstructions
              exercise={exercise}
              attemptCount={exerciseState.attemptCount}
              timeSpentSeconds={timeSpentSeconds}
              onUseHint={handleUseHint}
            />
          </div>
        </aside>

        {/* Right Panel - Editor & Output */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Code Editor */}
          <div className="flex-1 overflow-hidden p-2">
            <CodeEditor
              initialCode={code}
              language={exercise.language}
              onChange={setCode}
              readOnlyRegions={exercise.editor.readOnlyRegions}
              aria-label={`Code editor for ${exercise.title.default}`}
              className="h-full"
              minHeight={200}
            />
          </div>

          {/* Output Panel (collapsible on mobile) */}
          <div
            className={cn(
              'flex flex-col border-t border-border',
              !outputExpanded && 'max-h-12'
            )}
          >
            {/* Output Header */}
            <button
              className="flex items-center justify-between px-4 py-2 lg:hidden"
              onClick={() => setOutputExpanded(!outputExpanded)}
              aria-expanded={outputExpanded}
            >
              <span className="font-medium text-text">Output & Tests</span>
              {outputExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {/* Output Content */}
            <div
              className={cn(
                'flex flex-col gap-4 overflow-auto p-2 lg:flex-row',
                !outputExpanded && 'hidden lg:flex'
              )}
              style={{ maxHeight: '300px' }}
            >
              {/* Console Output */}
              <div className="flex-1 min-w-0">
                <OutputPanel
                  entries={outputEntries}
                  isRunning={isRunning && executionState !== 'loading-runtime'}
                  onClear={clearOutput}
                  maxHeight={250}
                />
              </div>

              {/* Test Results */}
              <div className="flex-1 min-w-0">
                <TestResults
                  results={testResults}
                  isRunning={executionState === 'testing' || executionState === 'submitting'}
                  showDiff={exercise.feedback.showDiff}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Submitted Score Banner */}
      {exerciseState.submitted && exerciseState.finalScore !== null && (
        <div
          className={cn(
            'border-t p-4 text-center',
            testResults?.allPassed
              ? 'border-success/50 bg-success/10'
              : 'border-warning/50 bg-warning/10'
          )}
          role="status"
        >
          <p className="font-medium text-text">
            {testResults?.allPassed ? 'Congratulations!' : 'Keep trying!'}{' '}
            Final Score: {exerciseState.finalScore}/{exercise.scoring.maxPoints}
            {exerciseState.hintPenalties > 0 && (
              <span className="text-text-muted">
                {' '}(includes -{exerciseState.hintPenalties} hint penalty)
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default ExercisePage;
