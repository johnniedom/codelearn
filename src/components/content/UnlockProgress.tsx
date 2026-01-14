'use client';

import { Lock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UnlockProgressProps {
  completed: number;
  total: number;
  nextPrerequisite?: string; // Description of next thing to complete
  className?: string;
}

export function UnlockProgress({
  completed,
  total,
  nextPrerequisite,
  className
}: UnlockProgressProps) {
  const isUnlocked = completed >= total;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Icon */}
      {isUnlocked ? (
        <CheckCircle className="h-5 w-5 text-success flex-shrink-0" aria-hidden="true" />
      ) : (
        <Lock className="h-5 w-5 text-warning flex-shrink-0" aria-hidden="true" />
      )}

      {/* Progress Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className={isUnlocked ? "text-success" : "text-text-muted"}>
            {isUnlocked ? "Unlocked" : `${completed} of ${total} complete`}
          </span>
          {!isUnlocked && (
            <span className="text-xs text-text-muted">{Math.round(progress)}%</span>
          )}
        </div>

        {/* Progress Bar */}
        {!isUnlocked && (
          <div
            className="h-1.5 bg-surface-alt rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={completed}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${completed} of ${total} prerequisites complete`}
          >
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Next step hint */}
        {!isUnlocked && nextPrerequisite && (
          <p className="text-xs text-text-muted mt-1 truncate">
            Next: {nextPrerequisite}
          </p>
        )}
      </div>
    </div>
  );
}
