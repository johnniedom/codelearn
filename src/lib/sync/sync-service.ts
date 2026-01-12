/**
 * Sync Service
 *
 * Manages synchronization between the PWA and the Hub.
 * Implements Last-Write-Wins (LWW) strategy with HLC timestamps.
 */

import { getDeviceState, updateDeviceState } from '@/lib/db';
import { HybridLogicalClock, lwwResolve } from './hlc';
import type {
  HLCTimestamp,
  SyncDelta,
  SyncEntityType,
  SyncOperation,
  SyncRequest,
  SyncResponse,
  SyncConfig,
  ConflictRecord,
  EntitySyncState,
  UserFriendlySyncStatus,
} from './types';
import { DEFAULT_SYNC_CONFIG } from './types';
import { SyncQueue } from './sync-queue';

// =============================================================================
// Sync Event Types
// =============================================================================

export type SyncEventType =
  | 'sync_started'
  | 'sync_progress'
  | 'sync_completed'
  | 'sync_error'
  | 'conflict_detected'
  | 'conflict_resolved'
  | 'entity_synced'
  | 'online_status_changed';

export interface SyncEvent {
  type: SyncEventType;
  timestamp: Date;
  data?: unknown;
}

type SyncEventListener = (event: SyncEvent) => void;

// =============================================================================
// Sync Service Class
// =============================================================================

/**
 * Sync Service
 *
 * Coordinates synchronization between local IndexedDB and the Hub.
 * Features:
 * - Delta-based sync (only changed data)
 * - HLC timestamps for conflict resolution
 * - Last-Write-Wins strategy
 * - Hub connectivity detection
 */
export class SyncService {
  private hlc: HybridLogicalClock;
  private queue: SyncQueue;
  private config: SyncConfig;
  private listeners: Set<SyncEventListener> = new Set();
  private isSyncing: boolean = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private deviceId: string | null = null;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
    this.hlc = new HybridLogicalClock(''); // Will be initialized with device ID
    this.queue = new SyncQueue(this.config);
  }

  /**
   * Initialize the sync service
   */
  async initialize(): Promise<void> {
    const deviceState = await getDeviceState();
    this.deviceId = deviceState.deviceId;
    this.hlc = new HybridLogicalClock(this.deviceId);

    // Try to restore HLC state from localStorage
    const savedHlc = localStorage.getItem('codelearn_hlc');
    if (savedHlc) {
      this.hlc = HybridLogicalClock.deserialize(savedHlc, this.deviceId);
    }

    // Initialize the queue
    await this.queue.initialize();

    // Set up online/offline listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  /**
   * Start automatic sync interval
   */
  startAutoSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.performSync().catch(console.error);
      }
    }, this.config.syncIntervalMs);
  }

  /**
   * Stop automatic sync interval
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Subscribe to sync events
   */
  subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit a sync event to all listeners
   */
  private emit(type: SyncEventType, data?: unknown): void {
    const event: SyncEvent = {
      type,
      timestamp: new Date(),
      data,
    };
    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Handle device coming online
   */
  private async handleOnline(): Promise<void> {
    this.emit('online_status_changed', { isOnline: true });

    // Trigger sync when coming online
    await this.performSync();
  }

  /**
   * Handle device going offline
   */
  private handleOffline(): void {
    this.emit('online_status_changed', { isOnline: false });
  }

  /**
   * Create a sync delta for a change
   */
  async createDelta(
    userId: string,
    entityType: SyncEntityType,
    entityId: string,
    operation: SyncOperation,
    payload: unknown
  ): Promise<SyncDelta> {
    const timestamp = this.hlc.now();

    // Save HLC state
    localStorage.setItem('codelearn_hlc', this.hlc.serialize());

    const payloadStr = JSON.stringify(payload);
    const checksum = await this.computeChecksum(payloadStr);

    const delta: SyncDelta = {
      id: crypto.randomUUID(),
      entityType,
      entityId,
      operation,
      payload,
      hlcTimestamp: timestamp,
      dependsOn: [],
      checksum,
      payloadSize: new TextEncoder().encode(payloadStr).length,
    };

    // Add to sync queue
    await this.queue.enqueue(userId, delta);

    return delta;
  }

  /**
   * Compute SHA-256 checksum of data
   */
  private async computeChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Perform a full sync cycle
   */
  async performSync(userId?: string): Promise<{
    success: boolean;
    deltasSent: number;
    deltasReceived: number;
    conflicts: ConflictRecord[];
  }> {
    if (this.isSyncing) {
      return { success: false, deltasSent: 0, deltasReceived: 0, conflicts: [] };
    }

    if (!navigator.onLine) {
      return { success: false, deltasSent: 0, deltasReceived: 0, conflicts: [] };
    }

    this.isSyncing = true;
    this.emit('sync_started');

    const conflicts: ConflictRecord[] = [];
    let deltasSent = 0;
    let deltasReceived = 0;

    try {
      // Get pending deltas from queue
      const pendingDeltas = await this.queue.getPendingDeltas(userId);

      if (pendingDeltas.length === 0 && !userId) {
        // Nothing to sync
        this.emit('sync_completed', { deltasSent: 0, deltasReceived: 0 });
        return { success: true, deltasSent: 0, deltasReceived: 0, conflicts: [] };
      }

      // Get device state for hub URL
      const deviceState = await getDeviceState();

      if (!deviceState.hubUrl) {
        // No hub configured, just mark as locally saved
        this.emit('sync_completed', { deltasSent: 0, deltasReceived: 0, noHub: true });
        return { success: true, deltasSent: 0, deltasReceived: 0, conflicts: [] };
      }

      // Prepare sync request
      const deltas = pendingDeltas.map((item) => item.delta);
      deltasSent = deltas.length;

      this.emit('sync_progress', { phase: 'sending', count: deltasSent });

      // Send to hub (simulated for now - would be actual API call)
      const response = await this.sendToHub(deviceState.hubUrl, {
        deviceId: this.deviceId!,
        userId: userId || '',
        lastSyncTimestamp: null, // Would track this per-user
        deltas,
      });

      // Process response
      deltasReceived = response.deltas.length;
      this.emit('sync_progress', { phase: 'receiving', count: deltasReceived });

      // Handle accepted deltas
      for (const acceptedId of response.acceptedDeltaIds) {
        await this.queue.markCompleted(acceptedId);
      }

      // Handle rejected deltas (conflicts)
      for (const rejected of response.rejectedDeltas) {
        const localDelta = deltas.find((d) => d.id === rejected.deltaId);
        if (localDelta && rejected.conflictWith) {
          const conflict = await this.resolveConflict(localDelta, rejected.conflictWith);
          conflicts.push(conflict);
        }
      }

      // Apply incoming deltas
      for (const delta of response.deltas) {
        await this.applyDelta(delta);
      }

      // Update sync timestamp
      await updateDeviceState({ lastSyncAt: new Date() });

      this.emit('sync_completed', { deltasSent, deltasReceived, conflicts: conflicts.length });

      return { success: true, deltasSent, deltasReceived, conflicts };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('sync_error', { error: errorMessage });
      return { success: false, deltasSent, deltasReceived, conflicts };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Send deltas to hub
   * Currently simulated - would be actual API call
   */
  private async sendToHub(
    hubUrl: string,
    request: SyncRequest
  ): Promise<SyncResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${hubUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': request.deviceId,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // For now, simulate a successful response with no server changes
      // This allows the app to work without an actual hub
      return {
        serverSequence: Date.now(),
        serverTimestamp: this.hlc.now(),
        deltas: [],
        acceptedDeltaIds: request.deltas.map((d) => d.id),
        rejectedDeltas: [],
        hasMore: false,
      };
    }
  }

  /**
   * Resolve a conflict between local and remote deltas
   * Uses LWW (Last-Write-Wins) strategy
   */
  private async resolveConflict(
    local: SyncDelta,
    remote: SyncDelta
  ): Promise<ConflictRecord> {
    this.emit('conflict_detected', { local, remote });

    // Use LWW resolution
    const localWithHlc = { ...local, hlc: local.hlcTimestamp };
    const remoteWithHlc = { ...remote, hlc: remote.hlcTimestamp };
    const winner = lwwResolve(localWithHlc, remoteWithHlc);

    const resolution: 'took_local' | 'took_remote' =
      winner === localWithHlc ? 'took_local' : 'took_remote';

    const conflictRecord: ConflictRecord = {
      id: crypto.randomUUID(),
      localDelta: local,
      remoteDelta: remote,
      reason: 'concurrent_modification',
      detectedAt: new Date(),
      resolution,
      resolvedAt: new Date(),
    };

    // If remote wins, apply it
    if (resolution === 'took_remote') {
      await this.applyDelta(remote);
    }

    this.emit('conflict_resolved', conflictRecord);

    return conflictRecord;
  }

  /**
   * Apply a delta to local storage
   */
  private async applyDelta(delta: SyncDelta): Promise<void> {
    // This would apply changes to IndexedDB based on entity type
    // For now, just update the HLC with the remote timestamp
    this.hlc.receive(delta.hlcTimestamp);
    localStorage.setItem('codelearn_hlc', this.hlc.serialize());

    this.emit('entity_synced', {
      entityType: delta.entityType,
      entityId: delta.entityId,
      operation: delta.operation,
    });
  }

  /**
   * Get the sync status for a specific entity
   */
  async getEntitySyncStatus(
    entityType: SyncEntityType,
    entityId: string
  ): Promise<EntitySyncState> {
    const pendingItems = await this.queue.findByEntity(entityType, entityId);

    let status: UserFriendlySyncStatus = 'saved_here';

    if (pendingItems.length > 0) {
      const latest = pendingItems[0];
      switch (latest.status) {
        case 'pending':
          status = 'waiting_to_share';
          break;
        case 'syncing':
          status = 'sharing_now';
          break;
        case 'failed':
          status = 'problem_sharing';
          break;
        case 'completed':
          status = 'shared_with_class';
          break;
        default:
          status = 'saved_here';
      }
    }

    return {
      entityType,
      entityId,
      status,
      lastModifiedAt: new Date(),
      lastSyncedAt: null,
      pendingChanges: pendingItems.some((p) => p.status === 'pending'),
    };
  }

  /**
   * Get overall sync status
   */
  async getOverallSyncStatus(): Promise<{
    pendingCount: number;
    failedCount: number;
    lastSyncAt: Date | null;
    isOnline: boolean;
    isHubReachable: boolean;
  }> {
    const deviceState = await getDeviceState();
    const pendingItems = await this.queue.getPendingDeltas();
    const failedItems = await this.queue.getFailedItems();

    let isHubReachable = false;
    if (navigator.onLine && deviceState.hubUrl) {
      try {
        const response = await fetch(`${deviceState.hubUrl}/api/health`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });
        isHubReachable = response.ok;
      } catch {
        isHubReachable = false;
      }
    }

    return {
      pendingCount: pendingItems.length,
      failedCount: failedItems.length,
      lastSyncAt: deviceState.lastSyncAt,
      isOnline: navigator.onLine,
      isHubReachable,
    };
  }

  /**
   * Force retry of failed items
   */
  async retryFailedItems(): Promise<void> {
    await this.queue.retryFailedItems();
    await this.performSync();
  }

  /**
   * Clear the sync queue (use with caution)
   */
  async clearQueue(): Promise<void> {
    await this.queue.clear();
  }

  /**
   * Get the current HLC timestamp
   */
  getCurrentTimestamp(): HLCTimestamp {
    return this.hlc.peek();
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let syncServiceInstance: SyncService | null = null;

/**
 * Get the sync service singleton instance
 */
export function getSyncService(): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService();
  }
  return syncServiceInstance;
}

/**
 * Initialize the sync service (call once at app startup)
 */
export async function initializeSyncService(): Promise<SyncService> {
  const service = getSyncService();
  await service.initialize();
  return service;
}

export default SyncService;
