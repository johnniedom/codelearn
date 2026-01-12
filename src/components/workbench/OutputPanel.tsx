/**
 * OutputPanel Component
 *
 * Displays stdout, stderr, and error messages from code execution.
 *
 * Features:
 * - Scrollable output area
 * - Color-coded stdout/stderr/errors
 * - Clear button
 * - Copy to clipboard
 * - Accessible with live region for screen readers
 */

import { useState, useRef, useEffect } from 'react';
import { Copy, Trash2, Check, AlertCircle, Terminal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

export type OutputType = 'stdout' | 'stderr' | 'error' | 'info';

export interface OutputEntry {
  id: string;
  type: OutputType;
  content: string;
  timestamp: Date;
}

interface OutputPanelProps {
  /** Output entries to display */
  entries: OutputEntry[];
  /** Whether code is currently executing */
  isRunning?: boolean;
  /** Callback to clear output */
  onClear?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Maximum height in pixels */
  maxHeight?: number;
  /** Accessible label */
  'aria-label'?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function getTypeStyles(type: OutputType): string {
  switch (type) {
    case 'stdout':
      return 'text-text';
    case 'stderr':
      return 'text-warning';
    case 'error':
      return 'text-error';
    case 'info':
      return 'text-primary';
    default:
      return 'text-text';
  }
}

function getTypePrefix(type: OutputType): string | null {
  switch (type) {
    case 'stderr':
      return 'stderr: ';
    case 'error':
      return 'Error: ';
    case 'info':
      return '';
    default:
      return null;
  }
}

// =============================================================================
// Component
// =============================================================================

export function OutputPanel({
  entries,
  isRunning = false,
  onClear,
  className,
  maxHeight = 300,
  'aria-label': ariaLabel = 'Code output',
}: OutputPanelProps) {
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  /**
   * Copy all output to clipboard
   */
  const handleCopy = async () => {
    const text = entries.map((e) => e.content).join('');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  /**
   * Format output content with line numbers for errors
   */
  const formatContent = (entry: OutputEntry): string => {
    const prefix = getTypePrefix(entry.type);
    if (prefix !== null) {
      return prefix + entry.content;
    }
    return entry.content;
  };

  const hasOutput = entries.length > 0;
  const hasErrors = entries.some((e) => e.type === 'error' || e.type === 'stderr');

  return (
    <div
      className={cn(
        'flex flex-col rounded-md border border-border bg-neutral-900',
        className
      )}
      role="region"
      aria-label={ariaLabel}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-neutral-800 px-3 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-neutral-400" />
          <span className="text-sm font-medium text-neutral-200">Output</span>
          {isRunning && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
              Running...
            </span>
          )}
          {!isRunning && hasErrors && (
            <AlertCircle className="h-4 w-4 text-error" aria-hidden="true" />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!hasOutput}
            className="h-7 px-2 text-neutral-400 hover:text-neutral-200"
            aria-label={copied ? 'Copied' : 'Copy output'}
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={!hasOutput}
            className="h-7 px-2 text-neutral-400 hover:text-neutral-200"
            aria-label="Clear output"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Output Content */}
      <div
        ref={scrollRef}
        className="overflow-auto p-3 font-mono text-sm"
        style={{ maxHeight: `${maxHeight}px`, minHeight: '100px' }}
        role="log"
        aria-live="polite"
        aria-atomic="false"
      >
        {!hasOutput && !isRunning && (
          <p className="text-neutral-500">
            Output will appear here when you run your code.
          </p>
        )}

        {entries.map((entry) => (
          <pre
            key={entry.id}
            className={cn(
              'whitespace-pre-wrap break-words',
              getTypeStyles(entry.type)
            )}
          >
            {formatContent(entry)}
          </pre>
        ))}

        {isRunning && entries.length === 0 && (
          <p className="text-neutral-500">Waiting for output...</p>
        )}
      </div>
    </div>
  );
}

/**
 * Create an output entry helper
 */
export function createOutputEntry(
  type: OutputType,
  content: string
): OutputEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    content,
    timestamp: new Date(),
  };
}

export default OutputPanel;
