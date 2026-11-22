/**
 * CashWise Validation & Sanitization Helpers
 * Pure TypeScript implementation, zero external dependencies.
 */

import { Account, Budget, Category, Transaction } from './types';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_V4_REGEX.test(value);
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.includes('T');
}

export function sanitizeString(value: unknown, maxLength = 255): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateAccount(account: Partial<Account>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!account.name || account.name.trim().length === 0) {
    errors.name = 'Nama akun wajib diisi.';
  } else if (account.name.length > 100) {
    errors.name = 'Nama akun maksimal 100 karakter.';
  }

  const validTypes = ['CASH', 'BANK', 'E_WALLET', 'INVESTMENT', 'CREDIT_CARD'];
  if (!account.type || !validTypes.includes(account.type)) {
    errors.type = `Tipe akun tidak valid. Harus salah satu dari: ${validTypes.join(', ')}`;
  }

  if (account.balance === undefined || typeof account.balance !== 'number' || isNaN(account.balance)) {
    errors.balance = 'Saldo awal wajib berupa angka valid.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateTransaction(tx: Partial<Transaction>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!tx.amount || typeof tx.amount !== 'number' || tx.amount <= 0 || isNaN(tx.amount)) {
    errors.amount = 'Nominal transaksi wajib lebih besar dari 0.';
  }

  const validTypes = ['INCOME', 'EXPENSE', 'TRANSFER'];
  if (!tx.type || !validTypes.includes(tx.type)) {
    errors.type = 'Jenis transaksi wajib INCOME, EXPENSE, atau TRANSFER.';
  }

  if (!tx.accountId) {
    errors.accountId = 'Akun sumber wajib dipilih.';
  }

  if (tx.type === 'TRANSFER') {
    if (!tx.toAccountId) {
      errors.toAccountId = 'Akun tujuan transfer wajib dipilih.';
    } else if (tx.toAccountId === tx.accountId) {
      errors.toAccountId = 'Akun asal dan akun tujuan transfer tidak boleh sama.';
    }
  }

  if (tx.type === 'EXPENSE' || tx.type === 'INCOME') {
    if (!tx.categoryId) {
      errors.categoryId = 'Kategori transaksi wajib dipilih.';
    }
  }

  if (!tx.date) {
    errors.date = 'Tanggal transaksi wajib diisi.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateCategory(cat: Partial<Category>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!cat.name || cat.name.trim().length === 0) {
    errors.name = 'Nama kategori wajib diisi.';
  } else if (cat.name.length > 100) {
    errors.name = 'Nama kategori maksimal 100 karakter.';
  }

  if (!cat.type || (cat.type !== 'INCOME' && cat.type !== 'EXPENSE')) {
    errors.type = 'Tipe kategori harus INCOME atau EXPENSE.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateBudget(budget: Partial<Budget>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!budget.categoryId) {
    errors.categoryId = 'Kategori anggaran wajib ditentukan.';
  }

  if (!budget.limitAmount || typeof budget.limitAmount !== 'number' || budget.limitAmount <= 0) {
    errors.limitAmount = 'Batas kuota anggaran harus lebih besar dari 0.';
  }

  if (!budget.startDate || !budget.endDate) {
    errors.period = 'Tanggal mulai dan selesai anggaran wajib diisi.';
  } else if (new Date(budget.startDate) > new Date(budget.endDate)) {
    errors.period = 'Tanggal mulai tidak boleh lebih lambat dari tanggal selesai.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Standard UUID v4 Generator (crypto-based or fallback)
 */
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
