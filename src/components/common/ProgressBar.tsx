import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

/**
 * Progress Bar Components
 *
 * Use for:
 * - File downloads (Pyodide, content packages)
 * - Multi-step processes
 * - Long synchronization operations
 */

interface ProgressBarProps {
  /** Current progress value (0-100) */
  value: number;
  /** Optional label for the progress bar */
  label?: string;
  /** Whether to show the percentage text */
  showPercentage?: boolean;
  /** Optional additional class names */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Color variant */
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const sizeClasses = {
  sm: 'h-1',
  default: 'h-2',
  lg: 'h-3',
};

const variantClasses = {
  default: '',
  success: '[&>div]:bg-success',
  warning: '[&>div]:bg-warning',
  error: '[&>div]:bg-error',
};

/**
 * Standard progress bar with optional label and percentage
 */
export function ProgressBar({
  value,
  label,
  showPercentage = true,
  className,
  size = 'default',
  variant = 'default',
}: ProgressBarProps) {
  // Ensure value is between 0 and 100
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn('w-full', className)}
      role="progressbar"
      aria-valuenow={normalizedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || 'Progress'}
    >
      {(label || showPercentage) && (
        <div className="mb-1 flex items-center justify-between text-sm">
          {label && <span className="font-medium text-text">{label}</span>}
          {showPercentage && (
            <span className="text-text-muted">{Math.round(normalizedValue)}%</span>
          )}
        </div>
      )}
      <Progress
        value={normalizedValue}
        className={cn(sizeClasses[size], variantClasses[variant])}
      />
    </div>
  );
}

/**
 * Download progress bar with additional details
 *
 * Shows download size, speed, and time remaining when available.
 * Specifically designed for Pyodide and content package downloads.
 */
interface DownloadProgressProps extends Omit<ProgressBarProps, 'showPercentage'> {
  /** Downloaded bytes */
  downloadedBytes?: number;
  /** Total bytes to download */
  totalBytes?: number;
  /** Current download speed in bytes/second */
  speedBps?: number;
}

export function DownloadProgress({
  value,
  label = 'Downloading',
  downloadedBytes,
  totalBytes,
  speedBps,
  className,
  ...props
}: DownloadProgressProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatSpeed = (bps: number): string => {
    return `${formatBytes(bps)}/s`;
  };

  const estimatedTimeRemaining = (): string | null => {
    if (!speedBps || !totalBytes || !downloadedBytes || speedBps === 0) {
      return null;
    }
    const remainingBytes = totalBytes - downloadedBytes;
    const seconds = remainingBytes / speedBps;
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s remaining`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m remaining`;
  };

  const timeRemaining = estimatedTimeRemaining();

  return (
    <div
      className={cn('w-full space-y-2', className)}
      role="status"
      aria-live="polite"
    >
      <ProgressBar value={value} label={label} showPercentage {...props} />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
        {downloadedBytes !== undefined && totalBytes !== undefined && (
          <span>
            {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}
          </span>
        )}
        {speedBps !== undefined && speedBps > 0 && (
          <span>{formatSpeed(speedBps)}</span>
        )}
        {timeRemaining && <span>{timeRemaining}</span>}
      </div>
    </div>
  );
}

/**
 * Step progress indicator
 *
 * For multi-step processes like registration or content sync.
 */
interface StepProgressProps {
  /** Current step (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Labels for each step */
  stepLabels?: string[];
  /** Optional additional class names */
  className?: string;
}

export function StepProgress({
  currentStep,
  totalSteps,
  stepLabels,
  className,
}: StepProgressProps) {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div
      className={cn('w-full', className)}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${currentStep} of ${totalSteps}`}
    >
      <div className="mb-2 flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={stepNumber}
              className="flex flex-col items-center"
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  isCompleted && 'bg-success text-white',
                  isCurrent && 'bg-primary text-white',
                  !isCompleted && !isCurrent && 'bg-surface text-text-muted border border-border'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              {stepLabels?.[index] && (
                <span
                  className={cn(
                    'mt-1 text-xs',
                    isCurrent ? 'font-medium text-text' : 'text-text-muted'
                  )}
                >
                  {stepLabels[index]}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="relative h-1 w-full rounded-full bg-border">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
