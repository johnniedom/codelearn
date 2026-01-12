import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Database types available at @/lib/db if needed for type-safe payloads

/**
 * Sync Store
 *
 * Manages synchronization state between the PWA and the Hub.
 * Tracks online status, sync queue, and sync operations.
 *
 * Features:
 * - Sync queue with priorities
 * - Retry logic with max 5 retries
 * - Max 1000 items per user
 * - Max 30 days retention
 */

type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

interface SyncState {
  // Connectivity
  isOnline: boolean;
  hubUrl: string | null;
  isHubReachable: boolean;
  lastHubCheck: Date | null;

  // Sync status
  syncStatus: SyncStatus;
  lastSyncAt: Date | null;
  syncProgress: number; // 0-100

  // Queue stats
  pendingItemsCount: number;
  failedItemsCount: number;

  // Current operation
  currentOperation: string | null;

  // Error handling
  lastError: string | null;
  retryCount: number;
}

interface SyncActions {
  // Connectivity
  setOnline: (isOnline: boolean) => void;
  setHubUrl: (url: string | null) => void;
  setHubReachable: (reachable: boolean) => void;

  // Sync operations
  startSync: () => void;
  updateSyncProgress: (progress: number, operation?: string) => void;
  completeSyncSuccess: () => void;
  completeSyncError: (error: string) => void;
  resetSyncState: () => void;

  // Queue management
  updateQueueStats: (pending: number, failed: number) => void;
  incrementRetryCount: () => void;
  resetRetryCount: () => void;

  // Hub discovery
  discoverHub: () => Promise<boolean>;
}

type SyncStore = SyncState & SyncActions;

// Constants
const MAX_RETRY_COUNT = 5;
// Hub check interval for future background sync implementation
// const HUB_CHECK_INTERVAL_MS = 30 * 1000; // Check hub every 30 seconds when online

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      hubUrl: null,
      isHubReachable: false,
      lastHubCheck: null,

      syncStatus: 'idle',
      lastSyncAt: null,
      syncProgress: 0,

      pendingItemsCount: 0,
      failedItemsCount: 0,

      currentOperation: null,

      lastError: null,
      retryCount: 0,

      // Actions
      setOnline: (isOnline) => {
        set({ isOnline });
        // If we just came online, trigger hub check
        if (isOnline) {
          get().discoverHub();
        } else {
          set({ isHubReachable: false });
        }
      },

      setHubUrl: (hubUrl) => {
        set({ hubUrl });
      },

      setHubReachable: (isHubReachable) => {
        set({ isHubReachable, lastHubCheck: new Date() });
      },

      startSync: () => {
        const { syncStatus, retryCount } = get();

        // Don't start if already syncing
        if (syncStatus === 'syncing') return;

        // Check retry limit
        if (retryCount >= MAX_RETRY_COUNT) {
          set({
            syncStatus: 'error',
            lastError: 'Maximum retry attempts reached. Please try again later.',
          });
          return;
        }

        set({
          syncStatus: 'syncing',
          syncProgress: 0,
          currentOperation: 'Preparing sync...',
          lastError: null,
        });
      },

      updateSyncProgress: (progress, operation) => {
        set({
          syncProgress: Math.min(100, Math.max(0, progress)),
          currentOperation: operation ?? get().currentOperation,
        });
      },

      completeSyncSuccess: () => {
        set({
          syncStatus: 'success',
          syncProgress: 100,
          lastSyncAt: new Date(),
          currentOperation: null,
          lastError: null,
          retryCount: 0,
        });

        // Reset to idle after a short delay
        setTimeout(() => {
          if (get().syncStatus === 'success') {
            set({ syncStatus: 'idle' });
          }
        }, 2000);
      },

      completeSyncError: (error) => {
        set((state) => ({
          syncStatus: 'error',
          lastError: error,
          currentOperation: null,
          retryCount: state.retryCount + 1,
        }));
      },

      resetSyncState: () => {
        set({
          syncStatus: 'idle',
          syncProgress: 0,
          currentOperation: null,
          lastError: null,
        });
      },

      updateQueueStats: (pending, failed) => {
        set({
          pendingItemsCount: pending,
          failedItemsCount: failed,
        });
      },

      incrementRetryCount: () => {
        set((state) => ({
          retryCount: Math.min(state.retryCount + 1, MAX_RETRY_COUNT),
        }));
      },

      resetRetryCount: () => {
        set({ retryCount: 0 });
      },

      discoverHub: async () => {
        const { hubUrl, isOnline } = get();

        if (!isOnline) {
          set({ isHubReachable: false });
          return false;
        }

        // If we have a hub URL, try to reach it
        if (hubUrl) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${hubUrl}/api/health`, {
              method: 'GET',
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              set({ isHubReachable: true, lastHubCheck: new Date() });
              return true;
            }
          } catch {
            // Hub not reachable
          }
        }

        // TODO: Implement mDNS discovery for codelearn.local
        // For now, just mark as not reachable
        set({ isHubReachable: false, lastHubCheck: new Date() });
        return false;
      },
    }),
    {
      name: 'codelearn-sync',
      storage: createJSONStorage(() => localStorage),
      // Only persist configuration, not transient states
      partialize: (state) => ({
        hubUrl: state.hubUrl,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);

// Set up online/offline event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useSyncStore.getState().setOnline(true);
  });

  window.addEventListener('offline', () => {
    useSyncStore.getState().setOnline(false);
  });
}

export default useSyncStore;
