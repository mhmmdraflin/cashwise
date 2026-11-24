'use client';

import React from 'react';
import { Target, AlertCircle } from 'lucide-react';
import { Budget, Category, formatCurrency } from '@cashwise/shared';

interface BudgetOverviewProps {
  budgets: Budget[];
  categories: Category[];
  expensesByCategory: Record<string, number>;
}

export function BudgetOverview({ budgets, categories, expensesByCategory }: BudgetOverviewProps) {
  function getCategoryName(categoryId: string) {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : 'Kategori';
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-indigo-600" />
          <h3 className="text-base font-semibold text-slate-900">Alokasi Anggaran Bulanan</h3>
        </div>
        <span className="text-xs text-slate-500">{budgets.length} Kuota</span>
      </div>

      <div className="space-y-4">
        {budgets.map((b) => {
          const spent = expensesByCategory[b.categoryId] || 0;
          const ratio = Math.min((spent / b.limitAmount) * 100, 100);
          const isOver = spent > b.limitAmount;
          const isWarning = spent > b.limitAmount * 0.7 && !isOver;

          let progressColor = 'bg-emerald-500';
          if (isOver) progressColor = 'bg-rose-600';
          else if (isWarning) progressColor = 'bg-amber-500';

          return (
            <div key={b.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-900">
                  {getCategoryName(b.categoryId)}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-700">
                  {formatCurrency(spent)} / {formatCurrency(b.limitAmount)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden my-2">
                <div
                  className={`h-full transition-all duration-300 ${progressColor}`}
                  style={{ width: `${ratio}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{ratio.toFixed(0)}% terpakai</span>
                {isOver && (
                  <span className="flex items-center space-x-1 text-rose-600 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Over-budget ({formatCurrency(spent - b.limitAmount)})</span>
                  </span>
                )}
                {!isOver && (
                  <span>Sisa: {formatCurrency(b.limitAmount - spent)}</span>
                )}
              </div>
            </div>
          );
        })}

        {budgets.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            Belum ada anggaran bulanan yang ditentukan.
          </p>
        )}
      </div>
    </div>
  );
}
