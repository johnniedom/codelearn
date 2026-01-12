/**
 * JavaScript Code Runner
 *
 * Executes JavaScript code in a sandboxed iframe.
 *
 * Features:
 * - Sandboxed execution via iframe postMessage
 * - Console.log output capture
 * - 30-second timeout enforcement
 * - Blocked dangerous APIs (fetch, localStorage, etc.)
 * - Beginner-friendly error messages
 */

import type { ExecutionResult, ExecutionLimits, CodeExecutor } from './types';
import { DEFAULT_EXECUTION_LIMITS } from './types';

/**
 * Sandbox iframe HTML template
 *
 * This creates a minimal HTML document that:
 * - Blocks dangerous globals
 * - Proxies console.log to parent window
 * - Provides readline() for input
 * - Reports completion/errors via postMessage
 */
const SANDBOX_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body>
<script>
(function() {
  'use strict';

  // Blocked globals for security
  const BLOCKED = [
    'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource',
    'Worker', 'SharedWorker', 'ServiceWorker',
    'indexedDB', 'caches', 'localStorage', 'sessionStorage',
    'document', 'window', 'parent', 'top', 'opener', 'frames',
    'alert', 'confirm', 'prompt', 'print',
    'requestAnimationFrame', 'cancelAnimationFrame',
    'setInterval', 'clearInterval',
    'importScripts', 'eval',
  ];

  // Block dangerous globals
  for (const name of BLOCKED) {
    try {
      Object.defineProperty(globalThis, name, {
        get: function() {
          throw new Error(name + ' is not available in the sandbox');
        },
        set: function() {
          throw new Error(name + ' cannot be modified in the sandbox');
        },
        configurable: false
      });
    } catch (e) {
      // Some properties may not be configurable
    }
  }

  // Input handling
  let inputLines = [];
  let inputIndex = 0;

  // Override console
  const originalConsole = console;
  globalThis.console = {
    log: function(...args) {
      parent.postMessage({
        type: 'stdout',
        data: args.map(function(arg) {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch (e) {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' ') + '\\n'
      }, '*');
    },
    error: function(...args) {
      parent.postMessage({
        type: 'stderr',
        data: args.map(String).join(' ') + '\\n'
      }, '*');
    },
    warn: function(...args) {
      parent.postMessage({
        type: 'stderr',
        data: 'Warning: ' + args.map(String).join(' ') + '\\n'
      }, '*');
    },
    info: function(...args) {
      this.log.apply(this, args);
    },
    debug: function(...args) {
      this.log.apply(this, args);
    },
    clear: function() {},
    table: function(data) {
      this.log(JSON.stringify(data, null, 2));
    }
  };

  // Provide readline function for input
  globalThis.readline = function() {
    if (inputIndex < inputLines.length) {
      return inputLines[inputIndex++];
    }
    return '';
  };

  // Provide input variable
  globalThis.input = '';

  // Limited setTimeout (max 5 seconds)
  const originalSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = function(fn, ms) {
    if (typeof ms === 'number' && ms > 5000) {
      ms = 5000;
    }
    return originalSetTimeout.call(globalThis, fn, ms || 0);
  };

  // Listen for execution requests
  globalThis.addEventListener('message', function(event) {
    if (!event.data || event.data.type !== 'execute') return;

    const { code, input: inputData } = event.data;

    // Set up input
    globalThis.input = inputData || '';
    inputLines = (inputData || '').split('\\n');
    inputIndex = 0;

    try {
      // Execute user code
      const result = (function() {
        'use strict';
        return eval(code);
      })();

      // If the code returns a value, log it
      if (result !== undefined) {
        console.log(result);
      }

      parent.postMessage({ type: 'complete', exitCode: 0 }, '*');
    } catch (error) {
      parent.postMessage({
        type: 'error',
        data: error.message || String(error),
        stack: error.stack
      }, '*');
    }
  });

  // Signal ready
  parent.postMessage({ type: 'ready' }, '*');
})();
</script>
</body>
</html>
`;

/**
 * JavaScript code executor using sandboxed iframe
 */
export class JavaScriptRunner implements CodeExecutor {
  readonly language = 'javascript' as const;
  private iframe: HTMLIFrameElement | null = null;
  private isInitialized = false;

  get isReady(): boolean {
    return this.isInitialized && this.iframe !== null;
  }

  /**
   * Initialize the sandbox iframe
   */
  async initialize(): Promise<void> {
    if (this.isReady) return;

    // Create sandbox iframe
    this.iframe = document.createElement('iframe');
    this.iframe.style.display = 'none';
    this.iframe.setAttribute('sandbox', 'allow-scripts');

    // Set CSP via srcdoc
    this.iframe.srcdoc = SANDBOX_HTML;

    // Wait for iframe to be ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Sandbox initialization timed out'));
      }, 5000);

      const handleMessage = (event: MessageEvent) => {
        if (event.source === this.iframe?.contentWindow && event.data?.type === 'ready') {
          clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);
          resolve();
        }
      };

      window.addEventListener('message', handleMessage);
      if (this.iframe) {
        document.body.appendChild(this.iframe);
      }
    });

    this.isInitialized = true;
  }

  /**
   * Execute JavaScript code
   */
  async execute(
    code: string,
    input: string = '',
    limits: ExecutionLimits = DEFAULT_EXECUTION_LIMITS
  ): Promise<ExecutionResult> {
    const startTime = performance.now();

    try {
      // Reinitialize iframe for isolation (fresh sandbox each time)
      await this.recreateIframe();

      let stdout = '';
      let stderr = '';

      return await new Promise<ExecutionResult>((resolve) => {
        // Set up timeout
        const timeoutId = setTimeout(() => {
          this.terminateExecution();
          resolve({
            success: false,
            output: stdout,
            error: `Execution timed out after ${limits.timeoutMs / 1000} seconds. Your code might have an infinite loop.`,
            exitCode: 124,
            executionTimeMs: limits.timeoutMs,
            memoryUsedBytes: 0,
          });
        }, limits.timeoutMs);

        // Listen for messages from sandbox
        const handleMessage = (event: MessageEvent) => {
          if (event.source !== this.iframe?.contentWindow) return;

          const { type, data, exitCode, stack } = event.data;

          switch (type) {
            case 'stdout':
              stdout += data;
              // Check output limit
              if (stdout.length > limits.maxOutputChars) {
                stdout = stdout.slice(0, limits.maxOutputChars) + '\n[Output truncated]';
                clearTimeout(timeoutId);
                window.removeEventListener('message', handleMessage);
                this.terminateExecution();
                resolve({
                  success: true,
                  output: stdout,
                  exitCode: 0,
                  executionTimeMs: performance.now() - startTime,
                  memoryUsedBytes: 0,
                });
              }
              break;

            case 'stderr':
              stderr += data;
              break;

            case 'complete':
              clearTimeout(timeoutId);
              window.removeEventListener('message', handleMessage);
              resolve({
                success: true,
                output: stdout,
                error: stderr || undefined,
                exitCode: exitCode || 0,
                executionTimeMs: performance.now() - startTime,
                memoryUsedBytes: 0,
              });
              break;

            case 'error':
              clearTimeout(timeoutId);
              window.removeEventListener('message', handleMessage);
              resolve({
                success: false,
                output: stdout,
                error: this.formatError(data, stack),
                exitCode: 1,
                executionTimeMs: performance.now() - startTime,
                memoryUsedBytes: 0,
              });
              break;
          }
        };

        window.addEventListener('message', handleMessage);

        // Send code to sandbox
        this.iframe?.contentWindow?.postMessage(
          { type: 'execute', code, input },
          '*'
        );
      });
    } catch (error) {
      return {
        success: false,
        output: '',
        error: this.formatError(error instanceof Error ? error.message : String(error)),
        exitCode: 1,
        executionTimeMs: performance.now() - startTime,
        memoryUsedBytes: 0,
      };
    }
  }

  /**
   * Reset the sandbox (recreate iframe)
   */
  async reset(): Promise<void> {
    await this.recreateIframe();
  }

  /**
   * Dispose of the runner
   */
  dispose(): void {
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
    this.isInitialized = false;
  }

  /**
   * Recreate the iframe for fresh isolation
   */
  private async recreateIframe(): Promise<void> {
    if (this.iframe) {
      this.iframe.remove();
    }
    this.isInitialized = false;
    await this.initialize();
  }

  /**
   * Terminate current execution
   */
  private terminateExecution(): void {
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
    this.isInitialized = false;
  }

  /**
   * Format JavaScript errors for display
   */
  private formatError(message: string, stack?: string): string {
    // Extract line number from stack
    const lineMatch = stack?.match(/<anonymous>:(\d+):(\d+)/);
    const lineNumber = lineMatch ? parseInt(lineMatch[1]) : null;
    const lineInfo = lineNumber ? ` on line ${lineNumber}` : '';

    // Simplify common errors for beginners
    if (message.includes('is not defined')) {
      const varMatch = message.match(/(\w+) is not defined/);
      if (varMatch) {
        return `Reference Error: '${varMatch[1]}' is not defined. Did you spell it correctly? Remember to declare variables with let, const, or var.`;
      }
    }

    if (message.includes('is not a function')) {
      const funcMatch = message.match(/(\w+) is not a function/);
      if (funcMatch) {
        return `Type Error${lineInfo}: '${funcMatch[1]}' is not a function. Check that you are calling a function correctly.`;
      }
    }

    if (message.includes('Cannot read properties of undefined') ||
        message.includes('Cannot read property')) {
      return `Type Error${lineInfo}: Trying to access a property of undefined. Make sure the variable exists and has a value.`;
    }

    if (message.includes('Cannot read properties of null') ||
        message.includes('null is not an object')) {
      return `Type Error${lineInfo}: Trying to use null as an object. Check that your variable is not null.`;
    }

    if (message.includes('Unexpected token')) {
      return `Syntax Error${lineInfo}: Unexpected token in your code. Check for typos, missing brackets, or semicolons.`;
    }

    if (message.includes('Unexpected end of input')) {
      return `Syntax Error${lineInfo}: Your code seems incomplete. Check for missing closing brackets or quotes.`;
    }

    if (message.includes('not available in the sandbox')) {
      const blockedMatch = message.match(/(\w+) is not available/);
      if (blockedMatch) {
        return `Security Error: '${blockedMatch[1]}' is not available in the code exercise environment.`;
      }
    }

    // Return cleaned message
    return message;
  }
}

// Export singleton instance
export const javascriptRunner = new JavaScriptRunner();
