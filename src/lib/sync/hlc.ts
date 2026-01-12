/**
 * Hybrid Logical Clock Implementation
 *
 * Combines wall clock time with logical counter for reliable ordering.
 *
 * Why HLC over Wall Clock:
 * - Handles device clock skew gracefully
 * - Preserves causality between operations
 * - Works reliably offline
 */

import type { HLCTimestamp } from './types';

/**
 * Hybrid Logical Clock
 *
 * Provides timestamps that combine physical time with a logical counter,
 * ensuring monotonically increasing timestamps even with clock drift.
 */
export class HybridLogicalClock {
  private wallTime: number = 0;
  private logical: number = 0;
  private readonly nodeId: string;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }

  /**
   * Get the node ID for this clock
   */
  getNodeId(): string {
    return this.nodeId;
  }

  /**
   * Generate a new timestamp for a local event
   */
  now(): HLCTimestamp {
    const physicalTime = Date.now();

    if (physicalTime > this.wallTime) {
      this.wallTime = physicalTime;
      this.logical = 0;
    } else {
      this.logical++;
    }

    return {
      wallTime: this.wallTime,
      logical: this.logical,
      nodeId: this.nodeId,
    };
  }

  /**
   * Update clock when receiving a remote timestamp
   * Returns a new timestamp that is guaranteed to be greater than both
   * the local clock and the received timestamp.
   */
  receive(remote: HLCTimestamp): HLCTimestamp {
    const physicalTime = Date.now();

    if (physicalTime > this.wallTime && physicalTime > remote.wallTime) {
      this.wallTime = physicalTime;
      this.logical = 0;
    } else if (this.wallTime === remote.wallTime) {
      this.logical = Math.max(this.logical, remote.logical) + 1;
    } else if (remote.wallTime > this.wallTime) {
      this.wallTime = remote.wallTime;
      this.logical = remote.logical + 1;
    } else {
      this.logical++;
    }

    return {
      wallTime: this.wallTime,
      logical: this.logical,
      nodeId: this.nodeId,
    };
  }

  /**
   * Get the current state of the clock without advancing it
   */
  peek(): HLCTimestamp {
    return {
      wallTime: this.wallTime,
      logical: this.logical,
      nodeId: this.nodeId,
    };
  }

  /**
   * Serialize the clock state for persistence
   */
  serialize(): string {
    return JSON.stringify({
      wallTime: this.wallTime,
      logical: this.logical,
      nodeId: this.nodeId,
    });
  }

  /**
   * Restore clock state from serialized form
   */
  static deserialize(data: string, nodeId: string): HybridLogicalClock {
    const clock = new HybridLogicalClock(nodeId);
    try {
      const parsed = JSON.parse(data);
      // Only restore if the nodeId matches
      if (parsed.nodeId === nodeId) {
        clock.wallTime = parsed.wallTime ?? 0;
        clock.logical = parsed.logical ?? 0;
      }
    } catch {
      // Invalid data, start fresh
    }
    return clock;
  }

  /**
   * Compare two HLC timestamps
   * Returns: negative if a < b, positive if a > b, 0 if equal
   */
  static compare(a: HLCTimestamp, b: HLCTimestamp): number {
    if (a.wallTime !== b.wallTime) {
      return a.wallTime - b.wallTime;
    }
    if (a.logical !== b.logical) {
      return a.logical - b.logical;
    }
    // Deterministic tiebreak using node ID
    return a.nodeId.localeCompare(b.nodeId);
  }

  /**
   * Check if timestamp a is before timestamp b
   */
  static isBefore(a: HLCTimestamp, b: HLCTimestamp): boolean {
    return HybridLogicalClock.compare(a, b) < 0;
  }

  /**
   * Check if timestamp a is after timestamp b
   */
  static isAfter(a: HLCTimestamp, b: HLCTimestamp): boolean {
    return HybridLogicalClock.compare(a, b) > 0;
  }

  /**
   * Get the maximum of two timestamps
   */
  static max(a: HLCTimestamp, b: HLCTimestamp): HLCTimestamp {
    return HybridLogicalClock.compare(a, b) >= 0 ? a : b;
  }

  /**
   * Create a timestamp from a Date object (for migration/compatibility)
   */
  static fromDate(date: Date, nodeId: string): HLCTimestamp {
    return {
      wallTime: date.getTime(),
      logical: 0,
      nodeId,
    };
  }

  /**
   * Convert timestamp to Date (loses logical component)
   */
  static toDate(timestamp: HLCTimestamp): Date {
    return new Date(timestamp.wallTime);
  }

  /**
   * Format timestamp for display
   */
  static format(timestamp: HLCTimestamp): string {
    const date = new Date(timestamp.wallTime);
    return `${date.toISOString()} [${timestamp.logical}@${timestamp.nodeId.slice(0, 8)}]`;
  }
}

/**
 * Last-Write-Wins resolution using HLC timestamps
 *
 * @param local - Local version of the data
 * @param remote - Remote version of the data
 * @returns The version with the later timestamp
 */
export function lwwResolve<T extends { hlc: HLCTimestamp }>(
  local: T,
  remote: T
): T {
  return HybridLogicalClock.compare(local.hlc, remote.hlc) > 0 ? local : remote;
}
