'use client';

import { Code, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ExerciseLinkProps {
  exerciseId: string;
  title: string;
  courseSlug: string;
  moduleId: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes?: number;
  className?: string;
}

export function ExerciseLink({
  exerciseId,
  title,
  courseSlug,
  moduleId,
  difficulty = 'beginner',
  estimatedMinutes,
  className,
}: ExerciseLinkProps) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

  return (
    <Link
      to={`/exercises/${courseSlug}/${moduleId}/${exerciseId}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border border-border",
        "bg-surface hover:bg-surface-alt transition-colors group",
        className
      )}
    >
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Code className="h-5 w-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-text group-hover:text-primary transition-colors">
          {title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn("text-xs px-2 py-0.5 rounded-full", difficultyColors[difficulty])}>
            {difficulty}
          </span>
          {estimatedMinutes && (
            <span className="text-xs text-text-muted">{estimatedMinutes} min</span>
          )}
        </div>
      </div>

      <ChevronRight className="h-5 w-5 text-text-muted group-hover:text-primary transition-colors" />
    </Link>
  );
}
