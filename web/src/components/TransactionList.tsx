'use client';

import React from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Trash2 } from 'lucide-react';
import { Category, Transaction, formatCurrency, formatDate } from '@cashwise/shared';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onDeleteTransaction: (id: string) => void;
}

export function TransactionList({
  transactions,
  categories,
  onDeleteTransaction,
}: TransactionListProps) {
  function getCategoryName(categoryId?: string | null) {
    if (!categoryId) return 'Tanpa Kategori';
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : 'Kategori';
  }

  function getBadge(type: Transaction['type']) {
    switch (type) {
      case 'INCOME':
        return (
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        );
      case 'EXPENSE':
        return (
          <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        );
      case 'TRANSFER':
        return (
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        );
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">Riwayat Transaksi Terbaru</h3>
        <span className="text-xs text-slate-500">{transactions.length} Transaksi</span>
      </div>

      <div className="divide-y divide-slate-100">
        {transactions.map((tx) => (
          <div key={tx.id} className="py-3 flex items-center justify-between hover:bg-slate-50/50 rounded-lg px-2 -mx-2 transition-colors">
            <div className="flex items-center space-x-3">
              {getBadge(tx.type)}
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {tx.note || getCategoryName(tx.categoryId)}
                </p>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span>{formatDate(tx.date, 'short')}</span>
                  <span>•</span>
                  <span>{getCategoryName(tx.categoryId)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p
                  className={`text-sm font-semibold font-mono ${
                    tx.type === 'INCOME'
                      ? 'text-emerald-600'
                      : tx.type === 'EXPENSE'
                      ? 'text-rose-600'
                      : 'text-slate-800'
                  }`}
                >
                  {formatCurrency(tx.amount, 'IDR', {
                    showSign: true,
                    isExpense: tx.type === 'EXPENSE',
                  })}
                </p>
                <p className="text-xs text-slate-400">
                  {formatDate(tx.date, 'time')}
                </p>
              </div>

              <button
                onClick={() => onDeleteTransaction(tx.id)}
                title="Hapus transaksi (kembalikan saldo)"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">Belum ada transaksi tercatat.</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol '+ Catat Transaksi' untuk memulai.</p>
          </div>
        )}
      </div>
    </div>
  );
}
