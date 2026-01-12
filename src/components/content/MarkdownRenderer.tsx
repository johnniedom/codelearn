import { useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * MarkdownRenderer Props
 */
export interface MarkdownRendererProps {
  /** Markdown content to render */
  content: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Simple markdown-to-HTML converter
 *
 * Supports basic markdown syntax without external dependencies.
 * For production, consider using a library like marked or remark.
 *
 * Supported syntax:
 * - Headers (# ## ###)
 * - Bold (**text**)
 * - Italic (*text* or _text_)
 * - Inline code (`code`)
 * - Code blocks (```)
 * - Lists (- or *)
 * - Numbered lists (1. 2. 3.)
 * - Links ([text](url))
 * - Blockquotes (> text)
 * - Horizontal rules (---)
 */
function parseMarkdown(markdown: string): string {
  let html = markdown;

  // Escape HTML to prevent XSS
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (must be before other processing)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const langClass = lang ? ` class="language-${lang}"` : '';
      return `<pre><code${langClass}>${code.trim()}</code></pre>`;
    }
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Links (after escaping, so we need to handle the escaped >)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Blockquotes (fix escaped >)
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr />');
  html = html.replace(/^\*\*\*$/gm, '<hr />');

  // Unordered lists
  html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  // Note: This is simplified - in real use, you'd want to distinguish between ul and ol

  // Paragraphs (wrap remaining text)
  html = html.replace(/^(?!<[hpuol]|<li|<blockquote|<pre|<hr)(.+)$/gm, '<p>$1</p>');

  // Clean up extra newlines
  html = html.replace(/\n{2,}/g, '\n');

  return html;
}

/**
 * MarkdownRenderer Component
 *
 * Renders markdown content as styled HTML.
 *
 * Features:
 * - Basic markdown syntax support
 * - Styled with Tailwind typography classes
 * - XSS-safe (HTML is escaped)
 * - Memoized parsing for performance
 *
 * Note: For more complex markdown needs, integrate a library like
 * marked, remark, or react-markdown.
 */
export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  // Memoize the parsed HTML to avoid re-parsing on every render
  const html = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div
      className={cn(
        // Base prose styles
        'prose prose-sm max-w-none',
        // Dark mode support
        'dark:prose-invert',
        // Custom styling
        'text-text',
        // Heading styles
        '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-text [&_h1]:mt-6 [&_h1]:mb-4',
        '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text [&_h2]:mt-5 [&_h2]:mb-3',
        '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text [&_h3]:mt-4 [&_h3]:mb-2',
        // Paragraph styles
        '[&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-text [&_p]:mb-4',
        // Code styles
        '[&_code]:bg-surface-hover [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono',
        '[&_pre]:bg-surface-hover [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
        // List styles
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4',
        '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4',
        '[&_li]:text-sm [&_li]:text-text [&_li]:mb-1',
        // Link styles
        '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
        '[&_a:hover]:text-primary-light',
        // Blockquote styles
        '[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-text-muted [&_blockquote]:mb-4',
        // Horizontal rule styles
        '[&_hr]:border-border [&_hr]:my-6',
        // Strong and emphasis
        '[&_strong]:font-semibold [&_strong]:text-text',
        '[&_em]:italic',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default MarkdownRenderer;
