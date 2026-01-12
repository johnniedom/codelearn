/**
 * Execution Engine Type Definitions
 *
 * Types for code execution in the CodeLearn Workbench.
 */

import type { ProgrammingLanguage } from '@/types/content';

/** Result of code execution */
export interface ExecutionResult {
  /** Whether execution completed without errors */
  success: boolean;
  /** Standard output from execution */
  output: string;
  /** Error message if execution failed */
  error?: string;
  /** Exit code (0 for success, non-zero for errors) */
  exitCode: number;
  /** Time taken to execute in milliseconds */
  executionTimeMs: number;
  /** Estimated memory usage in bytes */
  memoryUsedBytes: number;
}

/** Limits for code execution */
export interface ExecutionLimits {
  /** Maximum execution time in milliseconds */
  timeoutMs: number;
  /** Maximum memory usage in bytes */
  memoryBytes: number;
  /** Maximum output characters */
  maxOutputChars: number;
}

/** Default execution limits per spec */
export const DEFAULT_EXECUTION_LIMITS: ExecutionLimits = {
  timeoutMs: 30000, // 30 seconds
  memoryBytes: 50 * 1024 * 1024, // 50MB
  maxOutputChars: 10000,
};

/** Test case definition for exercise validation */
export interface TestCase {
  id: string;
  name: string;
  visible: boolean;
  input: string;
  expectedOutput: string;
  outputPattern?: string;
  points: number;
  failureFeedback?: string;
  timeoutMs?: number;
}

/** Result of running a single test case */
export interface TestCaseResult {
  testCaseId: string;
  testCaseName: string;
  passed: boolean;
  visible: boolean;
  expectedOutput: string;
  actualOutput: string;
  executionTimeMs: number;
  error?: string;
  feedback?: string;
  points: number;
  earnedPoints: number;
}

/** Overall test results for an exercise */
export interface TestResults {
  totalTests: number;
  passedTests: number;
  totalPoints: number;
  earnedPoints: number;
  allPassed: boolean;
  results: TestCaseResult[];
}

/** Pyodide loading progress event */
export interface PyodideLoadProgress {
  stage: 'checking' | 'downloading' | 'loading' | 'ready' | 'error';
  progress: number; // 0-100
  downloadedBytes?: number;
  totalBytes?: number;
  message: string;
}

/** Pyodide loading options */
export interface PyodideLoadOptions {
  onProgress?: (progress: PyodideLoadProgress) => void;
  onCancel?: () => void;
}

/** Memory pressure level */
export type MemoryPressureLevel = 'nominal' | 'low' | 'critical';

/** Device memory check result */
export interface MemoryCheckResult {
  availableGB: number;
  pressure: MemoryPressureLevel;
  canLoadPyodide: boolean;
  warning?: string;
}

/** Code executor interface */
export interface CodeExecutor {
  language: ProgrammingLanguage;
  isReady: boolean;
  initialize(): Promise<void>;
  execute(code: string, input: string, limits: ExecutionLimits): Promise<ExecutionResult>;
  reset(): Promise<void>;
  dispose(): void;
}
