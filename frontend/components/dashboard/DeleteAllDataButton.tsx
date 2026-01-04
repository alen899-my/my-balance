"use client";

import { useState, useEffect } from "react";
import { Trash2, Loader2, AlertTriangle, CheckCircle2, AlertCircle, X } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

export default function DeleteAllDataButton() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'idle', msg: string }>({ type: 'idle', msg: '' });

  // Auto-hide toast
  useEffect(() => {
    if (toast.type !== 'idle') {
      const timer = setTimeout(() => setToast({ type: 'idle', msg: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleClear = async () => {
    setIsDeleting(true);
    setIsConfirmOpen(false);
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/clear`, {
        method: "DELETE",
      });

      if (res.ok) {
        setToast({ type: 'success', msg: 'Database cleared successfully' });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        throw new Error();
      }
    } catch {
      setToast({ type: 'error', msg: 'Failed to clear transactions' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* --- TRIGGER BUTTON --- */}
      <button 
        onClick={() => setIsConfirmOpen(true)}
        disabled={isDeleting}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-800 disabled:opacity-50"
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        Clear Data
      </button>

      {/* --- FLOATING TOAST --- */}
      {toast.type !== 'idle' && (
        <div className={`fixed top-20 right-6 z-[150] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border animate-in slide-in-from-right-10 duration-300 ${
          toast.type === 'success' 
          ? 'bg-white dark:bg-slate-900 border-emerald-500/30 text-emerald-600' 
          : 'bg-white dark:bg-slate-900 border-red-500/30 text-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-xs font-black uppercase tracking-tight">{toast.msg}</span>
        </div>
      )}

      {/* --- CONFIRMATION MODAL --- */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setIsConfirmOpen(false)} 
          />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Are you sure?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 px-2 leading-relaxed font-medium">
                This will permanently delete <span className="text-red-500 font-bold">all transactions</span> from our database. This action cannot be undone.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-10">
              <button 
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleClear}
                className="px-4 py-4 rounded-2xl bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-700 shadow-xl shadow-red-500/30 transition-all active:scale-95"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}