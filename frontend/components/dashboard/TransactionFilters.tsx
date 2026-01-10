"use client";

import { Search, ArrowUpDown } from "lucide-react";

export default function TransactionFilters({ filters, setFilters }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-100/80 dark:bg-slate-800/60 p-4 md:p-5 rounded-3xl md:rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
      
      {/* Search UPI / Description */}
      <div className="relative group w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 group-focus-within:text-violet-500 transition-colors z-10" />
        <input 
          type="text"
          placeholder="Search UPI ID or Payee..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-base md:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
        />
      </div>

      {/* Transaction Type Segmented Control */}
      <div className="flex bg-slate-200/50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-1 w-full shadow-inner">
        {['all', 'debit', 'credit'].map((type) => (
          <button
            key={type}
            onClick={() => setFilters({...filters, type})}
            className={`flex-1 py-2 text-[11px] md:text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-200 ${
              filters.type === type 
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30 ring-1 ring-violet-400" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Date Sorting */}
      <div className="relative w-full">
        <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none z-10" />
        <select 
          value={filters.sort}
          onChange={(e) => setFilters({...filters, sort: e.target.value})}
          className="w-full appearance-none pl-11 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-base md:text-sm font-bold text-slate-900 dark:text-slate-100 cursor-pointer shadow-sm"
        >
          {/* Added background to options to ensure visibility in dark mode dropdowns */}
          <option value="desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Newest First</option>
          <option value="asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Oldest First</option>
        </select>
        {/* Custom Arrow for select because appearance-none hides it */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="border-t-2 border-r-2 border-slate-400 w-1.5 h-1.5 rotate-[135deg]"></div>
        </div>
      </div>

    </div>
  );
}