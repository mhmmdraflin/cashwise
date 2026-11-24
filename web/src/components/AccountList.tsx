'use client';

import React from 'react';
import { CreditCard, Smartphone, Banknote } from 'lucide-react';
import { Account, formatCurrency } from '@cashwise/shared';

interface AccountListProps {
  accounts: Account[];
}

export function AccountList({ accounts }: AccountListProps) {
  function getAccountIcon(type: Account['type']) {
    switch (type) {
      case 'BANK':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'E_WALLET':
        return <Smartphone className="w-4 h-4 text-cyan-600" />;
      default:
        return <Banknote className="w-4 h-4 text-emerald-600" />;
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">Rekening & Kantong</h3>
        <span className="text-xs text-slate-500">{accounts.length} Akun</span>
      </div>

      <div className="space-y-3">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50"
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-white border border-slate-200"
              >
                {getAccountIcon(acc.type)}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{acc.name}</p>
                <p className="text-xs text-slate-500 uppercase">{acc.type}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold font-mono text-slate-900">
                {formatCurrency(acc.balance)}
              </p>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">Belum ada akun.</p>
        )}
      </div>
    </div>
  );
}
