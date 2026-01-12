/**
 * Auth Library Exports
 *
 * Central export for all authentication utilities.
 */

// Crypto utilities
export {
  encrypt,
  decrypt,
  createPINVerifier,
  verifyPIN,
  createPatternVerifier,
  verifyPattern,
  generateRecoveryCode,
  generateBackupCodes,
  verifyBackupCode,
  calculateCredentialExpiry,
  getCredentialStatus,
  CREDENTIAL_VALIDITY_DAYS,
  CREDENTIAL_WARNING_DAYS,
  type EncryptedData,
  type PINVerifier,
  type PatternVerifier,
} from './crypto';

// Validators
export {
  validateFullName,
  validatePreferredName,
  validatePIN,
  validatePINConfirmation,
  validatePattern,
  validatePatternConfirmation,
  validateBirthYear,
  validateRegistration,
  isPreferredNameUnique,
  isProfileVisuallyUnique,
  GRADE_LEVELS,
  GRADE_LEVEL_LABELS,
  SECURITY_IMAGES,
  PROFILE_ICONS,
  PROFILE_COLORS,
  type ValidationResult,
  type RegistrationData,
  type GradeLevel,
} from './validators';

// Session management
export {
  createSession,
  getActiveSession,
  updateSessionActivity,
  lockSession,
  endSession,
  clearUserSessions,
  shouldLockSession,
  isSessionExpired,
  getLockoutStatus,
  attemptPINLogin,
  verifyPatternMFA,
  getDeviceProfiles,
  getProfile,
  getCredential,
  hasMFASetup,
  getMFAData,
  cleanupExpiredSessions,
  cleanupExpiredCredentials,
  IDLE_TIMEOUT_MS,
  MAX_SESSION_DURATION_MS,
  TAB_HIDDEN_TIMEOUT_MS,
  type LoginAttemptResult,
  type MFAVerificationResult,
  type LockoutStatus,
} from './session';
