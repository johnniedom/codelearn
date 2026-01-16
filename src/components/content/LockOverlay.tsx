'use client';

import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LockOverlayProps {
  locked: boolean;
  reason: string; // e.g., "Complete 'Variables Quiz' first"
  progress?: number; // 0-100, progress toward unlock
  onViewPrerequisites?: () => void;
  className?: string;
}

export function LockOverlay({
  locked,
  reason,
  progress,
  onViewPrerequisites,
  className
}: LockOverlayProps) {
  if (!locked) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center",
        "bg-surface/80 backdrop-blur-sm rounded-lg",
        className
      )}
      role="status"
      aria-label={`Content locked: ${reason}`}
    >
      {/* Lock Icon */}
      <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center mb-4">
        <Lock className="h-8 w-8 text-text-muted" aria-hidden="true" />
      </div>

      {/* Reason Text */}
      <p className="text-sm text-text-muted text-center px-4 mb-3">
        {reason}
      </p>

      {/* Progress Bar (if provided) */}
      {progress !== undefined && progress > 0 && (
        <div className="w-48 mb-4">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div
            className="h-2 bg-surface-alt rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Unlock progress"
          >
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* View Prerequisites Button */}
      {onViewPrerequisites && (
        <button
          onClick={onViewPrerequisites}
          className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded"
          type="button"
        >
          View Prerequisites
        </button>
      )}
    </div>
  );
}
