"use client";
import React from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";

export default function DeleteBudgetModal({ isOpen, onClose, onConfirm, itemName }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xs bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-2xl animate-in zoom-in-95">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center mb-6 border border-rose-100 dark:border-rose-900/30">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Delete Item?</h2>
          <p className="text-xs font-bold text-slate-500 mt-2">
            Are you sure you want to remove <span className="text-slate-900 dark:text-white">"{itemName}"</span> from your survival list?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <button 
            onClick={onClose}
            className="py-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}