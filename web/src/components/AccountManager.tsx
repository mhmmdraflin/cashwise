'use client';

import React, { useState } from 'react';
import {
  Plus,
  ArrowUpToLine,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Wallet,
  X,
  CreditCard,
  Building2,
  PiggyBank,
  TrendingUp,
} from 'lucide-react';
import { Account, AccountType, DEFAULT_ACCOUNT_GROUPS, formatCurrency } from '@cashwise/shared';

interface AccountManagerProps {
  accounts: Account[];
  onRefresh: () => Promise<void>;
  onCreateAccount: (data: {
    name: string;
    type: AccountType;
    group: string;
    balance: number;
    description?: string;
  }) => Promise<void>;
  onUpdateAccount: (
    id: string,
    data: {
      name?: string;
      group?: string;
      balance?: number;
      description?: string;
    }
  ) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onMoveToTop: (id: string) => Promise<void>;
  onToggleGroupHidden: (group: string, isHidden: boolean) => Promise<void>;
}

export function AccountManager({
  accounts,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount,
  onMoveToTop,
  onToggleGroupHidden,
}: AccountManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form states
  const [group, setGroup] = useState('Cash');
  const [customGroup, setCustomGroup] = useState('');
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Grouping accounts
  const groupedAccounts = accounts.reduce((map, acc) => {
    const grp = acc.group || 'Accounts';
    if (!map[grp]) map[grp] = [];
    map[grp].push(acc);
    return map;
  }, {} as Record<string, Account[]>);

  // Maintain standard order of groups
  const groupOrder = ['Cash', 'Accounts', 'Savings', 'Investment'];
  const sortedGroupKeys = Object.keys(groupedAccounts).sort((a, b) => {
    const idxA = groupOrder.indexOf(a);
    const idxB = groupOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  function getGroupIcon(grp: string) {
    switch (grp.toLowerCase()) {
      case 'cash':
        return <Wallet className="w-4 h-4 text-emerald-600" />;
      case 'accounts':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'savings':
        return <PiggyBank className="w-4 h-4 text-indigo-600" />;
      case 'investment':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-slate-600" />;
    }
  }

  function openCreateModal(defaultGrp = 'Cash') {
    setEditingAccount(null);
    setGroup(defaultGrp);
    setCustomGroup('');
    setName('');
    setAmountStr('');
    setDescription('');
    setError(null);
    setIsModalOpen(true);
  }

  function openEditModal(acc: Account) {
    setEditingAccount(acc);
    if (DEFAULT_ACCOUNT_GROUPS.includes(acc.group as any)) {
      setGroup(acc.group);
      setCustomGroup('');
    } else {
      setGroup('Other');
      setCustomGroup(acc.group);
    }
    setName(acc.name);
    setAmountStr(acc.balance.toString());
    setDescription(acc.description || '');
    setError(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const finalGroup = (group === 'Other' ? customGroup.trim() : group) || 'Accounts';
    if (!name.trim()) {
      setError('Nama akun wajib diisi.');
      return;
    }

    const balance = parseFloat(amountStr.replace(/\./g, '').replace(/,/g, '.'));
    if (isNaN(balance)) {
      setError('Nominal saldo wajib berupa angka valid.');
      return;
    }

    try {
      if (editingAccount) {
        await onUpdateAccount(editingAccount.id, {
          name: name.trim(),
          group: finalGroup,
          balance,
          description: description.trim() || undefined,
        });
      } else {
        const type: AccountType =
          finalGroup === 'Cash'
            ? 'CASH'
            : finalGroup === 'Investment'
            ? 'INVESTMENT'
            : 'BANK';

        await onCreateAccount({
          name: name.trim(),
          type,
          group: finalGroup,
          balance,
          description: description.trim() || undefined,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan akun.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Akun & Rekening</h2>
          <p className="text-sm text-slate-500">
            Kelola pos keuangan (Cash, Bank Accounts, Savings, Investment) dan atur urutan prioritas.
          </p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun</span>
        </button>
      </div>

      {/* Account Groups Accordion / List */}
      <div className="space-y-6">
        {sortedGroupKeys.map((grpKey) => {
          const list = groupedAccounts[grpKey] || [];
          const isGroupHidden = list.every((a) => a.isGroupHidden);
          const groupTotal = list.reduce((sum, a) => sum + (a.balance || 0), 0);

          return (
            <div
              key={grpKey}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card"
            >
              {/* Group Header */}
              <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                    {getGroupIcon(grpKey)}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900">{grpKey}</span>
                    <span className="ml-2 text-xs text-slate-500">({list.length} akun)</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {formatCurrency(groupTotal)}
                  </span>
                  <button
                    onClick={() => onToggleGroupHidden(grpKey, !isGroupHidden)}
                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                    title={isGroupHidden ? `Tampilkan grup ${grpKey}` : `Sembunyikan grup ${grpKey}`}
                  >
                    {isGroupHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Group Body: Accounts List */}
              {!isGroupHidden && (
                <div className="divide-y divide-slate-100">
                  {list.map((acc, index) => (
                    <div
                      key={acc.id}
                      className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-start sm:items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shrink-0">
                          {acc.icon || '💳'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-bold text-slate-900">{acc.name}</p>
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {acc.type}
                            </span>
                          </div>
                          {acc.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{acc.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-4">
                        <p className="text-sm font-mono font-bold text-slate-900">
                          {formatCurrency(acc.balance)}
                        </p>

                        <div className="flex items-center space-x-1">
                          {/* Geser dari bawah ke paling atas */}
                          <button
                            onClick={() => onMoveToTop(acc.id)}
                            title="Geser ke paling atas"
                            className="p-1.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <ArrowUpToLine className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openEditModal(acc)}
                            title="Ubah akun"
                            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDeleteAccount(acc.id)}
                            title="Hapus akun"
                            className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {list.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">
                      Belum ada akun di grup ini.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingAccount ? 'Ubah Akun' : 'Tambah Akun Baru'}
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
              {/* Group Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Group Akun
                </label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Cash">Cash (Uang Tunai)</option>
                  <option value="Accounts">Accounts (Bank Reguler: BCA, Superbank)</option>
                  <option value="Savings">Savings (Tabungan: Blu BCA)</option>
                  <option value="Investment">Investment (Investasi: Bibit)</option>
                  <option value="Other">Group Lainnya (Kustom)...</option>
                </select>
              </div>

              {group === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Group Kustom
                  </label>
                  <input
                    type="text"
                    required
                    value={customGroup}
                    onChange={(e) => setCustomGroup(e.target.value)}
                    placeholder="Contoh: E-Wallet, Dana Darurat"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Account Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Akun
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: BCA, Superbank, Blu BCA, Bibit"
                  maxLength={50}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Amount (Saldo) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Saldo Awal (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm font-semibold font-mono text-slate-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="1000000"
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi (Opsional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Rekening tabungan gaji, reksadana bibit"
                  maxLength={100}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Actions */}
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
                  {editingAccount ? 'Simpan Perubahan' : 'Tambah Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
