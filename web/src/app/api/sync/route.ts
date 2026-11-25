import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  Account,
  Category,
  Transaction,
  Budget,
  SyncResponse,
  SyncQueueItem,
} from '@cashwise/shared';

interface CloudStore {
  accounts: Record<string, Account>;
  categories: Record<string, Category>;
  transactions: Record<string, Transaction>;
  budgets: Record<string, Budget>;
  lastModifiedByDevice: Record<string, string>; // entityId -> deviceId
}

// File persistence fallback (supports local dev & Vercel /tmp)
function getDbFilePath(): string {
  if (process.env.VERCEL) {
    return path.join('/tmp', 'cashwise_cloud_sync.json');
  }
  const dir = path.join(process.cwd(), '..', '.cache');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      return path.join('/tmp', 'cashwise_cloud_sync.json');
    }
  }
  return path.join(dir, 'cashwise_cloud_sync.json');
}

function loadCloudStore(): CloudStore {
  const filePath = getDbFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading cloud sync file:', err);
  }
  return {
    accounts: {},
    categories: {},
    transactions: {},
    budgets: {},
    lastModifiedByDevice: {},
  };
}

function saveCloudStore(store: CloudStore): void {
  const filePath = getDbFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing cloud sync file:', err);
  }
}

export async function GET() {
  const store = loadCloudStore();
  return NextResponse.json({
    success: true,
    data: {
      status: 'ONLINE',
      serverTime: new Date().toISOString(),
      stats: {
        totalAccounts: Object.keys(store.accounts).length,
        totalCategories: Object.keys(store.categories).length,
        totalTransactions: Object.keys(store.transactions).length,
        totalBudgets: Object.keys(store.budgets).length,
      },
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deviceId: string = body.deviceId || req.headers.get('x-device-id') || 'anonymous-device';
    const lastSyncTimestamp: string = body.lastSyncTimestamp || new Date(0).toISOString();
    const lastSyncDate = new Date(lastSyncTimestamp);

    const store = loadCloudStore();
    let appliedCount = 0;
    const conflicts: SyncResponse['conflicts'] = [];

    // Parse incoming mutations from body (supports either raw queue mutations or structured changes)
    const incomingMutations: SyncQueueItem[] = [];

    if (Array.isArray(body.mutations)) {
      incomingMutations.push(...body.mutations);
    } else if (body.changes) {
      // Unpack structured changes to mutations
      const { accounts = [], categories = [], transactions = [], budgets = [] } = body.changes;
      for (const item of accounts) {
        incomingMutations.push({
          entityType: 'account',
          entityId: item.entityId,
          action: item.action,
          payload: JSON.stringify(item.data),
          createdAt: item.timestamp || new Date().toISOString(),
          status: 'PENDING',
          retryCount: 0,
        });
      }
      for (const item of categories) {
        incomingMutations.push({
          entityType: 'category',
          entityId: item.entityId,
          action: item.action,
          payload: JSON.stringify(item.data),
          createdAt: item.timestamp || new Date().toISOString(),
          status: 'PENDING',
          retryCount: 0,
        });
      }
      for (const item of transactions) {
        incomingMutations.push({
          entityType: 'transaction',
          entityId: item.entityId,
          action: item.action,
          payload: JSON.stringify(item.data),
          createdAt: item.timestamp || new Date().toISOString(),
          status: 'PENDING',
          retryCount: 0,
        });
      }
      for (const item of budgets) {
        incomingMutations.push({
          entityType: 'budget',
          entityId: item.entityId,
          action: item.action,
          payload: JSON.stringify(item.data),
          createdAt: item.timestamp || new Date().toISOString(),
          status: 'PENDING',
          retryCount: 0,
        });
      }
    }

    // Process each mutation with LWW (Last-Write-Wins) conflict resolution
    for (const mutation of incomingMutations) {
      try {
        const payloadData = typeof mutation.payload === 'string' ? JSON.parse(mutation.payload) : mutation.payload;
        const entityId = mutation.entityId;
        const entityType = mutation.entityType;

        if (!entityId || !entityType) continue;

        let targetTable: Record<string, any>;
        if (entityType === 'account') targetTable = store.accounts;
        else if (entityType === 'category') targetTable = store.categories;
        else if (entityType === 'transaction') targetTable = store.transactions;
        else if (entityType === 'budget') targetTable = store.budgets;
        else continue;

        const existing = targetTable[entityId];

        if (existing) {
          const clientTime = new Date(payloadData.updatedAt || mutation.createdAt || 0).getTime();
          const serverTime = new Date(existing.updatedAt || 0).getTime();

          if (clientTime >= serverTime) {
            // Client wins
            if (mutation.action === 'DELETE') {
              existing.deletedAt = new Date().toISOString();
              existing.updatedAt = new Date().toISOString();
              existing.version = (existing.version || 1) + 1;
            } else {
              targetTable[entityId] = {
                ...payloadData,
                version: Math.max(existing.version || 1, payloadData.version || 1) + 1,
                updatedAt: new Date().toISOString(),
              };
            }
            store.lastModifiedByDevice[entityId] = deviceId;
            appliedCount++;
          } else {
            // Server wins (Conflict)
            conflicts.push({
              entityId,
              entityType,
              serverVersion: existing.version || 1,
              clientVersion: payloadData.version || 1,
              resolution: 'SERVER_WON',
            });
          }
        } else {
          // Brand new entity from client
          if (mutation.action === 'DELETE') {
            payloadData.deletedAt = new Date().toISOString();
          }
          targetTable[entityId] = {
            ...payloadData,
            version: payloadData.version || 1,
            updatedAt: payloadData.updatedAt || new Date().toISOString(),
          };
          store.lastModifiedByDevice[entityId] = deviceId;
          appliedCount++;
        }
      } catch (err) {
        console.error('Error applying mutation:', mutation, err);
      }
    }

    saveCloudStore(store);

    const nowIso = new Date().toISOString();

    // Query changes that happened after lastSyncTimestamp and NOT modified by this device
    const serverChanges = {
      accounts: Object.values(store.accounts).filter((a) => {
        const up = new Date(a.updatedAt || 0);
        return up > lastSyncDate && store.lastModifiedByDevice[a.id] !== deviceId;
      }),
      categories: Object.values(store.categories).filter((c) => {
        const up = new Date(c.updatedAt || 0);
        return up > lastSyncDate && store.lastModifiedByDevice[c.id] !== deviceId;
      }),
      transactions: Object.values(store.transactions).filter((t) => {
        const up = new Date(t.updatedAt || 0);
        return up > lastSyncDate && store.lastModifiedByDevice[t.id] !== deviceId;
      }),
      budgets: Object.values(store.budgets).filter((b) => {
        const up = new Date(b.updatedAt || 0);
        return up > lastSyncDate && store.lastModifiedByDevice[b.id] !== deviceId;
      }),
    };

    const responseData: SyncResponse = {
      serverSyncTimestamp: nowIso,
      appliedCount,
      conflicts,
      serverChanges,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: error?.message || 'Gagal memproses sinkronisasi data.',
        },
      },
      { status: 500 }
    );
  }
}
