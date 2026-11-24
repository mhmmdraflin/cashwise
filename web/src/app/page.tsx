'use client';

import React, { useEffect, useState } from 'react';
import { PlusCircle, RefreshCw, Smartphone } from 'lucide-react';
import { Account, Budget, Category, Transaction, TransactionType } from '@cashwise/shared';
import { Navbar } from '@/components/Navbar';
import { NetWorthCard } from '@/components/NetWorthCard';
import { AccountList } from '@/components/AccountList';
import { BudgetOverview } from '@/components/BudgetOverview';
import { TransactionList } from '@/components/TransactionList';
import { TransactionModal } from '@/components/TransactionModal';
import { getStorage, DEFAULT_USER_ID } from '@/lib/db';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Load data from local IndexedDB
  async function loadData() {
    try {
      const storage = await getStorage();
      const [accs, cats, txs, bdgs] = await Promise.all([
        storage.getAccounts(DEFAULT_USER_ID),
        storage.getCategories(DEFAULT_USER_ID),
        storage.getTransactions(DEFAULT_USER_ID, { limit: 20 }),
        storage.getBudgets(DEFAULT_USER_ID),
      ]);

      setAccounts(accs);
      setCategories(cats);
      setTransactions(txs);
      setBudgets(bdgs);
    } catch (err) {
      console.error('Gagal memuat data dari IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handle adding transaction
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

  // Handle deleting transaction (reverts balance atomicaly)
  async function handleDeleteTransaction(id: string) {
    if (!confirm('Hapus transaksi ini? Saldo akun akan dikembalikan secara otomatis.')) {
      return;
    }
    const storage = await getStorage();
    await storage.deleteTransaction(id);
    await loadData();
  }

  // Calculate aggregations
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const expensesByCategory: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === 'EXPENSE' && t.categoryId) {
      expensesByCategory[t.categoryId] = (expensesByCategory[t.categoryId] || 0) + t.amount;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Ringkasan Keuangan
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Data tersimpan lokal di IndexedDB peramban Anda.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => loadData()}
              className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
              title="Muat ulang data lokal"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>
          </div>
        </div>

        {/* Hero Card: Net Worth */}
        <NetWorthCard
          totalBalance={totalBalance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
        />

        {/* 2-Column Grid: Accounts & Budgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AccountList accounts={accounts} />
          <BudgetOverview
            budgets={budgets}
            categories={categories}
            expensesByCategory={expensesByCategory}
          />
        </div>

        {/* Transactions List */}
        <TransactionList
          transactions={transactions}
          categories={categories}
          onDeleteTransaction={handleDeleteTransaction}
        />
      </main>

      {/* Fast Transaction Entry Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        accounts={accounts}
        categories={categories}
        onSubmit={handleCreateTransaction}
      />
    </div>
  );
}
