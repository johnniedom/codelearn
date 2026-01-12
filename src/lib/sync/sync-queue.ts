/**
 * Sync Queue Management
 *
 * Manages offline changes in IndexedDB with retry logic.
 *
 * Features:
 * - Queue offline changes in IndexedDB
 * - Process queue when online
 * - Exponential backoff retry logic
 * - Max 5 retries before marking failed
 */

import Dexie, { type EntityTable } from 'dexie';
import type {
  SyncDelta,
  SyncQueueItem,

  SyncConfig,
  SyncEntityType,
} from './types';
import { DEFAULT_SYNC_CONFIG } from './types';

// =============================================================================
// Sync Queue Database Schema
// =============================================================================

/**
 * Sync Queue IndexedDB Schema
 */

class SyncQueueDatabase extends Dexie {
  items!: EntityTable<SyncQueueItem, 'id'>;

  constructor() {
    super('CodeLearnSyncQueue');

    this.version(1).stores({
      items: 'id, userId, status, createdAt, nextRetryAt, [userId+status], [status+createdAt]',
    });
  }
}

// =============================================================================
// Sync Queue Class
// =============================================================================

/**
 * Sync Queue
 *
 * Manages the queue of changes waiting to be synced to the hub.
 * Handles batching, deduplication, and retry logic.
 */
export class SyncQueue {
  private db: SyncQueueDatabase;
  private config: SyncConfig;
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingBatch: Map<string, SyncDelta> = new Map();

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
    this.db = new SyncQueueDatabase();
  }

  /**
   * Initialize the queue
   */
  async initialize(): Promise<void> {
    // Clean up old completed items (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await this.db.items
      .where('status')
      .equals('completed')
      .and((item) => item.createdAt < sevenDaysAgo)
      .delete();

    // Reset items that were stuck in 'syncing' state
    await this.db.items
      .where('status')
      .equals('syncing')
      .modify({ status: 'pending' });
  }

  /**
   * Add a delta to the sync queue
   */
  async enqueue(userId: string, delta: SyncDelta): Promise<void> {
    // Add to pending batch for debouncing
    const key = `${delta.entityType}:${delta.entityId}`;
    this.pendingBatch.set(key, delta);

    // Start batch timer if not running
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(
        () => this.flushBatch(userId),
        this.config.batchingWindowMs
      );
    }

    // Force flush if batch is full
    if (this.pendingBatch.size >= this.config.maxDeltasPerRequest) {
      await this.flushBatch(userId);
    }
  }

  /**
   * Flush the current batch to the database
   */
  private async flushBatch(userId: string): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.pendingBatch.size === 0) return;

    const deltas = Array.from(this.pendingBatch.values());
    this.pendingBatch.clear();

    // Process each delta
    for (const delta of deltas) {
      await this.addToQueue(userId, delta);
    }
  }

  /**
   * Add a single delta to the database queue
   */
  private async addToQueue(userId: string, delta: SyncDelta): Promise<void> {
    // Check for existing item for this entity
    // existingKey would be used for deduplication logging
    const existing = await this.db.items
      .where('userId')
      .equals(userId)
      .filter(
        (item) =>
          item.delta.entityType === delta.entityType &&
          item.delta.entityId === delta.entityId &&
          (item.status === 'pending' || item.status === 'failed')
      )
      .first();

    const now = new Date();

    if (existing) {
      // Merge with existing pending item
      const mergedDelta = this.mergeDeltas(existing.delta, delta);
      await this.db.items.update(existing.id, {
        delta: mergedDelta,
        createdAt: now,
        attempts: 0,
        status: 'pending',
        errorMessage: null,
        nextRetryAt: null,
      });
    } else {
      // Create new queue item
      const item: SyncQueueItem = {
        id: delta.id,
        userId,
        delta,
        status: 'pending',
        createdAt: now,
        attempts: 0,
        lastAttemptAt: null,
        errorMessage: null,
        nextRetryAt: null,
      };
      await this.db.items.add(item);
    }
  }

  /**
   * Merge two deltas for the same entity
   */
  private mergeDeltas(existing: SyncDelta, newer: SyncDelta): SyncDelta {
    // For updates to same entity, keep the newer one
    if (existing.operation === 'update' && newer.operation === 'update') {
      return {
        ...newer,
        payload: { ...(existing.payload as object), ...(newer.payload as object) },
      };
    }

    // Create + Update = Create with updated data
    if (existing.operation === 'create' && newer.operation === 'update') {
      return {
        ...existing,
        payload: { ...(existing.payload as object), ...(newer.payload as object) },
        hlcTimestamp: newer.hlcTimestamp,
      };
    }

    // Any + Delete = Delete
    if (newer.operation === 'delete') {
      return newer;
    }

    // Default: take the newer delta
    return newer;
  }

  /**
   * Get pending deltas ready to sync
   */
  async getPendingDeltas(userId?: string): Promise<SyncQueueItem[]> {
    const now = new Date();

    let query = this.db.items.where('status').equals('pending');

    if (userId) {
      query = this.db.items
        .where('[userId+status]')
        .equals([userId, 'pending']);
    }

    const items = await query
      .filter(
        (item) =>
          !item.nextRetryAt || item.nextRetryAt <= now
      )
      .sortBy('createdAt');

    return items.slice(0, this.config.maxDeltasPerRequest);
  }

  /**
   * Mark item as currently syncing
   */
  async markSyncing(id: string): Promise<void> {
    await this.db.items.update(id, {
      status: 'syncing',
      lastAttemptAt: new Date(),
    });
  }

  /**
   * Mark item as successfully synced
   */
  async markCompleted(id: string): Promise<void> {
    await this.db.items.update(id, {
      status: 'completed',
    });
  }

  /**
   * Handle sync failure with exponential backoff
   */
  async markFailed(id: string, errorMessage: string): Promise<void> {
    const item = await this.db.items.get(id);
    if (!item) return;

    const newAttempts = item.attempts + 1;

    if (newAttempts >= this.config.maxRetries) {
      // Move to dead letter queue
      await this.db.items.update(id, {
        status: 'dead_letter',
        attempts: newAttempts,
        errorMessage,
        lastAttemptAt: new Date(),
      });
    } else {
      // Calculate next retry time with exponential backoff
      const delayIndex = Math.min(newAttempts - 1, this.config.retryDelays.length - 1);
      const delay = this.config.retryDelays[delayIndex];
      const nextRetryAt = new Date(Date.now() + delay);

      await this.db.items.update(id, {
        status: 'failed',
        attempts: newAttempts,
        errorMessage,
        lastAttemptAt: new Date(),
        nextRetryAt,
      });
    }
  }

  /**
   * Get failed items
   */
  async getFailedItems(): Promise<SyncQueueItem[]> {
    return this.db.items
      .where('status')
      .anyOf(['failed', 'dead_letter'])
      .toArray();
  }

  /**
   * Retry all failed items
   */
  async retryFailedItems(): Promise<void> {
    await this.db.items
      .where('status')
      .equals('failed')
      .modify({
        status: 'pending',
        nextRetryAt: null,
      });
  }

  /**
   * Find queue items by entity
   */
  async findByEntity(
    entityType: SyncEntityType,
    entityId: string
  ): Promise<SyncQueueItem[]> {
    return this.db.items
      .filter(
        (item) =>
          item.delta.entityType === entityType &&
          item.delta.entityId === entityId
      )
      .toArray();
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
    deadLetter: number;
    completed: number;
    total: number;
  }> {
    const all = await this.db.items.toArray();

    return {
      pending: all.filter((i) => i.status === 'pending').length,
      syncing: all.filter((i) => i.status === 'syncing').length,
      failed: all.filter((i) => i.status === 'failed').length,
      deadLetter: all.filter((i) => i.status === 'dead_letter').length,
      completed: all.filter((i) => i.status === 'completed').length,
      total: all.length,
    };
  }

  /**
   * Get user's queue count
   */
  async getUserQueueCount(userId: string): Promise<number> {
    return this.db.items
      .where('[userId+status]')
      .equals([userId, 'pending'])
      .count();
  }

  /**
   * Clear completed items for a user
   */
  async clearCompleted(userId?: string): Promise<number> {
    if (userId) {
      return this.db.items
        .where('status')
        .equals('completed')
        .filter((item) => item.userId === userId)
        .delete();
    }
    return this.db.items.where('status').equals('completed').delete();
  }

  /**
   * Clear all items (use with caution)
   */
  async clear(): Promise<void> {
    await this.db.items.clear();
  }

  /**
   * Remove dead letter items older than specified days
   */
  async pruneDeadLetter(daysOld: number = 30): Promise<number> {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    return this.db.items
      .where('status')
      .equals('dead_letter')
      .filter((item) => item.createdAt < cutoff)
      .delete();
  }

  /**
   * Export queue items for debugging
   */
  async exportQueue(): Promise<SyncQueueItem[]> {
    return this.db.items.toArray();
  }
}

export default SyncQueue;
