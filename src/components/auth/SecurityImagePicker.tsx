/**
 * SecurityImagePicker Component
 *
 * Allows users to select a security image for anti-phishing protection.
 * The selected image is shown during login to help users verify they're
 * on the legitimate login screen.
 *
 * Features:
 * - Grid of 24 preset security images
 * - Accessible with keyboard navigation
 * - Clear visual selection state
 * - Screen reader support
 */

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SECURITY_IMAGES } from '@/lib/auth/validators';

interface SecurityImagePickerProps {
  /** Currently selected image ID */
  value: string;
  /** Called when selection changes */
  onChange: (imageId: string) => void;
  /** Disable selection */
  disabled?: boolean;
  /** Show error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Additional class names */
  className?: string;
}

export const SecurityImagePicker = React.forwardRef<
  HTMLDivElement,
  SecurityImagePickerProps
>(
  (
    {
      value,
      onChange,
      disabled = false,
      error = false,
      errorMessage,
      className,
    },
    ref
  ) => {
    const selectedImage = SECURITY_IMAGES.find((img) => img.id === value);

    return (
      <div ref={ref} className={cn('w-full', className)}>
        {/* Instructions */}
        <div className="mb-4 text-center">
          <p className="text-sm text-text-muted">
            Choose a security image. This will be shown when you log in to help
            verify it is the real CodeLearn.
          </p>
        </div>

        {/* Current selection display */}
        {selectedImage && (
          <div
            className="mb-4 flex items-center justify-center gap-3 rounded-lg bg-primary/10 p-4"
            aria-live="polite"
          >
            <span className="text-4xl" role="img" aria-label={selectedImage.label}>
              {selectedImage.emoji}
            </span>
            <div>
              <p className="text-sm font-medium text-text">Your security image:</p>
              <p className="text-lg font-semibold text-primary">
                {selectedImage.label}
              </p>
            </div>
          </div>
        )}

        {/* Image grid */}
        <div
          role="radiogroup"
          aria-label="Select a security image"
          aria-describedby={error ? 'security-image-error' : undefined}
          className="grid grid-cols-4 gap-2 sm:grid-cols-6"
        >
          {SECURITY_IMAGES.map((image) => {
            const isSelected = value === image.id;

            return (
              <button
                key={image.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={image.label}
                disabled={disabled}
                onClick={() => onChange(image.id)}
                className={cn(
                  // Base styles
                  'relative flex flex-col items-center justify-center',
                  'h-16 w-full rounded-lg border-2 p-2',
                  'transition-all duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  // Normal state
                  !isSelected && !error && 'border-border bg-surface hover:border-primary/50',
                  // Selected state
                  isSelected && 'border-primary bg-primary/10',
                  // Error state
                  error && !isSelected && 'border-error/50',
                  // Disabled state
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {/* Emoji */}
                <span className="text-2xl" role="img" aria-hidden="true">
                  {image.emoji}
                </span>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {error && errorMessage && (
          <p
            id="security-image-error"
            className="mt-2 text-center text-sm text-error"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

SecurityImagePicker.displayName = 'SecurityImagePicker';

export default SecurityImagePicker;
