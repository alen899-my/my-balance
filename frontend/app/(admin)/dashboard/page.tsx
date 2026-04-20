"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import getSymbolFromCurrency from "currency-symbol-map";
import { Wallet, Activity, ArrowDownRight, ArrowUpRight, ArrowUp, ArrowDown, MoveRight, Trophy, TrendingDown, TrendingUp, Medal, Zap, Repeat, Target, Sparkles, Coins, Star, ShoppingBag, Flame, Skull, Search, Crosshair } from "lucide-react";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";
import { StatCard } from "@/components/ui/StatCard";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { SpendingPulseGraph } from "@/components/dashboard/SpendingPulseGraph";
import { IncomeTrendGraph } from "@/components/dashboard/IncomeTrendGraph";
import { BudgetComparisonGraph } from "@/components/dashboard/BudgetComparisonGraph";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Global Client-Side Data Cache
const dashboardFetchCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 30000; 

const formatCompact = (amount: number, sym: string) => {
  if (amount === 0) return `${sym}0`;
  const formatted = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(Math.abs(amount));
  return `${amount < 0 ? "-" : ""}${sym}${formatted}`;
};

function MiniMilestoneCard({ title, subtitle, value, icon, colorClass, loading }: any) {
  if (loading) return <div className="h-16 bg-muted/40 animate-pulse rounded-none border border-border/40" />;
  return (
    <div className={cn(
      "p-3 border-l-4 bg-card hover:bg-muted/30 transition-all duration-300 flex items-center justify-between group cursor-default shadow-sm border border-border/20",
      colorClass
    )}>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{title}</span>
        <span className="text-[13px] font-black truncate max-w-[140px] leading-tight">{value}</span>
        {subtitle && <span className="text-[8px] font-bold text-muted-foreground/40 uppercase truncate">{subtitle}</span>}
      </div>
      <div className="opacity-10 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 text-muted-foreground">
        {icon}
      </div>
    </div>
  )
}

function HorizontalBountyBoard({ items, currencySymbol, loading }: any) {
  if (loading) return <div className="w-full h-32 bg-muted/20 animate-pulse rounded-none" />;
  if (!items || items.length === 0) return null;

  return (
    <div className="w-full bg-slate-50 dark:bg-[#0a0a0a] border-y-4 border-amber-600/30 py-6 relative overflow-hidden group shadow-2xl transition-colors duration-500">
       <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
       <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-4 mb-6">
             <div className="px-5 py-1 bg-amber-600 text-black text-[12px] font-black uppercase tracking-[0.4em] shadow-lg flex items-center gap-3"><Skull className="w-4 h-4 animate-pulse" /> MOST WANTED BUDGETS <Crosshair className="w-4 h-4" /></div>
             <div className="flex-1 h-[2px] bg-amber-600/20" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {items.map((item: any, idx: number) => {
                const isTop = idx === 0;
                return (
                   <div key={idx} className={cn("relative p-6 border-2 flex flex-col justify-between transition-all duration-500 group/poster", isTop ? "bg-amber-500/5 dark:bg-amber-600/5 border-amber-600/40 shadow-[0_0_30px_rgba(217,119,6,0.1)]" : "border-black/5 dark:border-white/5 hover:border-amber-600/20 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]")}>
                      <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 pointer-events-none group-hover/poster:opacity-20 transition-opacity">{isTop ? <Skull className="w-12 h-12" /> : <Target className="w-12 h-12" />}</div>
                      <div className="flex flex-col gap-1">
                         <span className="text-[9px] font-black text-amber-600/60 dark:text-amber-500/40 uppercase tracking-[0.2em] leading-none mb-1">Most Wanted Monthly</span>
                         <h3 className="text-xl font-black text-foreground uppercase tracking-tight truncate leading-tight group-hover/poster:text-amber-600 transition-colors">{item.name}</h3>
                         <div className="flex items-center gap-2 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" /><span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{item.count} Months of Activity</span></div>
                      </div>
                      <div className="mt-8 flex items-end justify-between"><div className="flex flex-col"><span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Amount</span><div className="text-4xl font-black text-amber-600 tabular-nums leading-none tracking-tighter mt-2 group-hover/poster:scale-110 origin-left transition-transform">{currencySymbol}{Math.round(item.amount).toLocaleString()}</div></div><div className="opacity-0 group-hover/poster:opacity-100 transition-all transform translate-x-2 group-hover/poster:translate-x-0"><MoveRight className="w-6 h-6 text-amber-600" /></div></div>
                   </div>
                )
             })}
          </div>
       </div>
    </div>
  )
}

function LeaderboardWidget({ data, currencySymbol, loading, title, type }: { 
  data: any[], currencySymbol: string, loading: boolean, title: string, type: "debit" | "credit"
}) {
  const totalAmount = useMemo(() => data.reduce((acc, curr) => acc + (curr.amount || 0), 0), [data]);
  if (loading) return <div className="w-full bg-card border border-border h-[480px] animate-pulse" />;
  return (
    <div className="w-full bg-card border border-border rounded-none flex flex-col shadow-sm relative overflow-hidden group h-[480px]">
      <div className={cn("absolute top-0 left-0 right-0 h-[3px] z-50", type === "debit" ? "bg-gradient-to-r from-destructive via-red-500 to-amber-500" : "bg-gradient-to-r from-emerald-600 via-green-400 to-teal-400")} />
      <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/10 shrink-0">
         <div className="flex items-center gap-3"><div className={cn("w-8 h-8 flex items-center justify-center rounded-none border-2 rotate-45 group-hover:rotate-0 transition-all duration-500", type === "debit" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20")}><div className="-rotate-45 group-hover:rotate-0 transition-transform duration-500">{type === "debit" ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}</div></div>
            <div><h3 className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">{title}</h3></div></div>
         <Trophy className="w-4 h-4 text-amber-500" />
      </div>
      <div className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar">
         <table className="w-full text-left border-collapse table-fixed"><thead className="sticky top-0 z-40 bg-card shadow-sm"><tr className="bg-muted/5 border-b border-border/40"><th className="px-5 py-3 text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] w-[55%]">Description</th><th className="px-3 py-3 text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] text-center w-[15%]">Count</th><th className="px-5 py-3 text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] text-right w-[30%]">Volume</th></tr></thead>
            <tbody>{data.length === 0 ? (<tr><td colSpan={3} className="py-20 text-center text-[10px] uppercase font-black text-muted-foreground/20 px-5 tracking-[0.4em]">No Data</td></tr>) : (data.map((item, idx) => {
                     const isTop3 = idx < 3; const medalColors = ["text-amber-400", "text-slate-300", "text-orange-400"];
                     return (<tr key={idx} className={cn("border-b border-border/20 last:border-0 transition-all duration-300 group/row cursor-default", isTop3 ? "bg-muted/10 font-bold" : "hover:bg-muted/30")}><td className="px-5 py-3"><div className="flex items-start gap-3"><div className="w-5 flex justify-center mt-0.5">{isTop3 ? <Medal className={cn("w-4 h-4", medalColors[idx])} /> : <span className="text-[10px] font-black text-muted-foreground/15 italic">#{(idx+1).toString().padStart(2, '0')}</span>}</div><div className="flex flex-col min-w-0 flex-1"><div className={cn("text-[12px] font-bold leading-tight truncate", isTop3 ? "text-foreground" : "text-foreground/70 group-hover/row:text-primary")}>{item._id || "Unknown"}</div></div></div></td><td className="px-3 py-3 text-center"><span className="text-[10px] font-black tabular-nums">{item.count}</span></td><td className={cn("px-5 py-3 text-right text-[13px] font-black tabular-nums", type === "debit" ? "text-destructive" : "text-emerald-600")}>{currencySymbol}{item.amount.toLocaleString()}</td></tr>);}))}
            </tbody>
         </table>
      </div>
      <div className="shrink-0 bg-muted/20 border-t border-border/60 px-5 py-3 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/50"><span>TOTAL VOLUME</span><span className={cn("text-[14px]", type === "debit" ? "text-destructive" : "text-emerald-600")}>{currencySymbol}{totalAmount.toLocaleString()}</span></div>
    </div>
  );
}

function RecentTransactionsList({ transactions, currencySymbol, loading, title, subtitle, colorScheme = "primary" }: {
  transactions: any[], currencySymbol: string, loading: boolean, title: string, subtitle: string, colorScheme?: "primary" | "destructive" | "emerald"
}) {
  const textClasses = { primary: "text-primary", destructive: "text-destructive", emerald: "text-emerald-600" };
  const topLineClasses = { primary: "bg-primary/40", destructive: "bg-destructive/40", emerald: "bg-emerald-500/40" };
  if (loading) return <div className="w-full bg-card border border-border h-[400px] animate-pulse" />;
  return (
    <div className="w-full h-[400px] bg-card border border-border flex flex-col shadow-sm relative overflow-hidden group">
      <div className={cn("absolute top-0 left-0 right-0 h-[2px] z-30", topLineClasses[colorScheme])} />
      <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/5 shrink-0"><div><h3 className={cn("text-[10px] font-black uppercase tracking-[0.15em]", textClasses[colorScheme])}>{title}</h3><p className="text-[8px] font-bold text-muted-foreground/40 uppercase mt-0.5">{subtitle}</p></div></div>
      <div className="flex-1 p-1 space-y-0.5 overflow-y-auto custom-scrollbar">
        {transactions.map((tx: any, idx: number) => {
            const isDebit = (tx.debit || 0) > 0;
            return (
              <div key={tx._id || idx} className="flex items-center justify-between p-2 rounded-none hover:bg-muted/40 transition-all border border-transparent hover:border-border/10"><div className="flex items-center gap-3 overflow-hidden"><div className={cn("shrink-0 w-8 h-8 flex items-center justify-center border", isDebit ? "bg-destructive/5 text-destructive border-destructive/10" : "bg-emerald-500/5 text-emerald-600 border-emerald-500/10")}>{isDebit ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}</div><div className="overflow-hidden"><div className="text-[11px] font-black leading-tight whitespace-normal break-words">{tx.description || tx.payee}</div><div className="text-[8px] font-bold text-muted-foreground/40 uppercase mt-1">{tx.date} • {tx.bank}</div></div></div><div className={cn("shrink-0 text-[12px] font-black tabular-nums tracking-tighter pl-2", isDebit ? "text-destructive" : "text-emerald-600")}>{currencySymbol}{(tx.debit || tx.credit).toLocaleString()}</div></div>
            );
          })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [banks, setBanks] = useState<any[]>([]);
  const [bankFilter, setBankFilter] = useState("All Banks");
  const [searchFilter, setSearchFilter] = useState("");
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [recentDebit, setRecentDebit] = useState<any[]>([]);
  const [recentCredit, setRecentCredit] = useState<any[]>([]);
  const [topDebits, setTopDebits] = useState<any[]>([]);
  const [topCredits, setTopCredits] = useState<any[]>([]);
  const [transactionsData, setTransactionsData] = useState({ total_debit: 0, total_credit: 0, count: 0 });
  const [recordStats, setRecordStats] = useState<any>(null);
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token"); if (!token) return;
    const baseParams = new URLSearchParams(); 
    if (bankFilter !== "All Banks") baseParams.append("bank", bankFilter); 
    if (searchFilter) baseParams.append("search", searchFilter);
    if (startDate) baseParams.append("start_date", startDate);
    if (endDate) baseParams.append("end_date", endDate);
    const cacheKey = baseParams.toString(); const now = Date.now();
    if (dashboardFetchCache[cacheKey] && (now - dashboardFetchCache[cacheKey].timestamp < CACHE_TTL)) {
       const cached = dashboardFetchCache[cacheKey].data; setTransactionsData(cached.summary); setMonthlyTrend(cached.monthly_trend); setTopDebits(cached.top_debits); setTopCredits(cached.top_credits); setRecentDebit(cached.recent_debit); setRecentCredit(cached.recent_credit); setBanks(cached.banks); setRecordStats(cached.records); setLoading(false); return;
    }
    setLoading(true);
    try {
      const [banksRes, insightsRes, debitRes, creditRes] = await Promise.all([
        fetch(`${API_BASE_URL}/transactions/banks-summary`, { headers: { Authorization: `Bearer ${token}` } }), fetch(`${API_BASE_URL}/insights?${baseParams.toString()}`, { headers: { Authorization: `Bearer ${token}` } }), fetch(`${API_BASE_URL}/transactions?limit=15&type=debit&${baseParams.toString()}`, { headers: { Authorization: `Bearer ${token}` } }), fetch(`${API_BASE_URL}/transactions?limit=15&type=credit&${baseParams.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [banksJson, insightsJson, debitsJson, creditsJson] = await Promise.all([banksRes.json(), insightsRes.json(), debitRes.json(), creditRes.json()]);
      const finalData = {
        summary: { total_debit: insightsJson.summary?.expense || 0, total_credit: insightsJson.summary?.income || 0, count: insightsJson.summary?.total_transactions || 0 }, monthly_trend: insightsJson.monthly_data || [],
        top_debits: insightsJson.top_debits || [], top_credits: insightsJson.top_credits || [], recent_debit: debitsJson.data || [], recent_credit: creditsJson.data || [], records: insightsJson.records || null, banks: banksJson.data || []
      };
      setTransactionsData(finalData.summary); setMonthlyTrend(finalData.monthly_trend); setTopDebits(finalData.top_debits); setTopCredits(finalData.top_credits); setRecentDebit(finalData.recent_debit); setRecentCredit(finalData.recent_credit); setRecordStats(finalData.records); setBanks(finalData.banks);
      dashboardFetchCache[cacheKey] = { data: finalData, timestamp: now };
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [bankFilter, searchFilter, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalBalance = useMemo(() => {
    if (bankFilter === "All Banks") return banks.reduce((acc, curr) => acc + (curr.current_balance || 0), 0);
    const found = banks.find(b => b.bank_name === bankFilter); return found ? (found.current_balance || 0) : 0;
  }, [banks, bankFilter]);

  const walletBalance = useMemo(() => {
    const found = banks.find(b => b.bank_name.toLowerCase().includes("wallet")); return found ? (found.current_balance || 0) : 0;
  }, [banks]);

  return (
    <AdminPageLayout 
      title="Dashboard" 
      description="Financial records overview." 
      filters={[
        { key: "search", label: "Search", type: "input", value: searchFilter, onChange: setSearchFilter, placeholder: "Search..." }, 
        { key: "bank", label: "Account", type: "select", value: bankFilter, onChange: (v: string) => setBankFilter(v || "All Banks"), options: [{ label: "All Banks", value: "All Banks" }, ...banks.map(b => ({ label: b.bank_name, value: b.bank_name }))], placeholder: "Account" },
        { key: "start_date", label: "From", type: "date", value: startDate, onChange: setStartDate },
        { key: "end_date", label: "To", type: "date", value: endDate, onChange: setEndDate }
      ]} 
      onClearFilters={() => { setBankFilter("All Banks"); setSearchFilter(""); setStartDate(""); setEndDate(""); }}
    >
      <div className="flex flex-col gap-6 w-full pb-6">
         
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <StatCard title="Total Balance" value={formatCompact(totalBalance, currencySymbol)} icon={<Wallet className="w-4 h-4" />} colorType="primary" loading={loading} />
            <StatCard title="Total Income" value={formatCompact(transactionsData.total_credit, currencySymbol)} icon={<ArrowDownRight className="w-4 h-4" />} colorType="emerald" loading={loading} />
            <StatCard title="Total Expense" value={formatCompact(transactionsData.total_debit, currencySymbol)} icon={<ArrowUpRight className="w-4 h-4" />} colorType="destructive" loading={loading} />
            <StatCard title="TX Count" value={formatCompact(transactionsData.count, "")} icon={<Activity className="w-4 h-4" />} colorType="amber" loading={loading} />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
            <div className="group h-[480px]">
               <div className="h-full bg-gradient-to-br from-amber-600/20 via-card to-background border-2 border-amber-500/20 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-500 hover:border-amber-500/60 shadow-xl group-hover:shadow-amber-500/5">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-all duration-700"><Star className="w-48 h-48 -rotate-12" /></div>
                   <div className="w-16 h-16 bg-amber-500/10 border-2 border-amber-500/10 flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-500 mb-4"><Trophy className="w-8 h-8 text-amber-500 -rotate-12 group-hover:rotate-0 transition-transform duration-500" /></div>
                   <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600/60 dark:text-amber-600 leading-none mb-4">My primary source of income</h2>
                   <div className="flex flex-col items-center gap-1 mb-4"><span className="text-3xl font-black tracking-tighter text-foreground underline decoration-amber-500/40 decoration-2 underline-offset-4">{recordStats?.top_income_source?.source || "N/A"}</span></div>
                   <div className="flex flex-col items-center"><span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2 text-foreground/40">Total Confirmed</span><div className="text-5xl font-black text-amber-600 dark:text-amber-500 tabular-nums tracking-tighter drop-shadow-md">{currencySymbol}{recordStats?.top_income_source?.amount?.toLocaleString()}</div></div>
                   <div className="absolute bottom-4 left-0 right-0"><div className="flex items-center justify-center gap-2 px-4"><div className="w-1 h-1 bg-amber-500 rounded-full animate-ping" /><p className="text-[8px] font-black text-amber-600/40 dark:text-amber-600 uppercase tracking-widest leading-none">Module Verified</p></div></div>
               </div>
            </div>
            <LeaderboardWidget title="Spent Power Rankings" data={topDebits} currencySymbol={currencySymbol} loading={loading} type="debit" />
            <LeaderboardWidget title="Received Power Rankings" data={topCredits} currencySymbol={currencySymbol} loading={loading} type="credit" />
         </div>

         <HorizontalBountyBoard items={recordStats?.top_budget_items} currencySymbol={currencySymbol} loading={loading} />

         {/* FULL WIDTH CHART 1: Budget Comparison */}
         <div className="w-full">
            <BudgetComparisonGraph budgetData={recordStats?.budget_trend} currencySymbol={currencySymbol} loading={loading} />
         </div>

         {/* HALF WIDTH CHARTS ROW */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
            <SpendingPulseGraph trendData={monthlyTrend} totalSpend={transactionsData.total_debit} currencySymbol={currencySymbol} loading={loading} />
            <IncomeTrendGraph trendData={monthlyTrend} totalIncome={transactionsData.total_credit} currencySymbol={currencySymbol} loading={loading} />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 w-full">
            <div className="lg:col-span-2 min-h-[460px] h-[460px]"><RecentTransactionsList title="Recent Spent" subtitle="Latest 15 Debits" transactions={recentDebit} currencySymbol={currencySymbol} loading={loading} colorScheme="destructive" /></div>
            <div className="lg:col-span-2 min-h-[460px] h-[460px]"><RecentTransactionsList title="Recent Credited" subtitle="Latest 15 Credits" transactions={recentCredit} currencySymbol={currencySymbol} loading={loading} colorScheme="emerald" /></div>
            <div className="lg:col-span-2 flex flex-col gap-2 h-[460px]">
                <div className="flex flex-col gap-3 h-full overflow-y-auto custom-scrollbar">
                    <WalletCard balance={walletBalance} currencySymbol={currencySymbol} loading={loading} />
                    <div className="grid grid-cols-2 gap-2">
                        <MiniMilestoneCard title="Largest Payment" value={formatCompact(recordStats?.highest_payment?.amount || 0, currencySymbol)} subtitle={recordStats?.highest_payment?.name} icon={<Zap className="w-4 h-4 text-destructive" />} colorClass="border-destructive/40" loading={loading} />
                        <MiniMilestoneCard title="Largest Income" value={formatCompact(recordStats?.highest_income?.amount || 0, currencySymbol)} subtitle={recordStats?.highest_income?.name} icon={<Sparkles className="w-4 h-4 text-emerald-500" />} colorClass="border-emerald-500/40" loading={loading} />
                        <MiniMilestoneCard title="Common Amount" value={formatCompact(recordStats?.frequent_amount?.amount || 0, currencySymbol)} subtitle={`Used ${recordStats?.frequent_amount?.count}x`} icon={<Repeat className="w-4 h-4 text-amber-500" />} colorClass="border-amber-500/40" loading={loading} />
                        <MiniMilestoneCard title="Top Entity" value={recordStats?.frequent_spender?.name} subtitle={`${recordStats?.frequent_spender?.count} TXNS`} icon={<Target className="w-4 h-4 text-indigo-500" />} colorClass="border-indigo-500/40" loading={loading} />
                    </div>
                </div>
            </div>
         </div>

      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary), 0.1); border-radius: 0px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--muted-foreground); }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 3s infinite linear; }
      `}</style>
    </AdminPageLayout>
  );
}
