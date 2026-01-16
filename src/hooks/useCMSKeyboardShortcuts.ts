import { useEffect, useCallback, useRef } from 'react';

/**
 * CMS Keyboard Shortcuts Hook
 *
 * Provides keyboard shortcuts for common CMS operations.
 * All shortcuts use Ctrl (Windows/Linux) or Cmd (Mac) as modifier.
 *
 * Shortcuts:
 * - Ctrl/Cmd + S: Save current draft
 * - Ctrl/Cmd + P: Toggle preview panel
 * - Ctrl/Cmd + Shift + L: Create new lesson
 * - Ctrl/Cmd + Shift + Q: Create new quiz
 * - Ctrl/Cmd + Shift + E: Create new exercise
 *
 * All shortcuts prevent default browser behavior to avoid conflicts
 * (e.g., Ctrl+S saving the page, Ctrl+P opening print dialog).
 */

// =============================================================================
// Types
// =============================================================================

export interface CMSShortcuts {
  /** Called when Ctrl/Cmd + S is pressed */
  onSave?: () => void;
  /** Called when Ctrl/Cmd + P is pressed */
  onPreviewToggle?: () => void;
  /** Called when Ctrl/Cmd + Shift + L is pressed */
  onNewLesson?: () => void;
  /** Called when Ctrl/Cmd + Shift + Q is pressed */
  onNewQuiz?: () => void;
  /** Called when Ctrl/Cmd + Shift + E is pressed */
  onNewExercise?: () => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if the event uses the platform-appropriate modifier key.
 * Uses Cmd on Mac, Ctrl on other platforms.
 */
function hasModifierKey(event: KeyboardEvent): boolean {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  return isMac ? event.metaKey : event.ctrlKey;
}

// =============================================================================
// Hook
// =============================================================================

export function useCMSKeyboardShortcuts(shortcuts: CMSShortcuts): void {
  // Use refs to avoid stale closure issues with callbacks
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Require modifier key for all shortcuts
    if (!hasModifierKey(event)) {
      return;
    }

    const key = event.key.toLowerCase();

    // ==========================================================================
    // Ctrl/Cmd + S: Save
    // ==========================================================================
    if (key === 's' && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      shortcutsRef.current.onSave?.();
      return;
    }

    // ==========================================================================
    // Ctrl/Cmd + P: Toggle Preview
    // ==========================================================================
    if (key === 'p' && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      shortcutsRef.current.onPreviewToggle?.();
      return;
    }

    // ==========================================================================
    // Ctrl/Cmd + Shift + L: New Lesson
    // ==========================================================================
    if (key === 'l' && event.shiftKey && !event.altKey) {
      event.preventDefault();
      shortcutsRef.current.onNewLesson?.();
      return;
    }

    // ==========================================================================
    // Ctrl/Cmd + Shift + Q: New Quiz
    // ==========================================================================
    if (key === 'q' && event.shiftKey && !event.altKey) {
      event.preventDefault();
      shortcutsRef.current.onNewQuiz?.();
      return;
    }

    // ==========================================================================
    // Ctrl/Cmd + Shift + E: New Exercise
    // ==========================================================================
    if (key === 'e' && event.shiftKey && !event.altKey) {
      event.preventDefault();
      shortcutsRef.current.onNewExercise?.();
      return;
    }
  }, []);

  useEffect(() => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Add event listener with capture to handle before other handlers
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleKeyDown]);
}

export default useCMSKeyboardShortcuts;
