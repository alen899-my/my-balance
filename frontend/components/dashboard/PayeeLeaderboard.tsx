"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { Crown, Medal, TrendingUp, Receipt } from "lucide-react";

export default function PayeeLeaderboard() {
  const [payees, setPayees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/insights`);
        const json = await res.json();
        setPayees(json.top_payees || []);
      } catch (err) {
        console.error("Leaderboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  if (loading) return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 h-full animate-pulse">
      <div className="h-6 w-32 bg-slate-200 rounded mb-6" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-100" />
          <div className="flex-1 h-4 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">
            Top Payees
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spending Leaderboard</p>
        </div>
        <TrendingUp className="w-5 h-5 text-blue-500" />
      </div>

      {/* CUSTOM SCROLLBAR APPLIED HERE */}
      <div className="p-4 space-y-3 overflow-y-auto max-h-[400px] 
        scrollbar-thin 
        scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 
        scrollbar-track-transparent 
        hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-700
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-slate-200
        dark:[&::-webkit-scrollbar-thumb]:bg-slate-800
        hover:[&::-webkit-scrollbar-thumb]:bg-slate-300
        dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-700">
        
        {payees.map((payee, index) => {
          const isFirst = index === 0;
          const isSecond = index === 1;
          const isThird = index === 2;

          return (
            <div 
              key={index} 
              className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                isFirst ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                    isFirst ? 'bg-amber-500 text-white' : 
                    isSecond ? 'bg-slate-400 text-white' : 
                    isThird ? 'bg-orange-400 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                  {isFirst && <Crown className="w-4 h-4 text-amber-500 absolute -top-2 -right-1 rotate-12 fill-amber-500" />}
                  {(isSecond || isThird) && <Medal className={`w-4 h-4 absolute -top-2 -right-1 rotate-12 ${isSecond ? 'text-slate-400' : 'text-orange-400'}`} />}
                </div>

                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-sm tracking-tight capitalize">
                    {payee.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                    <Receipt className="w-3 h-3" />
                    {payee.count} Transactions
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="font-black text-slate-900 dark:text-white">
                  ₹{payee.amount.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}