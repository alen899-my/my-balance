"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { ChevronLeft, ChevronRight, Banknote, Calendar, ArrowUpRight, ArrowDownLeft } from "lucide-react";

type Transaction = {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  bank: string;
};

export default function TransactionTable() {
  const [data, setData] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const limit = 10;

  async function fetchTransactions(p = page) {
    setIsLoading(true);
    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/transactions?page=${p}&limit=${limit}`
      );
      const json = await res.json();
      setData(json.data || []);
      setTotalPages(json.totalPages || 1);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
          Transaction History
        </h3>
        <div className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
          {data.length} Records Found
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          // Better Skeleton Design
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 w-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />
          ))
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Banknote className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No transactions available yet.</p>
          </div>
        ) : (
          data.map((txn, idx) => (
            <div 
              key={idx} 
              className="group relative flex flex-col md:flex-row md:items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all shadow-sm hover:shadow-md"
            >
              {/* Left Side: Icon & Description */}
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors ${
                  txn.credit > 0 
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" 
                    : "bg-red-50 dark:bg-red-900/20 text-red-600"
                }`}>
                  {txn.credit > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {txn.description}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" /> {txn.date}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {txn.bank}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Amounts */}
              <div className="flex items-center justify-between md:justify-end gap-8 mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50 dark:border-slate-800">
                <div className="text-right">
                  <p className={`text-lg font-black tabular-nums ${
                    txn.credit > 0 ? "text-emerald-500" : "text-red-500"
                  }`}>
                    {txn.credit > 0 ? `+${txn.credit.toLocaleString()}` : `-${txn.debit.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    Balance: <span className="text-slate-600 dark:text-slate-300">{txn.balance.toLocaleString()}</span>
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 hidden md:block group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modern Pagination UI */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          disabled={page === 1 || isLoading}
          onClick={() => setPage(p => p - 1)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-30 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Page {page} <span className="mx-2 text-slate-200 dark:text-slate-700">|</span> Total {totalPages}
        </span>

        <button
          disabled={page === totalPages || isLoading}
          onClick={() => setPage(p => p + 1)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-30 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}