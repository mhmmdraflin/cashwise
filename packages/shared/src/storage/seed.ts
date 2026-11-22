/**
 * CashWise Seed Data Generator
 * Provides initial setup for newly created local databases.
 */

import { Account, Category, User } from '../types';

export const DEFAULT_USER_ID = '00000000-0000-4000-8000-000000000001';

export function createDefaultSeed(now = new Date().toISOString()): {
  user: User;
  accounts: Account[];
  categories: Category[];
} {
  const user: User = {
    id: DEFAULT_USER_ID,
    name: 'Pengguna CashWise',
    email: 'local-user@cashwise.app',
    currency: 'IDR',
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  const accounts: Account[] = [
    {
      id: '10000000-0000-4000-8000-000000000001',
      userId: DEFAULT_USER_ID,
      name: 'Dompet Tunai',
      type: 'CASH',
      balance: 500000,
      color: '#10B981', // Emerald
      icon: 'wallet',
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: '10000000-0000-4000-8000-000000000002',
      userId: DEFAULT_USER_ID,
      name: 'BCA Tabungan',
      type: 'BANK',
      balance: 3500000,
      color: '#2563EB', // Blue
      icon: 'credit-card',
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: '10000000-0000-4000-8000-000000000003',
      userId: DEFAULT_USER_ID,
      name: 'GoPay / E-Wallet',
      type: 'E_WALLET',
      balance: 250000,
      color: '#06B6D4', // Cyan
      icon: 'smartphone',
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
  ];

  const categories: Category[] = [
    // Pengeluaran (Expense)
    {
      id: '20000000-0000-4000-8000-000000000001',
      userId: DEFAULT_USER_ID,
      name: 'Makanan & Minuman',
      type: 'EXPENSE',
      color: '#F43F5E', // Rose
      icon: 'utensils',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: '20000000-0000-4000-8000-000000000002',
      userId: DEFAULT_USER_ID,
      name: 'Transportasi & Bensin',
      type: 'EXPENSE',
      color: '#F97316', // Orange
      icon: 'car',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: '20000000-0000-4000-8000-000000000003',
      userId: DEFAULT_USER_ID,
      name: 'Tagihan & Utilitas',
      type: 'EXPENSE',
      color: '#F59E0B', // Amber
      icon: 'receipt',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: '20000000-0000-4000-8000-000000000004',
      userId: DEFAULT_USER_ID,
      name: 'Belanja Kebutuhan Harian',
      type: 'EXPENSE',
      color: '#8B5CF6', // Purple
      icon: 'shopping-cart',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: '20000000-0000-4000-8000-000000000005',
      userId: DEFAULT_USER_ID,
      name: 'Hiburan & Langganan',
      type: 'EXPENSE',
      color: '#EC4899', // Pink
      icon: 'tv',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    // Pemasukan (Income)
    {
      id: '20000000-0000-4000-8000-000000000010',
      userId: DEFAULT_USER_ID,
      name: 'Gaji Bulanan',
      type: 'INCOME',
      color: '#10B981', // Emerald
      icon: 'briefcase',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: '20000000-0000-4000-8000-000000000011',
      userId: DEFAULT_USER_ID,
      name: 'Bonus & Freelance',
      type: 'INCOME',
      color: '#14B8A6', // Teal
      icon: 'trending-up',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: '20000000-0000-4000-8000-000000000012',
      userId: DEFAULT_USER_ID,
      name: 'Hadiah / Lainnya',
      type: 'INCOME',
      color: '#3B82F6', // Blue
      icon: 'gift',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
  ];

  return { user, accounts, categories };
}
