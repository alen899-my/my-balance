"use client";
import React, { useState } from "react";
import { X, Wallet, ArrowUpCircle, Loader2 } from "lucide-react";

export default function IncomeModal({ isOpen, onClose, currentIncome, onSave }: any) {
  const [incomeValue, setIncomeValue] = useState<string>(currentIncome.toString());
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    // You can add an API call here if you want to persist income to the DB
    // For now, it updates the local state
    setTimeout(() => {
      onSave(Number(incomeValue));
      setLoading(false);
      onClose();
    }, 500);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Monthly Income</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update your total salary</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Total Amount (₹)</label>
            <div className="relative">
                <Wallet className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                <input 
                type="number" 
                placeholder="0.00"
                value={incomeValue}
                onChange={(e) => setIncomeValue(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-lg font-black focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all text-slate-900 dark:text-white"
                />
            </div>
          </div>

          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-relaxed uppercase tracking-tight text-center">
              This will be used to calculate your survival balance and savings rate.
            </p>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-5 bg-violet-600 hover:bg-violet-700 text-white rounded-[2rem] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-violet-500/25 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowUpCircle className="w-5 h-5" /> Update Income</>}
          </button>
        </div>
      </div>
    </div>
  );
}