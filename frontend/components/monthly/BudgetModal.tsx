"use client";
import React, { useState } from "react";
import { X, Calculator, Plus } from "lucide-react";

export default function BudgetModal({ isOpen, onClose, onSave }: any) {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [times, setTimes] = useState<number>(1);

  const total = amount * times;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Add Budget Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Category Name</label>
            <input 
              type="text" placeholder="e.g. Milk, Internet, Rent"
              className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent mt-1 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Amount</label>
              <input 
                type="number" placeholder="0"
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent mt-1 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">How many times</label>
              <input 
                type="number" placeholder="1"
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent mt-1 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                onChange={(e) => setTimes(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="p-4 bg-violet-50 dark:bg-violet-900/10 rounded-2xl border border-violet-100 dark:border-violet-900/20 flex justify-between items-center">
             <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
               <Calculator className="w-4 h-4" />
               <span className="text-xs font-black uppercase">Calculated Total</span>
             </div>
             <span className="text-xl font-black text-violet-600">₹{total}</span>
          </div>

          <button 
            onClick={() => onSave({ category, amount, times, total })}
            className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
          >
            <Plus className="w-5 h-5" /> Add to List
          </button>
        </div>
      </div>
    </div>
  );
}