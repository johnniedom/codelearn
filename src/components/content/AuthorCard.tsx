'use client';

import { User, Mail, ExternalLink, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Author } from '@/types/content';

export interface AuthorCardProps {
  author: Author;
  variant?: 'compact' | 'full';
  className?: string;
}

export function AuthorCard({ author, variant = 'compact', className }: AuthorCardProps) {
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full bg-surface-alt flex items-center justify-center overflow-hidden flex-shrink-0">
          {author.avatar ? (
            <img
              src={author.avatar}
              alt={author.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-5 w-5 text-text-muted" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <p className="font-medium text-text truncate">{author.name}</p>
          {author.organization && (
            <p className="text-xs text-text-muted truncate">{author.organization}</p>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
      <div className="flex items-start gap-4">
        {/* Large Avatar */}
        <div className="h-16 w-16 rounded-full bg-surface-alt flex items-center justify-center overflow-hidden flex-shrink-0">
          {author.avatar ? (
            <img
              src={author.avatar}
              alt={author.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-text-muted" />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text">{author.name}</h3>

          {author.organization && (
            <div className="flex items-center gap-1 text-sm text-text-muted mt-1">
              <Building className="h-3.5 w-3.5" />
              <span>{author.organization}</span>
            </div>
          )}

          {author.bio && (
            <p className="text-sm text-text-muted mt-2">{author.bio}</p>
          )}

          {/* Links */}
          <div className="flex items-center gap-3 mt-3">
            {author.email && (
              <a
                href={`mailto:${author.email}`}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </a>
            )}
            {author.url && (
              <a
                href={author.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
