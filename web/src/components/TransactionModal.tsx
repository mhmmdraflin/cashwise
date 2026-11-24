'use client';

import React, { useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { Account, Category, TransactionType } from '@cashwise/shared';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  onSubmit: (data: {
    type: TransactionType;
    accountId: string;
    toAccountId?: string;
    categoryId?: string;
    amount: number;
    note?: string;
    date: string;
  }) => Promise<void>;
}

export function TransactionModal({
  isOpen,
  onClose,
  accounts,
  categories,
  onSubmit,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

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

    if (type === 'TRANSFER' && (!toAccountId || toAccountId === accountId)) {
      setError('Akun tujuan transfer harus berbeda dengan akun asal.');
      return;
    }

    if ((type === 'EXPENSE' || type === 'INCOME') && !categoryId) {
      setError('Kategori transaksi wajib dipilih.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        type,
        accountId,
        toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
        categoryId: type !== 'TRANSFER' ? categoryId : undefined,
        amount,
        note: note.trim() || undefined,
        date: new Date().toISOString(),
      });
      // Reset form
      setAmountStr('');
      setNote('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Catat Transaksi Kilat</h3>
          <button
            onClick={onClose}
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
          {/* Transaction Type Segmented Toggle */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                setCategoryId('');
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
                setCategoryId('');
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

          {/* Amount Input (Anti-Slop Tabular Display) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nominal Transaksi (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm font-semibold font-mono text-slate-500">
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
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 font-mono text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Account Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {type === 'TRANSFER' ? 'Dari Akun' : 'Akun'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>

            {/* To Account (Only for Transfer) */}
            {type === 'TRANSFER' ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ke Akun Tujuan
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === accountId}>
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Pilih Kategori...</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Kopi pagi, Bensin kantor"
              maxLength={100}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
