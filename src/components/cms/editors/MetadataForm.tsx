'use client';

/**
 * MetadataForm Component
 *
 * Form fields for content metadata (title and description).
 *
 * Features:
 * - Title input with required indicator
 * - Description textarea with character counter (max 500)
 * - Validation error display
 * - Accessible form labels and error messages
 */

import { useId } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// =============================================================================
// Types
// =============================================================================

interface MetadataFormProps {
  /** Content title */
  title: string;
  /** Content description */
  description: string;
  /** Callback when a field changes */
  onChange: (field: 'title' | 'description', value: string) => void;
  /** Validation errors for each field */
  errors?: {
    title?: string;
    description?: string;
  };
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const DESCRIPTION_MAX_LENGTH = 500;

// =============================================================================
// Component
// =============================================================================

export function MetadataForm({
  title,
  description,
  onChange,
  errors,
  className,
}: MetadataFormProps) {
  // Generate unique IDs for accessibility
  const titleId = useId();
  const descriptionId = useId();
  const titleErrorId = useId();
  const descriptionErrorId = useId();

  const descriptionLength = description.length;
  const isDescriptionOverLimit = descriptionLength > DESCRIPTION_MAX_LENGTH;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Title Field */}
      <div className="space-y-2">
        <Label htmlFor={titleId} className="flex items-center gap-1">
          Title
          <span className="text-error" aria-hidden="true">
            *
          </span>
          <span className="sr-only">(required)</span>
        </Label>
        <Input
          id={titleId}
          type="text"
          value={title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Enter content title"
          aria-required="true"
          aria-invalid={!!errors?.title}
          aria-describedby={errors?.title ? titleErrorId : undefined}
          className={cn(errors?.title && 'border-error focus-visible:ring-error')}
        />
        {errors?.title && (
          <p
            id={titleErrorId}
            className="text-sm text-error"
            role="alert"
          >
            {errors.title}
          </p>
        )}
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor={descriptionId} className="flex items-center justify-between">
          <span>Description</span>
          <span
            className={cn(
              'text-xs font-normal',
              isDescriptionOverLimit ? 'text-error' : 'text-text-muted'
            )}
            aria-live="polite"
          >
            {descriptionLength}/{DESCRIPTION_MAX_LENGTH}
          </span>
        </Label>
        <textarea
          id={descriptionId}
          value={description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Enter a brief description of the content"
          rows={4}
          aria-invalid={!!errors?.description || isDescriptionOverLimit}
          aria-describedby={errors?.description ? descriptionErrorId : undefined}
          className={cn(
            // Base styles matching Input component
            'flex w-full rounded-md border border-border bg-background px-3 py-2 text-base',
            'placeholder:text-text-muted',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-none',
            'md:text-sm',
            // Error styles
            (errors?.description || isDescriptionOverLimit) &&
              'border-error focus-visible:ring-error'
          )}
        />
        {errors?.description && (
          <p
            id={descriptionErrorId}
            className="text-sm text-error"
            role="alert"
          >
            {errors.description}
          </p>
        )}
        {!errors?.description && isDescriptionOverLimit && (
          <p className="text-sm text-error" role="alert">
            Description exceeds maximum length of {DESCRIPTION_MAX_LENGTH} characters
          </p>
        )}
      </div>
    </div>
  );
}

export type { MetadataFormProps };
export default MetadataForm;
