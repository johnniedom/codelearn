/**
 * LoginPage
 *
 * Login flow for existing users.
 *
 * Features:
 * 1. Show security image first (anti-phishing)
 * 2. 6-digit PIN entry
 * 3. Pattern Lock verification (MFA)
 * 4. 5 failed PIN attempts = 30min lockout
 * 5. 3 failed MFA attempts = 15min lockout
 */

import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PINInput } from '@/components/auth/PINInput';
import { PatternLock } from '@/components/auth/PatternLock';
import { db } from '@/lib/db';
import { SECURITY_IMAGES, PROFILE_ICONS, PROFILE_COLORS } from '@/lib/auth/validators';
import { attemptPINLogin, verifyPatternMFA, getLockoutStatus } from '@/lib/auth/session';
import { useAuthStore } from '@/stores/authStore';
import type { Profile, Credential } from '@/lib/db';

type LoginStep = 'security-image' | 'pin' | 'pattern';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setProfile, setSession } = useAuthStore();

  // Get userId from navigation state
  const userId = (location.state as { userId?: string })?.userId;

  // State
  const [step, setStep] = React.useState<LoginStep>('security-image');
  const [profile, setProfileState] = React.useState<Profile | null>(null);
  const [credential, setCredential] = React.useState<Credential | null>(null);
  const [sessionId, setSessionId] = React.useState<string | null>(null);

  // Form state
  const [pin, setPin] = React.useState('');
  const [pattern, setPattern] = React.useState<number[]>([]);

  // Error and loading states
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLocked, setIsLocked] = React.useState(false);
  const [lockoutMinutes, setLockoutMinutes] = React.useState(0);

  // Load profile and credential data
  React.useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        navigate('/profiles', { replace: true });
        return;
      }

      try {
        const [profileData, credentialData] = await Promise.all([
          db.profiles.get(userId),
          db.credentials.get(userId),
        ]);

        if (!profileData || !credentialData) {
          setError('Profile not found');
          return;
        }

        setProfileState(profileData);
        setCredential(credentialData);

        // Check lockout status
        const lockoutStatus = await getLockoutStatus(userId);
        if (lockoutStatus.isLocked) {
          setIsLocked(true);
          setLockoutMinutes(lockoutStatus.remainingMinutes);
        }
      } catch (err) {
        console.error('Failed to load user data:', err);
        setError('Failed to load profile');
      }
    };

    loadUserData();
  }, [userId, navigate]);

  // Get security image data
  const securityImage = credential
    ? SECURITY_IMAGES.find((img) => img.id === credential.securityImageId)
    : null;

  // Get profile icon and color
  const profileIcon = profile
    ? PROFILE_ICONS.find((i) => i.id === profile.profileIcon)
    : null;
  const profileColor = profile
    ? PROFILE_COLORS.find((c) => c.id === profile.profileColor)
    : null;

  // Handle security image verification
  const handleSecurityImageVerified = () => {
    setStep('pin');
    setError(null);
  };

  // Handle PIN submission
  const handlePINSubmit = async () => {
    if (!userId || pin.length !== 6) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await attemptPINLogin(userId, pin);

      if (!result.success) {
        setError(result.error ?? 'Invalid PIN');
        setPin('');

        if (result.lockoutUntil) {
          setIsLocked(true);
          const minutes = Math.ceil(
            (result.lockoutUntil.getTime() - Date.now()) / (60 * 1000)
          );
          setLockoutMinutes(minutes);
        }
        return;
      }

      // Check if MFA is required
      if (result.requiresMFA && result.session) {
        setSessionId(result.session.sessionId);
        setStep('pattern');
      } else if (result.session) {
        // No MFA, login complete
        await completeLogin(result.session.sessionId);
      }
    } catch (err) {
      console.error('PIN verification failed:', err);
      setError('An error occurred. Please try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pattern submission
  const handlePatternComplete = async (patternInput: number[]) => {
    if (!userId || !sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyPatternMFA(userId, sessionId, patternInput);

      if (!result.success) {
        setError(result.error ?? 'Invalid pattern');
        setPattern([]);

        if (result.lockoutUntil) {
          setIsLocked(true);
          const minutes = Math.ceil(
            (result.lockoutUntil.getTime() - Date.now()) / (60 * 1000)
          );
          setLockoutMinutes(minutes);
        }
        return;
      }

      // MFA verified, login complete
      await completeLogin(sessionId);
    } catch (err) {
      console.error('Pattern verification failed:', err);
      setError('An error occurred. Please try again.');
      setPattern([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Complete login and navigate
  const completeLogin = async (sessionIdToUse: string) => {
    if (!profile) return;

    const session = await db.sessions.get(sessionIdToUse);
    if (session) {
      setSession(session);
      setProfile(profile);

      // Update last used time
      await db.profiles.update(profile.userId, { lastUsedAt: new Date() });

      navigate('/', { replace: true });
    }
  };

  // Handle back to profile select
  const handleBackToProfiles = () => {
    navigate('/profiles', { replace: true });
  };

  // Handle forgot PIN
  const handleForgotPIN = () => {
    // In production, this would navigate to a recovery flow
    // For now, just show a message
    setError('Please see your teacher for PIN recovery help.');
  };

  // Loading state
  if (!profile || !credential) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Lockout state
  if (isLocked) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ backgroundColor: profileColor ? `${profileColor.hex}20` : undefined }}
            >
              <span className="text-5xl">{profileIcon?.emoji ?? '👤'}</span>
            </div>
            <CardTitle className="text-error">Account Locked</CardTitle>
            <CardDescription>
              Too many failed attempts. Please try again in {lockoutMinutes} minute
              {lockoutMinutes === 1 ? '' : 's'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleBackToProfiles}
              className="w-full"
            >
              Back to Profiles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {/* Profile avatar */}
          <div
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: profileColor ? `${profileColor.hex}20` : undefined }}
          >
            <span className="text-5xl">{profileIcon?.emoji ?? '👤'}</span>
          </div>
          <CardTitle>Welcome back, {profile.preferredName}!</CardTitle>

          {/* Step-specific description */}
          {step === 'security-image' && (
            <CardDescription>
              First, verify this is the real CodeLearn by checking your security image
            </CardDescription>
          )}
          {step === 'pin' && (
            <CardDescription>Enter your 6-digit PIN to continue</CardDescription>
          )}
          {step === 'pattern' && (
            <CardDescription>Draw your pattern to complete login</CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {/* Error display */}
          {error && (
            <div
              className="mb-4 rounded-lg bg-error/10 p-3 text-center text-sm text-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Step 1: Security Image Verification */}
          {step === 'security-image' && securityImage && (
            <div className="space-y-6">
              <div className="rounded-lg bg-primary/5 p-6 text-center">
                <p className="mb-4 text-sm text-text-muted">
                  Is this YOUR security image?
                </p>
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-xl bg-white shadow-md">
                  <span className="text-6xl" role="img" aria-label={securityImage.label}>
                    {securityImage.emoji}
                  </span>
                </div>
                <p className="mt-3 text-lg font-semibold text-text">
                  {securityImage.label}
                </p>
              </div>

              <div className="rounded-lg border border-warning/50 bg-warning/10 p-3">
                <p className="text-center text-sm text-warning">
                  If this is NOT your image, do not enter your PIN!
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBackToProfiles}
                  className="flex-1"
                >
                  Not my image
                </Button>
                <Button onClick={handleSecurityImageVerified} className="flex-1">
                  Yes, continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: PIN Entry */}
          {step === 'pin' && (
            <div className="space-y-6">
              <PINInput
                value={pin}
                onChange={setPin}
                onComplete={handlePINSubmit}
                disabled={isLoading}
                error={!!error}
                autoFocus
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('security-image')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handlePINSubmit}
                  disabled={pin.length !== 6 || isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Verifying...' : 'Continue'}
                </Button>
              </div>

              <button
                type="button"
                onClick={handleForgotPIN}
                className="w-full text-center text-sm text-primary hover:underline"
              >
                Forgot your PIN?
              </button>
            </div>
          )}

          {/* Step 3: Pattern Lock */}
          {step === 'pattern' && (
            <div className="space-y-6">
              <PatternLock
                onChange={setPattern}
                onComplete={handlePatternComplete}
                disabled={isLoading}
                error={!!error}
                size={220}
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('pin');
                    setPin('');
                    setPattern([]);
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => handlePatternComplete(pattern)}
                  disabled={pattern.length < 4 || isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
