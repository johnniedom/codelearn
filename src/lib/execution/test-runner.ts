/**
 * Test Case Runner
 *
 * Runs test cases against user code and validates output.
 *
 * Features:
 * - Run visible and hidden test cases
 * - Compare expected vs actual output
 * - Support regex pattern matching
 * - Calculate partial credit scores
 * - Generate pass/fail results
 */

import type { ProgrammingLanguage } from '@/types/content';
import type {
  ExecutionResult,
  ExecutionLimits,
  TestCase,
  TestCaseResult,
  TestResults,
} from './types';
import { DEFAULT_EXECUTION_LIMITS } from './types';
import { pythonRunner } from './python-runner';
import { javascriptRunner } from './javascript-runner';

/**
 * Normalize output for comparison
 *
 * Handles:
 * - Trailing whitespace/newlines
 * - Windows vs Unix line endings
 * - Trailing spaces on lines
 */
function normalizeOutput(output: string): string {
  return output
    .replace(/\r\n/g, '\n')        // Normalize line endings
    .replace(/[ \t]+$/gm, '')      // Remove trailing spaces per line
    .replace(/\n+$/, '')           // Remove trailing newlines
    .trim();
}

/**
 * Compare actual output to expected output
 */
function compareOutput(
  actual: string,
  expected: string,
  pattern?: string
): boolean {
  const normalizedActual = normalizeOutput(actual);
  const normalizedExpected = normalizeOutput(expected);

  // If pattern is provided, use regex matching
  if (pattern) {
    try {
      const regex = new RegExp(pattern, 'm');
      return regex.test(normalizedActual);
    } catch {
      // Invalid regex, fall back to exact match
      console.warn('[TestRunner] Invalid regex pattern:', pattern);
    }
  }

  // Exact match after normalization
  return normalizedActual === normalizedExpected;
}

/**
 * Get the appropriate code executor for a language
 */
function getExecutor(language: ProgrammingLanguage) {
  switch (language) {
    case 'python':
      return pythonRunner;
    case 'javascript':
      return javascriptRunner;
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

/**
 * Run a single test case
 */
async function runTestCase(
  code: string,
  testCase: TestCase,
  language: ProgrammingLanguage,
  limits: ExecutionLimits
): Promise<TestCaseResult> {
  const executor = getExecutor(language);
  const startTime = performance.now();

  try {
    // Use test-specific timeout if provided
    const testLimits: ExecutionLimits = {
      ...limits,
      timeoutMs: testCase.timeoutMs ?? limits.timeoutMs,
    };

    const result: ExecutionResult = await executor.execute(
      code,
      testCase.input,
      testLimits
    );

    const passed = result.success && compareOutput(
      result.output,
      testCase.expectedOutput,
      testCase.outputPattern
    );

    return {
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      passed,
      visible: testCase.visible,
      expectedOutput: testCase.expectedOutput,
      actualOutput: result.output,
      executionTimeMs: result.executionTimeMs,
      error: result.error,
      feedback: passed ? undefined : testCase.failureFeedback,
      points: testCase.points,
      earnedPoints: passed ? testCase.points : 0,
    };
  } catch (error) {
    return {
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      passed: false,
      visible: testCase.visible,
      expectedOutput: testCase.expectedOutput,
      actualOutput: '',
      executionTimeMs: performance.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
      feedback: testCase.failureFeedback,
      points: testCase.points,
      earnedPoints: 0,
    };
  }
}

/**
 * Run all test cases for an exercise
 */
export async function runTests(
  code: string,
  testCases: TestCase[],
  language: ProgrammingLanguage,
  limits: ExecutionLimits = DEFAULT_EXECUTION_LIMITS
): Promise<TestResults> {
  const results: TestCaseResult[] = [];
  let totalPoints = 0;
  let earnedPoints = 0;
  let passedTests = 0;

  // Initialize executor
  const executor = getExecutor(language);
  await executor.initialize();

  // Run each test case
  for (const testCase of testCases) {
    const result = await runTestCase(code, testCase, language, limits);
    results.push(result);

    totalPoints += testCase.points;
    earnedPoints += result.earnedPoints;

    if (result.passed) {
      passedTests++;
    }

    // Reset executor state between tests for isolation
    await executor.reset();
  }

  return {
    totalTests: testCases.length,
    passedTests,
    totalPoints,
    earnedPoints,
    allPassed: passedTests === testCases.length,
    results,
  };
}

/**
 * Run only visible test cases (for "Run" button)
 */
export async function runVisibleTests(
  code: string,
  testCases: TestCase[],
  language: ProgrammingLanguage,
  limits: ExecutionLimits = DEFAULT_EXECUTION_LIMITS
): Promise<TestResults> {
  const visibleTests = testCases.filter((tc) => tc.visible);
  return runTests(code, visibleTests, language, limits);
}

/**
 * Run all test cases including hidden (for "Submit" button)
 */
export async function runAllTests(
  code: string,
  testCases: TestCase[],
  language: ProgrammingLanguage,
  limits: ExecutionLimits = DEFAULT_EXECUTION_LIMITS
): Promise<TestResults> {
  return runTests(code, testCases, language, limits);
}

/**
 * Calculate score based on scoring method
 */
export function calculateScore(
  results: TestResults,
  scoringMethod: 'all-or-nothing' | 'per-test' | 'weighted',
  maxPoints: number
): { score: number; percentage: number } {
  switch (scoringMethod) {
    case 'all-or-nothing':
      return {
        score: results.allPassed ? maxPoints : 0,
        percentage: results.allPassed ? 100 : 0,
      };

    case 'per-test':
      // Each test is worth equal points
      const pointsPerTest = maxPoints / results.totalTests;
      const score = results.passedTests * pointsPerTest;
      return {
        score: Math.round(score * 100) / 100,
        percentage: Math.round((results.passedTests / results.totalTests) * 100),
      };

    case 'weighted':
      // Use test case point values
      return {
        score: results.earnedPoints,
        percentage: results.totalPoints > 0
          ? Math.round((results.earnedPoints / results.totalPoints) * 100)
          : 0,
      };

    default:
      return { score: 0, percentage: 0 };
  }
}

/**
 * Generate feedback summary for test results
 */
export function generateFeedback(results: TestResults): string {
  if (results.allPassed) {
    return 'All tests passed. Great work!';
  }

  const failedVisible = results.results.filter((r) => !r.passed && r.visible);
  const failedHidden = results.results.filter((r) => !r.passed && !r.visible);

  const parts: string[] = [];

  if (failedVisible.length > 0) {
    parts.push(`${failedVisible.length} visible test${failedVisible.length > 1 ? 's' : ''} failed.`);

    // Include specific feedback from first failed test
    const firstFeedback = failedVisible.find((r) => r.feedback)?.feedback;
    if (firstFeedback) {
      parts.push(`Hint: ${firstFeedback}`);
    }
  }

  if (failedHidden.length > 0) {
    parts.push(`${failedHidden.length} hidden test${failedHidden.length > 1 ? 's' : ''} failed.`);
    parts.push('Try different edge cases to find the issue.');
  }

  return parts.join(' ');
}
