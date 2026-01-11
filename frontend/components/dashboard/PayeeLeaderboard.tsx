"use client";

import React, { useEffect, useState, useMemo } from "react";
import { authFetch } from "@/lib/authFetch";
import {
  Crown, Medal, Receipt, ArrowUpRight, ArrowDownLeft,
  Search, Wallet, HandCoins
} from "lucide-react";

interface PayeeLeaderboardProps {
  startDate?: Date;
  endDate?: Date;
  selectedBank?: string; // 1. Added Prop
}

export default function PayeeLeaderboard({ startDate, endDate, selectedBank }: PayeeLeaderboardProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"spent" | "received">("spent");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate.toISOString());
        if (endDate) params.append("end_date", endDate.toISOString());
        
        // 2. Pass Bank to the API if a specific bank is selected
        if (selectedBank && selectedBank !== "All Banks") {
          params.append("bank", selectedBank);
        }

        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/insights?${params.toString()}`);
        const json = await res.json();
        
        // Match the backend response key "leaderboard"
        setData(json.leaderboard || []);
      } catch (err) {
        console.error("Leaderboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
    // 3. Dependency array ensures refetch when bank selection changes
  }, [startDate, endDate, selectedBank]); 

  // Filter and Sort Logic
  const filteredList = useMemo(() => {
    return data
      .filter(item => {
        const name = item.name || "Unknown";
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
        const hasValue = view === "spent" ? item.spent > 0 : item.received > 0;
        return matchesSearch && hasValue;
      })
      .sort((a, b) => (view === "spent" ? b.spent - a.spent : b.received - a.received));
  }, [data, view, searchTerm]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 h-[500px] animate-pulse">
        <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[500px]">
      {/* Header Section */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Payee Leaderboard
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institution-Specific Analysis</p>
            </div>

            {/* View Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full md:w-auto">
              <button
                onClick={() => setView("spent")}
                className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${view === 'spent' ? 'bg-white dark:bg-slate-700 shadow-sm text-red-500' : 'text-slate-500'}`}
              >
                <Wallet className="w-3 h-3" /> Outflow
              </button>
              <button
                onClick={() => setView("received")}
                className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${view === 'received' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-500' : 'text-slate-500'}`}
              >
                <HandCoins className="w-3 h-3" /> Inflow
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search UPI ID or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
        {filteredList.length > 0 ? (
          filteredList.map((item, index) => {
            const amount = view === "spent" ? item.spent : item.received;

            return (
              <div
                key={`${item.name}-${index}`}
                className={`flex items-center justify-between p-3 rounded-2xl transition-all border ${index === 0 && searchTerm === ""
                  ? 'bg-amber-50/50 dark:bg-amber-900/5 border-amber-100 dark:border-amber-900/20'
                  : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-amber-500 text-white' :
                      index === 1 ? 'bg-slate-400 text-white' :
                        index === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                      {index + 1}
                    </div>
                    {index === 0 && <Crown className="w-3.5 h-3.5 text-amber-500 absolute -top-1.5 -right-1 rotate-12 fill-amber-500" />}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight truncate max-w-[150px]">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                      <Receipt className="w-3 h-3" />
                      {item.count} Txns
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={`font-black text-base tabular-nums ${view === "spent" ? "text-slate-900 dark:text-white" : "text-emerald-500"}`}>
                    ₹{amount.toLocaleString()}
                  </p>
                  <div className={`flex items-center justify-end gap-1 text-[9px] font-black uppercase tracking-tighter ${view === "spent" ? "text-red-400" : "text-emerald-400"}`}>
                    {view === "spent" ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownLeft className="w-2.5 h-2.5" />}
                    {view === "spent" ? "Paid" : "Received"}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
            <Search className="w-8 h-8 mb-2" />
            <p className="text-xs font-bold uppercase">No records found</p>
          </div>
        )}
      </div>
    </div>
  );
}