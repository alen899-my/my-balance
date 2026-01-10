"use client";
import React, { useState, useEffect } from "react";
import { X, Wallet, ArrowUpCircle, Loader2, Edit3 } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

export default function IncomeModal({ isOpen, onClose, currentIncome, onSave, month, year }: any) {
  const [incomeValue, setIncomeValue] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIncomeValue(currentIncome > 0 ? currentIncome.toString() : "");
    }
  }, [currentIncome, isOpen]);

  const isEditing = currentIncome > 0;

  async function handleSubmit() {
    if (!incomeValue || isNaN(Number(incomeValue))) return;
    setLoading(true);
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/income`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(incomeValue),
          month: Number(month),
          year: Number(year)
        }),
      });

      if (response.ok) {
        onSave();
        onClose();
      }
    } catch (err) {
      console.error("Income Update Error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop with stronger blur for focus */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
              {isEditing ? "Update Income" : "Monthly Income"}
            </h2>
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {isEditing ? "Modify your settings" : "Set your base budget"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
              Monthly Amount (₹)
            </label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-violet-500">
                <Wallet className="w-5 h-5 text-slate-400 group-focus-within:text-violet-500" />
              </div>
              <input
                type="number"
                placeholder="0.00"
                value={incomeValue}
                autoFocus
                onChange={(e) => setIncomeValue(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xl font-black text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all appearance-none"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 md:py-5 bg-violet-600 hover:bg-violet-700 text-white rounded-[1.8rem] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-violet-500/25 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isEditing ? <Edit3 className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                <span className="text-sm">{isEditing ? "Update Now" : "Confirm Income"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}