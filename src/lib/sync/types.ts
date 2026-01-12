/**
 * Sync System Type Definitions
 *
 * Implements Hybrid Logical Clock (HLC) for conflict resolution.
 */

// =============================================================================
// Hybrid Logical Clock Types
// =============================================================================

/**
 * Hybrid Logical Clock Timestamp
 * Combines wall clock time with logical counter for reliable ordering
 */
export interface HLCTimestamp {
  /** Physical time in milliseconds */
  wallTime: number;
  /** Logical counter for same-millisecond ordering */
  logical: number;
  /** Device identifier for tiebreaking */
  nodeId: string;
}

// =============================================================================
// Sync Delta Types
// =============================================================================

/** Entity types that can be synced */
export type SyncEntityType =
  | 'progress'
  | 'quiz_attempt'
  | 'code_submission'
  | 'settings'
  | 'bookmark'
  | 'notification_read';

/** Sync operation types */
export type SyncOperation = 'create' | 'update' | 'delete';

/**
 * Represents a single change to be synced
 */
export interface SyncDelta {
  /** UUID v7 for time-sortable IDs */
  id: string;
  /** Type of entity being synced */
  entityType: SyncEntityType;
  /** ID of the entity being modified */
  entityId: string;
  /** Type of operation */
  operation: SyncOperation;
  /** Change data (structure depends on entityType) */
  payload: unknown;
  /** HLC timestamp for ordering */
  hlcTimestamp: HLCTimestamp;
  /** IDs of deltas this depends on */
  dependsOn: string[];
  /** SHA-256 checksum of payload */
  checksum: string;
  /** Size of payload in bytes */
  payloadSize: number;
}

// =============================================================================
// Sync Queue Types
// =============================================================================

/** Status of a sync queue item */
export type SyncQueueStatus =
  | 'pending'
  | 'syncing'
  | 'completed'
  | 'failed'
  | 'dead_letter';

/**
 * Item in the sync queue
 */
export interface SyncQueueItem {
  /** Unique ID for this queue item */
  id: string;
  /** User ID for isolation */
  userId: string;
  /** The sync delta */
  delta: SyncDelta;
  /** Current status */
  status: SyncQueueStatus;
  /** When the item was queued */
  createdAt: Date;
  /** Number of sync attempts */
  attempts: number;
  /** When the last attempt was made */
  lastAttemptAt: Date | null;
  /** Error message from last failed attempt */
  errorMessage: string | null;
  /** When the next retry should occur */
  nextRetryAt: Date | null;
}

// =============================================================================
// Sync State Types
// =============================================================================

/**
 * User-friendly sync status for UI display
 * Per audit: Use friendly vocabulary
 */
export type UserFriendlySyncStatus =
  | 'saved_here'      // Local only (blue, device icon)
  | 'waiting_to_share' // Pending sync (yellow, cloud+clock)
  | 'sharing_now'     // Currently syncing (blue, animated)
  | 'shared_with_class' // Synced (green, cloud+check)
  | 'problem_sharing'; // Error (orange, warning)

/**
 * Per-entity sync state for UI indicators
 */
export interface EntitySyncState {
  entityType: SyncEntityType;
  entityId: string;
  status: UserFriendlySyncStatus;
  lastModifiedAt: Date;
  lastSyncedAt: Date | null;
  pendingChanges: boolean;
}

// =============================================================================
// Sync Request/Response Types
// =============================================================================

/**
 * Request to sync with hub
 */
export interface SyncRequest {
  /** Device ID */
  deviceId: string;
  /** User ID */
  userId: string;
  /** Last known sync timestamp */
  lastSyncTimestamp: HLCTimestamp | null;
  /** Local deltas to send */
  deltas: SyncDelta[];
}

/**
 * Response from hub after sync
 */
export interface SyncResponse {
  /** Server's current sequence number */
  serverSequence: number;
  /** Server's HLC timestamp */
  serverTimestamp: HLCTimestamp;
  /** Deltas from server */
  deltas: SyncDelta[];
  /** IDs of accepted local deltas */
  acceptedDeltaIds: string[];
  /** Rejected deltas with reasons */
  rejectedDeltas: Array<{
    deltaId: string;
    reason: string;
    conflictWith?: SyncDelta;
  }>;
  /** Whether there are more deltas to fetch */
  hasMore: boolean;
  /** Cursor for pagination */
  nextCursor?: string;
}

// =============================================================================
// Conflict Resolution Types
// =============================================================================

/** Conflict resolution strategies */
export type ConflictStrategy = 'lww' | 'crdt_merge' | 'user_choice';

/**
 * Record of a detected conflict
 */
export interface ConflictRecord {
  /** Unique conflict ID */
  id: string;
  /** The local delta */
  localDelta: SyncDelta;
  /** The remote delta */
  remoteDelta: SyncDelta;
  /** Reason for conflict */
  reason: string;
  /** When conflict was detected */
  detectedAt: Date;
  /** How conflict was resolved */
  resolution?: 'took_local' | 'took_remote' | 'merged' | 'user_choice';
  /** When conflict was resolved */
  resolvedAt?: Date;
}

// =============================================================================
// Sync Configuration
// =============================================================================

/**
 * Configuration for sync service
 */
export interface SyncConfig {
  /** Maximum deltas per sync request */
  maxDeltasPerRequest: number;
  /** Maximum payload size in bytes */
  maxPayloadSizeBytes: number;
  /** Retry delays in milliseconds (exponential backoff) */
  retryDelays: number[];
  /** Maximum retry attempts */
  maxRetries: number;
  /** Interval between automatic sync attempts */
  syncIntervalMs: number;
  /** Window for batching changes */
  batchingWindowMs: number;
}

/**
 * Default sync configuration
 */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  maxDeltasPerRequest: 50,
  maxPayloadSizeBytes: 512 * 1024, // 512KB
  retryDelays: [1000, 5000, 15000, 60000, 300000], // 1s, 5s, 15s, 1m, 5m
  maxRetries: 5,
  syncIntervalMs: 30000, // 30 seconds
  batchingWindowMs: 2000, // 2 seconds
};
