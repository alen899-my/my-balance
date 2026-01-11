"use client";

import { useEffect, useState, useCallback } from "react";
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

interface TransactionTableProps {
  filters: {
    search: string;
    type: string;
    sort: string;
  };
  startDate?: Date;
  endDate?: Date;
  selectedBank?: string; // 1. Added this to the interface
}

export default function TransactionTable({ filters, startDate, endDate, selectedBank }: TransactionTableProps) {
  const [data, setData] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const limit = 50;

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

      // 2. Append bank to the API request if it's not "All Banks"
      if (selectedBank && selectedBank !== "All Banks") {
        queryParams.append("bank", selectedBank);
      }

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
    // 3. Added selectedBank to the dependency array
  }, [page, filters, limit, startDate, endDate, selectedBank]); 

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // 4. Reset to page 1 when filters OR bank selection changes
  useEffect(() => {
    setPage(1);
  }, [filters, selectedBank]);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
          Statement Details
        </h3>
        <div className="text-[10px] font-black uppercase tracking-tight text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-3 py-1 rounded-full border border-violet-100 dark:border-violet-800">
          {data.length} Records In View
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
        
        <div className="overflow-x-auto overflow-y-auto h-[500px] 
          [&::-webkit-scrollbar]:w-1.5 
          [&::-webkit-scrollbar-track]:bg-transparent 
          [&::-webkit-scrollbar-thumb]:bg-slate-100 
          dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 
          [&::-webkit-scrollbar-thumb]:rounded-full 
          hover:[&::-webkit-scrollbar-thumb]:bg-violet-500/50 
          transition-all">
          
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm">
              <tr>
                <th className="p-5 text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-widest">Type</th>
                <th className="p-5 text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-widest">Transaction Info</th>
                <th className="p-5 text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-widest text-right">Debit/Credit</th>
                <th className="p-5 text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-widest text-right">Net Balance</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="p-8"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-full" /></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <div className="flex flex-col items-center">
                      <Banknote className="w-10 h-10 text-slate-300 mb-4" />
                      <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No matching records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((txn, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                    <td className="p-5 w-20">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        txn.credit > 0 
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 shadow-sm shadow-emerald-500/10" 
                        : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 shadow-sm shadow-rose-500/10"
                      }`}>
                        {txn.credit > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 transition-colors">
                          {txn.description}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400">
                            <Calendar className="w-3 h-3" /> {txn.date}
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                            {txn.bank}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-5 text-right font-black tabular-nums tracking-tighter">
                      <span className={txn.credit > 0 ? "text-emerald-500 text-base" : "text-rose-500 text-base"}>
                        {txn.credit > 0 ? `+${txn.credit.toLocaleString()}` : `-${txn.debit.toLocaleString()}`}
                      </span>
                    </td>

                    <td className="p-5 text-right font-black tabular-nums text-slate-900 dark:text-white tracking-tighter">
                      ₹{txn.balance.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Container */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <button
          disabled={page === 1 || isLoading}
          onClick={() => setPage(p => p - 1)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-2xl transition-all disabled:opacity-30 shadow-sm border border-slate-200 dark:border-slate-700 hover:text-violet-600 dark:hover:text-violet-400 active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>

        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Page <span className="text-violet-600 dark:text-violet-400">{page}</span> / {totalPages}
        </span>

        <button
          disabled={page === totalPages || isLoading}
          onClick={() => setPage(p => p + 1)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-2xl transition-all disabled:opacity-30 shadow-sm border border-slate-200 dark:border-slate-700 hover:text-violet-600 dark:hover:text-violet-400 active:scale-95"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}