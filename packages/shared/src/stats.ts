/**
 * CashWise Financial Statistics & Time Range Calculator
 * Computes expense, income, and category breakdowns across 1D, 1W, 1M, 3M, 1Y.
 */

import { Category, Transaction } from './types';

export type StatsTimeRange = '1D' | '1W' | '1M' | '3M' | '1Y';

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}

export interface TimeRangeStats {
  timeRange: StatsTimeRange;
  label: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  transactionsCount: number;
  categoryBreakdown: CategoryBreakdownItem[];
}

export function getTimeRangeBoundary(range: StatsTimeRange, now = new Date()): { start: Date; end: Date; label: string } {
  const end = new Date(now);
  const start = new Date(now);

  switch (range) {
    case '1D':
      start.setHours(0, 0, 0, 0);
      return { start, end, label: 'Hari Ini (1 Hari)' };
    case '1W':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end, label: '7 Hari Terakhir (1 Minggu)' };
    case '1M':
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      return { start, end, label: '30 Hari Terakhir (1 Bulan)' };
    case '3M':
      start.setMonth(now.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      return { start, end, label: '3 Bulan Terakhir' };
    case '1Y':
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      return { start, end, label: '1 Tahun Terakhir' };
  }
}

export function computeTimeRangeStats(
  transactions: Transaction[],
  categories: Category[],
  range: StatsTimeRange,
  now = new Date()
): TimeRangeStats {
  const { start, end, label } = getTimeRangeBoundary(range, now);
  const startTime = start.getTime();
  const endTime = end.getTime();

  // Filter transactions within the time range and active (not deleted)
  const filtered = transactions.filter((t) => {
    if (t.deletedAt) return false;
    const txTime = new Date(t.date).getTime();
    return txTime >= startTime && txTime <= endTime;
  });

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryExpenses: Record<string, number> = {};

  for (const tx of filtered) {
    if (tx.type === 'INCOME') {
      totalIncome += tx.amount;
    } else if (tx.type === 'EXPENSE') {
      totalExpense += tx.amount;
      if (tx.categoryId) {
        categoryExpenses[tx.categoryId] = (categoryExpenses[tx.categoryId] || 0) + tx.amount;
      }
    }
  }

  // Build category breakdown
  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const categoryBreakdown: CategoryBreakdownItem[] = Object.entries(categoryExpenses)
    .map(([catId, amount]) => {
      const cat = categoryMap.get(catId);
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return {
        categoryId: catId,
        categoryName: cat?.name || 'Kategori Lain',
        categoryIcon: cat?.icon || '🏷️',
        categoryColor: cat?.color || '#64748B',
        amount,
        percentage,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return {
    timeRange: range,
    label,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    totalIncome,
    totalExpense,
    netSavings: totalIncome - totalExpense,
    transactionsCount: filtered.length,
    categoryBreakdown,
  };
}
