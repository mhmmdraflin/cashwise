/**
 * CashWise Storage Interface
 * Abstract contract for Local-First persistence (IndexedDB for Web, SQLite for Mobile).
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

export interface TransactionFilter {
  accountId?: string;
  categoryId?: string;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ICashWiseStorage {
  // Database Lifecycle
  init(): Promise<void>;
  close(): Promise<void>;
  clearAllData(): Promise<void>;
  getStats(userId: string): Promise<DatabaseStats>;

  // User
  getUser(id: string): Promise<User | null>;
  saveUser(user: User): Promise<void>;

  // Accounts
  getAccounts(userId: string, includeDeleted?: boolean): Promise<Account[]>;
  getAccountById(id: string): Promise<Account | null>;
  createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Account>;
  updateAccount(id: string, updates: Partial<Omit<Account, 'id' | 'createdAt' | 'userId'>>): Promise<Account>;
  deleteAccount(id: string): Promise<void>; // Soft-delete (tombstone)

  // Categories
  getCategories(userId: string, includeDeleted?: boolean): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | null>;
  createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Category>;
  updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'userId'>>): Promise<Category>;
  deleteCategory(id: string): Promise<void>; // Soft-delete

  // Transactions (Atomic Balance Updates + Sync Queue)
  getTransactions(userId: string, filter?: TransactionFilter): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | null>;
  createTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'userId'>>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>; // Reverts balance and soft-deletes

  // Budgets
  getBudgets(userId: string, includeDeleted?: boolean): Promise<Budget[]>;
  getBudgetById(id: string): Promise<Budget | null>;
  createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Budget>;
  updateBudget(id: string, updates: Partial<Omit<Budget, 'id' | 'createdAt' | 'userId'>>): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;

  // Sync Queue Operations
  getPendingSyncQueue(): Promise<SyncQueueItem[]>;
  markSyncQueueItem(id: number, status: 'SYNCED' | 'FAILED', error?: string): Promise<void>;
  clearCompletedSyncQueue(): Promise<void>;
}
