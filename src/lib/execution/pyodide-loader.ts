/**
 * Pyodide Lazy Loader
 *
 * Handles lazy loading of Pyodide (~25MB) for Python execution.
 *
 * Features:
 * - Lazy loading on first Python exercise
 * - Storage quota checking before download
 * - Progress reporting during download
 * - Service Worker caching after first load
 * - Memory pressure detection
 */

import type { PyodideInterface } from 'pyodide';
import type {
  PyodideLoadProgress,
  PyodideLoadOptions,
  MemoryCheckResult,
  MemoryPressureLevel,
} from './types';

// Pyodide CDN URL - cached by service worker after first load
const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.29.1/full/';

// Estimated Pyodide size for progress calculation
const ESTIMATED_PYODIDE_SIZE_BYTES = 25 * 1024 * 1024; // ~25MB

// Minimum storage required (in bytes)
const MIN_REQUIRED_STORAGE = 50 * 1024 * 1024; // 50MB for safety margin

// Singleton instance
let pyodideInstance: PyodideInterface | null = null;
let loadPromise: Promise<PyodideInterface> | null = null;
let isLoaded = false;
let loadCancelled = false;

/**
 * Check device memory availability
 *
 * Warns if < 3GB: "Close other apps first"
 */
export function checkMemoryPressure(): MemoryCheckResult {
  // navigator.deviceMemory is approximate RAM in GB
  const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;
  const availableGB = deviceMemory ?? 4; // Assume 4GB if not available

  let pressure: MemoryPressureLevel = 'nominal';
  let warning: string | undefined;
  let canLoadPyodide = true;

  if (availableGB < 2) {
    pressure = 'critical';
    warning = 'Your device has very limited memory. Pyodide may not work properly.';
    canLoadPyodide = false;
  } else if (availableGB < 3) {
    pressure = 'low';
    warning = 'Close other apps first to ensure smooth Python execution.';
    canLoadPyodide = true;
  }

  return {
    availableGB,
    pressure,
    canLoadPyodide,
    warning,
  };
}

/**
 * Check storage quota before downloading Pyodide
 */
export async function checkStorageQuota(): Promise<{
  hasSpace: boolean;
  availableBytes: number;
  usedBytes: number;
  quotaBytes: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usedBytes = estimate.usage ?? 0;
      const quotaBytes = estimate.quota ?? 0;
      const availableBytes = quotaBytes - usedBytes;

      return {
        hasSpace: availableBytes >= MIN_REQUIRED_STORAGE,
        availableBytes,
        usedBytes,
        quotaBytes,
      };
    } catch {
      // Storage API not available, assume we have space
      return { hasSpace: true, availableBytes: 0, usedBytes: 0, quotaBytes: 0 };
    }
  }

  return { hasSpace: true, availableBytes: 0, usedBytes: 0, quotaBytes: 0 };
}

/**
 * Check if Pyodide is already cached in the browser
 */
export async function isPyodideCached(): Promise<boolean> {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cache = await caches.open('pyodide-v1');
    const response = await cache.match(`${PYODIDE_CDN_URL}pyodide.js`);
    return !!response;
  } catch {
    return false;
  }
}

/**
 * Check if Pyodide is loaded and ready
 */
export function isPyodideLoaded(): boolean {
  return isLoaded && pyodideInstance !== null;
}

/**
 * Get the loaded Pyodide instance
 */
export function getPyodideInstance(): PyodideInterface | null {
  return pyodideInstance;
}

/**
 * Cancel an in-progress Pyodide load
 */
export function cancelPyodideLoad(): void {
  loadCancelled = true;
}

/**
 * Load Pyodide with progress reporting
 *
 * This is the main entry point for loading Pyodide.
 * It handles:
 * - Memory pressure checking
 * - Storage quota verification
 * - Progress reporting during load
 * - Singleton pattern (only loads once)
 */
export async function loadPyodide(
  options: PyodideLoadOptions = {}
): Promise<PyodideInterface> {
  const { onProgress } = options;

  // Already loaded - return immediately
  if (isLoaded && pyodideInstance) {
    onProgress?.({
      stage: 'ready',
      progress: 100,
      message: 'Python runtime ready',
    });
    return pyodideInstance;
  }

  // Already loading - wait for existing promise
  if (loadPromise) {
    return loadPromise;
  }

  // Reset cancellation flag
  loadCancelled = false;

  // Start loading
  loadPromise = performLoad(onProgress);

  try {
    const result = await loadPromise;
    return result;
  } catch (error) {
    // Clear promise on error so retry is possible
    loadPromise = null;
    throw error;
  }
}

/**
 * Internal load implementation
 */
async function performLoad(
  onProgress?: (progress: PyodideLoadProgress) => void
): Promise<PyodideInterface> {
  try {
    // Stage 1: Check prerequisites
    onProgress?.({
      stage: 'checking',
      progress: 0,
      message: 'Checking device compatibility...',
    });

    // Check memory
    const memoryCheck = checkMemoryPressure();
    if (!memoryCheck.canLoadPyodide) {
      throw new Error(memoryCheck.warning ?? 'Insufficient device memory for Python runtime');
    }

    // Check storage
    const storageCheck = await checkStorageQuota();
    if (!storageCheck.hasSpace) {
      throw new Error(
        'Not enough storage space for Python runtime. Please free up at least 50MB.'
      );
    }

    if (loadCancelled) {
      throw new Error('Loading cancelled');
    }

    // Check if already cached
    const isCached = await isPyodideCached();

    onProgress?.({
      stage: isCached ? 'loading' : 'downloading',
      progress: 10,
      message: isCached ? 'Loading Python runtime from cache...' : 'Downloading Python runtime...',
    });

    if (loadCancelled) {
      throw new Error('Loading cancelled');
    }

    // Stage 2: Load Pyodide
    // Dynamic import to ensure we get the correct module
    const { loadPyodide: loadPyodideFunc } = await import('pyodide');

    // Simulate progress during load (Pyodide doesn't provide native progress)
    let currentProgress = 10;
    const progressInterval = setInterval(() => {
      if (currentProgress < 85) {
        currentProgress += 5;
        onProgress?.({
          stage: 'downloading',
          progress: currentProgress,
          downloadedBytes: Math.floor(
            (currentProgress / 100) * ESTIMATED_PYODIDE_SIZE_BYTES
          ),
          totalBytes: ESTIMATED_PYODIDE_SIZE_BYTES,
          message: isCached
            ? 'Loading Python runtime...'
            : `Downloading Python runtime (${Math.round(currentProgress)}%)...`,
        });
      }
    }, 500);

    try {
      pyodideInstance = await loadPyodideFunc({
        indexURL: PYODIDE_CDN_URL,
      });

      clearInterval(progressInterval);

      if (loadCancelled) {
        // Clean up if cancelled during load
        pyodideInstance = null;
        throw new Error('Loading cancelled');
      }

      // Stage 3: Initialize
      onProgress?.({
        stage: 'loading',
        progress: 90,
        message: 'Initializing Python environment...',
      });

      // Pre-configure the Python environment
      await pyodideInstance.runPythonAsync(`
import sys
import io

# Set up custom stdout/stderr capture
class OutputCapture:
    def __init__(self):
        self.buffer = io.StringIO()

    def write(self, text):
        self.buffer.write(text)

    def flush(self):
        pass

    def get_output(self):
        return self.buffer.getvalue()

    def reset(self):
        self.buffer = io.StringIO()
      `);

      isLoaded = true;

      onProgress?.({
        stage: 'ready',
        progress: 100,
        message: 'Python runtime ready',
      });

      return pyodideInstance;
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  } catch (error) {
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'Failed to load Python runtime',
    });
    throw error;
  }
}

/**
 * Unload Pyodide and free memory
 *
 * Use this when navigating away from code exercises to free memory.
 */
export function unloadPyodide(): void {
  pyodideInstance = null;
  loadPromise = null;
  isLoaded = false;
}

/**
 * Monitor memory pressure during execution
 *
 * Returns true if memory pressure is detected and execution should be terminated.
 */
export function detectMemoryPressure(): boolean {
  // Check performance.memory if available (Chrome only)
  const performance = window.performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };

  if (performance.memory) {
    const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
    const usageRatio = usedJSHeapSize / jsHeapSizeLimit;

    // Warn at 80% heap usage
    return usageRatio > 0.8;
  }

  return false;
}
