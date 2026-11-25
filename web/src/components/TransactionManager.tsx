'use client';

import React, { useState } from 'react';
import {
  Plus,
  Calendar as CalendarIcon,
  List,
  Layers,
  PieChart,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import {
  Account,
  Category,
  Transaction,
  TransactionType,
  formatCurrency,
  formatDate,
} from '@cashwise/shared';

interface TransactionManagerProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onCreateTransaction: (data: {
    type: TransactionType;
    accountId: string;
    toAccountId?: string;
    categoryId?: string;
    amount: number;
    note?: string;
    date: string;
  }) => Promise<void>;
  onUpdateTransaction: (
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
  ) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}

type ViewMode = 'daily' | 'calendar' | 'monthly' | 'summary';

export function TransactionManager({
  transactions,
  accounts,
  categories,
  onCreateTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
}: TransactionManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Calendar state: current year & month
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Form Fields
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountStr, setAmountStr] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Filtered transactions by search query
  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const noteMatch = t.note && t.note.toLowerCase().includes(q);
    const cat = categories.find((c) => c.id === t.categoryId);
    const catMatch = cat && cat.name.toLowerCase().includes(q);
    const acc = accounts.find((a) => a.id === t.accountId);
    const accMatch = acc && acc.name.toLowerCase().includes(q);
    return noteMatch || catMatch || accMatch;
  });

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalNet = totalIncome - totalExpense;

  function getCategory(id?: string | null) {
    return categories.find((c) => c.id === id);
  }

  function getAccount(id?: string | null) {
    return accounts.find((a) => a.id === id);
  }

  function openCreateModal() {
    setEditingTransaction(null);
    setType('EXPENSE');
    setDate(new Date().toISOString().split('T')[0]);
    setAmountStr('');
    setAccountId(accounts[0]?.id || '');
    setToAccountId(accounts[1]?.id || '');
    const firstExpenseCat = categories.find((c) => c.type === 'EXPENSE');
    setCategoryId(firstExpenseCat?.id || '');
    setNote('');
    setError(null);
    setIsModalOpen(true);
  }

  function openEditModal(tx: Transaction) {
    setEditingTransaction(tx);
    setType(tx.type);
    setDate(tx.date.split('T')[0]);
    setAmountStr(tx.amount.toString());
    setAccountId(tx.accountId);
    setToAccountId(tx.toAccountId || accounts.find((a) => a.id !== tx.accountId)?.id || '');
    setCategoryId(tx.categoryId || '');
    setNote(tx.note || '');
    setError(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(amountStr.replace(/\./g, '').replace(/,/g, '.'));
    if (isNaN(amount) || amount <= 0) {
      setError('Nominal transaksi wajib lebih besar dari 0.');
      return;
    }

    if (!accountId) {
      setError('Akun sumber wajib dipilih.');
      return;
    }

    if (type === 'TRANSFER') {
      if (!toAccountId || toAccountId === accountId) {
        setError('Akun asal dan tujuan transfer tidak boleh sama.');
        return;
      }
    } else {
      if (!categoryId) {
        setError('Kategori transaksi wajib dipilih.');
        return;
      }
    }

    // Combine date with current time for timestamp ordering
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const isoDate = `${date}T${timeString}.000Z`;

    try {
      if (editingTransaction) {
        await onUpdateTransaction(editingTransaction.id, {
          type,
          accountId,
          toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
          categoryId: type !== 'TRANSFER' ? categoryId : undefined,
          amount,
          note: note.trim() || undefined,
          date: isoDate,
        });
      } else {
        await onCreateTransaction({
          type,
          accountId,
          toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
          categoryId: type !== 'TRANSFER' ? categoryId : undefined,
          amount,
          note: note.trim() || undefined,
          date: isoDate,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan transaksi.');
    }
  }

  // --- RENDER SUB-VIEWS ---

  // 1. DAILY VIEW
  function renderDailyView() {
    const dailyMap: Record<string, Transaction[]> = {};
    for (const t of filteredTransactions) {
      const dayKey = t.date.split('T')[0];
      if (!dailyMap[dayKey]) dailyMap[dayKey] = [];
      dailyMap[dayKey].push(t);
    }

    const sortedDays = Object.keys(dailyMap).sort((a, b) => b.localeCompare(a));

    if (sortedDays.length === 0) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-card">
          <p className="text-sm text-slate-500">Belum ada transaksi pada daftar harian.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sortedDays.map((dayKey) => {
          const dayList = dailyMap[dayKey];
          const dayIncome = dayList.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
          const dayExpense = dayList.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

          return (
            <div key={dayKey} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
              {/* Day Header */}
              <div className="bg-slate-50/80 px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {formatDate(dayKey, 'long')}
                </span>
                <div className="flex items-center space-x-3 text-xs font-mono">
                  {dayIncome > 0 && (
                    <span className="text-emerald-600 font-bold">
                      +{formatCurrency(dayIncome)}
                    </span>
                  )}
                  {dayExpense > 0 && (
                    <span className="text-rose-600 font-bold">
                      -{formatCurrency(dayExpense)}
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions on this day */}
              <div className="divide-y divide-slate-100">
                {dayList.map((tx) => renderTransactionRow(tx))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 2. CALENDAR VIEW
  function renderCalendarView() {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    // Map date string -> { income, expense, count }
    const calendarData: Record<string, { income: number; expense: number; count: number }> = {};
    for (const t of filteredTransactions) {
      const dayStr = t.date.split('T')[0];
      if (!calendarData[dayStr]) {
        calendarData[dayStr] = { income: 0, expense: 0, count: 0 };
      }
      calendarData[dayStr].count += 1;
      if (t.type === 'INCOME') calendarData[dayStr].income += t.amount;
      if (t.type === 'EXPENSE') calendarData[dayStr].expense += t.amount;
    }

    const prevMonth = () => {
      if (calendarMonth === 0) {
        setCalendarMonth(11);
        setCalendarYear(calendarYear - 1);
      } else {
        setCalendarMonth(calendarMonth - 1);
      }
    };

    const nextMonth = () => {
      if (calendarMonth === 11) {
        setCalendarMonth(0);
        setCalendarYear(calendarYear + 1);
      } else {
        setCalendarMonth(calendarMonth + 1);
      }
    };

    const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            {monthNames[calendarMonth]} {calendarYear}
          </h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              {day}
            </div>
          ))}

          {/* Empty cells before day 1 */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-16 sm:h-20 bg-slate-50/50 rounded-lg" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const monthStr = String(calendarMonth + 1).padStart(2, '0');
            const dayFormatted = String(dayNum).padStart(2, '0');
            const fullDateStr = `${calendarYear}-${monthStr}-${dayFormatted}`;
            const data = calendarData[fullDateStr];
            const isSelected = selectedCalendarDate === fullDateStr;

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedCalendarDate(fullDateStr)}
                className={`h-16 sm:h-20 p-1 rounded-lg border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500'
                    : 'border-slate-100 hover:border-slate-300 bg-white'
                }`}
              >
                <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-600' : 'text-slate-700'}`}>
                  {dayNum}
                </span>

                {data && (
                  <div className="text-[10px] leading-tight space-y-0.5 truncate font-mono">
                    {data.income > 0 && (
                      <div className="text-emerald-600 font-bold truncate">
                        +{data.income >= 1000000 ? `${(data.income / 1000000).toFixed(1)}M` : `${Math.round(data.income / 1000)}k`}
                      </div>
                    )}
                    {data.expense > 0 && (
                      <div className="text-rose-600 font-bold truncate">
                        -{data.expense >= 1000000 ? `${(data.expense / 1000000).toFixed(1)}M` : `${Math.round(data.expense / 1000)}k`}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Details */}
        {selectedCalendarDate && (
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                Transaksi pada {formatDate(selectedCalendarDate, 'long')}
              </h4>
              <button
                onClick={() => setSelectedCalendarDate(null)}
                className="text-xs text-indigo-600 hover:underline"
              >
                Tutup
              </button>
            </div>

            <div className="divide-y divide-slate-100 bg-slate-50/50 rounded-xl border border-slate-200">
              {filteredTransactions
                .filter((t) => t.date.startsWith(selectedCalendarDate))
                .map((tx) => renderTransactionRow(tx))}
              {filteredTransactions.filter((t) => t.date.startsWith(selectedCalendarDate)).length === 0 && (
                <p className="p-4 text-xs text-slate-400 text-center">
                  Tidak ada transaksi pada tanggal ini.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. MONTHLY VIEW
  function renderMonthlyView() {
    const monthMap: Record<string, Transaction[]> = {};
    for (const t of filteredTransactions) {
      const ym = t.date.substring(0, 7); // e.g. "2026-11"
      if (!monthMap[ym]) monthMap[ym] = [];
      monthMap[ym].push(t);
    }

    const sortedMonths = Object.keys(monthMap).sort((a, b) => b.localeCompare(a));

    if (sortedMonths.length === 0) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-card">
          <p className="text-sm text-slate-500">Belum ada transaksi pada daftar bulanan.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sortedMonths.map((ym) => {
          const list = monthMap[ym];
          const mIncome = list.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
          const mExpense = list.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
          const mNet = mIncome - mExpense;

          const [year, month] = ym.split('-');
          const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          const monthTitle = monthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

          return (
            <div key={ym} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{monthTitle}</h3>
                  <p className="text-xs text-slate-500">{list.length} transaksi</p>
                </div>

                <div className="flex items-center space-x-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400">Pemasukan: </span>
                    <span className="text-emerald-600 font-bold">+{formatCurrency(mIncome)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Pengeluaran: </span>
                    <span className="text-rose-600 font-bold">-{formatCurrency(mExpense)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Net: </span>
                    <span className={`font-bold ${mNet >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                      {formatCurrency(mNet)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {list.map((tx) => renderTransactionRow(tx))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 4. SUMMARY VIEW
  function renderSummaryView() {
    const expenseByCategory: Record<string, number> = {};
    for (const t of filteredTransactions) {
      if (t.type === 'EXPENSE' && t.categoryId) {
        expenseByCategory[t.categoryId] = (expenseByCategory[t.categoryId] || 0) + t.amount;
      }
    }

    const sortedCategories = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pemasukan</span>
            <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
              +{formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pengeluaran</span>
            <p className="text-2xl font-bold font-mono text-rose-600 mt-1">
              -{formatCurrency(totalExpense)}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bersih (Net)</span>
            <p className={`text-2xl font-bold font-mono mt-1 ${totalNet >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatCurrency(totalNet)}
            </p>
          </div>
        </div>

        {/* Top Expenses by Category */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
          <h3 className="text-base font-bold text-slate-900">Pengeluaran Terbesar per Kategori</h3>
          <div className="space-y-3">
            {sortedCategories.map(([catId, amount]) => {
              const cat = getCategory(catId);
              const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;

              return (
                <div key={catId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800 flex items-center space-x-2">
                      <span className="text-base">{cat?.icon || '🏷️'}</span>
                      <span>{cat?.name || 'Kategori Lain'}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {sortedCategories.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">Belum ada data pengeluaran.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Common Transaction Row
  function renderTransactionRow(tx: Transaction) {
    const cat = getCategory(tx.categoryId);
    const acc = getAccount(tx.accountId);
    const toAcc = getAccount(tx.toAccountId);

    return (
      <div
        key={tx.id}
        className="px-4 sm:px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shrink-0">
            {tx.type === 'TRANSFER' ? '🔁' : cat?.icon || '🏷️'}
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              {tx.note || (tx.type === 'TRANSFER' ? 'Transfer Antar-Akun' : cat?.name || 'Transaksi')}
            </p>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
              <span>{formatDate(tx.date, 'time')}</span>
              <span>•</span>
              {tx.type === 'TRANSFER' ? (
                <span>
                  {acc?.name || 'Asal'} ➔ {toAcc?.name || 'Tujuan'}
                </span>
              ) : (
                <span>
                  {cat ? `${cat.icon || '🏷️'} ${cat.name}` : 'Kategori'} ({acc?.name || 'Akun'})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p
              className={`text-sm font-mono font-bold ${
                tx.type === 'INCOME'
                  ? 'text-emerald-600'
                  : tx.type === 'EXPENSE'
                  ? 'text-rose-600'
                  : 'text-blue-600'
              }`}
            >
              {tx.type === 'INCOME'
                ? `+${formatCurrency(tx.amount)}`
                : tx.type === 'EXPENSE'
                ? `-${formatCurrency(tx.amount)}`
                : formatCurrency(tx.amount)}
            </p>
          </div>

          <button
            onClick={() => openEditModal(tx)}
            title="Ubah transaksi"
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDeleteTransaction(tx.id)}
            title="Hapus transaksi"
            className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pencatatan Transaksi</h2>
          <p className="text-sm text-slate-500">
            Kelola pengeluaran, pemasukan, dan transfer dengan tampilan harian, kalender, bulanan, dan ringkasan.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Transaksi</span>
        </button>
      </div>

      {/* Summary Banner (Income, Expense, Total) */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-card">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Pemasukan</span>
          <p className="text-base sm:text-lg font-bold font-mono text-emerald-600 truncate">
            +{formatCurrency(totalIncome)}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Pengeluaran</span>
          <p className="text-base sm:text-lg font-bold font-mono text-rose-600 truncate">
            -{formatCurrency(totalExpense)}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Net</span>
          <p className={`text-base sm:text-lg font-bold font-mono truncate ${totalNet >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatCurrency(totalNet)}
          </p>
        </div>
      </div>

      {/* Sub-Tabs (Daily, Calendar, Monthly, Summary) & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex p-1 bg-slate-200/60 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'daily'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Daily</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'calendar'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'monthly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Monthly</span>
          </button>
          <button
            onClick={() => setViewMode('summary')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'summary'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Summary</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari deskripsi, kategori, akun..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
      </div>

      {/* Main Tab Content */}
      {viewMode === 'daily' && renderDailyView()}
      {viewMode === 'calendar' && renderCalendarView()}
      {viewMode === 'monthly' && renderMonthlyView()}
      {viewMode === 'summary' && renderSummaryView()}

      {/* Modal Create & Update Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingTransaction ? 'Ubah Transaksi' : 'Catat Transaksi Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Type Toggle: Expense, Income, Transfer */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setType('EXPENSE');
                    const firstExp = categories.find((c) => c.type === 'EXPENSE');
                    setCategoryId(firstExp?.id || '');
                  }}
                  className={`flex items-center justify-center py-2 text-xs font-semibold rounded-md transition-all ${
                    type === 'EXPENSE'
                      ? 'bg-white text-rose-600 shadow-sm border border-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('INCOME');
                    const firstInc = categories.find((c) => c.type === 'INCOME');
                    setCategoryId(firstInc?.id || '');
                  }}
                  className={`flex items-center justify-center py-2 text-xs font-semibold rounded-md transition-all ${
                    type === 'INCOME'
                      ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 mr-1" />
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setType('TRANSFER')}
                  className={`flex items-center justify-center py-2 text-xs font-semibold rounded-md transition-all ${
                    type === 'TRANSFER'
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 mr-1" />
                  Transfer
                </button>
              </div>

              {/* Date & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date (Tanggal)
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount (Nominal Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-semibold font-mono text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      placeholder="50000"
                      className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Account / From & To / Category */}
              {type === 'TRANSFER' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      From (Akun Asal)
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.group})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      To (Akun Tujuan)
                    </label>
                    <select
                      value={toAccountId}
                      onChange={(e) => setToAccountId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id} disabled={acc.id === accountId}>
                          {acc.name} ({acc.group})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category (Kategori)
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Pilih Kategori...</option>
                      {categories
                        .filter((c) => c.type === type)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account (Akun)
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.group})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Note / Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note / Deskripsi
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: Makan siang nasi padang, Beli bensin Pertamax"
                  maxLength={100}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
                >
                  {editingTransaction ? 'Simpan Perubahan' : 'Catat Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
