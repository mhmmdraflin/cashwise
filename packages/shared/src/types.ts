/**
 * CashWise Shared Domain Models & Synchronization Protocols
 */

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type AccountType = 'CASH' | 'BANK' | 'E_WALLET' | 'INVESTMENT' | 'CREDIT_CARD';

export type CategoryType = 'INCOME' | 'EXPENSE';

export type BudgetPeriod = 'MONTHLY' | 'WEEKLY' | 'YEARLY';

export type SyncStatus = 'SYNCED' | 'PENDING' | 'CONFLICT';

export type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE';

export type EntityType = 'user' | 'account' | 'category' | 'transaction' | 'budget';

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
  name: string; // e.g. "BCA", "Superbank", "Blu BCA", "Bibit"
  type: AccountType;
  group: string; // "Cash", "Accounts", "Savings", "Investment"
  balance: number; // Tabular monetary figure
  description?: string; // Deskripsi akun
  order: number; // Sequence index for sorting / move-to-top
  isGroupHidden?: boolean; // Hide Group toggle
  color: string; // Hex color e.g. "#10B981"
  icon: string; // Identifier or emoji
}

export interface Category extends BaseEntity {
  userId: string;
  name: string; // e.g. "Makanan", "Transportasi", "Lainnya"
  type: CategoryType;
  icon: string; // Emoticon/Emoji e.g. "🍔", "🚗", "💼", "🛒"
  color: string;
  isDefault?: boolean;
}

export interface Transaction extends BaseEntity {
  userId: string;
  accountId: string; // Source account (Income destination / Expense source / Transfer from)
  toAccountId?: string | null; // Destination account (Only for Transfer)
  categoryId?: string | null; // Category (For Income/Expense)
  amount: number; // Tabular monetary figure, must be > 0
  type: TransactionType;
  date: string; // ISO 8601 Date of transaction (YYYY-MM-DD or full timestamp)
  note?: string; // Deskripsi transaksi
  tags?: string[];
  syncStatus?: SyncStatus;
}

export interface Budget extends BaseEntity {
  userId: string;
  categoryId: string;
  limitAmount: number;
  period: BudgetPeriod;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

/**
 * Local-First Queue Item for pending synchronization
 */
export interface SyncQueueItem {
  id?: number; // Auto-increment integer PK (local only)
  entityType: EntityType;
  entityId: string; // UUID v4
  action: SyncAction;
  payload: string; // JSON string of snapshot
  createdAt: string; // ISO 8601
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'SYNCED';
  retryCount: number;
  lastError?: string | null;
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
  action: SyncAction;
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

export interface DatabaseStats {
  totalAccounts: number;
  totalTransactions: number;
  totalCategories: number;
  totalBudgets: number;
  pendingSyncCount: number;
  netWorth: number;
}

export const PRESET_EMOJIS = [
  '🍔', '☕', '🍜', '🍕', '🚗', '⛽', '🚌', '🛵',
  '🏠', '⚡', '💧', '📶', '🛒', '🛍️', '👕', '💊',
  '🎮', '🍿', '🎬', '✈️', '💼', '💵', '📈', '🎁',
  '🎓', '📱', '🏋️', '📚', '👶', '🐱', '✨', '🏷️',
] as const;

export const DEFAULT_ACCOUNT_GROUPS = [
  'Cash',
  'Accounts',
  'Savings',
  'Investment',
] as const;
