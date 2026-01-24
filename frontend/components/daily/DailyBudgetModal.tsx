"use client";
import React, { useState } from "react";
import { X, Plus, Wallet, Tag, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

export default function DailyBudgetModal({ isOpen, onClose, onSave, selectedDate }: any) {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [type, setType] = useState("expense");

  if (!isOpen) return null;

  async function handleSave() {
    if (!category || amount <= 0) return;
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/daily-budget/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          amount,
          type,
          entry_date: selectedDate
        })
      });
      onSave();
      onClose();
    } catch (err) { console.error(err); }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Dynamic Backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
              Add Transaction
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Type Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            <button 
              onClick={() => setType("expense")} 
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase rounded-xl transition-all ${
                type === "expense" 
                  ? "bg-white dark:bg-slate-700 text-rose-500 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" /> Expense
            </button>
            <button 
              onClick={() => setType("income")} 
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase rounded-xl transition-all ${
                type === "income" 
                  ? "bg-white dark:bg-slate-700 text-emerald-500 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Income
            </button>
          </div>

          {/* Category Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2">Category</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="e.g. Starbucks Coffee" 
                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2">Amount</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">₹</span>
              <input 
                type="number" 
                placeholder="0.00" 
                className="w-full pl-12 pr-6 py-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-4xl font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-slate-200 dark:placeholder:text-slate-800"
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            onClick={handleSave} 
            className={`w-full py-5 rounded-[1.8rem] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${
              type === "expense" 
                ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/25 text-white" 
                : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25 text-white"
            }`}
          >
            <Plus className="w-5 h-5" /> 
            {type === "expense" ? "Log Expense" : "Log Income"}
          </button>
        </div>
      </div>
    </div>
  );
}