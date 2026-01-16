'use client';

/**
 * PublishDialog Component
 *
 * A modal dialog for publishing CMS content (lessons, quizzes, exercises).
 * Provides validation status, export functionality, and hub publishing.
 *
 * Features:
 * - Content validation with visual status indicators
 * - Export as ZIP functionality
 * - Publish to Hub with connectivity check
 * - Progress indicator during operations
 * - Success/error feedback with alerts
 *
 * Accessibility:
 * - Proper ARIA labels and live regions
 * - Focus management within dialog
 * - Keyboard navigation support
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useSyncStore } from '@/stores/syncStore';
import { useCMSStore } from '@/stores/cmsStore';
import {
  CheckCircle,
  AlertCircle,
  Package,
  Upload,
  Loader2,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface PublishDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the open state changes */
  onOpenChange: (open: boolean) => void;
  /** The ID of the draft to publish */
  draftId: string;
  /** The type of content being published */
  contentType: 'lesson' | 'quiz' | 'exercise';
  /** The title of the content */
  title: string;
}

interface ValidationItem {
  id: string;
  label: string;
  status: 'valid' | 'invalid' | 'warning';
  message?: string;
}

type OperationStatus = 'idle' | 'loading' | 'success' | 'error';

interface OperationState {
  status: OperationStatus;
  progress: number;
  message: string | null;
}

// =============================================================================
// Validation Logic
// =============================================================================

/**
 * Validate draft content readiness for publishing.
 * Returns an array of validation items with their status.
 */
async function validateDraft(
  draftId: string,
  contentType: string,
  title: string
): Promise<ValidationItem[]> {
  // Simulate async validation (in production, this would check IndexedDB/actual content)
  await new Promise((resolve) => setTimeout(resolve, 300));

  const validations: ValidationItem[] = [];

  // Title validation
  validations.push({
    id: 'title',
    label: 'Title is set',
    status: title.trim().length > 0 ? 'valid' : 'invalid',
    message: title.trim().length === 0 ? 'A title is required' : undefined,
  });

  // Content validation (simulated - in production check actual content)
  // For now, we assume content exists if we have a draftId
  validations.push({
    id: 'content',
    label: 'Content is not empty',
    status: draftId ? 'valid' : 'invalid',
    message: !draftId ? 'Content cannot be empty' : undefined,
  });

  // Assets validation (optional - always warning for now)
  validations.push({
    id: 'assets',
    label: 'No assets attached',
    status: 'warning',
    message: 'Assets are optional but recommended for rich content',
  });

  // Content-type specific validations
  if (contentType === 'quiz') {
    validations.push({
      id: 'questions',
      label: 'Quiz has questions',
      status: 'valid', // Simulated
    });
  }

  if (contentType === 'exercise') {
    validations.push({
      id: 'solution',
      label: 'Solution provided',
      status: 'valid', // Simulated
    });
  }

  return validations;
}

// =============================================================================
// Export Logic
// =============================================================================

/**
 * Export draft content as a ZIP file.
 * In production, this would package all content and assets.
 */
async function exportAsZip(
  draftId: string,
  contentType: string,
  title: string,
  onProgress: (progress: number) => void
): Promise<void> {
  // Simulate export process with progress updates
  for (let i = 0; i <= 100; i += 10) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    onProgress(i);
  }

  // In production, this would:
  // 1. Gather content from IndexedDB
  // 2. Package with JSZip
  // 3. Trigger download

  // Simulate download by creating a blob
  const mockContent = JSON.stringify({
    id: draftId,
    type: contentType,
    title,
    exportedAt: new Date().toISOString(),
  });

  const blob = new Blob([mockContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${contentType}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =============================================================================
// Publish Logic
// =============================================================================

/**
 * Publish draft content to the Hub.
 * In production, this would sync with the connected Hub server.
 */
async function publishToHub(
  _draftId: string,
  _contentType: string,
  _hubUrl: string,
  onProgress: (progress: number) => void
): Promise<void> {
  // Simulate publish process with progress updates
  const steps = [
    { progress: 10, delay: 200 },
    { progress: 30, delay: 300 },
    { progress: 50, delay: 400 },
    { progress: 70, delay: 300 },
    { progress: 90, delay: 200 },
    { progress: 100, delay: 100 },
  ];

  for (const step of steps) {
    await new Promise((resolve) => setTimeout(resolve, step.delay));
    onProgress(step.progress);
  }

  // In production, this would:
  // 1. Prepare payload from IndexedDB
  // 2. POST to hubUrl/api/content
  // 3. Handle response and update local state
}

// =============================================================================
// Sub-components
// =============================================================================

interface ValidationListProps {
  items: ValidationItem[];
  isLoading: boolean;
}

function ValidationList({ items, isLoading }: ValidationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Validating content">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-text-muted" aria-hidden="true" />
            <div className="h-4 w-32 animate-pulse rounded bg-surface" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-2" aria-label="Validation results">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2">
          {item.status === 'valid' && (
            <CheckCircle
              className="h-5 w-5 shrink-0 text-success"
              aria-hidden="true"
            />
          )}
          {item.status === 'invalid' && (
            <AlertCircle
              className="h-5 w-5 shrink-0 text-error"
              aria-hidden="true"
            />
          )}
          {item.status === 'warning' && (
            <AlertTriangle
              className="h-5 w-5 shrink-0 text-warning"
              aria-hidden="true"
            />
          )}
          <div className="flex flex-col">
            <span
              className={cn(
                'text-sm',
                item.status === 'valid' && 'text-text',
                item.status === 'invalid' && 'text-error',
                item.status === 'warning' && 'text-text-muted'
              )}
            >
              {item.status === 'valid' ? item.label : item.label}
              {item.status === 'warning' && ' (optional)'}
            </span>
            {item.message && (
              <span className="text-xs text-text-muted">{item.message}</span>
            )}
          </div>
          <span className="sr-only">
            {item.status === 'valid' && 'Passed'}
            {item.status === 'invalid' && 'Failed'}
            {item.status === 'warning' && 'Warning'}
          </span>
        </li>
      ))}
    </ul>
  );
}

interface HubStatusProps {
  isConnected: boolean;
  hubUrl: string | null;
}

function HubStatus({ isConnected, hubUrl }: HubStatusProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-success" aria-hidden="true" />
          <span className="text-text-muted">
            Connected to{' '}
            <span className="font-medium text-text">{hubUrl || 'Hub'}</span>
          </span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-text-muted" aria-hidden="true" />
          <span className="text-text-muted">Not connected to Hub</span>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function PublishDialog({
  open,
  onOpenChange,
  draftId,
  contentType,
  title,
}: PublishDialogProps) {
  // Store subscriptions
  const { isHubReachable, hubUrl, discoverHub } = useSyncStore();
  const { hasUnsavedChanges } = useCMSStore();

  // Local state
  const [validations, setValidations] = useState<ValidationItem[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [exportState, setExportState] = useState<OperationState>({
    status: 'idle',
    progress: 0,
    message: null,
  });
  const [publishState, setPublishState] = useState<OperationState>({
    status: 'idle',
    progress: 0,
    message: null,
  });

  // Computed values
  const hasInvalidItems = validations.some((v) => v.status === 'invalid');
  const isOperationInProgress =
    exportState.status === 'loading' || publishState.status === 'loading';

  // ==========================================================================
  // Effects
  // ==========================================================================

  // Validate content when dialog opens
  useEffect(() => {
    if (open) {
      setIsValidating(true);
      setExportState({ status: 'idle', progress: 0, message: null });
      setPublishState({ status: 'idle', progress: 0, message: null });

      validateDraft(draftId, contentType, title)
        .then(setValidations)
        .catch(() => {
          setValidations([
            {
              id: 'error',
              label: 'Validation failed',
              status: 'invalid',
              message: 'Could not validate content. Please try again.',
            },
          ]);
        })
        .finally(() => setIsValidating(false));

      // Also check hub connectivity
      discoverHub();
    }
  }, [open, draftId, contentType, title, discoverHub]);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleExport = useCallback(async () => {
    if (hasInvalidItems) return;

    setExportState({ status: 'loading', progress: 0, message: 'Preparing export...' });

    try {
      await exportAsZip(draftId, contentType, title, (progress) => {
        setExportState((prev) => ({
          ...prev,
          progress,
          message: progress < 50 ? 'Gathering content...' : 'Creating package...',
        }));
      });

      setExportState({
        status: 'success',
        progress: 100,
        message: 'Export completed successfully!',
      });
    } catch (error) {
      setExportState({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Export failed. Please try again.',
      });
    }
  }, [draftId, contentType, title, hasInvalidItems]);

  const handlePublish = useCallback(async () => {
    if (hasInvalidItems || !isHubReachable || !hubUrl) return;

    setPublishState({ status: 'loading', progress: 0, message: 'Connecting to Hub...' });

    try {
      await publishToHub(draftId, contentType, hubUrl, (progress) => {
        setPublishState((prev) => ({
          ...prev,
          progress,
          message:
            progress < 30
              ? 'Preparing content...'
              : progress < 70
                ? 'Uploading to Hub...'
                : 'Finalizing...',
        }));
      });

      setPublishState({
        status: 'success',
        progress: 100,
        message: 'Published to Hub successfully!',
      });
    } catch (error) {
      setPublishState({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Publish failed. Please try again.',
      });
    }
  }, [draftId, contentType, hubUrl, isHubReachable, hasInvalidItems]);

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="publish-dialog-description"
      >
        <DialogHeader>
          <DialogTitle>Publish: "{title}"</DialogTitle>
          <DialogDescription id="publish-dialog-description">
            Review validation status and choose how to publish your {contentType}.
          </DialogDescription>
        </DialogHeader>

        {/* Unsaved changes warning */}
        {hasUnsavedChanges && (
          <Alert variant="warning" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Unsaved changes</AlertTitle>
            <AlertDescription>
              You have unsaved changes. Save your work before publishing.
            </AlertDescription>
          </Alert>
        )}

        {/* Validation section */}
        <section className="mt-4" aria-labelledby="validation-heading">
          <h3 id="validation-heading" className="sr-only">
            Content validation
          </h3>
          <ValidationList items={validations} isLoading={isValidating} />
        </section>

        {/* Divider */}
        <div className="my-4 border-t border-border" role="separator" />

        {/* Export section */}
        <section className="space-y-3" aria-labelledby="export-heading">
          <h3 id="export-heading" className="sr-only">
            Export options
          </h3>

          {/* Export status feedback */}
          {exportState.status !== 'idle' && (
            <div
              role="status"
              aria-live="polite"
              className="space-y-2"
            >
              {exportState.status === 'loading' && (
                <>
                  <Progress value={exportState.progress} className="h-2" />
                  <p className="text-xs text-text-muted">{exportState.message}</p>
                </>
              )}
              {exportState.status === 'success' && (
                <Alert variant="success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{exportState.message}</AlertDescription>
                </Alert>
              )}
              {exportState.status === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{exportState.message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleExport}
            disabled={isValidating || hasInvalidItems || isOperationInProgress}
            aria-describedby={hasInvalidItems ? 'export-disabled-reason' : undefined}
          >
            {exportState.status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Package className="h-4 w-4" aria-hidden="true" />
            )}
            Export as ZIP
          </Button>
          {hasInvalidItems && (
            <p id="export-disabled-reason" className="sr-only">
              Fix validation errors before exporting
            </p>
          )}
        </section>

        {/* Publish to Hub section */}
        <section className="mt-4 space-y-3" aria-labelledby="publish-heading">
          <h3 id="publish-heading" className="sr-only">
            Publish to Hub
          </h3>

          {/* Hub connection status */}
          <HubStatus isConnected={isHubReachable} hubUrl={hubUrl} />

          {/* Publish status feedback */}
          {publishState.status !== 'idle' && (
            <div
              role="status"
              aria-live="polite"
              className="space-y-2"
            >
              {publishState.status === 'loading' && (
                <>
                  <Progress value={publishState.progress} className="h-2" />
                  <p className="text-xs text-text-muted">{publishState.message}</p>
                </>
              )}
              {publishState.status === 'success' && (
                <Alert variant="success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{publishState.message}</AlertDescription>
                </Alert>
              )}
              {publishState.status === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{publishState.message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <Button
            className="w-full justify-start gap-2"
            onClick={handlePublish}
            disabled={
              isValidating ||
              hasInvalidItems ||
              !isHubReachable ||
              isOperationInProgress
            }
            aria-describedby={
              !isHubReachable
                ? 'publish-disabled-hub'
                : hasInvalidItems
                  ? 'publish-disabled-validation'
                  : undefined
            }
          >
            {publishState.status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-4 w-4" aria-hidden="true" />
            )}
            Publish to Hub
          </Button>

          {/* Disabled reason announcements for screen readers */}
          {!isHubReachable && (
            <p id="publish-disabled-hub" className="sr-only">
              Connect to a Hub to enable publishing
            </p>
          )}
          {hasInvalidItems && (
            <p id="publish-disabled-validation" className="sr-only">
              Fix validation errors before publishing
            </p>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}

export type { PublishDialogProps };
export default PublishDialog;
