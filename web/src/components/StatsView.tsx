'use client';

import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import {
  Category,
  Transaction,
  StatsTimeRange,
  computeTimeRangeStats,
  formatCurrency,
  formatDate,
} from '@cashwise/shared';

interface StatsViewProps {
  transactions: Transaction[];
  categories: Category[];
}

export function StatsView({ transactions, categories }: StatsViewProps) {
  const [selectedRange, setSelectedRange] = useState<StatsTimeRange>('1M');

  const stats = computeTimeRangeStats(transactions, categories, selectedRange);

  const timeRangeOptions: Array<{ key: StatsTimeRange; label: string; desc: string }> = [
    { key: '1D', label: '1 Hari', desc: 'Hari Ini' },
    { key: '1W', label: '1 Minggu', desc: '7 Hari' },
    { key: '1M', label: '1 Bulan', desc: '30 Hari' },
    { key: '3M', label: '3 Bulan', desc: 'Kuarter' },
    { key: '1Y', label: '1 Tahun', desc: 'Tahunan' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Statistik Keuangan</h2>
          <p className="text-sm text-slate-500">
            Analisis pengeluaran dan arus kas berdasarkan rentang waktu.
          </p>
        </div>

        {/* Time Range Pills */}
        <div className="flex items-center p-1 bg-slate-200/60 rounded-xl">
          {timeRangeOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelectedRange(opt.key)}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                selectedRange === opt.key
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Sub-label */}
      <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-100/70 py-2 px-3 rounded-lg border border-slate-200">
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        <span>Periode: <strong>{stats.label}</strong></span>
        <span>•</span>
        <span>
          {formatDate(stats.startDate, 'short')} s/d {formatDate(stats.endDate, 'short')}
        </span>
        <span>•</span>
        <span>{stats.transactionsCount} transaksi dihitung</span>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pengeluaran */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Pengeluaran</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-rose-600 tracking-tight">
            -{formatCurrency(stats.totalExpense)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Dalam periode terpilih</p>
        </div>

        {/* Total Pemasukan */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Pemasukan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 tracking-tight">
            +{formatCurrency(stats.totalIncome)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Dalam periode terpilih</p>
        </div>

        {/* Net Cashflow */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Tabungan Bersih (Net)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${stats.netSavings >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatCurrency(stats.netSavings)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Pemasukan dikurangi pengeluaran</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Rincian Pengeluaran per Kategori ({stats.categoryBreakdown.length} Kategori)
          </h3>
          <span className="text-xs text-slate-400">Diurutkan dari terbesar</span>
        </div>

        <div className="space-y-4">
          {stats.categoryBreakdown.map((item) => (
            <div key={item.categoryId} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">{item.categoryIcon}</span>
                  <span className="font-semibold text-slate-800">{item.categoryName}</span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                  <span className="ml-2 text-xs text-slate-400">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(item.percentage, 100)}%`,
                    backgroundColor: item.categoryColor || '#E11D48',
                  }}
                />
              </div>
            </div>
          ))}

          {stats.categoryBreakdown.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">
                Tidak ada data pengeluaran pada rentang waktu {stats.label}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
