'use client';

import React from 'react';
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@cashwise/shared';

interface NetWorthCardProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export function NetWorthCard({ totalBalance, totalIncome, totalExpense }: NetWorthCardProps) {
  const netSaving = totalIncome - totalExpense;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Total Kekayaan Bersih (Net Worth)
        </h2>
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          Semua Akun Aktif
        </span>
      </div>

      <div className="mt-1 mb-6">
        <p className="text-3xl sm:text-4xl font-bold font-mono text-slate-900 tracking-tight">
          {formatCurrency(totalBalance)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Pemasukan Bulan Ini</p>
            <p className="text-sm font-semibold font-mono text-emerald-600">
              {formatCurrency(totalIncome, 'IDR', { showSign: true })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Pengeluaran Bulan Ini</p>
            <p className="text-sm font-semibold font-mono text-rose-600">
              {formatCurrency(totalExpense, 'IDR', { showSign: true, isExpense: true })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
