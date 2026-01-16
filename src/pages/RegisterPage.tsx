/**
 * RegisterPage
 *
 * Page for new user registration.
 * Uses the multi-step RegistrationForm component.
 *
 * Flow:
 * 1. Personal info
 * 2. Profile setup
 * 3. Security image selection
 * 4. PIN creation
 * 5. Pattern lock setup
 * 6. Store credentials encrypted in IndexedDB
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { RegistrationForm, type RegistrationData } from '@/components/auth/RegistrationForm';
import { db } from '@/lib/db';
import {
  createPINVerifier,
  createPatternVerifier,
  generateBackupCodes,
  calculateCredentialExpiry,
  encrypt,
} from '@/lib/auth/crypto';
import { useAuthStore } from '@/stores/authStore';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setProfile, setSession } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Handle registration submission
  const handleSubmit = async (data: RegistrationData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Generate unique user ID
      const userId = crypto.randomUUID();
      const now = new Date();

      // Create PIN verifier (Argon2id hash)
      const pinVerifier = await createPINVerifier(data.pin, userId);

      // Create pattern verifier (SHA-256 hash)
      const patternVerifier = await createPatternVerifier(data.pattern, userId);

      // Generate backup codes
      const { plaintextCodes, hashedCodes, salt: backupCodesSalt } = await generateBackupCodes(10, userId);

      // Create offline auth bundle (encrypted with derived key from PIN)
      // This contains the pattern verifier and backup codes
      const authBundleData = {
        patternVerifier,
        backupCodes: hashedCodes.map((hc) => ({ ...hc, used: false })),
        backupCodesSalt,
        createdAt: now.toISOString(),
      };

      // Encrypt the auth bundle with a key derived from the PIN
      const encryptedAuthBundle = await encrypt(
        JSON.stringify(authBundleData),
        `${data.pin}:${userId}`
      );

      // Calculate credential expiry (45 days)
      const expiresAt = calculateCredentialExpiry(now);

      // Create profile record
      const profile = {
        userId,
        preferredName: data.preferredName,
        profileIcon: data.profileIcon,
        profileColor: data.profileColor,
        gradeLevel: data.gradeLevel,
        role: data.role,
        lastUsedAt: now,
        accountStatus: 'active' as const,
        createdAt: now,
      };

      // Create credential record
      const credential = {
        userId,
        offlineAuthBundle: JSON.stringify(encryptedAuthBundle),
        pinVerifier: JSON.stringify(pinVerifier),
        securityImageId: data.securityImageId,
        issuedAt: now,
        expiresAt,
        lastUsedAt: now,
      };

      // Create MFA data record
      const mfaData = {
        userId,
        primaryMethod: 'pattern' as const,
        patternVerifier: JSON.stringify(patternVerifier),
        backupCodes: hashedCodes.map((hc) => JSON.stringify({ ...hc, used: false })),
        failedAttempts: 0,
        lockedUntil: null,
      };

      // Create session
      const session = {
        sessionId: crypto.randomUUID(),
        userId,
        pinVerified: true,
        mfaVerified: true,
        mfaMethod: 'pattern' as const,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1000), // 8 hours
        lastActivityAt: now,
        isActive: true,
      };

      // Save to IndexedDB
      await db.transaction('rw', [db.profiles, db.credentials, db.mfaData, db.sessions, db.auditLogs], async () => {
        await db.profiles.add(profile);
        await db.credentials.add(credential);
        await db.mfaData.add(mfaData);
        await db.sessions.add(session);

        // Log registration
        await db.auditLogs.add({
          logId: crypto.randomUUID(),
          userId,
          eventType: 'registration_complete',
          timestamp: now,
          details: JSON.stringify({
            fullName: data.fullName,
            preferredName: data.preferredName,
            gradeLevel: data.gradeLevel,
          }),
          synced: false,
        });
      });

      // Update auth store
      setProfile(profile);
      setSession(session);

      // Show backup codes to user (in production, this would be a modal or dedicated page)
      // For now, we'll store them temporarily and show on a confirmation page
      sessionStorage.setItem('registration_backup_codes', JSON.stringify(plaintextCodes));

      // Navigate to home (or backup codes display page)
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Registration failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel (go back to profile select)
  const handleCancel = () => {
    navigate('/profiles', { replace: true });
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-text">Create Your Profile</h1>
        <p className="mt-1 text-text-muted">Set up your CodeLearn account</p>
      </div>

      {error && (
        <div
          className="mb-4 w-full max-w-md rounded-lg bg-error/10 p-4 text-center text-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <RegistrationForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default RegisterPage;
