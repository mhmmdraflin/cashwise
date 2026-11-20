/**
 * CashWise Shared Domain Models & Synchronization Protocols
 */

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface BaseEntity {
  id: string; // UUID v4
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  deletedAt?: string | null; // Soft delete / tombstone for sync
  version: number; // Incrementing version number for conflict detection
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  currency: string; // default e.g. 'IDR', 'USD'
}

export interface Account extends BaseEntity {
  userId: string;
  name: string; // e.g. "BCA Tabungan", "Dompet Tunai", "GoPay"
  type: 'CASH' | 'BANK' | 'E_WALLET' | 'INVESTMENT' | 'CREDIT_CARD';
  balance: number;
  color: string;
  icon: string;
}

export interface Category extends BaseEntity {
  userId: string;
  name: string; // e.g. "Makanan & Minuman", "Gaji", "Transportasi"
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
}

export interface Transaction extends BaseEntity {
  userId: string;
  accountId: string;
  toAccountId?: string | null; // For transfers
  categoryId?: string | null;
  amount: number;
  type: TransactionType;
  date: string; // ISO 8601 Date of transaction
  note?: string;
  tags?: string[];
  syncStatus?: 'SYNCED' | 'PENDING' | 'CONFLICT';
}

export interface Budget extends BaseEntity {
  userId: string;
  categoryId: string;
  limitAmount: number;
  period: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  startDate: string;
  endDate: string;
}

export interface SyncPayload {
  lastSyncTimestamp: string;
  deviceId: string;
  changes: {
    accounts?: TransactionChange<Account>[];
    categories?: TransactionChange<Category>[];
    transactions?: TransactionChange<Transaction>[];
    budgets?: TransactionChange<Budget>[];
  };
}

export interface TransactionChange<T> {
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  version: number;
  timestamp: string;
  data: T;
}

export interface SyncResponse {
  serverSyncTimestamp: string;
  appliedCount: number;
  conflicts: Array<{
    entityId: string;
    entityType: string;
    serverVersion: number;
    clientVersion: number;
    resolution: 'SERVER_WON' | 'CLIENT_WON';
  }>;
  serverChanges: {
    accounts: Account[];
    categories: Category[];
    transactions: Transaction[];
    budgets: Budget[];
  };
}
