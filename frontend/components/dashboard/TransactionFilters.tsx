"use client";

import { Search, ArrowUpDown, CreditCard, Wallet } from "lucide-react";

export default function TransactionFilters({ filters, setFilters }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800">
      
      {/* Search UPI / Description */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
        <input 
          type="text"
          placeholder="Search UPI ID or Payee..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-sm font-medium"
        />
      </div>

      {/* Transaction Type */}
      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
        {['all', 'debit', 'credit'].map((type) => (
          <button
            key={type}
            onClick={() => setFilters({...filters, type})}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              filters.type === type 
              ? "bg-violet-600 text-white shadow-md shadow-violet-500/20" 
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Date Sorting */}
      <div className="relative">
        <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <select 
          value={filters.sort}
          onChange={(e) => setFilters({...filters, sort: e.target.value})}
          className="w-full appearance-none pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

    </div>
  );
}