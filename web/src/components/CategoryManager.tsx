'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, X } from 'lucide-react';
import { Category, CategoryType, PRESET_EMOJIS } from '@cashwise/shared';

interface CategoryManagerProps {
  categories: Category[];
  onCreateCategory: (data: {
    name: string;
    type: CategoryType;
    icon: string;
    color: string;
  }) => Promise<void>;
  onUpdateCategory: (
    id: string,
    data: {
      name?: string;
      type?: CategoryType;
      icon?: string;
      color?: string;
    }
  ) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export function CategoryManager({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryManagerProps) {
  const [activeTab, setActiveTab] = useState<CategoryType>('EXPENSE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const [icon, setIcon] = useState('🍔');
  const [color, setColor] = useState('#F43F5E');
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const colorPresets = [
    '#F43F5E', // Rose
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#2563EB', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#64748B', // Slate
  ];

  function openCreateModal() {
    setEditingCategory(null);
    setName('');
    setType(activeTab);
    setIcon(activeTab === 'EXPENSE' ? '🍔' : '💼');
    setColor(activeTab === 'EXPENSE' ? '#F43F5E' : '#10B981');
    setError(null);
    setIsModalOpen(true);
  }

  function openEditModal(cat: Category) {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setIcon(cat.icon || '🏷️');
    setColor(cat.color || '#64748B');
    setError(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Nama kategori wajib diisi.');
      return;
    }

    try {
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, {
          name: name.trim(),
          type,
          icon: icon.trim() || '🏷️',
          color,
        });
      } else {
        await onCreateCategory({
          name: name.trim(),
          type,
          icon: icon.trim() || '🏷️',
          color,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan kategori.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Kategori Transaksi</h2>
          <p className="text-sm text-slate-500">
            Kelola kategori pengeluaran dan pemasukan dengan ikon emot visual.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {/* Tabs: Pengeluaran vs Pemasukan */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('EXPENSE')}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 -mb-px ${
            activeTab === 'EXPENSE'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Kategori Pengeluaran ({categories.filter((c) => c.type === 'EXPENSE').length})
        </button>
        <button
          onClick={() => setActiveTab('INCOME')}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 -mb-px ${
            activeTab === 'INCOME'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Kategori Pemasukan ({categories.filter((c) => c.type === 'INCOME').length})
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-card hover:border-slate-300 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: `${cat.color}15`, border: `1px solid ${cat.color}30` }}
              >
                {cat.icon || '🏷️'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  <span className="mr-1.5 text-base">{cat.icon || '🏷️'}</span>
                  {cat.name}
                </p>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {cat.type}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => openEditModal(cat)}
                title="Ubah kategori"
                className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteCategory(cat.id)}
                title="Hapus kategori"
                className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingCategory ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
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
              {/* Type Segmented Control */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setType('EXPENSE');
                    setColor('#F43F5E');
                  }}
                  className={`py-2 text-xs font-semibold rounded-md transition-all ${
                    type === 'EXPENSE'
                      ? 'bg-white text-rose-600 shadow-sm border border-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pengeluaran (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('INCOME');
                    setColor('#10B981');
                  }}
                  className={`py-2 text-xs font-semibold rounded-md transition-all ${
                    type === 'INCOME'
                      ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pemasukan (Income)
                </button>
              </div>

              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kategori Makanan, Kategori Transportasi, Kategori Lainnya"
                  maxLength={50}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Emoji Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Emot / Ikon
                </label>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shrink-0">
                    {icon}
                  </div>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="Ketik emot..."
                    maxLength={4}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Preset Emoji Grid */}
                <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-32 overflow-y-auto">
                  {PRESET_EMOJIS.map((emot) => (
                    <button
                      key={emot}
                      type="button"
                      onClick={() => setIcon(emot)}
                      className={`w-8 h-8 rounded-md flex items-center justify-center text-base hover:bg-white hover:scale-110 transition-all ${
                        icon === emot ? 'bg-white border-2 border-indigo-500 shadow-sm' : ''
                      }`}
                    >
                      {emot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Warna Aksen
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
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
                  {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
