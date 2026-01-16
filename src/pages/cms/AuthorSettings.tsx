/**
 * AuthorSettings Page
 *
 * CMS page for managing author profile settings.
 * Loads profile from IndexedDB, creates default if needed, and saves changes.
 */

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { db, type AuthorProfile } from '@/lib/db';
import { useAuthStore } from '@/stores/authStore';
import { generateId } from '@/lib/utils';
import { AuthorProfileEditor } from '@/components/cms/AuthorProfileEditor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// =============================================================================
// Types
// =============================================================================

type LoadingState = 'loading' | 'loaded' | 'error';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Creates a URL-safe slug from a display name
 */
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'author';
}

/**
 * Creates a default author profile from user profile data
 */
function createDefaultProfile(userId: string, preferredName: string): AuthorProfile {
  const now = new Date();
  return {
    userId,
    slug: `${createSlug(preferredName)}-${generateId().slice(0, 8)}`,
    displayName: preferredName,
    bio: '',
    credentials: '[]',
    expertise: '[]',
    socialLinks: '[]',
    avatarType: 'initials',
    avatarData: null,
    avatarBgColor: null,
    createdAt: now,
    updatedAt: now,
  };
}

// =============================================================================
// AuthorSettings Component
// =============================================================================

export function AuthorSettings() {
  const { profile: userProfile } = useAuthStore();
  const userId = userProfile?.userId;

  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load author profile from IndexedDB
  useEffect(() => {
    async function loadProfile() {
      if (!userId) {
        setLoadingState('error');
        setError('User not authenticated');
        return;
      }

      try {
        setLoadingState('loading');
        setError(null);

        // Try to get existing author profile
        const existingProfile = await db.authorProfiles.get(userId);

        if (existingProfile) {
          setAuthorProfile(existingProfile);
          console.log('Loaded existing author profile');
        } else {
          // Create default profile from user's Profile data
          const defaultProfile = createDefaultProfile(
            userId,
            userProfile?.preferredName || 'Author'
          );

          // Save to IndexedDB
          await db.authorProfiles.add(defaultProfile);
          setAuthorProfile(defaultProfile);
          console.log('Created default author profile');
        }

        setLoadingState('loaded');
      } catch (err) {
        console.error('Failed to load author profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        setLoadingState('error');
      }
    }

    loadProfile();
  }, [userId, userProfile?.preferredName]);

  // Handle save
  const handleSave = useCallback(
    async (data: Partial<AuthorProfile>) => {
      if (!userId || !authorProfile) {
        console.error('Cannot save: no userId or author profile');
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        // Update slug if display name changed
        const updates: Partial<AuthorProfile> = { ...data };
        if (data.displayName && data.displayName !== authorProfile.displayName) {
          updates.slug = `${createSlug(data.displayName)}-${authorProfile.slug.split('-').pop()}`;
        }

        // Update in IndexedDB
        await db.authorProfiles.update(userId, updates);

        // Update local state
        setAuthorProfile((prev) =>
          prev ? { ...prev, ...updates } : null
        );

        console.log('Author profile saved successfully');
      } catch (err) {
        console.error('Failed to save author profile:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to save profile';
        setError(errorMessage);
        throw err; // Re-throw so the editor knows save failed
      } finally {
        setIsSaving(false);
      }
    },
    [userId, authorProfile]
  );

  // Loading state
  if (loadingState === 'loading') {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state (no profile loaded)
  if (loadingState === 'error' && !authorProfile) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Author Settings</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Profile</AlertTitle>
          <AlertDescription>
            {error || 'An unexpected error occurred. Please try refreshing the page.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Author Settings</h2>
        <p className="mt-1 text-text-muted">
          Manage your author profile and how you appear on published content.
        </p>
      </div>

      {/* Error Alert (for save errors) */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Profile Editor */}
      {userId && (
        <AuthorProfileEditor
          profile={authorProfile}
          userId={userId}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

export default AuthorSettings;
