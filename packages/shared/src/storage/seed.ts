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
    // 1. Group: Cash
    {
      id: '10000000-0000-4000-8000-000000000001',
      userId: DEFAULT_USER_ID,
      name: 'Dompet Tunai',
      type: 'CASH',
      group: 'Cash',
      balance: 500000,
      description: 'Uang fisik di dompet untuk kebutuhan harian',
      order: 1,
      isGroupHidden: false,
      color: '#10B981', // Emerald
      icon: '💵',
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    // 2. Group: Accounts (Bank)
    {
      id: '10000000-0000-4000-8000-000000000002',
      userId: DEFAULT_USER_ID,
      name: 'BCA',
      type: 'BANK',
      group: 'Accounts',
      balance: 3500000,
      description: 'Rekening utama penerimaan gaji & transfer',
      order: 2,
      isGroupHidden: false,
      color: '#2563EB', // Blue
      icon: '💳',
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: '10000000-0000-4000-8000-000000000003',
      userId: DEFAULT_USER_ID,
      name: 'Superbank',
      type: 'BANK',
      group: 'Accounts',
      balance: 1000000,
      description: 'Rekening digital untuk transaksi harian & promo',
      order: 3,
      isGroupHidden: false,
      color: '#06B6D4', // Cyan
      icon: '🏦',
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    // 3. Group: Savings
    {
      id: '10000000-0000-4000-8000-000000000004',
      userId: DEFAULT_USER_ID,
      name: 'Blu BCA',
      type: 'BANK',
      group: 'Savings',
      balance: 5000000,
      description: 'Tabungan dana darurat bunga tinggi',
      order: 4,
      isGroupHidden: false,
      color: '#6366F1', // Indigo
      icon: '🔒',
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    // 4. Group: Investment
    {
      id: '10000000-0000-4000-8000-000000000005',
      userId: DEFAULT_USER_ID,
      name: 'Bibit',
      type: 'INVESTMENT',
      group: 'Investment',
      balance: 2500000,
      description: 'Portofolio Reksa Dana Pasar Uang & Obligasi',
      order: 5,
      isGroupHidden: false,
      color: '#8B5CF6', // Purple
      icon: '📈',
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
      color: '#F43F5E',
      icon: '🍔',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: '20000000-0000-4000-8000-000000000002',
      userId: DEFAULT_USER_ID,
      name: 'Transportasi',
      type: 'EXPENSE',
      color: '#F97316',
      icon: '🚗',
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
      color: '#F59E0B',
      icon: '🏠',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: '20000000-0000-4000-8000-000000000004',
      userId: DEFAULT_USER_ID,
      name: 'Belanja Kebutuhan',
      type: 'EXPENSE',
      color: '#8B5CF6',
      icon: '🛒',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: '20000000-0000-4000-8000-000000000005',
      userId: DEFAULT_USER_ID,
      name: 'Hiburan',
      type: 'EXPENSE',
      color: '#EC4899',
      icon: '🎮',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: '20000000-0000-4000-8000-000000000006',
      userId: DEFAULT_USER_ID,
      name: 'Lainnya',
      type: 'EXPENSE',
      color: '#64748B',
      icon: '🏷️',
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
      color: '#10B981',
      icon: '💼',
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
      color: '#14B8A6',
      icon: '📈',
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
      color: '#3B82F6',
      icon: '🎁',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
  ];

  return { user, accounts, categories };
}
