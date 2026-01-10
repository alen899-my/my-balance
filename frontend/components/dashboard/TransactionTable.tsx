"use client";

import { useEffect, useState, useCallback } from "react"; // Added useCallback
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

// 1. Define the props interface
interface TransactionTableProps {
  filters: {
    search: string;
    type: string;
    sort: string;
  };
  startDate?: Date;
  endDate?: Date;
}

export default function TransactionTable({ filters, startDate, endDate }: TransactionTableProps) { // 2. Receive filters prop
  const [data, setData] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const limit = 10;

  // 3. Use useCallback to prevent unnecessary re-renders
  const fetchTransactions = useCallback(async (p = page) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: p.toString(),
        limit: limit.toString(),
        search: filters?.search || "",
        type: filters?.type || "all",
        sort: filters?.sort || "desc"
      });

      if (startDate) queryParams.append("start_date", startDate.toISOString());
      if (endDate) queryParams.append("end_date", endDate.toISOString());

      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/transactions?${queryParams.toString()}`
      );

      const json = await res.json();
      setData(json.data || []);
      setTotalPages(json.totalPages || 1);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, filters, limit, startDate, endDate]); // dependencies for the fetch

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
          Transaction History
        </h3>
        <div className="text-[10px] font-black uppercase tracking-tight text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-3 py-1 rounded-full border border-violet-100 dark:border-violet-800">
          {data.length} Records Found
        </div>
      </div>

      {/* Table Body */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 w-full bg-slate-100 dark:bg-slate-800/50 rounded-3xl animate-pulse border border-slate-200 dark:border-slate-800" />
          ))
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl mb-4">
              <Banknote className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No results found.</p>
          </div>
        ) : (
          data.map((txn, idx) => (
            <div
              key={idx}
              className="group relative flex flex-col md:flex-row md:items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-violet-500/50 dark:hover:border-violet-400/50 transition-all shadow-sm hover:shadow-xl hover:shadow-violet-500/5"
            >
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl transition-all shadow-sm ${txn.credit > 0
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                  : "bg-rose-50 dark:bg-rose-900/20 text-rose-600"
                  }`}>
                  {txn.credit > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {txn.description}
                  </h4>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                      <Calendar className="w-3 h-3" /> {txn.date}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {txn.bank}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-10 mt-5 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50 dark:border-slate-800">
                <div className="text-right">
                  <p className={`text-xl font-black tabular-nums tracking-tight ${txn.credit > 0 ? "text-emerald-500" : "text-rose-500"
                    }`}>
                    {txn.credit > 0 ? `+${txn.credit.toLocaleString()}` : `-${txn.debit.toLocaleString()}`}
                  </p>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                    Balance: <span className="text-slate-700 dark:text-slate-200">{txn.balance.toLocaleString()}</span>
                  </p>
                </div>
                <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-violet-600 group-hover:text-white transition-all">
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <button
          disabled={page === 1 || isLoading}
          onClick={() => setPage(p => p - 1)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-2xl transition-all disabled:opacity-30 shadow-sm border border-slate-200 dark:border-slate-700 hover:text-violet-600 dark:hover:text-violet-400"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>

        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Page <span className="text-violet-600 dark:text-violet-400">{page}</span> / {totalPages}
        </span>

        <button
          disabled={page === totalPages || isLoading}
          onClick={() => setPage(p => p + 1)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-2xl transition-all disabled:opacity-30 shadow-sm border border-slate-200 dark:border-slate-700 hover:text-violet-600 dark:hover:text-violet-400"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}