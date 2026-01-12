/**
 * ProfileSelectPage
 *
 * Profile selector for shared devices.
 *
 * Features:
 * - Shows all registered profiles on device
 * - Avatar + color band + name + last activity
 * - "Add new profile" option
 * - Maximum 10 profiles per device
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileCard, AddProfileCard } from '@/components/auth/ProfileCard';
import { db, type Profile } from '@/lib/db';
import { useAuthStore } from '@/stores/authStore';

const MAX_PROFILES = 10;

export const ProfileSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, profile: currentProfile } = useAuthStore();

  // State
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // If already authenticated, redirect to home
  React.useEffect(() => {
    if (isAuthenticated && currentProfile) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, currentProfile, navigate]);

  // Load profiles from IndexedDB
  React.useEffect(() => {
    const loadProfiles = async () => {
      try {
        const allProfiles = await db.profiles
          .orderBy('lastUsedAt')
          .reverse()
          .toArray();
        setProfiles(allProfiles);
      } catch (err) {
        console.error('Failed to load profiles:', err);
        setError('Failed to load profiles');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfiles();
  }, []);

  // Handle profile selection
  const handleSelectProfile = (selectedProfile: Profile) => {
    navigate('/login', { state: { userId: selectedProfile.userId } });
  };

  // Handle add new profile
  const handleAddProfile = () => {
    navigate('/register');
  };

  // Can add more profiles?
  const canAddProfile = profiles.length < MAX_PROFILES;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-text-muted">Loading profiles...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
        <div className="text-center">
          <p className="mb-4 text-error">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // No profiles - show welcome and registration
  if (profiles.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-text">
            Welcome to CodeLearn!
          </h1>
          <p className="mb-8 text-text-muted">
            Create your profile to start learning
          </p>
        </div>

        <AddProfileCard
          onClick={handleAddProfile}
          className="w-full max-w-xs"
        />

        <p className="mt-6 text-center text-sm text-text-muted">
          Your progress is saved on this device.
          <br />
          Sync with your class hub to share with your teacher.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-text">Who is learning today?</h1>
        <p className="mt-1 text-text-muted">
          Select your profile to continue
        </p>
      </div>

      {/* Profile grid */}
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        role="list"
        aria-label="Profiles on this device"
      >
        {profiles.map((profileItem) => (
          <ProfileCard
            key={profileItem.userId}
            profile={profileItem}
            onSelect={handleSelectProfile}
          />
        ))}

        {/* Add new profile card */}
        {canAddProfile && <AddProfileCard onClick={handleAddProfile} />}
      </div>

      {/* Max profiles reached message */}
      {!canAddProfile && (
        <p className="mt-6 text-center text-sm text-text-muted">
          Maximum {MAX_PROFILES} profiles per device reached.
        </p>
      )}

      {/* Help text */}
      <div className="mt-8 text-center">
        <p className="text-sm text-text-muted">
          {profiles.length === 1
            ? 'This device has 1 profile'
            : `This device has ${profiles.length} profiles`}
        </p>
      </div>
    </div>
  );
};

export default ProfileSelectPage;
