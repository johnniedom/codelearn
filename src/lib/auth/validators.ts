/**
 * Authentication Validators for CodeLearn
 *
 * Validates user input for registration and login flows.
 */

import { db } from '@/lib/db';

// =============================================================================
// Types
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface RegistrationData {
  fullName: string;
  preferredName: string;
  gradeLevel: GradeLevel;
  birthYear: number;
  pin: string;
  confirmPin: string;
  securityImageId: string;
  profileIcon: string;
  profileColor: string;
}

export type GradeLevel =
  | 'grade1'
  | 'grade2'
  | 'grade3'
  | 'grade4'
  | 'grade5'
  | 'grade6'
  | 'grade7'
  | 'grade8'
  | 'grade9'
  | 'grade10'
  | 'grade11'
  | 'grade12'
  | 'adult';

// =============================================================================
// Constants
// =============================================================================

// Sequential patterns to reject (123456, 654321, etc.)
const SEQUENTIAL_PATTERNS = [
  '012345',
  '123456',
  '234567',
  '345678',
  '456789',
  '567890',
  '098765',
  '987654',
  '876543',
  '765432',
  '654321',
  '543210',
];

// Repeated patterns to reject (111111, 222222, etc.)
const REPEATED_PATTERNS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(
  (d) => d.repeat(6)
);

// Common weak PINs
const WEAK_PINS = [
  '000000',
  '111111',
  '222222',
  '333333',
  '444444',
  '555555',
  '666666',
  '777777',
  '888888',
  '999999',
  '123123',
  '121212',
  '696969',
  '112233',
];

// Valid grade levels
export const GRADE_LEVELS: GradeLevel[] = [
  'grade1',
  'grade2',
  'grade3',
  'grade4',
  'grade5',
  'grade6',
  'grade7',
  'grade8',
  'grade9',
  'grade10',
  'grade11',
  'grade12',
  'adult',
];

// Grade level display names
export const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  grade1: 'Grade 1',
  grade2: 'Grade 2',
  grade3: 'Grade 3',
  grade4: 'Grade 4',
  grade5: 'Grade 5',
  grade6: 'Grade 6',
  grade7: 'Grade 7',
  grade8: 'Grade 8',
  grade9: 'Grade 9',
  grade10: 'Grade 10',
  grade11: 'Grade 11',
  grade12: 'Grade 12',
  adult: 'Adult Learner',
};

// =============================================================================
// Name Validation
// =============================================================================

/**
 * Validate full name
 *
 * Requirements:
 * - 2-50 characters
 * - No numbers or special characters (except spaces, hyphens, apostrophes)
 */
export function validateFullName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Name must be 50 characters or less' };
  }

  // Allow letters, spaces, hyphens, apostrophes, and common diacritical marks
  const nameRegex = /^[\p{L}\s\-']+$/u;
  if (!nameRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Name can only contain letters, spaces, hyphens, and apostrophes',
    };
  }

  return { valid: true };
}

/**
 * Validate preferred name
 *
 * Requirements:
 * - 1-20 characters
 * - Same character restrictions as full name
 */
export function validatePreferredName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (trimmed.length < 1) {
    return { valid: false, error: 'Preferred name is required' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Preferred name must be 20 characters or less' };
  }

  const nameRegex = /^[\p{L}\s\-']+$/u;
  if (!nameRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Name can only contain letters, spaces, hyphens, and apostrophes',
    };
  }

  return { valid: true };
}

// =============================================================================
// PIN Validation
// =============================================================================

/**
 * Validate 6-digit PIN
 *
 * Requirements:
 * - Exactly 6 numeric digits
 * - Cannot be sequential (123456)
 * - Cannot be repeated (111111)
 * - Cannot match birth year patterns
 */
export function validatePIN(
  pin: string,
  birthYear?: number
): ValidationResult {
  // Must be exactly 6 digits
  if (!/^\d{6}$/.test(pin)) {
    return { valid: false, error: 'PIN must be exactly 6 digits' };
  }

  // Check for sequential patterns
  if (SEQUENTIAL_PATTERNS.includes(pin)) {
    return {
      valid: false,
      error: 'PIN cannot be a sequential pattern like 123456',
    };
  }

  // Check for repeated patterns
  if (REPEATED_PATTERNS.includes(pin)) {
    return {
      valid: false,
      error: 'PIN cannot be all the same digit',
    };
  }

  // Check for weak PINs
  if (WEAK_PINS.includes(pin)) {
    return {
      valid: false,
      error: 'This PIN is too common. Please choose a different one',
    };
  }

  // Check birth year patterns if provided
  if (birthYear) {
    const yearStr = birthYear.toString();
    const reversedYear = yearStr.split('').reverse().join('');

    // Check if PIN starts or ends with birth year
    if (pin.includes(yearStr) || pin.includes(reversedYear)) {
      return {
        valid: false,
        error: 'PIN cannot contain your birth year',
      };
    }

    // Check for common birth year patterns
    const lastTwo = yearStr.slice(-2);
    if (pin === lastTwo.repeat(3) || pin === `${lastTwo}${lastTwo}${lastTwo}`) {
      return {
        valid: false,
        error: 'PIN cannot be based on your birth year',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate PIN confirmation
 */
export function validatePINConfirmation(
  pin: string,
  confirmPin: string
): ValidationResult {
  if (pin !== confirmPin) {
    return { valid: false, error: 'PINs do not match' };
  }
  return { valid: true };
}

// =============================================================================
// Pattern Lock Validation
// =============================================================================

/**
 * Validate pattern lock sequence
 *
 * Requirements:
 * - Minimum 4 points
 * - Maximum 9 points (3x3 grid)
 * - Each point used only once
 * - Points must be in valid range (0-8)
 */
export function validatePattern(pattern: number[]): ValidationResult {
  // Minimum 4 points
  if (pattern.length < 4) {
    return {
      valid: false,
      error: 'Pattern must connect at least 4 dots',
    };
  }

  // Maximum 9 points
  if (pattern.length > 9) {
    return {
      valid: false,
      error: 'Pattern cannot use more than 9 dots',
    };
  }

  // All points must be valid (0-8 for 3x3 grid)
  if (pattern.some((p) => p < 0 || p > 8 || !Number.isInteger(p))) {
    return {
      valid: false,
      error: 'Invalid pattern points',
    };
  }

  // No duplicate points
  const uniquePoints = new Set(pattern);
  if (uniquePoints.size !== pattern.length) {
    return {
      valid: false,
      error: 'Each dot can only be used once',
    };
  }

  // Check for very weak patterns (straight lines)
  const weakPatterns = [
    [0, 1, 2], // Top row
    [3, 4, 5], // Middle row
    [6, 7, 8], // Bottom row
    [0, 3, 6], // Left column
    [1, 4, 7], // Middle column
    [2, 5, 8], // Right column
    [0, 4, 8], // Diagonal
    [2, 4, 6], // Anti-diagonal
  ];

  const patternStr = pattern.slice(0, 3).sort().join(',');
  for (const weak of weakPatterns) {
    if (weak.sort().join(',') === patternStr && pattern.length === 3) {
      return {
        valid: false,
        error: 'Pattern is too simple. Add more dots',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate that two patterns match
 */
export function validatePatternConfirmation(
  pattern1: number[],
  pattern2: number[]
): ValidationResult {
  if (pattern1.length !== pattern2.length) {
    return { valid: false, error: 'Patterns do not match' };
  }

  for (let i = 0; i < pattern1.length; i++) {
    if (pattern1[i] !== pattern2[i]) {
      return { valid: false, error: 'Patterns do not match' };
    }
  }

  return { valid: true };
}

// =============================================================================
// Birth Year Validation
// =============================================================================

/**
 * Validate birth year
 *
 * Requirements:
 * - 4-digit year
 * - Not in the future
 * - Not before 1900
 * - User should be at least 4 years old (for grade 1)
 */
export function validateBirthYear(year: number): ValidationResult {
  const currentYear = new Date().getFullYear();

  if (!Number.isInteger(year) || year < 1900 || year > 9999) {
    return { valid: false, error: 'Please enter a valid 4-digit year' };
  }

  if (year > currentYear) {
    return { valid: false, error: 'Birth year cannot be in the future' };
  }

  if (year < 1900) {
    return { valid: false, error: 'Please enter a year after 1900' };
  }

  // User should be at least 4 years old
  const age = currentYear - year;
  if (age < 4) {
    return { valid: false, error: 'You must be at least 4 years old' };
  }

  // User probably shouldn't be over 120
  if (age > 120) {
    return { valid: false, error: 'Please check your birth year' };
  }

  return { valid: true };
}

// =============================================================================
// Username/Profile Validation
// =============================================================================

/**
 * Check if a preferred name is unique on this device
 *
 * For shared devices, we need to ensure profile names are distinguishable
 */
export async function isPreferredNameUnique(
  preferredName: string,
  excludeUserId?: string
): Promise<boolean> {
  const normalized = preferredName.toLowerCase().trim();

  const existingProfiles = await db.profiles.toArray();

  return !existingProfiles.some(
    (p) =>
      p.preferredName.toLowerCase().trim() === normalized &&
      p.userId !== excludeUserId
  );
}

/**
 * Validate that a profile icon + color combination is unique on this device
 *
 * Each profile should be visually distinct.
 */
export async function isProfileVisuallyUnique(
  icon: string,
  color: string,
  excludeUserId?: string
): Promise<boolean> {
  const existingProfiles = await db.profiles.toArray();

  return !existingProfiles.some(
    (p) =>
      p.profileIcon === icon &&
      p.profileColor === color &&
      p.userId !== excludeUserId
  );
}

// =============================================================================
// Complete Registration Validation
// =============================================================================

/**
 * Validate complete registration data
 */
export async function validateRegistration(
  data: RegistrationData
): Promise<{
  valid: boolean;
  errors: Partial<Record<keyof RegistrationData, string>>;
}> {
  const errors: Partial<Record<keyof RegistrationData, string>> = {};

  // Full name
  const fullNameResult = validateFullName(data.fullName);
  if (!fullNameResult.valid) {
    errors.fullName = fullNameResult.error;
  }

  // Preferred name
  const preferredNameResult = validatePreferredName(data.preferredName);
  if (!preferredNameResult.valid) {
    errors.preferredName = preferredNameResult.error;
  } else {
    // Check uniqueness
    const isUnique = await isPreferredNameUnique(data.preferredName);
    if (!isUnique) {
      errors.preferredName = 'This name is already in use on this device';
    }
  }

  // Grade level
  if (!GRADE_LEVELS.includes(data.gradeLevel)) {
    errors.gradeLevel = 'Please select a grade level';
  }

  // Birth year
  const birthYearResult = validateBirthYear(data.birthYear);
  if (!birthYearResult.valid) {
    errors.birthYear = birthYearResult.error;
  }

  // PIN
  const pinResult = validatePIN(data.pin, data.birthYear);
  if (!pinResult.valid) {
    errors.pin = pinResult.error;
  }

  // PIN confirmation
  const confirmPinResult = validatePINConfirmation(data.pin, data.confirmPin);
  if (!confirmPinResult.valid) {
    errors.confirmPin = confirmPinResult.error;
  }

  // Security image
  if (!data.securityImageId) {
    errors.securityImageId = 'Please select a security image';
  }

  // Profile icon
  if (!data.profileIcon) {
    errors.profileIcon = 'Please select a profile icon';
  }

  // Profile color
  if (!data.profileColor) {
    errors.profileColor = 'Please select a profile color';
  }

  // Check visual uniqueness of icon + color
  if (data.profileIcon && data.profileColor) {
    const isVisuallyUnique = await isProfileVisuallyUnique(
      data.profileIcon,
      data.profileColor
    );
    if (!isVisuallyUnique) {
      errors.profileColor =
        'This icon and color combination is already in use. Please choose a different combination';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// =============================================================================
// Security Image Data
// =============================================================================

// 24 preset security images
export const SECURITY_IMAGES = [
  { id: 'flower', label: 'Flower', emoji: '🌺' },
  { id: 'star', label: 'Star', emoji: '⭐' },
  { id: 'sun', label: 'Sun', emoji: '☀️' },
  { id: 'moon', label: 'Moon', emoji: '🌙' },
  { id: 'tree', label: 'Tree', emoji: '🌳' },
  { id: 'mountain', label: 'Mountain', emoji: '⛰️' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊' },
  { id: 'rainbow', label: 'Rainbow', emoji: '🌈' },
  { id: 'heart', label: 'Heart', emoji: '❤️' },
  { id: 'diamond', label: 'Diamond', emoji: '💎' },
  { id: 'crown', label: 'Crown', emoji: '👑' },
  { id: 'rocket', label: 'Rocket', emoji: '🚀' },
  { id: 'airplane', label: 'Airplane', emoji: '✈️' },
  { id: 'car', label: 'Car', emoji: '🚗' },
  { id: 'bicycle', label: 'Bicycle', emoji: '🚲' },
  { id: 'house', label: 'House', emoji: '🏠' },
  { id: 'book', label: 'Book', emoji: '📚' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'soccer', label: 'Soccer Ball', emoji: '⚽' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀' },
  { id: 'apple', label: 'Apple', emoji: '🍎' },
  { id: 'cake', label: 'Cake', emoji: '🎂' },
  { id: 'gift', label: 'Gift', emoji: '🎁' },
  { id: 'balloon', label: 'Balloon', emoji: '🎈' },
];

// Profile icons (animals for visual differentiation on shared devices)
export const PROFILE_ICONS = [
  { id: 'lion', label: 'Lion', emoji: '🦁' },
  { id: 'elephant', label: 'Elephant', emoji: '🐘' },
  { id: 'giraffe', label: 'Giraffe', emoji: '🦒' },
  { id: 'zebra', label: 'Zebra', emoji: '🦓' },
  { id: 'monkey', label: 'Monkey', emoji: '🐵' },
  { id: 'bear', label: 'Bear', emoji: '🐻' },
  { id: 'panda', label: 'Panda', emoji: '🐼' },
  { id: 'tiger', label: 'Tiger', emoji: '🐯' },
  { id: 'rabbit', label: 'Rabbit', emoji: '🐰' },
  { id: 'fox', label: 'Fox', emoji: '🦊' },
  { id: 'koala', label: 'Koala', emoji: '🐨' },
  { id: 'penguin', label: 'Penguin', emoji: '🐧' },
  { id: 'owl', label: 'Owl', emoji: '🦉' },
  { id: 'butterfly', label: 'Butterfly', emoji: '🦋' },
  { id: 'turtle', label: 'Turtle', emoji: '🐢' },
  { id: 'dolphin', label: 'Dolphin', emoji: '🐬' },
  { id: 'octopus', label: 'Octopus', emoji: '🐙' },
  { id: 'unicorn', label: 'Unicorn', emoji: '🦄' },
  { id: 'dragon', label: 'Dragon', emoji: '🐉' },
  { id: 'eagle', label: 'Eagle', emoji: '🦅' },
  { id: 'cat', label: 'Cat', emoji: '🐱' },
  { id: 'dog', label: 'Dog', emoji: '🐶' },
  { id: 'hamster', label: 'Hamster', emoji: '🐹' },
  { id: 'frog', label: 'Frog', emoji: '🐸' },
];

// Profile colors (12 options per spec)
export const PROFILE_COLORS = [
  { id: 'blue', label: 'Blue', hex: '#3B82F6' },
  { id: 'green', label: 'Green', hex: '#22C55E' },
  { id: 'purple', label: 'Purple', hex: '#A855F7' },
  { id: 'orange', label: 'Orange', hex: '#F97316' },
  { id: 'pink', label: 'Pink', hex: '#EC4899' },
  { id: 'cyan', label: 'Cyan', hex: '#06B6D4' },
  { id: 'red', label: 'Red', hex: '#EF4444' },
  { id: 'yellow', label: 'Yellow', hex: '#EAB308' },
  { id: 'indigo', label: 'Indigo', hex: '#6366F1' },
  { id: 'teal', label: 'Teal', hex: '#14B8A6' },
  { id: 'rose', label: 'Rose', hex: '#F43F5E' },
  { id: 'amber', label: 'Amber', hex: '#F59E0B' },
];
