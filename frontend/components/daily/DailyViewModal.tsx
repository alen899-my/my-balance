"use client";
import React from "react";
import { 
  X, 
  Calendar, 
  Tag, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Clock,
  Hash
} from "lucide-react";

export default function DailyViewModal({ isOpen, onClose, item }: any) {
  if (!isOpen || !item) return null;

  const isExpense = item.type === "expense";

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
              Entry Details
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Daily Transaction Log
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-6">
          
          {/* Amount Hero Section */}
          <div className={`p-6 rounded-[2rem] flex flex-col items-center justify-center text-center border-2 border-dashed ${
            isExpense 
              ? "bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30" 
              : "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30"
          }`}>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">
              Transaction Total
            </p>
            <h3 className={`text-4xl font-black tracking-tighter tabular-nums ${
              isExpense ? "text-rose-500" : "text-emerald-500"
            }`}>
              {isExpense ? "-" : "+"} ₹{item.amount?.toLocaleString()}
            </h3>
          </div>

          <div className="space-y-4">
            {/* Category Row */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-2xl text-orange-500">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Category</p>
                <p className="text-base font-bold text-slate-900 dark:text-white leading-none">
                  {item.category}
                </p>
              </div>
            </div>

            {/* Type Row */}
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${
                isExpense ? "bg-rose-50 dark:bg-rose-950/20 text-rose-500" : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500"
              }`}>
                {isExpense ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Entry Type</p>
                <p className={`text-base font-bold leading-none capitalize ${
                   isExpense ? "text-rose-600" : "text-emerald-600"
                }`}>
                  {item.type}
                </p>
              </div>
            </div>

            {/* Date Row */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Date Logged</p>
                <p className="text-base font-bold text-slate-700 dark:text-slate-300 leading-none">
                  {new Date(item.entry_date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* ID / Reference */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-400">
                <Hash className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Transaction Ref</p>
                <p className="text-[10px] font-mono font-bold text-slate-400 truncate">
                  {item._id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
           <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-full">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Verified Dispatch
              </span>
           </div>
        </div>
      </div>
    </div>
  );
}