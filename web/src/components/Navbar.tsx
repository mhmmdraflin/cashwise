'use client';

import React from 'react';
import { Wallet, HardDrive, ShieldCheck } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">CashWise</span>
            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Web Client
            </span>
          </div>
        </div>

        {/* Local Storage Indicator (Anti-Slop Clean Badge) */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700">
          <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
          <span>Local-First (IndexedDB)</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </header>
  );
}
