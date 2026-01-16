/**
 * PINInput Component
 *
 * A 6-digit PIN input component with proper accessibility.
 * Each digit has its own input field for better UX.
 *
 * Features:
 * - Auto-focus next input on digit entry
 * - Backspace moves to previous input
 * - Paste support for full PIN
 * - Screen reader announcements
 * - Visible focus states
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PINInputProps {
  /** Current PIN value */
  value: string;
  /** Called when PIN changes */
  onChange: (pin: string) => void;
  /** Called when all 6 digits entered */
  onComplete?: (pin: string) => void;
  /** Disable input */
  disabled?: boolean;
  /** Show error state */
  error?: boolean;
  /** Error message for screen readers */
  errorMessage?: string;
  /** Accessible label */
  label?: string;
  /** Hide digits (show dots instead) */
  secure?: boolean;
  /** Additional class names */
  className?: string;
  /** Auto-focus first input on mount */
  autoFocus?: boolean;
}

export const PINInput = React.forwardRef<HTMLDivElement, PINInputProps>(
  (
    {
      value,
      onChange,
      onComplete,
      disabled = false,
      error = false,
      errorMessage,
      label = 'Enter your 6-digit PIN',
      secure = true,
      className,
      autoFocus = false,
    },
    ref
  ) => {
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
    const [focused, setFocused] = React.useState(false);

    // Split value into 6 digits
    const digits = React.useMemo(() => {
      const arr = value.split('').slice(0, 6);
      while (arr.length < 6) arr.push('');
      return arr;
    }, [value]);

    // Focus first input on mount if autoFocus
    React.useEffect(() => {
      if (autoFocus && inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, [autoFocus]);

    // Handle digit input
    const handleChange = (index: number, newValue: string) => {
      // Only allow single digit
      const digit = newValue.replace(/\D/g, '').slice(-1);

      // Update the PIN
      const newDigits = [...digits];
      newDigits[index] = digit;
      const newPin = newDigits.join('');
      onChange(newPin);

      // Move to next input if digit entered
      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Call onComplete if all digits entered
      if (digit && index === 5 && newPin.length === 6) {
        onComplete?.(newPin);
      }
    };

    // Handle key down events
    const handleKeyDown = (
      index: number,
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      // Backspace moves to previous input
      if (e.key === 'Backspace') {
        if (!digits[index] && index > 0) {
          e.preventDefault();
          inputRefs.current[index - 1]?.focus();
          const newDigits = [...digits];
          newDigits[index - 1] = '';
          onChange(newDigits.join(''));
        }
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === 'ArrowRight' && index < 5) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      }
    };

    // Handle paste
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const pastedDigits = pastedText.replace(/\D/g, '').slice(0, 6);

      if (pastedDigits) {
        onChange(pastedDigits);

        // Focus appropriate input
        const focusIndex = Math.min(pastedDigits.length, 5);
        inputRefs.current[focusIndex]?.focus();

        // Call onComplete if 6 digits pasted
        if (pastedDigits.length === 6) {
          onComplete?.(pastedDigits);
        }
      }
    };

    // Handle focus
    const handleFocus = () => {
      setFocused(true);
    };

    const handleBlur = () => {
      setFocused(false);
    };

    return (
      <div ref={ref} className={cn('w-full', className)}>
        {/* Screen reader label */}
        <label id="pin-label" className="sr-only">
          {label}
        </label>

        {/* PIN input fields */}
        <div
          role="group"
          aria-labelledby="pin-label"
          aria-describedby={error ? 'pin-error' : undefined}
          className="flex justify-center gap-2 sm:gap-3"
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type={secure ? 'password' : 'text'}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
              autoComplete="off"
              aria-label={`Digit ${index + 1} of 6`}
              className={cn(
                // Base styles
                'h-12 w-10 sm:h-14 sm:w-12',
                'rounded-lg border-2 bg-background',
                'text-center text-xl font-semibold',
                'transition-all duration-150',
                // Focus styles - using ring for better mobile rendering
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background',
                // Normal state
                !error && !disabled && 'border-border focus:border-primary focus:ring-primary/70',
                // Error state
                error && 'border-error focus:border-error focus:ring-error/70',
                // Disabled state
                disabled && 'cursor-not-allowed opacity-50',
                // Filled state indicator
                digit && !error && 'border-primary/50 bg-primary/5'
              )}
            />
          ))}
        </div>

        {/* Visual focus indicator for group */}
        {focused && (
          <p className="mt-2 text-center text-sm text-text-muted" aria-live="polite">
            {value.length}/6 digits entered
          </p>
        )}

        {/* Error message */}
        {error && errorMessage && (
          <p
            id="pin-error"
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

PINInput.displayName = 'PINInput';

export default PINInput;
