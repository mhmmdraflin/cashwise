'use client';

import React, { useEffect, useState } from 'react';
import {
  Receipt,
  Building2,
  Tag,
  BarChart3,
  RefreshCw,
  PlusCircle,
  HardDrive,
  Download,
} from 'lucide-react';
import {
  Account,
  AccountType,
  Category,
  CategoryType,
  Transaction,
  TransactionType,
  formatCurrency,
} from '@cashwise/shared';
import { Navbar } from '@/components/Navbar';
import { NetWorthCard } from '@/components/NetWorthCard';
import { TransactionManager } from '@/components/TransactionManager';
import { AccountManager } from '@/components/AccountManager';
import { CategoryManager } from '@/components/CategoryManager';
import { StatsView } from '@/components/StatsView';
import { getStorage, DEFAULT_USER_ID } from '@/lib/db';

type MainTab = 'transactions' | 'accounts' | 'categories' | 'stats';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<MainTab>('transactions');
  const [isLoading, setIsLoading] = useState(true);

  // Core Data States
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load all data from IndexedDB
  async function loadData() {
    try {
      const storage = await getStorage();
      const [accs, cats, txs] = await Promise.all([
        storage.getAccounts(DEFAULT_USER_ID),
        storage.getCategories(DEFAULT_USER_ID),
        storage.getTransactions(DEFAULT_USER_ID),
      ]);

      setAccounts(accs);
      setCategories(cats);
      setTransactions(txs);
    } catch (err) {
      console.error('Gagal memuat data dari IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // --- TRANSACTION HANDLERS ---
  async function handleCreateTransaction(data: {
    type: TransactionType;
    accountId: string;
    toAccountId?: string;
    categoryId?: string;
    amount: number;
    note?: string;
    date: string;
  }) {
    const storage = await getStorage();
    await storage.createTransaction({
      userId: DEFAULT_USER_ID,
      accountId: data.accountId,
      toAccountId: data.toAccountId,
      categoryId: data.categoryId,
      amount: data.amount,
      type: data.type,
      note: data.note,
      date: data.date,
    });
    await loadData();
  }

  async function handleUpdateTransaction(
    id: string,
    data: {
      type: TransactionType;
      accountId: string;
      toAccountId?: string;
      categoryId?: string;
      amount: number;
      note?: string;
      date: string;
    }
  ) {
    const storage = await getStorage();
    await storage.updateTransaction(id, data);
    await loadData();
  }

  async function handleDeleteTransaction(id: string) {
    if (!confirm('Hapus transaksi ini? Saldo rekening akan dikembalikan otomatis.')) {
      return;
    }
    const storage = await getStorage();
    await storage.deleteTransaction(id);
    await loadData();
  }

  // --- ACCOUNT HANDLERS ---
  async function handleCreateAccount(data: {
    name: string;
    type: AccountType;
    group: string;
    balance: number;
    description?: string;
  }) {
    const storage = await getStorage();
    await storage.createAccount({
      userId: DEFAULT_USER_ID,
      name: data.name,
      type: data.type,
      group: data.group,
      balance: data.balance,
      description: data.description,
      color: '#10B981',
      icon: data.group === 'Cash' ? '💵' : data.group === 'Investment' ? '📈' : '💳',
      order: accounts.length + 1,
      isGroupHidden: false,
    });
    await loadData();
  }

  async function handleUpdateAccount(
    id: string,
    data: {
      name?: string;
      group?: string;
      balance?: number;
      description?: string;
    }
  ) {
    const storage = await getStorage();
    await storage.updateAccount(id, data);
    await loadData();
  }

  async function handleDeleteAccount(id: string) {
    if (!confirm('Hapus akun ini? Riwayat transaksi lama tetap dipertahankan.')) {
      return;
    }
    const storage = await getStorage();
    await storage.deleteAccount(id);
    await loadData();
  }

  async function handleMoveAccountToTop(id: string) {
    const storage = await getStorage();
    await storage.moveAccountToTop(id);
    await loadData();
  }

  async function handleToggleGroupHidden(group: string, isHidden: boolean) {
    const storage = await getStorage();
    await storage.toggleGroupHidden(DEFAULT_USER_ID, group, isHidden);
    await loadData();
  }

  // --- CATEGORY HANDLERS ---
  async function handleCreateCategory(data: {
    name: string;
    type: CategoryType;
    icon: string;
    color: string;
  }) {
    const storage = await getStorage();
    await storage.createCategory({
      userId: DEFAULT_USER_ID,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      isDefault: false,
    });
    await loadData();
  }

  async function handleUpdateCategory(
    id: string,
    data: {
      name?: string;
      type?: CategoryType;
      icon?: string;
      color?: string;
    }
  ) {
    const storage = await getStorage();
    await storage.updateCategory(id, data);
    await loadData();
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Hapus kategori ini?')) {
      return;
    }
    const storage = await getStorage();
    await storage.deleteCategory(id);
    await loadData();
  }

  // --- EXPORT HANDLER ---
  function handleExportData(format: 'json' | 'csv') {
    if (format === 'json') {
      const dataStr = JSON.stringify({ accounts, categories, transactions }, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cashwise_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } else {
      let csv = 'ID,Tanggal,Tipe,Nominal,Kategori,Akun,Catatan\n';
      for (const t of transactions) {
        const cat = categories.find((c) => c.id === t.categoryId)?.name || '';
        const acc = accounts.find((a) => a.id === t.accountId)?.name || '';
        csv += `"${t.id}","${t.date}","${t.type}","${t.amount}","${cat}","${acc}","${t.note || ''}"\n`;
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cashwise_transactions_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  }

  // Aggregated totals
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Summary Banner */}
        <NetWorthCard
          totalBalance={totalBalance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
        />

        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-2">
          {/* Main Segmented Tabs */}
          <div className="flex space-x-1 p-1 bg-slate-200/70 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center space-x-2 py-2 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Transaksi</span>
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center space-x-2 py-2 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'accounts'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Akun ({accounts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center space-x-2 py-2 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'categories'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Kategori ({categories.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-2 py-2 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistik (1D/1W/1M/3M/1Y)</span>
            </button>
          </div>

          {/* Quick Utility Tools (Refresh & Export) */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={() => handleExportData('csv')}
              title="Ekspor CSV"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={() => loadData()}
              title="Refresh Data Lokal"
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Content Panes */}
        {activeTab === 'transactions' && (
          <TransactionManager
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            onCreateTransaction={handleCreateTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountManager
            accounts={accounts}
            onRefresh={loadData}
            onCreateAccount={handleCreateAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
            onMoveToTop={handleMoveAccountToTop}
            onToggleGroupHidden={handleToggleGroupHidden}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'stats' && (
          <StatsView
            transactions={transactions}
            categories={categories}
          />
        )}
      </main>
    </div>
  );
}
