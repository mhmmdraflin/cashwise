'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Account,
  AccountType,
  Category,
  CategoryType,
  Transaction,
  TransactionType,
  formatCurrency,
} from '@cashwise/shared';
import { TransactionManager } from '@/components/TransactionManager';
import { AccountManager } from '@/components/AccountManager';
import { CategoryManager } from '@/components/CategoryManager';
import { StatsView } from '@/components/StatsView';
import { getStorage, DEFAULT_USER_ID } from '@/lib/db';

type NavTab = 'overview' | 'transactions' | 'accounts' | 'categories' | 'stats' | 'settings';
type ThemeMode = 'light' | 'dark' | 'system';

export default function CashWiseApp() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [hideBalance, setHideBalance] = useState(false);

  // Core Data States
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Modal State for Quick Add Transaction
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('EXPENSE');
  const [modalAmount, setModalAmount] = useState('');
  const [modalAccountId, setModalAccountId] = useState('');
  const [modalToAccountId, setModalToAccountId] = useState('');
  const [modalCategoryId, setModalCategoryId] = useState('');
  const [modalDate, setModalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [modalNote, setModalNote] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Theme Initializer & Controller
  useEffect(() => {
    try {
      const saved = (localStorage.getItem('cashwise-theme') as ThemeMode) || 'system';
      setThemeMode(saved);
      applyTheme(saved);
    } catch {
      // ignore
    }
  }, []);

  function applyTheme(mode: ThemeMode) {
    try {
      localStorage.setItem('cashwise-theme', mode);
    } catch {}
    const isDark =
      mode === 'dark' ||
      (mode === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function toggleThemeMode() {
    const order: ThemeMode[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(themeMode) + 1) % order.length];
    setThemeMode(next);
    applyTheme(next);
  }

  // Load Data from Local IndexedDB
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
      if (accs.length > 0 && !modalAccountId) {
        setModalAccountId(accs[0].id);
        if (accs.length > 1) setModalToAccountId(accs[1].id);
      }
    } catch (err) {
      console.error('Error loading data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // --- CRUD HANDLERS ---
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
    if (!confirm('Hapus transaksi ini? Saldo rekening akan dikembalikan otomatis.')) return;
    const storage = await getStorage();
    await storage.deleteTransaction(id);
    await loadData();
  }

  // Account Handlers
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
    if (!confirm('Hapus akun ini? Riwayat transaksi lama tetap dipertahankan.')) return;
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

  // Category Handlers
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
    if (!confirm('Hapus kategori ini?')) return;
    const storage = await getStorage();
    await storage.deleteCategory(id);
    await loadData();
  }

  // Quick Modal Submit
  async function handleQuickModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setModalError(null);
    const amt = parseFloat(modalAmount.replace(/\./g, '').replace(/,/g, '.'));
    if (isNaN(amt) || amt <= 0) {
      setModalError('Nominal transaksi wajib lebih besar dari 0.');
      return;
    }
    if (!modalAccountId) {
      setModalError('Pilih akun transaksi.');
      return;
    }
    if (modalType === 'TRANSFER' && (!modalToAccountId || modalToAccountId === modalAccountId)) {
      setModalError('Akun tujuan transfer harus berbeda dengan akun asal.');
      return;
    }

    try {
      await handleCreateTransaction({
        type: modalType,
        accountId: modalAccountId,
        toAccountId: modalType === 'TRANSFER' ? modalToAccountId : undefined,
        categoryId: modalType !== 'TRANSFER' ? modalCategoryId || undefined : undefined,
        amount: amt,
        date: `${modalDate}T${new Date().toISOString().substring(11)}`,
        note: modalNote.trim() || undefined,
      });
      setIsTxModalOpen(false);
      setModalAmount('');
      setModalNote('');
    } catch (err: any) {
      setModalError(err.message || 'Gagal menyimpan transaksi');
    }
  }

  // Data Export Handler
  function handleExportData(format: 'json' | 'csv') {
    if (format === 'json') {
      const dataStr = JSON.stringify({ accounts, categories, transactions }, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cashwise_backup_${new Date().toISOString().split('T')[0]}.json`;
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

  // --- AGGREGATIONS & METRICS ---
  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + (a.balance || 0), 0),
    [accounts]
  );

  const currentMonthKey = new Date().toISOString().substring(0, 7); // e.g. "2026-11"
  const monthTransactions = useMemo(
    () => transactions.filter((t) => (t.date || '').startsWith(currentMonthKey)),
    [transactions, currentMonthKey]
  );

  const currentMonthIncome = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions]
  );

  const currentMonthExpense = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions]
  );

  const netCashFlow = currentMonthIncome - currentMonthExpense;
  const savingsRate =
    currentMonthIncome > 0
      ? Math.max(0, Math.round((netCashFlow / currentMonthIncome) * 100))
      : 0;

  // Account Groups Aggregation
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, { label: string; icon: string; count: number; total: number }> = {
      Cash: { label: 'Cash', icon: 'payments', count: 0, total: 0 },
      Accounts: { label: 'Accounts / Bank', icon: 'account_balance', count: 0, total: 0 },
      Savings: { label: 'Savings', icon: 'savings', count: 0, total: 0 },
      Investment: { label: 'Investment', icon: 'candlestick_chart', count: 0, total: 0 },
    };
    for (const a of accounts) {
      const g = a.group in groups ? a.group : 'Accounts';
      groups[g].count += 1;
      groups[g].total += a.balance || 0;
    }
    return Object.values(groups);
  }, [accounts]);

  // Last 6 Months Chart Aggregation
  const monthlyChartData = useMemo(() => {
    const result: { label: string; income: number; expense: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = d.toISOString().substring(0, 7);
      const monthShort = d.toLocaleString('en-US', { month: 'short' });
      const inc = transactions
        .filter((t) => t.type === 'INCOME' && (t.date || '').startsWith(prefix))
        .reduce((s, t) => s + t.amount, 0);
      const exp = transactions
        .filter((t) => t.type === 'EXPENSE' && (t.date || '').startsWith(prefix))
        .reduce((s, t) => s + t.amount, 0);
      result.push({ label: monthShort, income: inc, expense: exp });
    }
    return result;
  }, [transactions]);

  const maxChartVal = useMemo(() => {
    let max = 1;
    for (const m of monthlyChartData) {
      if (m.income > max) max = m.income;
      if (m.expense > max) max = m.expense;
    }
    return Math.max(max, 1000000);
  }, [monthlyChartData]);

  // Today formatted for header
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const categoriesByType = categories.filter((c) => c.type === modalType);

  return (
    <div className="min-h-screen flex bg-light-background dark:bg-dark-background text-light-on-background dark:text-dark-on-background">
      {/* ─── FIXED LEFT SIDEBAR ─── */}
      <aside className="w-60 shrink-0 bg-light-surface dark:bg-dark-surface border-r border-light-border dark:border-dark-border min-h-screen sticky top-0 flex flex-col justify-between p-md">
        <div className="flex flex-col gap-lg">
          {/* Brand Identity */}
          <div className="flex items-center gap-sm px-sm py-xs">
            <div
              className="w-9 h-9 rounded-DEFAULT bg-light-primary dark:bg-dark-primary text-light-on-primary dark:text-dark-on-primary inline-flex items-center justify-center shrink-0 shadow-sm"
              aria-hidden="true"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3"></rect>
                <path d="M16 12h4"></path>
                <circle cx="16" cy="12" r="1.5" fill="currentColor"></circle>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-title text-title-md text-light-on-surface dark:text-dark-on-surface leading-tight font-bold">CashWise</span>
              <span className="font-label text-label-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">Local-first Vault</span>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav aria-label="Main navigation" className="flex flex-col gap-xs">
            <button
              onClick={() => setCurrentTab('overview')}
              className={`flex items-center gap-sm px-md py-sm rounded-DEFAULT text-left transition-colors duration-state-change ${
                currentTab === 'overview'
                  ? 'bg-light-primary-tint dark:bg-dark-primary-tint text-light-on-primary-tint dark:text-dark-on-primary-tint font-bold'
                  : 'text-light-on-surface-muted dark:text-dark-on-surface-muted hover:bg-light-surface-subtle dark:hover:bg-dark-surface-subtle hover:text-light-on-surface dark:hover:text-dark-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span className="font-label text-label-lg">Overview</span>
            </button>

            <button
              onClick={() => setCurrentTab('transactions')}
              className={`flex items-center gap-sm px-md py-sm rounded-DEFAULT text-left transition-colors duration-state-change ${
                currentTab === 'transactions'
                  ? 'bg-light-primary-tint dark:bg-dark-primary-tint text-light-on-primary-tint dark:text-dark-on-primary-tint font-bold'
                  : 'text-light-on-surface-muted dark:text-dark-on-surface-muted hover:bg-light-surface-subtle dark:hover:bg-dark-surface-subtle hover:text-light-on-surface dark:hover:text-dark-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              <span className="font-label text-label-lg">Transactions</span>
            </button>

            <button
              onClick={() => setCurrentTab('accounts')}
              className={`flex items-center gap-sm px-md py-sm rounded-DEFAULT text-left transition-colors duration-state-change ${
                currentTab === 'accounts'
                  ? 'bg-light-primary-tint dark:bg-dark-primary-tint text-light-on-primary-tint dark:text-dark-on-primary-tint font-bold'
                  : 'text-light-on-surface-muted dark:text-dark-on-surface-muted hover:bg-light-surface-subtle dark:hover:bg-dark-surface-subtle hover:text-light-on-surface dark:hover:text-dark-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              <span className="font-label text-label-lg">Accounts ({accounts.length})</span>
            </button>

            <button
              onClick={() => setCurrentTab('categories')}
              className={`flex items-center gap-sm px-md py-sm rounded-DEFAULT text-left transition-colors duration-state-change ${
                currentTab === 'categories'
                  ? 'bg-light-primary-tint dark:bg-dark-primary-tint text-light-on-primary-tint dark:text-dark-on-primary-tint font-bold'
                  : 'text-light-on-surface-muted dark:text-dark-on-surface-muted hover:bg-light-surface-subtle dark:hover:bg-dark-surface-subtle hover:text-light-on-surface dark:hover:text-dark-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">category</span>
              <span className="font-label text-label-lg">Categories ({categories.length})</span>
            </button>

            <button
              onClick={() => setCurrentTab('stats')}
              className={`flex items-center gap-sm px-md py-sm rounded-DEFAULT text-left transition-colors duration-state-change ${
                currentTab === 'stats'
                  ? 'bg-light-primary-tint dark:bg-dark-primary-tint text-light-on-primary-tint dark:text-dark-on-primary-tint font-bold'
                  : 'text-light-on-surface-muted dark:text-dark-on-surface-muted hover:bg-light-surface-subtle dark:hover:bg-dark-surface-subtle hover:text-light-on-surface dark:hover:text-dark-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">bar_chart</span>
              <span className="font-label text-label-lg">Statistics</span>
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex items-center gap-sm px-md py-sm rounded-DEFAULT text-left transition-colors duration-state-change ${
                currentTab === 'settings'
                  ? 'bg-light-primary-tint dark:bg-dark-primary-tint text-light-on-primary-tint dark:text-dark-on-primary-tint font-bold'
                  : 'text-light-on-surface-muted dark:text-dark-on-surface-muted hover:bg-light-surface-subtle dark:hover:bg-dark-surface-subtle hover:text-light-on-surface dark:hover:text-dark-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span className="font-label text-label-lg">Settings</span>
            </button>
          </nav>
        </div>

        {/* Footer: Privacy Status & Theme Switcher */}
        <div className="flex flex-col gap-sm">
          <div className="p-md rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border flex flex-col gap-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-xs text-light-income-text dark:text-dark-income-text">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span className="font-label text-label-sm font-semibold">Offline Vault Active</span>
              </div>
              <button
                onClick={toggleThemeMode}
                title={`Tema saat ini: ${themeMode}. Klik untuk ganti.`}
                className="w-7 h-7 rounded-sm flex items-center justify-center text-light-on-surface-muted dark:text-dark-on-surface-muted hover:bg-light-surface-subtle dark:hover:bg-dark-surface-subtle transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {themeMode === 'dark' ? 'dark_mode' : themeMode === 'light' ? 'light_mode' : 'contrast'}
                </span>
              </button>
            </div>
            <p className="font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">
              All records stored locally in IndexedDB.
            </p>
          </div>
        </div>
      </aside>

      {/* ─── MAIN WORKSPACE ─── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border px-xl py-md flex flex-wrap items-center justify-between gap-md">
          <div className="flex flex-col">
            <h1 className="font-headline text-headline-lg text-light-on-surface dark:text-dark-on-surface font-semibold tracking-tight">
              {currentTab === 'overview' && 'Good day, Welcome back'}
              {currentTab === 'transactions' && 'Transactions Ledger'}
              {currentTab === 'accounts' && 'Accounts & Assets'}
              {currentTab === 'categories' && 'Expense & Income Categories'}
              {currentTab === 'stats' && 'Financial Analysis & Statistics'}
              {currentTab === 'settings' && 'App Settings & Vault Data'}
            </h1>
            <p className="font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">
              {todayFormatted} • Local-first Sync
            </p>
          </div>

          <div className="flex items-center gap-sm shrink-0">
            {/* Quick Export CSV */}
            <button
              onClick={() => handleExportData('csv')}
              title="Ekspor CSV"
              className="inline-flex items-center gap-xs px-md py-sm rounded-DEFAULT border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-on-surface dark:text-dark-on-surface text-xs font-semibold hover:bg-light-surface-subtle dark:hover:bg-dark-surface-subtle transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>CSV</span>
            </button>

            {/* Quick Add Transaction Button */}
            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setIsTxModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-sm px-md py-sm rounded-DEFAULT bg-light-primary dark:bg-dark-primary text-light-on-primary dark:text-dark-on-primary hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary dark:focus-visible:ring-dark-primary transition-opacity duration-state-change shrink-0 whitespace-nowrap shadow-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="font-label text-label-lg">Add Transaction</span>
            </button>
          </div>
        </header>

        {/* Dynamic View Panes */}
        <main className="flex-1 p-xl max-w-[1280px] w-full mx-auto flex flex-col gap-lg">
          {/* ─── TAB 1: OVERVIEW (DASHBOARD) ─── */}
          {currentTab === 'overview' && (
            <div className="flex flex-col gap-lg">
              {/* Top Financial Summary Section */}
              <section aria-label="Financial Summary" className="flex flex-col gap-md">
                {/* Net Worth Hero Card */}
                <article className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md p-lg shadow-sm flex flex-wrap items-center justify-between gap-md">
                  <div className="flex flex-col gap-xs">
                    <div className="flex items-center gap-sm">
                      <span className="font-label text-label-lg text-light-on-surface-muted dark:text-dark-on-surface-muted font-medium">
                        Total Net Worth
                      </span>
                      <button
                        type="button"
                        onClick={() => setHideBalance(!hideBalance)}
                        aria-label="Toggle balance visibility"
                        className="inline-flex items-center gap-xs px-sm py-xs rounded-DEFAULT text-light-on-surface-muted dark:text-dark-on-surface-muted hover:text-light-on-surface dark:hover:text-dark-on-surface hover:bg-light-surface-subtle dark:hover:bg-dark-surface-subtle transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {hideBalance ? 'visibility_off' : 'visibility'}
                        </span>
                        <span className="font-label text-label-sm">{hideBalance ? 'Show' : 'Hide'}</span>
                      </button>
                    </div>

                    <p className="font-display text-display-lg text-light-on-surface dark:text-dark-on-surface tabular-nums font-bold">
                      {hideBalance ? 'Rp •••••••••' : formatCurrency(totalBalance)}
                    </p>

                    <p className="font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">
                      Across {accounts.length} accounts in 4 groups
                    </p>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-xs">
                    <span className="font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">
                      Net Flow This Month
                    </span>
                    <span
                      className={`font-headline text-headline-md tabular-nums font-semibold ${
                        netCashFlow >= 0
                          ? 'text-light-income-text dark:text-dark-income-text'
                          : 'text-light-expense-text dark:text-dark-expense-text'
                      }`}
                    >
                      {netCashFlow >= 0 ? `+ ${formatCurrency(netCashFlow)}` : `- ${formatCurrency(Math.abs(netCashFlow))}`}
                    </span>
                  </div>
                </article>

                {/* KPI Cards: Income, Expense, Net Cash Flow */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-md items-stretch">
                  {/* Income Summary Card */}
                  <article className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md p-lg shadow-sm flex flex-col justify-between gap-sm">
                    <header className="flex items-center justify-between gap-sm">
                      <span className="font-label text-label-lg text-light-on-surface-muted dark:text-dark-on-surface-muted font-medium">
                        Income This Month
                      </span>
                      <span className="w-8 h-8 rounded-DEFAULT bg-light-income-bg dark:bg-dark-income-bg text-light-income-text dark:text-dark-income-text inline-flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">south_west</span>
                      </span>
                    </header>
                    <div>
                      <p className="font-headline text-headline-md text-light-income-text dark:text-dark-income-text tabular-nums font-semibold">
                        + {formatCurrency(currentMonthIncome)}
                      </p>
                      <p className="font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted mt-xs">
                        {monthTransactions.filter((t) => t.type === 'INCOME').length} entries recorded
                      </p>
                    </div>
                  </article>

                  {/* Expense Summary Card */}
                  <article className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md p-lg shadow-sm flex flex-col justify-between gap-sm">
                    <header className="flex items-center justify-between gap-sm">
                      <span className="font-label text-label-lg text-light-on-surface-muted dark:text-dark-on-surface-muted font-medium">
                        Expenses This Month
                      </span>
                      <span className="w-8 h-8 rounded-DEFAULT bg-light-expense-bg dark:bg-dark-expense-bg text-light-expense-text dark:text-dark-expense-text inline-flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">north_east</span>
                      </span>
                    </header>
                    <div>
                      <p className="font-headline text-headline-md text-light-expense-text dark:text-dark-expense-text tabular-nums font-semibold">
                        - {formatCurrency(currentMonthExpense)}
                      </p>
                      <p className="font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted mt-xs">
                        {monthTransactions.filter((t) => t.type === 'EXPENSE').length} entries recorded
                      </p>
                    </div>
                  </article>

                  {/* Net Cash Flow Card */}
                  <article className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md p-lg shadow-sm flex flex-col justify-between gap-sm">
                    <header className="flex items-center justify-between gap-sm">
                      <span className="font-label text-label-lg text-light-on-surface-muted dark:text-dark-on-surface-muted font-medium">
                        Net Cash Flow
                      </span>
                      <span className="w-8 h-8 rounded-DEFAULT bg-light-primary-tint dark:bg-dark-primary-tint text-light-on-primary-tint dark:text-dark-on-primary-tint inline-flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">trending_up</span>
                      </span>
                    </header>
                    <div>
                      <p className="font-headline text-headline-md text-light-on-surface dark:text-dark-on-surface tabular-nums font-semibold">
                        {netCashFlow >= 0 ? `+ ${formatCurrency(netCashFlow)}` : `- ${formatCurrency(Math.abs(netCashFlow))}`}
                      </p>
                      <p className="font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted mt-xs">
                        {savingsRate}% savings rate
                      </p>
                    </div>
                  </article>
                </div>
              </section>

              {/* Middle Row: Financial Chart (SVG) + Grouped Accounts */}
              <section className="grid grid-cols-12 gap-md items-stretch">
                {/* Financial Overview Chart */}
                <article className="col-span-12 lg:col-span-8 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md p-lg shadow-sm flex flex-col justify-between gap-lg">
                  <header className="flex flex-wrap items-center justify-between gap-sm">
                    <div>
                      <h2 className="font-title text-title-md text-light-on-surface dark:text-dark-on-surface font-semibold">
                        Financial Overview
                      </h2>
                      <p className="font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">
                        Income vs Expenses (6-Month Trend)
                      </p>
                    </div>
                    <div className="flex items-center gap-md">
                      <div className="flex items-center gap-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-light-income dark:bg-dark-income inline-block"></span>
                        <span className="font-label text-label-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">Income</span>
                      </div>
                      <div className="flex items-center gap-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-light-expense dark:bg-dark-expense inline-block"></span>
                        <span className="font-label text-label-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">Expenses</span>
                      </div>
                    </div>
                  </header>

                  {/* Clean SVG Bar Chart */}
                  <div className="w-full overflow-x-auto">
                    <svg viewBox="0 0 680 220" className="w-full h-56" role="img" aria-label="Income versus expenses bar chart">
                      <line x1="48" y1="20" x2="660" y2="20" className="stroke-light-border dark:stroke-dark-border" strokeDasharray="3 3"></line>
                      <line x1="48" y1="70" x2="660" y2="70" className="stroke-light-border dark:stroke-dark-border" strokeDasharray="3 3"></line>
                      <line x1="48" y1="120" x2="660" y2="120" className="stroke-light-border dark:stroke-dark-border" strokeDasharray="3 3"></line>
                      <line x1="48" y1="170" x2="660" y2="170" className="stroke-light-border dark:stroke-dark-border"></line>

                      <text x="40" y="24" textAnchor="end" className="fill-light-on-surface-muted dark:fill-dark-on-surface-muted font-mono" fontSize="11">
                        {Math.round(maxChartVal / 1000000)}M
                      </text>
                      <text x="40" y="95" textAnchor="end" className="fill-light-on-surface-muted dark:fill-dark-on-surface-muted font-mono" fontSize="11">
                        {Math.round(maxChartVal / 2000000)}M
                      </text>
                      <text x="40" y="174" textAnchor="end" className="fill-light-on-surface-muted dark:fill-dark-on-surface-muted font-mono" fontSize="11">
                        0
                      </text>

                      {monthlyChartData.map((m, idx) => {
                        const baseX = 82 + idx * 100;
                        const incHeight = Math.min(145, Math.max(4, (m.income / maxChartVal) * 145));
                        const expHeight = Math.min(145, Math.max(4, (m.expense / maxChartVal) * 145));
                        const isCurrent = idx === monthlyChartData.length - 1;
                        return (
                          <g key={m.label}>
                            {/* Income Bar */}
                            <rect
                              x={baseX}
                              y={170 - incHeight}
                              width="22"
                              height={incHeight}
                              rx="4"
                              className="fill-light-income dark:fill-dark-income"
                            />
                            {/* Expense Bar */}
                            <rect
                              x={baseX + 26}
                              y={170 - expHeight}
                              width="22"
                              height={expHeight}
                              rx="4"
                              className="fill-light-expense dark:fill-dark-expense"
                            />
                            {/* Month Label */}
                            <text
                              x={baseX + 24}
                              y="194"
                              textAnchor="middle"
                              className={isCurrent ? 'fill-light-on-surface dark:fill-dark-on-surface font-bold' : 'fill-light-on-surface-muted dark:fill-dark-on-surface-muted'}
                              fontSize="12"
                            >
                              {m.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </article>

                {/* Grouped Account Overview */}
                <article className="col-span-12 lg:col-span-4 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md p-lg shadow-sm flex flex-col justify-between gap-md">
                  <header className="flex items-center justify-between gap-sm">
                    <h2 className="font-title text-title-md text-light-on-surface dark:text-dark-on-surface font-semibold">
                      Account Overview
                    </h2>
                    <button
                      onClick={() => setCurrentTab('accounts')}
                      className="font-label text-label-sm text-light-primary dark:text-dark-primary hover:underline font-semibold"
                    >
                      Manage
                    </button>
                  </header>

                  <div className="flex flex-col divide-y divide-light-border dark:divide-dark-border">
                    {groupedAccounts.map((grp) => (
                      <div key={grp.label} className="py-sm flex items-center justify-between gap-sm">
                        <div className="flex items-center gap-sm">
                          <span className="w-9 h-9 rounded-DEFAULT bg-light-surface-subtle dark:bg-dark-surface-subtle text-light-on-surface dark:text-dark-on-surface inline-flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">{grp.icon}</span>
                          </span>
                          <div>
                            <p className="font-label text-label-lg text-light-on-surface dark:text-dark-on-surface font-semibold">
                              {grp.label}
                            </p>
                            <p className="font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">
                              {grp.count} akun
                            </p>
                          </div>
                        </div>
                        <span className="font-label text-label-lg text-light-on-surface dark:text-dark-on-surface tabular-nums text-right font-mono font-semibold">
                          {hideBalance ? 'Rp •••••' : formatCurrency(grp.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              {/* Recent Transactions Section */}
              <section className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-sm overflow-hidden">
                <header className="px-lg py-md border-b border-light-border dark:border-dark-border flex items-center justify-between gap-sm">
                  <div>
                    <h2 className="font-title text-title-md text-light-on-surface dark:text-dark-on-surface font-semibold">
                      Recent Transactions
                    </h2>
                    <p className="font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">
                      Latest activity across all accounts
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentTab('transactions')}
                    className="font-label text-label-lg text-light-primary dark:text-dark-primary hover:underline font-semibold"
                  >
                    View all transactions
                  </button>
                </header>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background">
                        <th className="px-lg py-sm font-label text-label-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">Transaction</th>
                        <th className="px-lg py-sm font-label text-label-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">Category</th>
                        <th className="px-lg py-sm font-label text-label-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">Account</th>
                        <th className="px-lg py-sm font-label text-label-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">Date</th>
                        <th className="px-lg py-sm font-label text-label-sm text-light-on-surface-muted dark:text-dark-on-surface-muted text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border dark:divide-dark-border">
                      {transactions.slice(0, 7).map((t) => {
                        const cat = categories.find((c) => c.id === t.categoryId);
                        const acc = accounts.find((a) => a.id === t.accountId);
                        const isIncome = t.type === 'INCOME';
                        const isTransfer = t.type === 'TRANSFER';
                        return (
                          <tr
                            key={t.id}
                            className="hover:bg-light-background dark:hover:bg-dark-background-secondary transition-colors duration-state-change"
                          >
                            <td className="px-lg py-md">
                              <div className="flex items-center gap-sm">
                                <span className={`w-9 h-9 rounded-DEFAULT inline-flex items-center justify-center text-title-md ${
                                  isIncome
                                    ? 'bg-light-income-bg dark:bg-dark-income-bg'
                                    : isTransfer
                                    ? 'bg-light-surface-subtle dark:bg-dark-surface-subtle'
                                    : 'bg-light-expense-bg dark:bg-dark-expense-bg'
                                }`}>
                                  {cat?.icon || (isTransfer ? '🔄' : isIncome ? '💼' : '🍜')}
                                </span>
                                <span className="font-label text-label-lg text-light-on-surface dark:text-dark-on-surface font-medium">
                                  {t.note || (isTransfer ? 'Transfer Antar Akun' : cat?.name || 'Transaksi')}
                                </span>
                              </div>
                            </td>
                            <td className="px-lg py-md font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">
                              {cat ? `${cat.icon || '🏷️'} ${cat.name}` : (isTransfer ? '🔄 Transfer' : '🏷️ Umum')}
                            </td>
                            <td className="px-lg py-md font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">
                              {acc?.name || 'Akun'}
                            </td>
                            <td className="px-lg py-md font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted tabular-nums">
                              {t.date ? t.date.substring(0, 10) : ''}
                            </td>
                            <td className={`px-lg py-md font-label text-label-lg tabular-nums text-right font-mono font-semibold ${
                              isIncome
                                ? 'text-light-income-text dark:text-dark-income-text'
                                : isTransfer
                                ? 'text-light-on-surface dark:text-dark-on-surface'
                                : 'text-light-expense dark:text-dark-expense'
                            }`}>
                              {isIncome ? `+ ${formatCurrency(t.amount)}` : isTransfer ? formatCurrency(t.amount) : `- ${formatCurrency(t.amount)}`}
                            </td>
                          </tr>
                        );
                      })}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-light-on-surface-muted dark:text-dark-on-surface-muted">
                            Belum ada transaksi yang dicatat. Klik "+ Add Transaction" untuk memulai.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ─── TAB 2: TRANSACTIONS ─── */}
          {currentTab === 'transactions' && (
            <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md p-lg shadow-sm">
              <TransactionManager
                transactions={transactions}
                accounts={accounts}
                categories={categories}
                onCreateTransaction={handleCreateTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </div>
          )}

          {/* ─── TAB 3: ACCOUNTS ─── */}
          {currentTab === 'accounts' && (
            <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md p-lg shadow-sm">
              <AccountManager
                accounts={accounts}
                onRefresh={loadData}
                onCreateAccount={handleCreateAccount}
                onUpdateAccount={handleUpdateAccount}
                onDeleteAccount={handleDeleteAccount}
                onMoveToTop={handleMoveAccountToTop}
                onToggleGroupHidden={handleToggleGroupHidden}
              />
            </div>
          )}

          {/* ─── TAB 4: CATEGORIES ─── */}
          {currentTab === 'categories' && (
            <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md p-lg shadow-sm">
              <CategoryManager
                categories={categories}
                onCreateCategory={handleCreateCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            </div>
          )}

          {/* ─── TAB 5: STATISTICS ─── */}
          {currentTab === 'stats' && (
            <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md p-lg shadow-sm">
              <StatsView transactions={transactions} categories={categories} />
            </div>
          )}

          {/* ─── TAB 6: SETTINGS ─── */}
          {currentTab === 'settings' && (
            <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md p-lg shadow-sm flex flex-col gap-lg max-w-3xl">
              <div>
                <h2 className="font-headline text-headline-md text-light-on-surface dark:text-dark-on-surface font-semibold">
                  Settings & Data Vault
                </h2>
                <p className="font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">
                  Kelola preferensi antarmuka dan cadangan data lokal perangkat Anda.
                </p>
              </div>

              {/* Theme Settings */}
              <div className="p-md rounded-md border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background flex items-center justify-between">
                <div>
                  <h3 className="font-label text-label-lg font-semibold text-light-on-surface dark:text-dark-on-surface">
                    Mode Tampilan (Theme)
                  </h3>
                  <p className="font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">
                    Pilih antara mode terang, gelap, atau mengikuti tema sistem OS Anda.
                  </p>
                </div>
                <div className="inline-flex rounded-DEFAULT p-xs bg-light-surface-subtle dark:bg-dark-surface-subtle border border-light-border dark:border-dark-border">
                  {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setThemeMode(m);
                        applyTheme(m);
                      }}
                      className={`px-md py-xs rounded-sm capitalize font-label text-label-sm ${
                        themeMode === m
                          ? 'bg-light-surface dark:bg-dark-surface text-light-primary dark:text-dark-primary font-bold shadow-sm'
                          : 'text-light-on-surface-muted dark:text-dark-on-surface-muted hover:text-light-on-surface'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Backup & Export */}
              <div className="p-md rounded-md border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background flex flex-col gap-md">
                <div>
                  <h3 className="font-label text-label-lg font-semibold text-light-on-surface dark:text-dark-on-surface">
                    Cadangan Data (Backup & Export)
                  </h3>
                  <p className="font-body text-body-sm text-light-on-surface-muted dark:text-dark-on-surface-muted">
                    Semua catatan transaksi Anda sepenuhnya berada di IndexedDB browser lokal. Anda dapat mengunduh salinan berkala.
                  </p>
                </div>

                <div className="flex items-center gap-sm">
                  <button
                    onClick={() => handleExportData('csv')}
                    className="inline-flex items-center gap-sm px-md py-sm rounded-DEFAULT border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-on-surface dark:text-dark-on-surface font-label text-label-lg hover:bg-light-surface-subtle dark:hover:bg-dark-surface-subtle"
                  >
                    <span className="material-symbols-outlined text-[18px]">table_view</span>
                    <span>Ekspor CSV</span>
                  </button>
                  <button
                    onClick={() => handleExportData('json')}
                    className="inline-flex items-center gap-sm px-md py-sm rounded-DEFAULT border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-on-surface dark:text-dark-on-surface font-label text-label-lg hover:bg-light-surface-subtle dark:hover:bg-dark-surface-subtle"
                  >
                    <span className="material-symbols-outlined text-[18px]">data_object</span>
                    <span>Ekspor JSON (Full Backup)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── ADD TRANSACTION MODAL (NEW DESIGN) ─── */}
      {isTxModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-light-on-surface/40 dark:bg-black/60 flex items-center justify-center p-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-xl w-full max-w-md p-lg flex flex-col gap-md animate-in fade-in zoom-in-95 duration-surface-enter">
            <header className="flex items-center justify-between">
              <h2 className="font-headline text-headline-md text-light-on-surface dark:text-dark-on-surface font-semibold">
                Add Transaction
              </h2>
              <button
                type="button"
                onClick={() => setIsTxModalOpen(false)}
                className="w-9 h-9 rounded-DEFAULT text-light-on-surface-muted dark:text-dark-on-surface-muted hover:bg-light-surface-subtle dark:hover:bg-dark-surface-subtle inline-flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </header>

            {modalError && (
              <div className="p-sm rounded-DEFAULT bg-light-expense-bg dark:bg-dark-expense-bg text-light-expense-text dark:text-dark-expense-text font-body text-body-sm">
                {modalError}
              </div>
            )}

            <form onSubmit={handleQuickModalSubmit} className="flex flex-col gap-md">
              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-xs p-xs rounded-DEFAULT bg-light-surface-subtle dark:bg-dark-surface-subtle border border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setModalType('EXPENSE')}
                  className={`py-xs rounded-sm font-label text-label-lg font-semibold transition-all ${
                    modalType === 'EXPENSE'
                      ? 'bg-light-surface dark:bg-dark-surface text-light-expense dark:text-dark-expense shadow-sm'
                      : 'text-light-on-surface-muted dark:text-dark-on-surface-muted'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setModalType('INCOME')}
                  className={`py-xs rounded-sm font-label text-label-lg font-semibold transition-all ${
                    modalType === 'INCOME'
                      ? 'bg-light-surface dark:bg-dark-surface text-light-income-text dark:text-dark-income-text shadow-sm'
                      : 'text-light-on-surface-muted dark:text-dark-on-surface-muted'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setModalType('TRANSFER')}
                  className={`py-xs rounded-sm font-label text-label-lg font-semibold transition-all ${
                    modalType === 'TRANSFER'
                      ? 'bg-light-surface dark:bg-dark-surface text-light-on-surface dark:text-dark-on-surface shadow-sm'
                      : 'text-light-on-surface-muted dark:text-dark-on-surface-muted'
                  }`}
                >
                  Transfer
                </button>
              </div>

              {/* Amount Input */}
              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-lg text-light-on-surface dark:text-dark-on-surface font-semibold">
                  Amount (Rp)
                </span>
                <input
                  type="text"
                  placeholder="150.000"
                  value={modalAmount}
                  onChange={(e) => setModalAmount(e.target.value)}
                  required
                  className="w-full rounded-DEFAULT border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-md py-sm font-headline text-headline-md text-light-on-surface dark:text-dark-on-surface tabular-nums font-mono focus:border-light-primary dark:focus:border-dark-primary focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary"
                />
              </label>

              {/* Dynamic Fields */}
              {modalType === 'TRANSFER' ? (
                <div className="grid grid-cols-2 gap-sm">
                  <label className="flex flex-col gap-xs">
                    <span className="font-label text-label-lg text-light-on-surface dark:text-dark-on-surface font-semibold">
                      Dari Akun
                    </span>
                    <select
                      value={modalAccountId}
                      onChange={(e) => setModalAccountId(e.target.value)}
                      className="w-full rounded-DEFAULT border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-md py-sm font-body text-body-md text-light-on-surface dark:text-dark-on-surface"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-xs">
                    <span className="font-label text-label-lg text-light-on-surface dark:text-dark-on-surface font-semibold">
                      Ke Akun
                    </span>
                    <select
                      value={modalToAccountId}
                      onChange={(e) => setModalToAccountId(e.target.value)}
                      className="w-full rounded-DEFAULT border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-md py-sm font-body text-body-md text-light-on-surface dark:text-dark-on-surface"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-sm">
                  <label className="flex flex-col gap-xs">
                    <span className="font-label text-label-lg text-light-on-surface dark:text-dark-on-surface font-semibold">
                      Kategori
                    </span>
                    <select
                      value={modalCategoryId}
                      onChange={(e) => setModalCategoryId(e.target.value)}
                      className="w-full rounded-DEFAULT border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-md py-sm font-body text-body-md text-light-on-surface dark:text-dark-on-surface"
                    >
                      <option value="">Pilih Kategori</option>
                      {categoriesByType.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-xs">
                    <span className="font-label text-label-lg text-light-on-surface dark:text-dark-on-surface font-semibold">
                      Akun
                    </span>
                    <select
                      value={modalAccountId}
                      onChange={(e) => setModalAccountId(e.target.value)}
                      className="w-full rounded-DEFAULT border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-md py-sm font-body text-body-md text-light-on-surface dark:text-dark-on-surface"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {/* Date & Note */}
              <div className="grid grid-cols-2 gap-sm">
                <label className="flex flex-col gap-xs">
                  <span className="font-label text-label-lg text-light-on-surface dark:text-dark-on-surface font-semibold">
                    Date
                  </span>
                  <input
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full rounded-DEFAULT border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-md py-sm font-body text-body-md text-light-on-surface dark:text-dark-on-surface"
                  />
                </label>
                <label className="flex flex-col gap-xs">
                  <span className="font-label text-label-lg text-light-on-surface dark:text-dark-on-surface font-semibold">
                    Notes
                  </span>
                  <input
                    type="text"
                    placeholder="Catatan transaksi..."
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                    className="w-full rounded-DEFAULT border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-md py-sm font-body text-body-md text-light-on-surface dark:text-dark-on-surface"
                  />
                </label>
              </div>

              {/* Actions Footer */}
              <footer className="flex items-center justify-end gap-sm pt-sm border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-md py-sm rounded-DEFAULT border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface font-label text-label-lg hover:bg-light-surface-subtle dark:hover:bg-dark-surface-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-md py-sm rounded-DEFAULT bg-light-primary dark:bg-dark-primary text-light-on-primary dark:text-dark-on-primary font-label text-label-lg font-semibold hover:opacity-95 shadow-sm"
                >
                  Save Transaction
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
