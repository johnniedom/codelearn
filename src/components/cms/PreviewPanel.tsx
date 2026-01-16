'use client';

/**
 * PreviewPanel Component
 *
 * A container for previewing rendered markdown content.
 *
 * Features:
 * - Uses MarkdownRenderer for content display
 * - Scrollable container with border
 * - Header label indicating preview mode
 * - Responsive height with overflow handling
 */

import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/content/MarkdownRenderer';
import { Eye } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface PreviewPanelProps {
  /** Markdown content to preview */
  content: string;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PreviewPanel({ content, className }: PreviewPanelProps) {
  const hasContent = content.trim().length > 0;

  return (
    <div
      className={cn(
        'flex flex-col rounded-md border border-border bg-background',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-2 border-b border-border bg-surface px-3 py-2',
          'text-sm font-medium text-text-muted'
        )}
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
        <span>Preview</span>
      </div>

      {/* Content area */}
      <div
        className="flex-1 overflow-auto p-4"
        role="region"
        aria-label="Content preview"
      >
        {hasContent ? (
          <MarkdownRenderer content={content} />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center">
            <p className="text-sm text-text-muted">
              Start typing to see a preview...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export type { PreviewPanelProps };
export default PreviewPanel;
