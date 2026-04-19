"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Wallet,
  Activity,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import getSymbolFromCurrency from "currency-symbol-map";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface BankSummary {
  bank_name: string;
  total_transactions: number;
  current_balance: number;
}

const fmt = (n: number, sym: string) =>
  `${sym}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function BankAccounts() {
  const [banks, setBanks] = useState<BankSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  const fetchBanks = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/transactions/banks-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBanks(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch bank data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const pref = localStorage.getItem("preferred_currency");
    if (pref) setCurrencySymbol(getSymbolFromCurrency(pref) || "₹");
    fetchBanks();
  }, [fetchBanks]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-end">
        <button
          onClick={fetchBanks}
          className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted text-foreground text-sm font-semibold rounded-lg transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Sync
        </button>
      </div>

      {/* ── Loading state ── */}
      {loading && banks.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-muted/40 border border-border" />
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && banks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl bg-muted/10">
          <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 opacity-40" />
          </div>
          <p className="text-sm font-semibold mb-1">No Accounts Found</p>
          <p className="text-xs text-center max-w-xs">
            Upload your bank statements to automatically track bank account balances here.
          </p>
        </div>
      )}

      {/* ── Bank Grid ── */}
      {!loading && banks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {banks.map((bank, idx) => {
            const isWallet = bank.bank_name.toLowerCase().includes("wallet");
            return (
              <div
                key={idx}
                className={cn(
                  "group flex flex-col p-5 rounded-none border relative overflow-hidden transition-all duration-300",
                  "hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10",
                  isWallet 
                    ? "bg-gradient-to-br from-amber-500/10 via-background to-background border-amber-500/20" 
                    : "bg-gradient-to-br from-primary/15 via-background to-background border-primary/20"
                )}
              >
                {/* Decorative background glow */}
                <div className={cn(
                  "absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full pointer-events-none opacity-50",
                  isWallet ? "bg-amber-500/20" : "bg-primary/20"
                )} />

                <div className="flex flex-col mb-5 relative z-10">
                  <span className="text-lg font-black text-foreground tracking-tight pr-2 mb-0.5">
                    {bank.bank_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-80">
                    {isWallet ? "Manual Wallet" : "Bank Account"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 mb-5 relative z-10">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70">
                    Available Balance
                  </span>
                  <span className="text-2xl font-black text-emerald-500 dark:text-emerald-400 tabular-nums tracking-tighter drop-shadow-sm">
                    {fmt(bank.current_balance, currencySymbol)}
                  </span>
                </div>

                {/* Footer metrics inside card */}
                <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5 opacity-80">
                    <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {bank.total_transactions} {bank.total_transactions === 1 ? "Txn" : "Txns"} total
                    </span>
                  </div>
                  {/* Subtle element indicating viewability */}
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
