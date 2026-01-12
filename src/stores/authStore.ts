import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { Profile, Session } from '@/lib/db';
import { db } from '@/lib/db';
import { getCredentialStatus, CREDENTIAL_WARNING_DAYS } from '@/lib/auth/crypto';

/**
 * Authentication Store
 *
 * Manages user session state, profile information, and authentication status.
 * Persisted to localStorage via Zustand's persist middleware.
 *
 * Features:
 * - 30 min idle timeout -> Lock session, require PIN
 * - 8 hours active -> End session, full re-auth
 * - Tab hidden > 5 min -> Lock session
 * - 45-day credential validity with warnings
 */

interface AuthState {
  // Current session
  session: Session | null;
  profile: Profile | null;

  // Authentication status
  isAuthenticated: boolean;
  isLocked: boolean;
  lastActivityAt: Date | null;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Error state
  error: string | null;

  // Credential status
  credentialStatus: {
    status: 'valid' | 'warning' | 'read-only' | 'locked' | 'archived' | null;
    daysRemaining: number | null;
    message: string | null;
  };
}

interface AuthActions {
  // Session management
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  lockSession: () => void;
  unlockSession: () => Promise<void>;
  clearSession: () => void;
  logout: () => Promise<void>;

  // Activity tracking
  updateLastActivity: () => void;
  checkSessionValidity: () => boolean;

  // Loading and error states
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  initialize: () => Promise<void>;

  // Credential expiry
  updateCredentialStatus: () => Promise<void>;
  getCredentialExpiryDays: () => number | null;
  isCredentialExpiringSoon: () => boolean;
}

type AuthStore = AuthState & AuthActions;

// Session timeout constants (in milliseconds)
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours
const TAB_HIDDEN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      session: null,
      profile: null,
      isAuthenticated: false,
      isLocked: false,
      lastActivityAt: null,
      isLoading: false,
      isInitialized: false,
      error: null,
      credentialStatus: {
        status: null,
        daysRemaining: null,
        message: null,
      },

      // Actions
      setSession: (session) => {
        set({
          session,
          isAuthenticated: session !== null && session.isActive,
          isLocked: false,
          lastActivityAt: new Date(),
          error: null,
        });

        // Update credential status after setting session
        if (session) {
          get().updateCredentialStatus();
        }
      },

      setProfile: (profile) => {
        set({ profile });
      },

      lockSession: () => {
        const { session, profile } = get();

        set({ isLocked: true });

        // Log lock event
        if (session && profile) {
          db.auditLogs.add({
            logId: crypto.randomUUID(),
            userId: profile.userId,
            eventType: 'session_locked',
            timestamp: new Date(),
            details: JSON.stringify({
              sessionId: session.sessionId,
              reason: 'idle_timeout',
            }),
            synced: false,
          }).catch(console.error);
        }
      },

      unlockSession: async () => {
        const { session, profile } = get();

        set({
          isLocked: false,
          lastActivityAt: new Date(),
        });

        // Log unlock event
        if (session && profile) {
          await db.auditLogs.add({
            logId: crypto.randomUUID(),
            userId: profile.userId,
            eventType: 'session_unlocked',
            timestamp: new Date(),
            details: JSON.stringify({ sessionId: session.sessionId }),
            synced: false,
          });
        }
      },

      clearSession: () => {
        set({
          session: null,
          profile: null,
          isAuthenticated: false,
          isLocked: false,
          lastActivityAt: null,
          error: null,
          credentialStatus: {
            status: null,
            daysRemaining: null,
            message: null,
          },
        });
      },

      logout: async () => {
        const { session, profile } = get();

        // Mark session as inactive in IndexedDB
        if (session) {
          await db.sessions.update(session.sessionId, { isActive: false });
        }

        // Log logout event
        if (profile) {
          await db.auditLogs.add({
            logId: crypto.randomUUID(),
            userId: profile.userId,
            eventType: 'logout',
            timestamp: new Date(),
            details: JSON.stringify({
              sessionId: session?.sessionId,
            }),
            synced: false,
          });
        }

        get().clearSession();
      },

      updateLastActivity: () => {
        const { isAuthenticated, isLocked } = get();
        if (isAuthenticated && !isLocked) {
          set({ lastActivityAt: new Date() });
        }
      },

      checkSessionValidity: () => {
        const { session, lastActivityAt, isAuthenticated, isLocked } = get();

        if (!isAuthenticated || !session) {
          return false;
        }

        const now = new Date();

        // Check if session has expired
        if (new Date(session.expiresAt) < now) {
          get().clearSession();
          return false;
        }

        // Check max session duration
        const sessionDuration = now.getTime() - new Date(session.createdAt).getTime();
        if (sessionDuration > MAX_SESSION_DURATION_MS) {
          get().clearSession();
          return false;
        }

        // If already locked, stay locked
        if (isLocked) {
          return false;
        }

        // Check idle timeout
        if (lastActivityAt) {
          const idleTime = now.getTime() - new Date(lastActivityAt).getTime();
          if (idleTime > IDLE_TIMEOUT_MS) {
            get().lockSession();
            return false;
          }
        }

        return true;
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error });
      },

      initialize: async () => {
        const { session, profile, checkSessionValidity, updateCredentialStatus } = get();

        // If we have a persisted session, validate it
        if (session && profile) {
          // Re-hydrate Date objects (they come as strings from storage)
          const hydratedSession = {
            ...session,
            createdAt: new Date(session.createdAt),
            expiresAt: new Date(session.expiresAt),
            lastActivityAt: new Date(session.lastActivityAt),
          };

          set({ session: hydratedSession });

          // Check if session is still valid
          const isValid = checkSessionValidity();

          if (isValid) {
            // Update credential status
            await updateCredentialStatus();
          }
        }

        set({ isInitialized: true });
      },

      updateCredentialStatus: async () => {
        const { profile } = get();
        if (!profile) {
          set({
            credentialStatus: {
              status: null,
              daysRemaining: null,
              message: null,
            },
          });
          return;
        }

        try {
          const credential = await db.credentials.get(profile.userId);
          if (!credential) {
            set({
              credentialStatus: {
                status: 'archived',
                daysRemaining: 0,
                message: 'Credentials not found. Please sync with the hub.',
              },
            });
            return;
          }

          const status = getCredentialStatus(new Date(credential.expiresAt));
          set({
            credentialStatus: {
              status: status.status,
              daysRemaining: status.daysRemaining,
              message: status.message,
            },
          });
        } catch (err) {
          console.error('Failed to update credential status:', err);
        }
      },

      getCredentialExpiryDays: () => {
        return get().credentialStatus.daysRemaining;
      },

      isCredentialExpiringSoon: () => {
        const days = get().credentialStatus.daysRemaining;
        return days !== null && days <= CREDENTIAL_WARNING_DAYS && days > 0;
      },
    }),
    {
      name: 'codelearn-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist specific fields, not loading states
      partialize: (state) => ({
        session: state.session,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        lastActivityAt: state.lastActivityAt,
      }),
    }
  )
);

// Tab visibility handler for session locking
if (typeof document !== 'undefined') {
  let hiddenSince: number | null = null;

  document.addEventListener('visibilitychange', () => {
    const { isAuthenticated, isLocked, lockSession, updateLastActivity } = useAuthStore.getState();

    if (!isAuthenticated) return;

    if (document.visibilityState === 'hidden') {
      hiddenSince = Date.now();
    } else if (document.visibilityState === 'visible') {
      if (hiddenSince !== null) {
        const hiddenDuration = Date.now() - hiddenSince;
        if (hiddenDuration > TAB_HIDDEN_TIMEOUT_MS) {
          if (!isLocked) {
            lockSession();
          }
        } else {
          updateLastActivity();
        }
        hiddenSince = null;
      }
    }
  });

  // Activity tracking on user interaction
  const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];

  const handleActivity = () => {
    const { isAuthenticated, isLocked, updateLastActivity } = useAuthStore.getState();
    if (isAuthenticated && !isLocked) {
      updateLastActivity();
    }
  };

  // Throttle activity updates to avoid excessive calls
  let lastActivityUpdate = 0;
  const throttledActivity = () => {
    const now = Date.now();
    if (now - lastActivityUpdate > 30000) { // Update at most every 30 seconds
      lastActivityUpdate = now;
      handleActivity();
    }
  };

  activityEvents.forEach((event) => {
    document.addEventListener(event, throttledActivity, { passive: true });
  });
}

export default useAuthStore;
