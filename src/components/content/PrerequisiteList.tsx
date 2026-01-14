'use client';

import { Check, Lock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Prerequisite } from '@/types/content';

export interface PrerequisiteListProps {
  prerequisites: Prerequisite[];
  completedIds: Set<string>; // IDs of completed prerequisites
  onPrerequisiteClick?: (prerequisite: Prerequisite) => void;
  className?: string;
}

export function PrerequisiteList({
  prerequisites,
  completedIds,
  onPrerequisiteClick,
  className
}: PrerequisiteListProps) {
  if (prerequisites.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-medium text-text-muted">Prerequisites</h3>
      <ul className="space-y-2">
        {prerequisites.map((prereq) => {
          const isCompleted = completedIds.has(prereq.refId);
          const isRequired = prereq.required;

          return (
            <li
              key={prereq.refId}
              className={cn(
                "flex items-start gap-2 text-sm p-2 rounded-lg cursor-pointer hover:bg-surface-alt transition-colors",
                isCompleted && "text-success",
                !isCompleted && isRequired && "text-error",
                !isCompleted && !isRequired && "text-warning"
              )}
              onClick={() => onPrerequisiteClick?.(prereq)}
            >
              {/* Icon based on state */}
              {isCompleted ? (
                <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
              ) : isRequired ? (
                <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              ) : (
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              )}

              {/* Description */}
              <span>
                {prereq.description.default}
                {!isRequired && " (recommended)"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
