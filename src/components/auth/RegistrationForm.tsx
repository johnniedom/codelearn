/**
 * RegistrationForm Component
 *
 * Multi-step registration form for new users.
 *
 * Steps:
 * 1. Personal Info (name, grade, birth year)
 * 2. Role Selection (student, teacher, author)
 * 3. Profile Setup (icon, color)
 * 4. Security Image
 * 5. PIN Setup
 * 6. Pattern Lock MFA
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PINInput } from './PINInput';
import { SecurityImagePicker } from './SecurityImagePicker';
import { PatternLock } from './PatternLock';
import { RoleSelector } from './RoleSelector';
import type { UserRole } from '@/types/roles';
import {
  validateFullName,
  validatePreferredName,
  validateBirthYear,
  validatePIN,
  validatePINConfirmation,
  validatePattern,
  validatePatternConfirmation,
  GRADE_LEVELS,
  GRADE_LEVEL_LABELS,
  PROFILE_ICONS,
  PROFILE_COLORS,
  type GradeLevel,
} from '@/lib/auth/validators';

// =============================================================================
// Types
// =============================================================================

export interface RegistrationData {
  fullName: string;
  preferredName: string;
  gradeLevel: GradeLevel;
  birthYear: number;
  role: UserRole;
  profileIcon: string;
  profileColor: string;
  securityImageId: string;
  pin: string;
  pattern: number[];
}

interface RegistrationFormProps {
  /** Called when registration is submitted */
  onSubmit: (data: RegistrationData) => Promise<void>;
  /** Called when user wants to go back to profile select */
  onCancel: () => void;
  /** Whether registration is in progress */
  isSubmitting?: boolean;
  /** Additional class names */
  className?: string;
}

type RegistrationStep =
  | 'personal-info'
  | 'role-selection'
  | 'profile-setup'
  | 'security-image'
  | 'pin-setup'
  | 'pattern-setup';

const STEPS: RegistrationStep[] = [
  'personal-info',
  'role-selection',
  'profile-setup',
  'security-image',
  'pin-setup',
  'pattern-setup',
];

const STEP_TITLES: Record<RegistrationStep, string> = {
  'personal-info': 'About You',
  'role-selection': 'Choose Your Role',
  'profile-setup': 'Your Profile',
  'security-image': 'Security Image',
  'pin-setup': 'Create PIN',
  'pattern-setup': 'Pattern Lock',
};

const STEP_DESCRIPTIONS: Record<RegistrationStep, string> = {
  'personal-info': 'Tell us a bit about yourself',
  'role-selection': 'Select how you will use CodeLearn',
  'profile-setup': 'Choose how your profile looks',
  'security-image': 'Pick an image to recognize your login',
  'pin-setup': 'Create a 6-digit PIN to protect your account',
  'pattern-setup': 'Draw a pattern for extra security',
};

// =============================================================================
// Component
// =============================================================================

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
}) => {
  // Current step
  const [currentStep, setCurrentStep] = React.useState<RegistrationStep>('personal-info');
  const currentStepIndex = STEPS.indexOf(currentStep);

  // Form data
  const [fullName, setFullName] = React.useState('');
  const [preferredName, setPreferredName] = React.useState('');
  const [gradeLevel, setGradeLevel] = React.useState<GradeLevel | ''>('');
  const [birthYear, setBirthYear] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('student');
  const [profileIcon, setProfileIcon] = React.useState('');
  const [profileColor, setProfileColor] = React.useState('');
  const [securityImageId, setSecurityImageId] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [pattern, setPattern] = React.useState<number[]>([]);
  const [confirmPattern, setConfirmPattern] = React.useState<number[]>([]);
  const [isConfirmingPattern, setIsConfirmingPattern] = React.useState(false);

  // Errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Validate current step
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'personal-info': {
        const fullNameResult = validateFullName(fullName);
        if (!fullNameResult.valid) newErrors.fullName = fullNameResult.error!;

        const preferredNameResult = validatePreferredName(preferredName);
        if (!preferredNameResult.valid) newErrors.preferredName = preferredNameResult.error!;

        if (!gradeLevel) newErrors.gradeLevel = 'Please select a grade level';

        if (birthYear) {
          const birthYearResult = validateBirthYear(parseInt(birthYear, 10));
          if (!birthYearResult.valid) newErrors.birthYear = birthYearResult.error!;
        } else {
          newErrors.birthYear = 'Please enter your birth year';
        }
        break;
      }

      case 'role-selection': {
        // Role always has a default value, no validation needed
        break;
      }

      case 'profile-setup': {
        if (!profileIcon) newErrors.profileIcon = 'Please select an icon';
        if (!profileColor) newErrors.profileColor = 'Please select a color';
        break;
      }

      case 'security-image': {
        if (!securityImageId) newErrors.securityImageId = 'Please select a security image';
        break;
      }

      case 'pin-setup': {
        const pinResult = validatePIN(pin, parseInt(birthYear, 10));
        if (!pinResult.valid) newErrors.pin = pinResult.error!;

        const confirmPinResult = validatePINConfirmation(pin, confirmPin);
        if (!confirmPinResult.valid) newErrors.confirmPin = confirmPinResult.error!;
        break;
      }

      case 'pattern-setup': {
        if (!isConfirmingPattern) {
          const patternResult = validatePattern(pattern);
          if (!patternResult.valid) newErrors.pattern = patternResult.error!;
        } else {
          const confirmResult = validatePatternConfirmation(pattern, confirmPattern);
          if (!confirmResult.valid) newErrors.confirmPattern = confirmResult.error!;
        }
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (!validateStep()) return;

    if (currentStep === 'pattern-setup' && !isConfirmingPattern) {
      // First pattern entered, now confirm
      setIsConfirmingPattern(true);
      setConfirmPattern([]);
      return;
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
      setErrors({});
    }
  };

  // Handle previous step
  const handleBack = () => {
    if (currentStep === 'pattern-setup' && isConfirmingPattern) {
      setIsConfirmingPattern(false);
      setConfirmPattern([]);
      return;
    }

    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
      setErrors({});
    } else {
      onCancel();
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) return;

    const data: RegistrationData = {
      fullName: fullName.trim(),
      preferredName: preferredName.trim(),
      gradeLevel: gradeLevel as GradeLevel,
      birthYear: parseInt(birthYear, 10),
      role,
      profileIcon,
      profileColor,
      securityImageId,
      pin,
      pattern,
    };

    await onSubmit(data);
  };

  // Check if current step is valid (for enabling Next button)
  const isStepComplete = (): boolean => {
    switch (currentStep) {
      case 'personal-info':
        return !!(fullName && preferredName && gradeLevel && birthYear);
      case 'role-selection':
        return !!role;
      case 'profile-setup':
        return !!(profileIcon && profileColor);
      case 'security-image':
        return !!securityImageId;
      case 'pin-setup':
        return pin.length === 6 && confirmPin.length === 6;
      case 'pattern-setup':
        if (!isConfirmingPattern) return pattern.length >= 4;
        return confirmPattern.length >= 4;
      default:
        return false;
    }
  };

  // Get current icon and color for preview
  const selectedIcon = PROFILE_ICONS.find((i) => i.id === profileIcon);
  const selectedColor = PROFILE_COLORS.find((c) => c.id === profileColor);

  return (
    <div className={cn('w-full max-w-md', className)}>
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                index < currentStepIndex && 'bg-primary text-white',
                index === currentStepIndex && 'bg-primary text-white',
                index > currentStepIndex && 'bg-surface text-text-muted'
              )}
              aria-current={index === currentStepIndex ? 'step' : undefined}
            >
              {index < currentStepIndex ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 h-1 rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEP_TITLES[currentStep]}</CardTitle>
          <CardDescription>{STEP_DESCRIPTIONS[currentStep]}</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Step 1: Personal Info */}
          {currentStep === 'personal-info' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                />
                {errors.fullName && (
                  <p id="fullName-error" className="mt-1 text-sm text-error" role="alert">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="preferredName">What should we call you?</Label>
                <Input
                  id="preferredName"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="Your nickname or first name"
                  aria-invalid={!!errors.preferredName}
                  aria-describedby={errors.preferredName ? 'preferredName-error' : undefined}
                />
                {errors.preferredName && (
                  <p id="preferredName-error" className="mt-1 text-sm text-error" role="alert">
                    {errors.preferredName}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="gradeLevel">Grade Level</Label>
                <select
                  id="gradeLevel"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                  className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-invalid={!!errors.gradeLevel}
                  aria-describedby={errors.gradeLevel ? 'gradeLevel-error' : undefined}
                >
                  <option value="">Select your grade</option>
                  {GRADE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {GRADE_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </select>
                {errors.gradeLevel && (
                  <p id="gradeLevel-error" className="mt-1 text-sm text-error" role="alert">
                    {errors.gradeLevel}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="birthYear">Birth Year</Label>
                <Input
                  id="birthYear"
                  type="number"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="e.g., 2010"
                  min="1900"
                  max={new Date().getFullYear()}
                  aria-invalid={!!errors.birthYear}
                  aria-describedby={errors.birthYear ? 'birthYear-error' : undefined}
                />
                {errors.birthYear && (
                  <p id="birthYear-error" className="mt-1 text-sm text-error" role="alert">
                    {errors.birthYear}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Role Selection */}
          {currentStep === 'role-selection' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold">Choose Your Role</h2>
                <p className="text-text-muted mt-2">Select how you'll use CodeLearn</p>
              </div>
              <RoleSelector
                selectedRole={role}
                onSelectRole={(selectedRole) => setRole(selectedRole)}
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Profile Setup */}
          {currentStep === 'profile-setup' && (
            <div className="space-y-6">
              {/* Preview */}
              {(selectedIcon || selectedColor) && (
                <div className="flex justify-center">
                  <div className="relative">
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-full"
                      style={{ backgroundColor: selectedColor ? `${selectedColor.hex}20` : undefined }}
                    >
                      <span className="text-5xl">{selectedIcon?.emoji ?? '?'}</span>
                    </div>
                    {selectedColor && (
                      <div
                        className="absolute -bottom-1 left-1/2 h-2 w-16 -translate-x-1/2 rounded-full"
                        style={{ backgroundColor: selectedColor.hex }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Icon selection */}
              <div>
                <Label>Choose your icon</Label>
                <div className="mt-2 grid grid-cols-6 gap-2">
                  {PROFILE_ICONS.map((icon) => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => setProfileIcon(icon.id)}
                      aria-pressed={profileIcon === icon.id}
                      aria-label={icon.label}
                      className={cn(
                        'flex h-12 items-center justify-center rounded-lg border-2 transition-all',
                        profileIcon === icon.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <span className="text-2xl">{icon.emoji}</span>
                    </button>
                  ))}
                </div>
                {errors.profileIcon && (
                  <p className="mt-1 text-sm text-error" role="alert">
                    {errors.profileIcon}
                  </p>
                )}
              </div>

              {/* Color selection */}
              <div>
                <Label>Choose your color</Label>
                <div className="mt-2 grid grid-cols-6 gap-2">
                  {PROFILE_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setProfileColor(color.id)}
                      aria-pressed={profileColor === color.id}
                      aria-label={color.label}
                      className={cn(
                        'flex h-12 items-center justify-center rounded-lg border-2 transition-all',
                        profileColor === color.id ? 'border-text' : 'border-transparent'
                      )}
                    >
                      <div
                        className="h-8 w-8 rounded-full"
                        style={{ backgroundColor: color.hex }}
                      />
                    </button>
                  ))}
                </div>
                {errors.profileColor && (
                  <p className="mt-1 text-sm text-error" role="alert">
                    {errors.profileColor}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Security Image */}
          {currentStep === 'security-image' && (
            <SecurityImagePicker
              value={securityImageId}
              onChange={setSecurityImageId}
              error={!!errors.securityImageId}
              errorMessage={errors.securityImageId}
            />
          )}

          {/* Step 5: PIN Setup */}
          {currentStep === 'pin-setup' && (
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block text-center">Enter a 6-digit PIN</Label>
                <PINInput
                  value={pin}
                  onChange={setPin}
                  error={!!errors.pin}
                  errorMessage={errors.pin}
                  autoFocus
                />
              </div>

              {pin.length === 6 && (
                <div>
                  <Label className="mb-2 block text-center">Confirm your PIN</Label>
                  <PINInput
                    value={confirmPin}
                    onChange={setConfirmPin}
                    error={!!errors.confirmPin}
                    errorMessage={errors.confirmPin}
                    autoFocus
                  />
                </div>
              )}

              <p className="text-center text-sm text-text-muted">
                Your PIN should not be easy to guess (no 123456 or repeating numbers).
                Do not use your birth year.
              </p>
            </div>
          )}

          {/* Step 6: Pattern Setup */}
          {currentStep === 'pattern-setup' && (
            <div className="space-y-4">
              {!isConfirmingPattern ? (
                <>
                  <p className="text-center text-sm text-text-muted">
                    Draw a pattern by connecting at least 4 dots
                  </p>
                  <PatternLock
                    key="initial"
                    onChange={setPattern}
                    onComplete={() => {}}
                    error={!!errors.pattern}
                    errorMessage={errors.pattern}
                    size={240}
                  />
                </>
              ) : (
                <>
                  <p className="text-center text-sm text-text-muted">
                    Draw the same pattern again to confirm
                  </p>
                  <PatternLock
                    key="confirm"
                    onChange={setConfirmPattern}
                    onComplete={() => {}}
                    error={!!errors.confirmPattern}
                    errorMessage={errors.confirmPattern}
                    size={240}
                  />
                </>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex-1"
            >
              Back
            </Button>

            {currentStep === 'pattern-setup' && isConfirmingPattern ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!isStepComplete() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isStepComplete()}
                className="flex-1"
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationForm;
