/**
 * Cryptographic Utilities for CodeLearn Identity System
 *
 * Provides secure credential storage and verification using:
 * - AES-256-GCM for encrypting sensitive data
 * - Argon2id for PIN hashing (via hash-wasm)
 * - SHA-256 for pattern lock hashing
 */

import { argon2id, argon2Verify } from 'hash-wasm';

// =============================================================================
// Types
// =============================================================================

export interface EncryptedData {
  /** Base64-encoded ciphertext */
  ciphertext: string;
  /** Base64-encoded initialization vector */
  iv: string;
  /** Base64-encoded salt for key derivation */
  salt: string;
}

export interface PINVerifier {
  /** Algorithm used */
  algorithm: 'argon2id';
  /** Argon2 encoded hash (includes salt and parameters) */
  hash: string;
  /** Time cost parameter */
  timeCost: number;
  /** Memory cost in KB */
  memoryCost: number;
  /** Parallelism factor */
  parallelism: number;
}

export interface PatternVerifier {
  /** SHA-256 hash of pattern sequence */
  hash: string;
  /** Salt for hashing */
  salt: string;
  /** Number of points in pattern (for hint, not security) */
  pointCount: number;
}

// =============================================================================
// Constants
// =============================================================================

// Argon2id parameters
// timeCost: 3, memoryCost: 65536 (64MB), parallelism: 1
const ARGON2_TIME_COST = 3;
const ARGON2_MEMORY_COST = 65536; // 64MB in KB
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LENGTH = 32;

// Credential validity per spec
export const CREDENTIAL_VALIDITY_DAYS = 45;
export const CREDENTIAL_WARNING_DAYS = 7;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate cryptographically secure random bytes
 * Returns ArrayBuffer-backed Uint8Array for compatibility with Web Crypto API
 */
function generateRandomBytes(length: number): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(length);
  const bytes = new Uint8Array(buffer);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Convert Uint8Array to Base64 string
 */
function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Convert Base64 string to Uint8Array
 * Returns ArrayBuffer-backed Uint8Array for compatibility with Web Crypto API
 */
function fromBase64(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert string to UTF-8 encoded Uint8Array
 * Returns ArrayBuffer-backed Uint8Array for compatibility with Web Crypto API
 */
function stringToBytes(str: string): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  // Copy to new ArrayBuffer to ensure proper type
  const buffer = new ArrayBuffer(encoded.length);
  const bytes = new Uint8Array(buffer);
  bytes.set(encoded);
  return bytes;
}

/**
 * Convert Uint8Array to UTF-8 string
 */
function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

// =============================================================================
// AES-256-GCM Encryption
// =============================================================================

/**
 * Derive an AES-256 key from a password using PBKDF2
 *
 * @param password - The password to derive key from
 * @param salt - Salt for key derivation
 * @returns CryptoKey for AES-GCM operations
 */
async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<CryptoKey> {
  // Import password as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    stringToBytes(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES-256 key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM
 *
 * @param plaintext - Data to encrypt
 * @param password - Password for key derivation
 * @returns Encrypted data with IV and salt
 */
export async function encrypt(
  plaintext: string,
  password: string
): Promise<EncryptedData> {
  const salt = generateRandomBytes(16);
  const iv = generateRandomBytes(12); // 96-bit IV for GCM
  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    stringToBytes(plaintext)
  );

  return {
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    iv: toBase64(iv),
    salt: toBase64(salt),
  };
}

/**
 * Decrypt data using AES-256-GCM
 *
 * @param encryptedData - Data to decrypt
 * @param password - Password for key derivation
 * @returns Decrypted plaintext
 * @throws Error if decryption fails (wrong password or tampered data)
 */
export async function decrypt(
  encryptedData: EncryptedData,
  password: string
): Promise<string> {
  const salt = fromBase64(encryptedData.salt);
  const iv = fromBase64(encryptedData.iv);
  const ciphertext = fromBase64(encryptedData.ciphertext);
  const key = await deriveKey(password, salt);

  try {
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext
    );

    return bytesToString(new Uint8Array(plaintext));
  } catch {
    throw new Error('Decryption failed: invalid password or corrupted data');
  }
}

// =============================================================================
// Argon2id PIN Hashing
// =============================================================================

/**
 * Create a PIN verifier using Argon2id
 *
 * Uses the following parameters:
 * - Algorithm: argon2id
 * - timeCost: 3
 * - memoryCost: 65536 (64MB)
 * - parallelism: 1
 *
 * @param pin - The 6-digit PIN to hash
 * @param userId - User ID to include in hash (prevents hash reuse)
 * @returns PIN verifier object for storage
 */
export async function createPINVerifier(
  pin: string,
  userId: string
): Promise<PINVerifier> {
  const salt = generateRandomBytes(16);

  // Combine PIN with userId to prevent hash reuse across users
  const password = `${pin}:${userId}`;

  const hash = await argon2id({
    password,
    salt,
    iterations: ARGON2_TIME_COST,
    memorySize: ARGON2_MEMORY_COST,
    parallelism: ARGON2_PARALLELISM,
    hashLength: ARGON2_HASH_LENGTH,
    outputType: 'encoded',
  });

  return {
    algorithm: 'argon2id',
    hash,
    timeCost: ARGON2_TIME_COST,
    memoryCost: ARGON2_MEMORY_COST,
    parallelism: ARGON2_PARALLELISM,
  };
}

/**
 * Verify a PIN against a stored verifier
 *
 * @param pin - The PIN to verify
 * @param userId - User ID
 * @param verifier - Stored PIN verifier
 * @returns true if PIN matches, false otherwise
 */
export async function verifyPIN(
  pin: string,
  userId: string,
  verifier: PINVerifier
): Promise<boolean> {
  const password = `${pin}:${userId}`;

  try {
    return await argon2Verify({
      password,
      hash: verifier.hash,
    });
  } catch {
    return false;
  }
}

// =============================================================================
// Pattern Lock Hashing
// =============================================================================

/**
 * Create a pattern verifier using SHA-256
 *
 * Pattern is represented as an array of node indices (0-8 for 3x3 grid)
 * Example: [0, 1, 2, 5, 8] represents a pattern going:
 *   top-left -> top-center -> top-right -> middle-right -> bottom-right
 *
 * @param pattern - Array of node indices in order drawn
 * @param userId - User ID to include in hash
 * @returns Pattern verifier for storage
 */
export async function createPatternVerifier(
  pattern: number[],
  userId: string
): Promise<PatternVerifier> {
  const salt = toBase64(generateRandomBytes(16));

  // Create string representation of pattern
  const patternString = pattern.join(',');
  const dataToHash = `${patternString}:${salt}:${userId}`;

  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    stringToBytes(dataToHash)
  );

  return {
    hash: toBase64(new Uint8Array(hashBuffer)),
    salt,
    pointCount: pattern.length,
  };
}

/**
 * Verify a pattern against a stored verifier
 *
 * @param pattern - Pattern to verify
 * @param userId - User ID
 * @param verifier - Stored pattern verifier
 * @returns true if pattern matches, false otherwise
 */
export async function verifyPattern(
  pattern: number[],
  userId: string,
  verifier: PatternVerifier
): Promise<boolean> {
  // Validate pattern input before processing
  if (
    !Array.isArray(pattern) ||
    pattern.length === 0 ||
    pattern.some((p) => !Number.isInteger(p) || p < 0 || p > 8)
  ) {
    return false;
  }

  // Quick check: if point count differs, pattern can't match
  if (pattern.length !== verifier.pointCount) {
    return false;
  }

  const patternString = pattern.join(',');
  const dataToHash = `${patternString}:${verifier.salt}:${userId}`;

  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    stringToBytes(dataToHash)
  );

  const computedHash = toBase64(new Uint8Array(hashBuffer));

  // Constant-time comparison
  if (computedHash.length !== verifier.hash.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < computedHash.length; i++) {
    diff |= computedHash.charCodeAt(i) ^ verifier.hash.charCodeAt(i);
  }
  return diff === 0;
}

// =============================================================================
// Recovery Code Generation
// =============================================================================

/**
 * Generate a single backup/recovery code
 *
 * Format: XXXX-XXXX (8 alphanumeric characters)
 */
export function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (0, O, I, 1)
  const bytes = generateRandomBytes(8);
  let code = '';

  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
    if (i === 3) code += '-';
  }

  return code;
}

/**
 * Generate a set of backup codes
 *
 * @param count - Number of codes to generate (default 10)
 * @returns Array of plaintext codes and their hashed versions
 */
export async function generateBackupCodes(
  count: number = 10,
  userId: string
): Promise<{
  plaintextCodes: string[];
  hashedCodes: Array<{ hash: string; index: number }>;
  salt: string;
}> {
  const salt = toBase64(generateRandomBytes(16));
  const plaintextCodes: string[] = [];
  const hashedCodes: Array<{ hash: string; index: number }> = [];

  for (let i = 0; i < count; i++) {
    const code = generateRecoveryCode();
    plaintextCodes.push(code);

    // Hash code for storage
    const dataToHash = `${code}:${salt}:${userId}`;
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      stringToBytes(dataToHash)
    );

    hashedCodes.push({
      hash: toBase64(new Uint8Array(hashBuffer)),
      index: i + 1,
    });
  }

  return { plaintextCodes, hashedCodes, salt };
}

/**
 * Verify a backup code
 *
 * @param code - Code to verify (format: XXXX-XXXX)
 * @param hashedCodes - Array of hashed codes
 * @param salt - Salt used for hashing
 * @param userId - User ID
 * @returns Index of matched code (1-10) or null if not found
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: Array<{ hash: string; used: boolean; index: number }>,
  salt: string,
  userId: string
): Promise<number | null> {
  // Normalize code (uppercase, remove spaces)
  const normalizedCode = code.toUpperCase().replace(/\s/g, '');

  const dataToHash = `${normalizedCode}:${salt}:${userId}`;
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    stringToBytes(dataToHash)
  );
  const computedHash = toBase64(new Uint8Array(hashBuffer));

  // Find matching unused code
  for (const hashedCode of hashedCodes) {
    if (hashedCode.used) continue;

    // Constant-time comparison
    if (computedHash.length !== hashedCode.hash.length) continue;

    let diff = 0;
    for (let i = 0; i < computedHash.length; i++) {
      diff |= computedHash.charCodeAt(i) ^ hashedCode.hash.charCodeAt(i);
    }

    if (diff === 0) {
      return hashedCode.index;
    }
  }

  return null;
}

// =============================================================================
// Credential Expiry Helpers
// =============================================================================

/**
 * Calculate credential expiry date
 *
 * @param issuedAt - When credential was issued
 * @returns Expiry date (45 days from issue)
 */
export function calculateCredentialExpiry(issuedAt: Date = new Date()): Date {
  const expiry = new Date(issuedAt);
  expiry.setDate(expiry.getDate() + CREDENTIAL_VALIDITY_DAYS);
  return expiry;
}

/**
 * Get credential status based on expiry
 *
 * Status levels:
 * - Days 0-38: Normal operation
 * - Days 38-45: Warning period
 * - Days 45-52: Read-only mode
 * - Days 52-60: Locked mode
 * - Day 60+: Archived
 */
export function getCredentialStatus(expiresAt: Date): {
  status: 'valid' | 'warning' | 'read-only' | 'locked' | 'archived';
  daysRemaining: number;
  message: string;
} {
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining > CREDENTIAL_WARNING_DAYS) {
    return {
      status: 'valid',
      daysRemaining,
      message: '',
    };
  }

  if (daysRemaining > 0) {
    return {
      status: 'warning',
      daysRemaining,
      message: `Your credentials expire in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Please sync with the hub.`,
    };
  }

  if (daysRemaining > -7) {
    return {
      status: 'read-only',
      daysRemaining,
      message: 'Your credentials have expired. Progress is read-only until you sync.',
    };
  }

  if (daysRemaining > -15) {
    return {
      status: 'locked',
      daysRemaining,
      message: 'Your account is locked. Please sync with the hub to continue.',
    };
  }

  return {
    status: 'archived',
    daysRemaining,
    message: 'This account has been archived. Please contact your teacher.',
  };
}
