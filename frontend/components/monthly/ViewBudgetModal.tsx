"use client";
import React from "react";
import { X, Calendar, Calculator, Info, Tag } from "lucide-react";

export default function ViewBudgetModal({ isOpen, onClose, item }: any) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Item Details</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory overview</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-2xl text-violet-600">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Category</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white leading-none">{item.category}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Rate</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">₹{item.amount_per_unit.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Frequency</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{item.units} Times</p>
            </div>
          </div>

          <div className="p-5 bg-violet-600 rounded-[2rem] shadow-xl shadow-violet-500/20 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 opacity-70" />
              <span className="text-[10px] font-black uppercase tracking-widest">Total Net</span>
            </div>
            <span className="text-xl font-black">₹{item.total_amount.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pt-2">
            <Calendar className="w-3 h-3" /> Month: {item.month}/{item.year}
          </div>
        </div>
      </div>
    </div>
  );
}