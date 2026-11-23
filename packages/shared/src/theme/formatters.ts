/**
 * CashWise Financial Formatter Utilities
 * Formats financial figures with standard Indonesian notation and tabular formatting.
 */

export function formatCurrency(
  amount: number,
  currency = 'IDR',
  options?: { showSign?: boolean; isExpense?: boolean }
): string {
  const isNegative = amount < 0 || options?.isExpense;
  const absAmount = Math.abs(amount);

  // Format to Indonesian locale e.g. 1.250.000
  const formattedNumber = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absAmount);

  let prefix = '';
  if (currency === 'IDR') {
    prefix = 'Rp ';
  } else {
    prefix = `${currency} `;
  }

  if (options?.showSign) {
    if (isNegative) {
      return `- ${prefix}${formattedNumber}`;
    }
    return `+ ${prefix}${formattedNumber}`;
  }

  if (isNegative) {
    return `-${prefix}${formattedNumber}`;
  }

  return `${prefix}${formattedNumber}`;
}

export function formatCompactCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 1_000_000_000) {
    return `${sign}Rp ${(absAmount / 1_000_000_000).toFixed(1)} M`;
  }
  if (absAmount >= 1_000_000) {
    return `${sign}Rp ${(absAmount / 1_000_000).toFixed(1)} jt`;
  }
  if (absAmount >= 1_000) {
    return `${sign}Rp ${(absAmount / 1_000).toFixed(0)} rb`;
  }
  return `${sign}Rp ${absAmount}`;
}

export function formatDate(isoDate: string, format: 'short' | 'long' | 'time' = 'short'): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '-';

  if (format === 'time') {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  if (format === 'long') {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // Short format e.g. 23 Nov 2026
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
