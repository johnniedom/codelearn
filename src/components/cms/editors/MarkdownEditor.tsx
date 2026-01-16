'use client';

/**
 * MarkdownEditor Component
 *
 * CodeMirror-based markdown editor with a formatting toolbar.
 *
 * Features:
 * - Markdown syntax highlighting
 * - Toolbar for common formatting (bold, italic, heading, link, code)
 * - Configurable minimum height
 * - Accessible with proper ARIA labels
 */

import { useEffect, useRef, useCallback } from 'react';
import { EditorState, type Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  highlightActiveLine,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  indentOnInput,
  bracketMatching,
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { markdown } from '@codemirror/lang-markdown';
import {
  Bold,
  Italic,
  Heading1,
  Link,
  Code,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// =============================================================================
// Types
// =============================================================================

interface MarkdownEditorProps {
  /** Current markdown content */
  value: string;
  /** Callback when content changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the editor */
  'aria-label'?: string;
}

// =============================================================================
// Theme
// =============================================================================

/**
 * Light theme matching CodeLearn design system
 */
const markdownEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#F9FAFB',
      color: '#111827',
      fontSize: '14px',
    },
    '.cm-content': {
      caretColor: '#2563EB',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      padding: '12px',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#2563EB',
      borderLeftWidth: '2px',
    },
    '.cm-cursor': {
      borderLeftColor: '#2563EB',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: '#DBEAFE',
    },
    '.cm-gutters': {
      backgroundColor: '#F3F4F6',
      color: '#6B7280',
      borderRight: '1px solid #E5E7EB',
      minWidth: '44px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 8px 0 12px',
      minWidth: '32px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#DBEAFE',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(37, 99, 235, 0.05)',
    },
    '.cm-scroller': {
      overflow: 'auto',
    },
  },
  { dark: false }
);

/**
 * Content attributes for mobile optimization
 */
const contentAttributes = EditorView.contentAttributes.of({
  autocapitalize: 'off',
  autocorrect: 'off',
  spellcheck: 'false',
});

// =============================================================================
// Toolbar Button Configuration
// =============================================================================

interface ToolbarButton {
  id: string;
  label: string;
  icon: typeof Bold;
  prefix: string;
  suffix: string;
  blockLevel?: boolean;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  {
    id: 'bold',
    label: 'Bold',
    icon: Bold,
    prefix: '**',
    suffix: '**',
  },
  {
    id: 'italic',
    label: 'Italic',
    icon: Italic,
    prefix: '*',
    suffix: '*',
  },
  {
    id: 'heading',
    label: 'Heading',
    icon: Heading1,
    prefix: '## ',
    suffix: '',
    blockLevel: true,
  },
  {
    id: 'link',
    label: 'Link',
    icon: Link,
    prefix: '[',
    suffix: '](url)',
  },
  {
    id: 'code',
    label: 'Inline Code',
    icon: Code,
    prefix: '`',
    suffix: '`',
  },
];

// =============================================================================
// Component
// =============================================================================

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = 300,
  className,
  'aria-label': ariaLabel = 'Markdown editor',
}: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  // Store onChange in ref to avoid recreating editor on every render
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  /**
   * Insert markdown syntax at the current cursor position
   */
  const insertMarkdown = useCallback((prefix: string, suffix: string, blockLevel?: boolean) => {
    const view = editorViewRef.current;
    if (!view) return;

    const { state } = view;
    const { from, to } = state.selection.main;
    const selectedText = state.sliceDoc(from, to);

    let insertText: string;
    let cursorOffset: number;

    if (selectedText) {
      // Wrap selected text with markdown syntax
      insertText = `${prefix}${selectedText}${suffix}`;
      cursorOffset = prefix.length + selectedText.length + suffix.length;
    } else {
      // Insert placeholder text
      const placeholderText = blockLevel ? 'Heading' : 'text';
      insertText = `${prefix}${placeholderText}${suffix}`;
      // Position cursor to select the placeholder
      cursorOffset = prefix.length;
    }

    // Handle block-level elements (ensure they start on a new line)
    let finalFrom = from;
    if (blockLevel && from > 0) {
      const lineStart = state.doc.lineAt(from).from;
      if (lineStart !== from) {
        insertText = '\n' + insertText;
        cursorOffset += 1;
      }
    }

    view.dispatch({
      changes: { from: finalFrom, to, insert: insertText },
      selection: selectedText
        ? { anchor: finalFrom + cursorOffset }
        : { anchor: finalFrom + cursorOffset, head: finalFrom + cursorOffset + (blockLevel ? 7 : 4) },
    });

    view.focus();
  }, []);

  /**
   * Create the CodeMirror editor instance
   */
  const createEditor = useCallback(() => {
    if (!containerRef.current) return;

    // Destroy existing editor if any
    if (editorViewRef.current) {
      editorViewRef.current.destroy();
    }

    // Build extensions array
    const extensions: Extension[] = [
      // Core functionality
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      highlightActiveLine(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),

      // Keymaps
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        indentWithTab,
      ]),

      // Markdown language support
      markdown(),

      // Theme
      markdownEditorTheme,
      contentAttributes,

      // Update listener for onChange callback
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString();
          onChangeRef.current?.(newValue);
        }
      }),

      // Placeholder text
      ...(placeholder
        ? [EditorView.contentAttributes.of({ 'data-placeholder': placeholder })]
        : []),

      // Min height constraint
      EditorView.theme({
        '.cm-scroller': {
          minHeight: `${minHeight}px`,
        },
        '.cm-content': {
          minHeight: `${minHeight - 24}px`, // Account for padding
        },
      }),
    ];

    // Create editor state
    const state = EditorState.create({
      doc: value,
      extensions,
    });

    // Create editor view
    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    editorViewRef.current = view;
  }, [value, placeholder, minHeight]);

  /**
   * Initialize editor on mount
   */
  useEffect(() => {
    createEditor();

    return () => {
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
        editorViewRef.current = null;
      }
    };
    // Only run on mount - we don't want to recreate on value change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Sync external value changes to editor
   * Only update if the value differs from editor content to avoid cursor jumps
   */
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (currentContent !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div className={cn('flex flex-col rounded-md border border-border', className)}>
      {/* Toolbar */}
      <div
        className="flex items-center gap-0.5 sm:gap-1 border-b border-border bg-surface px-2 py-1.5 overflow-x-auto"
        role="toolbar"
        aria-label="Markdown formatting toolbar"
      >
        {TOOLBAR_BUTTONS.map((button) => {
          const Icon = button.icon;
          return (
            <Button
              key={button.id}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown(button.prefix, button.suffix, button.blockLevel)}
              aria-label={button.label}
              title={button.label}
              className="h-10 w-10 sm:h-8 sm:w-8 p-0 shrink-0"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </Button>
          );
        })}
      </div>

      {/* Editor container */}
      <div
        ref={containerRef}
        className={cn(
          'w-full overflow-hidden',
          'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1'
        )}
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline="true"
        data-testid="markdown-editor"
      />
    </div>
  );
}

export type { MarkdownEditorProps };
export default MarkdownEditor;
