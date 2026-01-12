/**
 * Python Code Runner
 *
 * Executes Python code using Pyodide (WebAssembly).
 *
 * Features:
 * - Lazy Pyodide loading with progress
 * - Timeout enforcement (30 seconds default)
 * - Memory pressure monitoring
 * - Beginner-friendly error messages
 * - State reset between exercises
 */

import type { PyodideInterface } from 'pyodide';
import type { ExecutionResult, ExecutionLimits, CodeExecutor } from './types';
import { DEFAULT_EXECUTION_LIMITS } from './types';
import {
  loadPyodide,
  isPyodideLoaded,
  getPyodideInstance,
  unloadPyodide,
  detectMemoryPressure,
} from './pyodide-loader';

/** Custom error for execution timeout */
class ExecutionTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Execution timed out after ${timeoutMs}ms`);
    this.name = 'ExecutionTimeoutError';
  }
}

/**
 * Python code executor using Pyodide
 */
export class PythonRunner implements CodeExecutor {
  readonly language = 'python' as const;
  private onLoadingStart?: () => void;
  private onLoadingEnd?: () => void;
  private onProgress?: (progress: { stage: string; progress: number; message: string }) => void;

  get isReady(): boolean {
    return isPyodideLoaded();
  }

  /**
   * Set callbacks for loading progress
   */
  setLoadingCallbacks(callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onProgress?: (progress: { stage: string; progress: number; message: string }) => void;
  }): void {
    this.onLoadingStart = callbacks.onStart;
    this.onLoadingEnd = callbacks.onEnd;
    this.onProgress = callbacks.onProgress;
  }

  /**
   * Initialize Pyodide (lazy load on first use)
   */
  async initialize(): Promise<void> {
    if (this.isReady) return;

    this.onLoadingStart?.();

    try {
      await loadPyodide({
        onProgress: this.onProgress,
      });
    } finally {
      this.onLoadingEnd?.();
    }
  }

  /**
   * Execute Python code with timeout and memory limits
   */
  async execute(
    code: string,
    input: string = '',
    limits: ExecutionLimits = DEFAULT_EXECUTION_LIMITS
  ): Promise<ExecutionResult> {
    // Ensure Pyodide is loaded
    await this.initialize();

    const pyodide = getPyodideInstance();
    if (!pyodide) {
      return {
        success: false,
        output: '',
        error: 'Python runtime not available. Please refresh the page.',
        exitCode: 1,
        executionTimeMs: 0,
        memoryUsedBytes: 0,
      };
    }

    const startTime = performance.now();

    try {
      // Set up stdin with provided input
      this.setupStdin(pyodide, input);

      // Create timeout race
      const result = await Promise.race([
        this.runCode(pyodide, code),
        this.createTimeout(limits.timeoutMs),
      ]);

      const executionTimeMs = performance.now() - startTime;

      // Check memory pressure after execution
      if (detectMemoryPressure()) {
        console.warn('[PythonRunner] High memory pressure detected after execution');
      }

      return {
        ...result,
        executionTimeMs,
        memoryUsedBytes: this.estimateMemoryUsage(),
      };
    } catch (error) {
      const executionTimeMs = performance.now() - startTime;

      if (error instanceof ExecutionTimeoutError) {
        return {
          success: false,
          output: '',
          error: `Execution timed out after ${limits.timeoutMs / 1000} seconds. Your code might have an infinite loop.`,
          exitCode: 124,
          executionTimeMs,
          memoryUsedBytes: 0,
        };
      }

      return {
        success: false,
        output: '',
        error: this.formatError(error),
        exitCode: 1,
        executionTimeMs,
        memoryUsedBytes: 0,
      };
    }
  }

  /**
   * Reset Python interpreter state
   */
  async reset(): Promise<void> {
    const pyodide = getPyodideInstance();
    if (!pyodide) return;

    try {
      await pyodide.runPythonAsync(`
# Clear all user-defined variables
import sys

# Get all names in global namespace
all_names = list(globals().keys())

# Keep system names and our OutputCapture class
keep_names = {
    '__name__', '__doc__', '__package__', '__loader__', '__spec__',
    '__annotations__', '__builtins__', 'sys', 'io', 'OutputCapture'
}

# Delete user-defined names
for name in all_names:
    if name not in keep_names and not name.startswith('_'):
        try:
            del globals()[name]
        except:
            pass
      `);
    } catch (error) {
      console.error('[PythonRunner] Failed to reset state:', error);
    }
  }

  /**
   * Dispose of the Python runner and free memory
   */
  dispose(): void {
    unloadPyodide();
  }

  /**
   * Set up stdin for code execution
   */
  private setupStdin(pyodide: PyodideInterface, input: string): void {
    const lines = input.split('\n');
    let lineIndex = 0;

    pyodide.setStdin({
      stdin: () => {
        if (lineIndex < lines.length) {
          return lines[lineIndex++];
        }
        return null;
      },
    });
  }

  /**
   * Run Python code and capture output
   */
  private async runCode(
    pyodide: PyodideInterface,
    code: string
  ): Promise<Omit<ExecutionResult, 'executionTimeMs' | 'memoryUsedBytes'>> {
    let stdout = '';
    let stderr = '';

    // Set up stdout/stderr capture
    pyodide.setStdout({
      batched: (text) => {
        stdout += text;
      },
    });

    pyodide.setStderr({
      batched: (text) => {
        stderr += text;
      },
    });

    try {
      await pyodide.runPythonAsync(code);

      return {
        success: true,
        output: stdout,
        error: stderr || undefined,
        exitCode: 0,
      };
    } catch (error) {
      return {
        success: false,
        output: stdout,
        error: this.formatError(error, stderr),
        exitCode: 1,
      };
    }
  }

  /**
   * Create a timeout promise
   */
  private createTimeout(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new ExecutionTimeoutError(timeoutMs));
      }, timeoutMs);
    });
  }

  /**
   * Format Python errors for display
   *
   * Per spec: Simplify common errors for beginners
   */
  private formatError(error: unknown, stderr?: string): string {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const message = stderr ? `${stderr}\n${rawMessage}` : rawMessage;

    // Extract line number from traceback
    const lineMatch = message.match(/line (\d+)/);
    const lineNumber = lineMatch ? parseInt(lineMatch[1]) : null;
    const lineInfo = lineNumber ? ` on line ${lineNumber}` : '';

    // Simplify SyntaxError
    if (message.includes('SyntaxError')) {
      if (message.includes('unexpected EOF')) {
        return `Syntax Error${lineInfo}: Your code seems incomplete. Check for missing closing brackets, quotes, or colons.`;
      }
      if (message.includes('invalid syntax')) {
        return `Syntax Error${lineInfo}: Python does not understand this code. Check for typos, missing colons after if/for/while, or mismatched parentheses.`;
      }
      if (message.includes('expected ":"') || message.includes("expected ':'")) {
        return `Syntax Error${lineInfo}: Missing colon (:) after if, for, while, or function definition.`;
      }
    }

    // Simplify NameError
    if (message.includes('NameError')) {
      const nameMatch = message.match(/name '(\w+)' is not defined/);
      if (nameMatch) {
        return `Name Error: '${nameMatch[1]}' is not defined. Did you spell it correctly? Remember to define variables before using them.`;
      }
    }

    // Simplify TypeError
    if (message.includes('TypeError')) {
      if (message.includes("can't multiply sequence by non-int")) {
        return `Type Error: You are trying to multiply a string/list by something that is not a number. Make sure to convert strings to numbers using int() or float().`;
      }
      if (message.includes('unsupported operand type')) {
        return `Type Error: You are trying to combine incompatible types (like adding a string to a number). Convert them to the same type first.`;
      }
      if (message.includes("'NoneType'")) {
        return `Type Error: You are trying to use None (nothing) as a value. Make sure your function returns something or your variable is set correctly.`;
      }
    }

    // Simplify IndexError
    if (message.includes('IndexError')) {
      return `Index Error${lineInfo}: You are trying to access an element that does not exist. Check that your index is within the list/string length.`;
    }

    // Simplify KeyError
    if (message.includes('KeyError')) {
      const keyMatch = message.match(/KeyError: ['"]?(\w+)['"]?/);
      if (keyMatch) {
        return `Key Error: The key '${keyMatch[1]}' does not exist in the dictionary. Check the spelling or use .get() to avoid this error.`;
      }
    }

    // Simplify ZeroDivisionError
    if (message.includes('ZeroDivisionError')) {
      return `Division Error${lineInfo}: You cannot divide by zero. Check that your divisor is not zero.`;
    }

    // Simplify IndentationError
    if (message.includes('IndentationError')) {
      return `Indentation Error${lineInfo}: Python requires consistent indentation. Use 4 spaces for each level of indentation.`;
    }

    // Return cleaned up message for other errors
    // Remove Pyodide-specific noise
    return message
      .replace(/PythonError:\s*/g, '')
      .replace(/Traceback \(most recent call last\):/g, 'Error:')
      .trim();
  }

  /**
   * Estimate memory usage (Chrome only)
   */
  private estimateMemoryUsage(): number {
    const performance = window.performance as Performance & {
      memory?: { usedJSHeapSize: number };
    };

    if (performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }
}

// Export singleton instance
export const pythonRunner = new PythonRunner();
