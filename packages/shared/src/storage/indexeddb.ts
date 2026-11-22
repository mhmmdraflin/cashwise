/**
 * CashWise Native IndexedDB Storage Engine (Web Local-First)
 * Zero external dependencies. Pure standard Web IndexedDB API.
 */

import {
  Account,
  Budget,
  Category,
  DatabaseStats,
  SyncQueueItem,
  Transaction,
  User,
} from '../types';
import { generateUuid } from '../validators';
import { ICashWiseStorage, TransactionFilter } from './interface';
import { createDefaultSeed } from './seed';

const DB_NAME = 'cashwise_local_db';
const DB_VERSION = 1;

export class CashWiseIndexedDbStorage implements ICashWiseStorage {
  private db: IDBDatabase | null = null;
  private isSeeded = false;

  async init(): Promise<void> {
    if (this.db) return;

    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB tidak didukung pada lingkungan runtime ini.');
    }

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Users Store
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }

        // 2. Accounts Store
        if (!db.objectStoreNames.contains('accounts')) {
          const store = db.createObjectStore('accounts', { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }

        // 3. Categories Store
        if (!db.objectStoreNames.contains('categories')) {
          const store = db.createObjectStore('categories', { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }

        // 4. Transactions Store
        if (!db.objectStoreNames.contains('transactions')) {
          const store = db.createObjectStore('transactions', { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
          store.createIndex('categoryId', 'categoryId', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }

        // 5. Budgets Store
        if (!db.objectStoreNames.contains('budgets')) {
          const store = db.createObjectStore('budgets', { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('categoryId', 'categoryId', { unique: false });
        }

        // 6. Sync Queue Store (Local-first mutations)
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('entityType', 'entityType', { unique: false });
        }
      };

      request.onsuccess = async () => {
        this.db = request.result;
        await this.checkAndSeed();
        resolve();
      };

      request.onerror = () => {
        reject(request.error || new Error('Gagal membuka database IndexedDB CashWise.'));
      };
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async clearAllData(): Promise<void> {
    const stores: (keyof IDBDatabase)[] = ['users', 'accounts', 'categories', 'transactions', 'budgets', 'sync_queue'] as any;
    for (const storeName of stores) {
      await this.runTx(storeName as string, 'readwrite', (store) => store.clear());
    }
    this.isSeeded = false;
    await this.checkAndSeed();
  }

  private async checkAndSeed(): Promise<void> {
    if (this.isSeeded) return;
    const users = await this.getAllFromStore<User>('users');
    if (users.length === 0) {
      const seed = createDefaultSeed();
      await this.saveUser(seed.user);
      for (const acc of seed.accounts) {
        await this.runTx('accounts', 'readwrite', (s) => s.put(acc));
      }
      for (const cat of seed.categories) {
        await this.runTx('categories', 'readwrite', (s) => s.put(cat));
      }
    }
    this.isSeeded = true;
  }

  private getStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database belum diinisialisasi. Panggil init() terlebih dahulu.');
    }
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  private runTx<T = any>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, mode);
      const req = operation(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error(`Operasi ${storeName} gagal`));
    });
  }

  private getAllFromStore<T>(storeName: string): Promise<T[]> {
    return this.runTx<T[]>(storeName, 'readonly', (store) => store.getAll());
  }

  // --- STATS ---
  async getStats(userId: string): Promise<DatabaseStats> {
    const [accounts, transactions, categories, budgets, syncQueue] = await Promise.all([
      this.getAccounts(userId),
      this.getTransactions(userId),
      this.getCategories(userId),
      this.getBudgets(userId),
      this.getPendingSyncQueue(),
    ]);

    const netWorth = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    return {
      totalAccounts: accounts.length,
      totalTransactions: transactions.length,
      totalCategories: categories.length,
      totalBudgets: budgets.length,
      pendingSyncCount: syncQueue.length,
      netWorth,
    };
  }

  // --- USER ---
  async getUser(id: string): Promise<User | null> {
    return this.runTx<User | null>('users', 'readonly', (s) => s.get(id));
  }

  async saveUser(user: User): Promise<void> {
    await this.runTx('users', 'readwrite', (s) => s.put(user));
  }

  // --- ACCOUNTS ---
  async getAccounts(userId: string, includeDeleted = false): Promise<Account[]> {
    const all = await this.getAllFromStore<Account>('accounts');
    return all.filter((a) => a.userId === userId && (includeDeleted || !a.deletedAt));
  }

  async getAccountById(id: string): Promise<Account | null> {
    const acc = await this.runTx<Account | undefined>('accounts', 'readonly', (s) => s.get(id));
    return acc || null;
  }

  async createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Account> {
    const now = new Date().toISOString();
    const account: Account = {
      ...accountData,
      id: generateUuid(),
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    await this.runTx('accounts', 'readwrite', (s) => s.put(account));
    await this.enqueueSync('account', account.id, 'CREATE', account);
    return account;
  }

  async updateAccount(id: string, updates: Partial<Omit<Account, 'id' | 'createdAt' | 'userId'>>): Promise<Account> {
    const existing = await this.getAccountById(id);
    if (!existing) throw new Error(`Akun dengan ID ${id} tidak ditemukan.`);

    const now = new Date().toISOString();
    const updated: Account = {
      ...existing,
      ...updates,
      updatedAt: now,
      version: existing.version + 1,
    };

    await this.runTx('accounts', 'readwrite', (s) => s.put(updated));
    await this.enqueueSync('account', updated.id, 'UPDATE', updated);
    return updated;
  }

  async deleteAccount(id: string): Promise<void> {
    const existing = await this.getAccountById(id);
    if (!existing) return;

    const now = new Date().toISOString();
    const updated: Account = {
      ...existing,
      deletedAt: now,
      updatedAt: now,
      version: existing.version + 1,
    };

    await this.runTx('accounts', 'readwrite', (s) => s.put(updated));
    await this.enqueueSync('account', updated.id, 'DELETE', updated);
  }

  // --- CATEGORIES ---
  async getCategories(userId: string, includeDeleted = false): Promise<Category[]> {
    const all = await this.getAllFromStore<Category>('categories');
    return all.filter((c) => c.userId === userId && (includeDeleted || !c.deletedAt));
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const cat = await this.runTx<Category | undefined>('categories', 'readonly', (s) => s.get(id));
    return cat || null;
  }

  async createCategory(catData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Category> {
    const now = new Date().toISOString();
    const cat: Category = {
      ...catData,
      id: generateUuid(),
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    await this.runTx('categories', 'readwrite', (s) => s.put(cat));
    await this.enqueueSync('category', cat.id, 'CREATE', cat);
    return cat;
  }

  async updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'userId'>>): Promise<Category> {
    const existing = await this.getCategoryById(id);
    if (!existing) throw new Error(`Kategori ${id} tidak ditemukan.`);

    const now = new Date().toISOString();
    const updated: Category = {
      ...existing,
      ...updates,
      updatedAt: now,
      version: existing.version + 1,
    };

    await this.runTx('categories', 'readwrite', (s) => s.put(updated));
    await this.enqueueSync('category', updated.id, 'UPDATE', updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    const existing = await this.getCategoryById(id);
    if (!existing) return;

    const now = new Date().toISOString();
    const updated: Category = {
      ...existing,
      deletedAt: now,
      updatedAt: now,
      version: existing.version + 1,
    };

    await this.runTx('categories', 'readwrite', (s) => s.put(updated));
    await this.enqueueSync('category', updated.id, 'DELETE', updated);
  }

  // --- TRANSACTIONS (Atomic Balance Updates + Local Queue) ---
  async getTransactions(userId: string, filter?: TransactionFilter): Promise<Transaction[]> {
    let all = await this.getAllFromStore<Transaction>('transactions');
    all = all.filter((t) => t.userId === userId && !t.deletedAt);

    if (filter) {
      if (filter.accountId) {
        all = all.filter((t) => t.accountId === filter.accountId || t.toAccountId === filter.accountId);
      }
      if (filter.categoryId) {
        all = all.filter((t) => t.categoryId === filter.categoryId);
      }
      if (filter.type) {
        all = all.filter((t) => t.type === filter.type);
      }
      if (filter.startDate) {
        all = all.filter((t) => t.date >= filter.startDate!);
      }
      if (filter.endDate) {
        all = all.filter((t) => t.date <= filter.endDate!);
      }
      if (filter.search) {
        const query = filter.search.toLowerCase();
        all = all.filter((t) => (t.note && t.note.toLowerCase().includes(query)));
      }
    }

    // Sort by date DESC
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filter?.offset !== undefined || filter?.limit !== undefined) {
      const offset = filter.offset || 0;
      const limit = filter.limit !== undefined ? filter.limit : all.length;
      return all.slice(offset, offset + limit);
    }

    return all;
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const tx = await this.runTx<Transaction | undefined>('transactions', 'readonly', (s) => s.get(id));
    return tx || null;
  }

  async createTransaction(txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Transaction> {
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...txData,
      id: generateUuid(),
      createdAt: now,
      updatedAt: now,
      version: 1,
      syncStatus: 'PENDING',
    };

    // Atomic update in IndexedDB transaction
    if (!this.db) throw new Error('DB belum aktif.');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['transactions', 'accounts', 'sync_queue'], 'readwrite');
      const txStore = tx.objectStore('transactions');
      const accStore = tx.objectStore('accounts');
      const syncStore = tx.objectStore('sync_queue');

      // 1. Mutate balances
      const sourceReq = accStore.get(transaction.accountId);
      sourceReq.onsuccess = () => {
        const sourceAcc: Account | undefined = sourceReq.result;
        if (!sourceAcc) {
          tx.abort();
          return reject(new Error(`Akun sumber ${transaction.accountId} tidak ditemukan.`));
        }

        if (transaction.type === 'EXPENSE') {
          sourceAcc.balance -= transaction.amount;
          sourceAcc.updatedAt = now;
          sourceAcc.version += 1;
          accStore.put(sourceAcc);
        } else if (transaction.type === 'INCOME') {
          sourceAcc.balance += transaction.amount;
          sourceAcc.updatedAt = now;
          sourceAcc.version += 1;
          accStore.put(sourceAcc);
        } else if (transaction.type === 'TRANSFER') {
          if (!transaction.toAccountId) {
            tx.abort();
            return reject(new Error('Akun tujuan transfer wajib diisi.'));
          }

          sourceAcc.balance -= transaction.amount;
          sourceAcc.updatedAt = now;
          sourceAcc.version += 1;
          accStore.put(sourceAcc);

          const destReq = accStore.get(transaction.toAccountId);
          destReq.onsuccess = () => {
            const destAcc: Account | undefined = destReq.result;
            if (!destAcc) {
              tx.abort();
              return reject(new Error(`Akun tujuan ${transaction.toAccountId} tidak ditemukan.`));
            }
            destAcc.balance += transaction.amount;
            destAcc.updatedAt = now;
            destAcc.version += 1;
            accStore.put(destAcc);
          };
        }

        // 2. Insert transaction
        txStore.put(transaction);

        // 3. Enqueue sync
        const queueItem: SyncQueueItem = {
          entityType: 'transaction',
          entityId: transaction.id,
          action: 'CREATE',
          payload: JSON.stringify(transaction),
          createdAt: now,
          status: 'PENDING',
          retryCount: 0,
        };
        syncStore.add(queueItem);
      };

      tx.oncomplete = () => resolve(transaction);
      tx.onerror = () => reject(tx.error || new Error('Gagal mencatat transaksi'));
    });
  }

  async updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'userId'>>): Promise<Transaction> {
    const existing = await this.getTransactionById(id);
    if (!existing) throw new Error(`Transaksi ${id} tidak ditemukan.`);

    // To cleanly update with balance integrity: revert previous, apply new
    await this.deleteTransaction(id);
    const newTx = await this.createTransaction({
      ...existing,
      ...updates,
    });
    return newTx;
  }

  async deleteTransaction(id: string): Promise<void> {
    const existing = await this.getTransactionById(id);
    if (!existing || existing.deletedAt) return;

    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['transactions', 'accounts', 'sync_queue'], 'readwrite');
      const txStore = tx.objectStore('transactions');
      const accStore = tx.objectStore('accounts');
      const syncStore = tx.objectStore('sync_queue');

      // Revert account balances
      const sourceReq = accStore.get(existing.accountId);
      sourceReq.onsuccess = () => {
        const sourceAcc: Account | undefined = sourceReq.result;
        if (sourceAcc) {
          if (existing.type === 'EXPENSE') {
            sourceAcc.balance += existing.amount;
          } else if (existing.type === 'INCOME') {
            sourceAcc.balance -= existing.amount;
          } else if (existing.type === 'TRANSFER' && existing.toAccountId) {
            sourceAcc.balance += existing.amount;
            const destReq = accStore.get(existing.toAccountId);
            destReq.onsuccess = () => {
              const destAcc: Account | undefined = destReq.result;
              if (destAcc) {
                destAcc.balance -= existing.amount;
                destAcc.updatedAt = now;
                destAcc.version += 1;
                accStore.put(destAcc);
              }
            };
          }
          sourceAcc.updatedAt = now;
          sourceAcc.version += 1;
          accStore.put(sourceAcc);
        }

        // Soft delete
        existing.deletedAt = now;
        existing.updatedAt = now;
        existing.version += 1;
        txStore.put(existing);

        // Queue sync delete
        const queueItem: SyncQueueItem = {
          entityType: 'transaction',
          entityId: existing.id,
          action: 'DELETE',
          payload: JSON.stringify(existing),
          createdAt: now,
          status: 'PENDING',
          retryCount: 0,
        };
        syncStore.add(queueItem);
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Gagal menghapus transaksi'));
    });
  }

  // --- BUDGETS ---
  async getBudgets(userId: string, includeDeleted = false): Promise<Budget[]> {
    const all = await this.getAllFromStore<Budget>('budgets');
    return all.filter((b) => b.userId === userId && (includeDeleted || !b.deletedAt));
  }

  async getBudgetById(id: string): Promise<Budget | null> {
    const b = await this.runTx<Budget | undefined>('budgets', 'readonly', (s) => s.get(id));
    return b || null;
  }

  async createBudget(bData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Budget> {
    const now = new Date().toISOString();
    const budget: Budget = {
      ...bData,
      id: generateUuid(),
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    await this.runTx('budgets', 'readwrite', (s) => s.put(budget));
    await this.enqueueSync('budget', budget.id, 'CREATE', budget);
    return budget;
  }

  async updateBudget(id: string, updates: Partial<Omit<Budget, 'id' | 'createdAt' | 'userId'>>): Promise<Budget> {
    const existing = await this.getBudgetById(id);
    if (!existing) throw new Error(`Budget ${id} tidak ditemukan.`);

    const now = new Date().toISOString();
    const updated: Budget = {
      ...existing,
      ...updates,
      updatedAt: now,
      version: existing.version + 1,
    };

    await this.runTx('budgets', 'readwrite', (s) => s.put(updated));
    await this.enqueueSync('budget', updated.id, 'UPDATE', updated);
    return updated;
  }

  async deleteBudget(id: string): Promise<void> {
    const existing = await this.getBudgetById(id);
    if (!existing) return;

    const now = new Date().toISOString();
    const updated: Budget = {
      ...existing,
      deletedAt: now,
      updatedAt: now,
      version: existing.version + 1,
    };

    await this.runTx('budgets', 'readwrite', (s) => s.put(updated));
    await this.enqueueSync('budget', updated.id, 'DELETE', updated);
  }

  // --- SYNC QUEUE ---
  private async enqueueSync(entityType: SyncQueueItem['entityType'], entityId: string, action: SyncQueueItem['action'], data: any): Promise<void> {
    const item: SyncQueueItem = {
      entityType,
      entityId,
      action,
      payload: JSON.stringify(data),
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0,
    };
    await this.runTx('sync_queue', 'readwrite', (s) => s.add(item));
  }

  async getPendingSyncQueue(): Promise<SyncQueueItem[]> {
    const all = await this.getAllFromStore<SyncQueueItem>('sync_queue');
    return all.filter((i) => i.status === 'PENDING');
  }

  async markSyncQueueItem(id: number, status: 'SYNCED' | 'FAILED', error?: string): Promise<void> {
    const item = await this.runTx<SyncQueueItem | undefined>('sync_queue', 'readonly', (s) => s.get(id));
    if (!item) return;

    item.status = status;
    if (error) item.lastError = error;
    if (status === 'FAILED') item.retryCount += 1;

    await this.runTx('sync_queue', 'readwrite', (s) => s.put(item));
  }

  async clearCompletedSyncQueue(): Promise<void> {
    const all = await this.getAllFromStore<SyncQueueItem>('sync_queue');
    const synced = all.filter((i) => i.status === 'SYNCED');
    for (const item of synced) {
      if (item.id) {
        await this.runTx('sync_queue', 'readwrite', (s) => s.delete(item.id));
      }
    }
  }
}
