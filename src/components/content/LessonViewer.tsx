import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AudioPlayer } from './AudioPlayer';
import type {
  Lesson,
  ContentBlock,
  TextBlock,
  CodeBlock,
  ImageBlock,
  AudioBlock,
  CalloutBlock,
  DividerBlock,
} from '@/types/content';
import { getLocalizedText } from '@/types/content';

/**
 * LessonViewer Props
 */
export interface LessonViewerProps {
  /** The lesson to display */
  lesson: Lesson;
  /** Base URL for assets (package slug path) */
  assetBaseUrl: string;
  /** Whether the lesson is already completed */
  isCompleted?: boolean;
  /** Called when the back button is pressed */
  onBack?: () => void;
  /** Called when the next button is pressed */
  onNext?: () => void;
  /** Called when the lesson is marked as complete */
  onComplete?: () => void;
  /** Current locale for translations */
  locale?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Callout component for tips, warnings, etc.
 */
function Callout({
  block,
  locale,
}: {
  block: CalloutBlock;
  locale?: string;
}) {
  const [isCollapsed, setIsCollapsed] = useState(block.defaultCollapsed ?? false);

  const typeStyles = {
    info: 'border-primary bg-primary/5 text-primary',
    tip: 'border-success bg-success/5 text-success',
    warning: 'border-warning bg-warning/5 text-warning',
    error: 'border-error bg-error/5 text-error',
    example: 'border-text-muted bg-surface-hover text-text-muted',
  };

  const content = (
    <div className={cn('rounded-lg border-l-4 p-4', typeStyles[block.calloutType])}>
      {block.title && (
        <div className="mb-2 font-semibold">
          {getLocalizedText(block.title, locale)}
        </div>
      )}
      <div className="text-sm text-text">
        {getLocalizedText(block.content, locale)}
      </div>
    </div>
  );

  if (block.collapsible) {
    return (
      <details open={!isCollapsed} className="mb-4">
        <summary
          className="cursor-pointer font-medium text-text"
          onClick={(e) => {
            e.preventDefault();
            setIsCollapsed(!isCollapsed);
          }}
        >
          {getLocalizedText(block.title, locale) || block.calloutType}
        </summary>
        <div className="mt-2">{content}</div>
      </details>
    );
  }

  return <div className="mb-4">{content}</div>;
}

/**
 * Code display component
 */
function CodeDisplay({
  block,
  locale,
}: {
  block: CodeBlock;
  locale?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(block.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="mb-4">
      <div className="overflow-hidden rounded-lg border border-border bg-surface-hover">
        {/* Header with filename and copy button */}
        {(block.filename || block.allowCopy) && (
          <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
            {block.filename && (
              <span className="text-xs font-medium text-text-muted">
                {block.filename}
              </span>
            )}
            {block.allowCopy && (
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  'text-xs font-medium',
                  copied ? 'text-success' : 'text-text-muted hover:text-text'
                )}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
        )}

        {/* Code content */}
        <pre className="overflow-x-auto p-4">
          <code className="text-sm font-mono text-text">{block.code}</code>
        </pre>
      </div>

      {/* Caption */}
      {block.caption && (
        <p className="mt-2 text-center text-xs text-text-muted">
          {getLocalizedText(block.caption, locale)}
        </p>
      )}
    </div>
  );
}

/**
 * Image display component
 */
function ImageDisplay({
  block,
  assetBaseUrl,
  locale,
}: {
  block: ImageBlock;
  assetBaseUrl: string;
  locale?: string;
}) {
  const [isZoomed, setIsZoomed] = useState(false);

  const sizeClasses = {
    small: 'max-w-xs mx-auto',
    medium: 'max-w-md mx-auto',
    large: 'max-w-lg mx-auto',
    'full-width': 'w-full',
  };

  const imgSrc = `${assetBaseUrl}/${block.image.path}`;
  const altText = getLocalizedText(block.image.altText, locale) || 'Lesson image';

  return (
    <figure className={cn('mb-4', sizeClasses[block.size])}>
      <button
        type="button"
        onClick={() => block.zoomable && setIsZoomed(!isZoomed)}
        disabled={!block.zoomable}
        className={cn(
          'w-full overflow-hidden rounded-lg',
          block.zoomable && 'cursor-zoom-in hover:opacity-90'
        )}
      >
        <img
          src={imgSrc}
          alt={altText}
          className="h-auto w-full"
          loading="lazy"
        />
      </button>

      {/* Caption */}
      {block.caption && (
        <figcaption className="mt-2 text-center text-xs text-text-muted">
          {getLocalizedText(block.caption, locale)}
        </figcaption>
      )}

      {/* Zoom modal */}
      {isZoomed && block.zoomable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsZoomed(false)}
          role="dialog"
          aria-label="Zoomed image"
        >
          <img
            src={imgSrc}
            alt={altText}
            className="max-h-full max-w-full object-contain"
          />
          <span className="sr-only">Click to close</span>
        </div>
      )}
    </figure>
  );
}

/**
 * Render a content block based on its type
 */
function ContentBlockRenderer({
  block,
  assetBaseUrl,
  locale,
  onAudioTimeUpdate,
}: {
  block: ContentBlock;
  assetBaseUrl: string;
  locale?: string;
  onAudioTimeUpdate?: (blockId: string, time: number) => void;
}) {
  switch (block.type) {
    case 'text':
      return (
        <MarkdownRenderer
          content={getLocalizedText((block as TextBlock).markdown, locale)}
          className="mb-4"
        />
      );

    case 'code':
      return <CodeDisplay block={block as CodeBlock} locale={locale} />;

    case 'image':
      return (
        <ImageDisplay
          block={block as ImageBlock}
          assetBaseUrl={assetBaseUrl}
          locale={locale}
        />
      );

    case 'audio':
      const audioBlock = block as AudioBlock;
      return (
        <div className="mb-4">
          {audioBlock.title && (
            <p className="mb-2 text-sm font-medium text-text">
              {getLocalizedText(audioBlock.title, locale)}
            </p>
          )}
          <AudioPlayer
            src={`${assetBaseUrl}/${audioBlock.audio.path}`}
            title={getLocalizedText(audioBlock.title, locale) || 'Audio'}
            onTimeUpdate={(time) => onAudioTimeUpdate?.(block.id, time)}
          />
          {audioBlock.transcript && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-text-muted">
                Show transcript
              </summary>
              <p className="mt-2 text-xs text-text-muted">
                {getLocalizedText(audioBlock.transcript, locale)}
              </p>
            </details>
          )}
        </div>
      );

    case 'callout':
      return <Callout block={block as CalloutBlock} locale={locale} />;

    case 'divider':
      const dividerBlock = block as DividerBlock;
      return (
        <div className="my-6">
          {dividerBlock.label ? (
            <div className="flex items-center gap-4">
              <hr className="flex-1 border-border" />
              <span className="text-xs text-text-muted">
                {getLocalizedText(dividerBlock.label, locale)}
              </span>
              <hr className="flex-1 border-border" />
            </div>
          ) : (
            <hr className="border-border" />
          )}
        </div>
      );

    default:
      // For unsupported block types, show placeholder
      return (
        <div className="mb-4 rounded-lg border border-dashed border-border bg-surface-hover p-4 text-center">
          <span className="text-sm text-text-muted">
            Content block: {block.type}
          </span>
        </div>
      );
  }
}

/**
 * LessonViewer Component
 *
 * Full lesson content viewer with navigation.
 *
 * Features:
 * - Renders various content block types
 * - Audio player integration
 * - Progress tracking support
 * - Navigation (back/next)
 * - Completion marking
 *
 * Accessibility:
 * - Proper heading structure
 * - Keyboard navigation
 * - Focus management
 */
export function LessonViewer({
  lesson,
  assetBaseUrl,
  isCompleted = false,
  onBack,
  onNext,
  onComplete,
  locale,
  className,
}: LessonViewerProps) {
  const [showCompletedBanner, setShowCompletedBanner] = useState(false);

  const title = getLocalizedText(lesson.title, locale);

  // Handle lesson completion
  const handleComplete = useCallback(() => {
    onComplete?.();
    setShowCompletedBanner(true);
    setTimeout(() => setShowCompletedBanner(false), 3000);
  }, [onComplete]);

  // Auto-scroll to top when lesson changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lesson.id]);

  return (
    <div className={cn('flex min-h-full flex-col', className)}>
      {/* Content area */}
      <div className="flex-1 px-4 pb-24">
        {/* Lesson title */}
        <h1 className="mb-4 mt-4 text-xl font-bold text-text">{title}</h1>

        {/* Main narration audio if present */}
        {lesson.narration && (
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-text">
              Listen to this lesson
            </p>
            <AudioPlayer
              src={`${assetBaseUrl}/${lesson.narration.audioFile.path}`}
              title={title}
            />
          </div>
        )}

        {/* Content blocks */}
        {lesson.content.map((block) => (
          <ContentBlockRenderer
            key={block.id}
            block={block}
            assetBaseUrl={assetBaseUrl}
            locale={locale}
          />
        ))}

        {/* Summary section */}
        {lesson.summary && (
          <div className="mt-8 rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 text-base font-semibold text-text">
              Key Points
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              {lesson.summary.keyPoints.map((point, index) => (
                <li key={index} className="text-sm text-text">
                  {getLocalizedText(point, locale)}
                </li>
              ))}
            </ul>
            {lesson.summary.nextSteps && (
              <p className="mt-4 text-sm text-text-muted">
                <strong>Next:</strong>{' '}
                {getLocalizedText(lesson.summary.nextSteps, locale)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface p-4 safe-area-inset-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          {/* Back button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            disabled={!onBack}
            className="min-w-[44px]"
          >
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Back
          </Button>

          {/* Complete/Next button */}
          {isCompleted ? (
            <Button
              size="sm"
              onClick={onNext}
              disabled={!onNext}
              className="min-w-[120px]"
            >
              Next
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleComplete}
              className="min-w-[120px]"
            >
              <CheckCircle className="mr-1 h-4 w-4" aria-hidden="true" />
              Complete
            </Button>
          )}
        </div>
      </div>

      {/* Completion banner */}
      {showCompletedBanner && (
        <div
          className="fixed left-0 right-0 top-16 z-50 mx-auto max-w-lg px-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 rounded-lg bg-success p-4 text-white shadow-lg">
            <CheckCircle className="h-5 w-5" aria-hidden="true" />
            <span className="font-medium">Lesson completed!</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default LessonViewer;
