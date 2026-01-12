/**
 * Code Execution Library
 *
 * Provides code execution capabilities for the CodeLearn Workbench.
 * Supports Python (via Pyodide) and JavaScript (via sandboxed iframe).
 */

// Types
export type {
  ExecutionResult,
  ExecutionLimits,
  TestCase,
  TestCaseResult,
  TestResults,
  PyodideLoadProgress,
  PyodideLoadOptions,
  MemoryCheckResult,
  MemoryPressureLevel,
  CodeExecutor,
} from './types';

export { DEFAULT_EXECUTION_LIMITS } from './types';

// Pyodide Loader
export {
  loadPyodide,
  isPyodideLoaded,
  isPyodideCached,
  getPyodideInstance,
  cancelPyodideLoad,
  unloadPyodide,
  checkMemoryPressure,
  checkStorageQuota,
  detectMemoryPressure,
} from './pyodide-loader';

// Python Runner
export { PythonRunner, pythonRunner } from './python-runner';

// JavaScript Runner
export { JavaScriptRunner, javascriptRunner } from './javascript-runner';

// Test Runner
export {
  runTests,
  runVisibleTests,
  runAllTests,
  calculateScore,
  generateFeedback,
} from './test-runner';
