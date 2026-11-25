'use client';

import { getStorage } from './db';
import { SyncResponse } from '@cashwise/shared';

export type SyncState = 'IDLE' | 'SYNCING' | 'SYNCED' | 'OFFLINE' | 'ERROR';

type SyncListener = (state: SyncState, meta?: { lastSync?: string; error?: string }) => void;
const listeners = new Set<SyncListener>();

let currentSyncState: SyncState = 'IDLE';
let lastSyncTime: string | null = null;

function notifyListeners(state: SyncState, error?: string) {
  currentSyncState = state;
  listeners.forEach((fn) => fn(state, { lastSync: lastSyncTime || undefined, error }));
}

export function subscribeSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(currentSyncState, { lastSync: lastSyncTime || undefined });
  return () => {
    listeners.delete(listener);
  };
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let deviceId = localStorage.getItem('cashwise_device_id');
  if (!deviceId) {
    deviceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `web-${Date.now()}`;
    localStorage.setItem('cashwise_device_id', deviceId);
  }
  return deviceId;
}

export function getLastSyncTimestamp(): string {
  if (typeof window === 'undefined') return new Date(0).toISOString();
  return localStorage.getItem('cashwise_last_sync') || new Date(0).toISOString();
}

export function setLastSyncTimestamp(ts: string): void {
  if (typeof window === 'undefined') return;
  lastSyncTime = ts;
  localStorage.setItem('cashwise_last_sync', ts);
}

export async function runWebSync(): Promise<{
  success: boolean;
  appliedCount?: number;
  serverChangesCount?: number;
  error?: string;
}> {
  if (typeof window === 'undefined') return { success: false, error: 'Bukan browser' };

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    notifyListeners('OFFLINE');
    return { success: false, error: 'Perangkat sedang offline' };
  }

  notifyListeners('SYNCING');

  try {
    const storage = await getStorage();
    const deviceId = getDeviceId();
    const lastSyncTimestamp = getLastSyncTimestamp();
    const pendingItems = await storage.getPendingSyncQueue();

    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId,
      },
      body: JSON.stringify({
        deviceId,
        lastSyncTimestamp,
        mutations: pendingItems,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Server sync returned ${response.status}`);
    }

    const json = await response.json();
    const data: SyncResponse = json.data;

    // 1. Mark sent mutations as SYNCED
    for (const item of pendingItems) {
      if (item.id !== undefined) {
        await storage.markSyncQueueItem(item.id, 'SYNCED');
      }
    }
    await storage.clearCompletedSyncQueue();

    // 2. Apply inbound changes from server
    let inboundCount = 0;
    if (data.serverChanges) {
      const { updatedCount } = await storage.applyServerChanges(data.serverChanges);
      inboundCount = updatedCount;
    }

    // 3. Update sync timestamp
    setLastSyncTimestamp(data.serverSyncTimestamp);

    notifyListeners('SYNCED');

    // Dispatch global event for reactive UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cashwise:data-changed', { detail: { source: 'sync', inboundCount } }));
    }

    return {
      success: true,
      appliedCount: data.appliedCount,
      serverChangesCount: inboundCount,
    };
  } catch (err: any) {
    console.error('Sync failed:', err);
    notifyListeners('ERROR', err?.message);
    return {
      success: false,
      error: err?.message || 'Sinkronisasi gagal.',
    };
  }
}
