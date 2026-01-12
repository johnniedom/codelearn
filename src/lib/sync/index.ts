/**
 * Sync Module Exports
 *
 * Central export point for all sync-related functionality.
 */

// Types
export type {
  HLCTimestamp,
  SyncEntityType,
  SyncOperation,
  SyncDelta,
  SyncQueueItem,
  SyncQueueStatus,
  UserFriendlySyncStatus,
  EntitySyncState,
  SyncRequest,
  SyncResponse,
  ConflictRecord,
  ConflictStrategy,
  SyncConfig,
} from './types';

export { DEFAULT_SYNC_CONFIG } from './types';

// HLC
export { HybridLogicalClock, lwwResolve } from './hlc';

// Sync Service
export {
  SyncService,
  getSyncService,
  initializeSyncService,
} from './sync-service';
export type { SyncEventType, SyncEvent } from './sync-service';

// Sync Queue
export { SyncQueue } from './sync-queue';
