"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import getSymbolFromCurrency from "currency-symbol-map";
import {
  Wallet, Activity, ArrowDownRight, ArrowUpRight, ArrowUp, ArrowDown,
  Trophy, TrendingDown, TrendingUp, Medal, Zap, Repeat, Target,
  Sparkles, Star, Skull, Crosshair, Building2, Gem, HandCoins,
  CreditCard, AlertCircle, CheckCircle2, Clock, MoveRight,
  PiggyBank, RefreshCw, Gauge, BarChart3, Flame, BellRing,
  Home, ArrowDownLeft,
} from "lucide-react";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";
import { StatCard } from "@/components/ui/StatCard";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { SpendingPulseGraph } from "@/components/dashboard/SpendingPulseGraph";
import { IncomeTrendGraph } from "@/components/dashboard/IncomeTrendGraph";
import { BudgetComparisonGraph } from "@/components/dashboard/BudgetComparisonGraph";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const dashboardFetchCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 0; // always fetch fresh — set to 30000 to re-enable caching

const fmt = (n: number, sym: string) => {
  if (n === 0) return `${sym}0`;
  const f = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(Math.abs(n));
  return `${n < 0 ? "-" : ""}${sym}${f}`;
};

// ─── Metal colours / emoji ─────────────────────────────────────────────────────
const METAL_BG: Record<string, string> = {
  XAU: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
  XAG: "bg-slate-400/10 border-slate-400/20 text-slate-400",
  XPT: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  XPD: "bg-blue-500/10 border-blue-500/20 text-blue-400",
};
const METAL_ICON: Record<string, string> = { XAU: "🥇", XAG: "🥈", XPT: "💿", XPD: "💠" };

// ─── Section header helper ─────────────────────────────────────────────────────
function SectionLabel({ icon, label, color = "text-muted-foreground" }: { icon: React.ReactNode; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className={color}>{icon}</span>
      <span className={cn("text-[9px] font-black uppercase tracking-[0.25em]", color)}>{label}</span>
      <div className="flex-1 h-px bg-border/30" />
    </div>
  );
}

// ─── Metals Widget ─────────────────────────────────────────────────────────────
const METAL_CONFIG: Record<string, {
  label: string; icon: string; emoji: string;
  bg: string; border: string; shine: string; text: string; sub: string;
}> = {
  gold: { label: "Gold", icon: "🪙", emoji: "🥇", bg: "from-yellow-950 via-yellow-900 to-amber-900", border: "border-yellow-600/40", shine: "from-yellow-400/30 via-transparent to-transparent", text: "text-yellow-300", sub: "text-yellow-500/70" },
  silver: { label: "Silver", icon: "🥈", emoji: "🥈", bg: "from-slate-800 via-slate-700 to-zinc-800", border: "border-slate-400/30", shine: "from-slate-300/25 via-transparent to-transparent", text: "text-slate-200", sub: "text-slate-400/70" },
  platinum: { label: "Platinum", icon: "💿", emoji: "💎", bg: "from-indigo-950 via-slate-800 to-indigo-900", border: "border-indigo-400/30", shine: "from-indigo-300/20 via-transparent to-transparent", text: "text-indigo-200", sub: "text-indigo-400/70" },
  diamond: { label: "Diamond", icon: "💎", emoji: "💠", bg: "from-cyan-950 via-sky-900 to-blue-900", border: "border-cyan-400/30", shine: "from-cyan-300/25 via-transparent to-transparent", text: "text-cyan-200", sub: "text-cyan-400/70" },
  palladium: { label: "Palladium", icon: "🔘", emoji: "⚪", bg: "from-neutral-800 via-zinc-700 to-neutral-900", border: "border-neutral-400/30", shine: "from-neutral-300/20 via-transparent to-transparent", text: "text-neutral-200", sub: "text-neutral-400/70" },
};

// Partial match: "Gold 22K", "GOLD", "gold916" → all match "gold"
// If type is generic (e.g. "Metal"), check the name too.
function getMetalCfg(type: string, name: string) {
  const t = (type || "").toLowerCase();
  const n = (name || "").toLowerCase();

  const match = Object.keys(METAL_CONFIG).find(k => t.includes(k) || n.includes(k));
  if (match) {
    const cfg = { ...METAL_CONFIG[match] };
    // Use actual metal name from data as the display label, fallback to generic
    cfg.label = name && name.trim() ? name : (type || cfg.label);
    return cfg;
  }
  // Unknown metal — use amber theme with actual name
  const fallbackLabel = name || type || "Metal";
  return {
    label: fallbackLabel,
    icon: "💰",
    emoji: "💰",
    bg: "from-amber-950 via-amber-900 to-orange-900",
    border: "border-amber-500/30",
    shine: "from-amber-300/20 via-transparent to-transparent",
    text: "text-amber-200",
    sub: "text-amber-400/70",
  };
}

function IndividualMetalCard({ g, sym, busy }: { g: any; sym: string; busy?: boolean }) {
  const cfg = getMetalCfg(g.type, g.name);
  const gain = g.curr - g.inv;
  const pct = g.inv > 0 ? ((gain / g.inv) * 100).toFixed(1) : "0.0";
  const isGain = gain >= 0;

  if (busy) {
    return (
      <div className="h-32 border border-border bg-muted/20 animate-pulse rounded-xl" />
    );
  }

  return (
    <div className={cn(
      "relative h-32 overflow-hidden border flex flex-col justify-between p-4 group transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl cursor-default rounded-xl shadow-sm",
      `bg-gradient-to-br ${cfg.bg}`, cfg.border
    )}>
      {/* Dynamic Shine Effect */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none", cfg.shine)} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        <div className="absolute -inset-x-full top-0 bottom-0 w-[200%] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s] ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Background Icon Decoration */}
      <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:opacity-25 transition-all duration-700 rotate-12 group-hover:rotate-0 scale-110 pointer-events-none">
        <Gem className="w-24 h-24" />
      </div>

      <div className="relative z-10 flex justify-between items-start">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("w-7 h-7 flex items-center justify-center border text-base bg-black/40 backdrop-blur-md rounded-lg", cfg.border)}>
              {cfg.icon}
            </div>
            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", cfg.text)}>{cfg.label}</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className={cn("text-2xl font-black tabular-nums tracking-tighter leading-none", cfg.text)}>
              {sym}{Math.round(g.curr).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={cn("text-[10px] font-black tabular-nums flex items-center justify-end gap-0.5 px-2 py-0.5 rounded-full", isGain ? "bg-emerald-500/20 text-emerald-400" : "bg-red-400/20 text-red-400")}>
            {isGain ? "▲" : "▼"} {Math.abs(Number(pct))}%
          </span>
          <p className={cn("text-[10px] font-bold mt-2", cfg.sub)}>
            {g.grams >= 1000 ? `${(g.grams / 1000).toFixed(2)}kg` : `${g.grams.toFixed(1)}g`}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <div className="w-full bg-black/20 h-[3px] overflow-hidden rounded-full">
          <div className={cn("h-full transition-all duration-1000 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]", isGain ? "bg-emerald-500" : "bg-red-500")} style={{ width: isGain ? "100%" : "30%" }} />
        </div>
      </div>
    </div>
  );
}

function TotalMetalCard({ totalVal, totalGain, sym, busy }: { totalVal: number; totalGain: number; sym: string; busy: boolean }) {
  const isGain = totalGain >= 0;

  if (busy) {
    return <div className="h-32 border border-border bg-muted/20 animate-pulse rounded-xl" />;
  }

  return (
    <div className={cn(
      "relative h-32 overflow-hidden border flex flex-col justify-between p-4 bg-zinc-950 border-white/10 group rounded-xl shadow-lg",
      "hover:border-yellow-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl cursor-default"
    )}>
      {/* Luxury Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.15),transparent_60%)] pointer-events-none rounded-xl" />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,#09090b_0%,#18181b_100%)] pointer-events-none rounded-xl" />

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-yellow-500/20 group-hover:border-yellow-500/50 transition-colors pointer-events-none rounded-tl-xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-yellow-500 text-black rounded-sm shadow-lg shadow-yellow-500/20">
            <Gem className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/80">Net Worth: Metals</span>
        </div>
        <p className="text-3xl font-black tabular-nums tracking-tighter text-white group-hover:text-yellow-500 transition-colors">
          {sym}{Math.round(totalVal).toLocaleString()}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between mt-auto">
        <div className="min-w-0">
          <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40 mb-0.5">Overall Performance</p>
          <p className={cn("text-sm font-black tabular-nums flex items-center gap-1", isGain ? "text-emerald-500" : "text-destructive")}>
            {isGain ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isGain ? "+" : "-"}{sym}{Math.round(Math.abs(totalGain)).toLocaleString()}
          </p>
        </div>
        <div className={cn(
          "px-3 py-1 text-[9px] font-black border transition-all duration-500 rounded-md shadow-inner",
          isGain
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black"
            : "bg-destructive/10 border-destructive/20 text-destructive group-hover:bg-destructive group-hover:text-white"
        )}>
          {isGain ? "BULLISH" : "BEARISH"}
        </div>
      </div>
    </div>
  );
}

function MetalsWidget({ sym }: { sym: string }) {
  const [groups, setGroups] = useState<any[]>([]);
  const [totalVal, setTotalVal] = useState(0);
  const [totalGain, setTotalGain] = useState(0);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const tok = localStorage.getItem("token"); if (!tok) return;
    (async () => {
      try {
        const [pR, lR] = await Promise.all([
          fetch(`${API_BASE_URL}/metals/portfolio`, { headers: { Authorization: `Bearer ${tok}` } }),
          fetch(`${API_BASE_URL}/metals/live-prices?currency=INR`, { headers: { Authorization: `Bearer ${tok}` } }),
        ]);
        const { items = [] } = await pR.json();
        const livePrices = await lR.json();
        const prices: Record<string, number> = {};
        for (const k of Object.keys(livePrices)) prices[k] = livePrices[k]?.price_per_gram || 0;
        const map: Record<string, any> = {};
        for (const m of items) {
          const t = m.metal_type;
          if (!map[t]) map[t] = { type: t, name: m.metal_name || t, grams: 0, curr: 0, inv: 0 };
          map[t].grams += m.quantity;
          map[t].inv += m.quantity * m.purchase_price;
          map[t].curr += m.quantity * (prices[t] || m.purchase_price);
        }

        // Sort by current value descending
        const g = Object.values(map).sort((a: any, b: any) => b.curr - a.curr);
        setGroups(g);
        setTotalVal(g.reduce((s, x) => s + x.curr, 0));
        setTotalGain(g.reduce((s, x) => s + (x.curr - x.inv), 0));
      } catch { }
      setBusy(false);
    })();
  }, []);

  // Prepare standard assets if data is missing (for UI consistency as requested)
  const displayGroups = [...groups];
  if (!busy && displayGroups.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
        <TotalMetalCard totalVal={0} totalGain={0} sym={sym} busy={false} />
        <div className="col-span-2 flex items-center justify-center border border-dashed border-border/40 opacity-30">
          <p className="text-[9px] font-black uppercase tracking-widest">No metal assets trackable</p>
        </div>
      </div>
    );
  }

  // We want to show exactly 3 cards optimally. 
  // 1. Summary
  // 2. Gold (top)
  // 3. Silver (secondary) or next metal

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 w-full">
      <TotalMetalCard totalVal={totalVal} totalGain={totalGain} sym={sym} busy={busy} />
      {displayGroups.slice(0, 2).map(g => (
        <IndividualMetalCard key={g.type} g={g} sym={sym} busy={busy} />
      ))}
      {/* If only 1 metal, add a subtle placeholder or invite to add more */}
      {!busy && displayGroups.length === 1 && (
        <div className="h-32 border border-dashed border-border/20 flex flex-col items-center justify-center opacity-20 hover:opacity-40 transition-opacity cursor-pointer">
          <Gem className="w-6 h-6 mb-1" />
          <p className="text-[8px] font-black uppercase tracking-widest">Add more assets</p>
        </div>
      )}
    </div>
  );
}

// ─── Property Widget ───────────────────────────────────────────────────────────

function PropertyWidget({ sym }: { sym: string }) {
  const [props, setProps] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const tok = localStorage.getItem("token"); if (!tok) return;
    fetch(`${API_BASE_URL}/properties/`, { headers: { Authorization: `Bearer ${tok}` } })
      .then(r => r.json()).then(j => { setProps(j.items || []); setBusy(false); })
      .catch(() => setBusy(false));
  }, []);

  const sorted = [...props].sort((a, b) => (b.current_value || b.purchase_price) - (a.current_value || a.purchase_price));
  const topProp = sorted[0];

  return (
    <div className="bg-card border border-border flex flex-col overflow-hidden group rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0 bg-muted/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center rounded-lg text-emerald-500">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Properties</span>
        </div>
        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{props.length} Assets</span>
      </div>

      {busy ? (
        <div className="flex-1 bg-muted/20 animate-pulse" />
      ) : !topProp ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 opacity-30">
          <Building2 className="w-12 h-12 mb-3 text-muted-foreground/30" />
          <p className="text-[10px] font-black uppercase tracking-widest text-center">No properties<br />tracked in portfolio</p>
        </div>
      ) : (
        <div className="flex flex-col flex-1">
          {/* Top Property Hero */}
          <div className="relative aspect-[16/10] overflow-hidden">
            {topProp.image_url ? (
              <img src={topProp.image_url} alt={topProp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s] ease-out" />
            ) : (
              <div className="w-full h-full bg-emerald-500/5 flex items-center justify-center">
                <Building2 className="w-16 h-16 text-emerald-500/10" />
              </div>
            )}

            <div className="absolute top-3 left-3 flex flex-col gap-1 items-start z-10">
              <div className="px-2.5 py-1 bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest shadow-xl rounded-md">
                Prime Asset
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end justify-between p-5 gap-4">
              <div className="min-w-0">
                <h4 className="text-xl font-black text-white truncate leading-tight group-hover:text-emerald-400 transition-colors">{topProp.title || topProp.name}</h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <p className="text-[10px] font-bold text-emerald-400/90 uppercase tracking-widest">{topProp.type}</p>
                  <div className="w-1 h-1 rounded-full bg-white/30" />
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Highest Valuation</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-black tabular-nums text-white leading-none">
                  {sym}{Math.round(topProp.current_value || topProp.purchase_price).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Secondary Assets */}
          {sorted.length > 1 && (
            <div className="p-4 flex flex-col gap-3 mt-auto">
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                <span>Other Assets</span>
                <div className="flex-1 h-px bg-border/20 mx-3" />
              </div>
              <div className="flex flex-col gap-2.5">
                {sorted.slice(1, 3).map(p => (
                  <div key={p._id} className="flex items-center justify-between gap-3 group/item">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-muted/30 rounded-lg flex items-center justify-center border border-border/20 group-hover/item:border-emerald-500/30 transition-colors">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground/30 group-hover/item:text-emerald-500/60" />
                      </div>
                      <p className="text-[11px] font-black truncate text-muted-foreground group-hover/item:text-foreground transition-colors">{p.title || p.name}</p>
                    </div>
                    <span className="text-[11px] font-black tabular-nums text-foreground">{sym}{Math.round(p.current_value || p.purchase_price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Lend & Borrow Widget ──────────────────────────────────────────────────────
function LendBorrowWidget({ sym }: { sym: string }) {
  const [summary, setSummary] = useState<any>(null);
  const [lent, setLent] = useState<any[]>([]);
  const [bor, setBor] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const tok = localStorage.getItem("token"); if (!tok) return;
    (async () => {
      try {
        const [sR, lR, bR] = await Promise.all([
          fetch(`${API_BASE_URL}/lend-borrow/summary`, { headers: { Authorization: `Bearer ${tok}` } }),
          fetch(`${API_BASE_URL}/lend-borrow/list?direction=lent&is_settled=false`, { headers: { Authorization: `Bearer ${tok}` } }),
          fetch(`${API_BASE_URL}/lend-borrow/list?direction=borrowed&is_settled=false`, { headers: { Authorization: `Bearer ${tok}` } }),
        ]);
        const sj = await sR.json(); setSummary(sj);
        const lj = await lR.json(); setLent((lj.items || []).sort((a: any, b: any) => b.amount - a.amount));
        const bj = await bR.json(); setBor((bj.items || []).sort((a: any, b: any) => b.amount - a.amount));
      } catch { }
      setBusy(false);
    })();
  }, []);

  const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  const maxLent = lent[0];
  const maxBor = bor[0];

  return (
    <div className="bg-card border border-border flex flex-col overflow-hidden group h-full rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
      {/* ── High-Impact Split Header ── */}
      <div className="grid grid-cols-2 divide-x divide-border/20 border-b border-border/40">
        <div className="p-5 bg-emerald-500/[0.03]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Receivables</span>
          </div>
          <p className="text-2xl font-black tabular-nums transition-transform group-hover:translate-x-1 duration-500">
            {sym}{Math.round(summary?.pending_lent || 0).toLocaleString()}
          </p>
        </div>
        <div className="p-5 bg-red-500/[0.03]">
          <div className="flex items-center gap-2 mb-2 justify-end">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest text-right">Payables</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black tabular-nums text-right transition-transform group-hover:-translate-x-1 duration-500 text-red-500">
            {sym}{Math.round(summary?.pending_borrowed || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {busy ? (
        <div className="flex-1 bg-muted/20 animate-pulse" />
      ) : (
        <div className="flex flex-col flex-1 divide-y divide-border/10">
          {/* HERO: Top Person Who Owes Me */}
          {maxLent && (
            <div className="p-5 flex items-center justify-between hover:bg-emerald-500/[0.05] transition-colors group/item">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-xl shadow-inner">
                  {maxLent.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-1">Top Debtor</p>
                  <h4 className="text-sm font-black tracking-tight truncate max-w-[140px]">{maxLent.name}</h4>
                  <p className="text-[9px] font-bold text-muted-foreground/40 mt-1">{daysSince(maxLent.date)}d since loan</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-emerald-500 tabular-nums leading-none">
                  {sym}{Math.round(maxLent.amount).toLocaleString()}
                </p>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mt-3">
                  <Clock className="w-3 h-3 text-emerald-500" />
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                </div>
              </div>
            </div>
          )}

          {/* HERO: Top Person I Owe */}
          {maxBor && (
            <div className="p-5 flex items-center justify-between hover:bg-red-500/[0.05] transition-colors group/item">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl border border-red-500/20 bg-red-500/10 flex items-center justify-center text-red-500 font-black text-xl shadow-inner">
                  {maxBor.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[9px] font-black text-red-500/60 uppercase tracking-[0.2em] mb-1">Major Liability</p>
                  <h4 className="text-sm font-black tracking-tight truncate max-w-[140px]">{maxBor.name}</h4>
                  <p className="text-[9px] font-bold text-muted-foreground/40 mt-1">{daysSince(maxBor.date)}d overdue</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-red-500 tabular-nums leading-none">
                  {sym}{Math.round(maxBor.amount).toLocaleString()}
                </p>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full mt-3">
                  <AlertCircle className="w-3 h-3 text-red-500" />
                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Urgent</span>
                </div>
              </div>
            </div>
          )}

          {lent.length === 0 && bor.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 opacity-20">
              <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500" />
              <p className="text-[11px] font-black uppercase tracking-widest">All Accounts Clear</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── EMI Widget ────────────────────────────────────────────────────────────────
function EMIWidget({ sym }: { sym: string }) {
  const [emis, setEmis] = useState<any[]>([]);
  const [total, setTotal] = useState({ monthly: 0, outstanding: 0, count: 0 });
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const tok = localStorage.getItem("token"); if (!tok) return;
    fetch(`${API_BASE_URL}/emi/`, { headers: { Authorization: `Bearer ${tok}` } })
      .then(r => r.json()).then(j => {
        const active = (j.items || []).filter((e: any) => e.is_active && e.months_remaining > 0)
          .sort((a: any, b: any) => (a.days_until_payment ?? 999) - (b.days_until_payment ?? 999));
        setEmis(active);
        setTotal({ monthly: j.total_monthly_burden || 0, outstanding: j.total_outstanding || 0, count: j.active_count || 0 });
        setBusy(false);
      }).catch(() => setBusy(false));
  }, []);

  const urgent = emis.filter(e => (e.days_until_payment ?? 999) <= 7);

  return (
    <div className="bg-card border border-border flex flex-col overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0 bg-muted/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center rounded-lg text-blue-500">
            <CreditCard className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Loans & EMIs</span>
        </div>
        <div className="flex items-center gap-2">
          {urgent.length > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-black text-red-500 animate-pulse bg-red-500/10 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3.5 h-3.5" />{urgent.length} due
            </span>
          )}
          <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{total.count} active</span>
        </div>
      </div>

      {busy ? (
        <div className="flex-1 bg-muted/20 animate-pulse" />
      ) : (
        <div className="flex flex-col flex-1 divide-y divide-border/10">
          {/* Summary pills */}
          <div className="grid grid-cols-2 divide-x divide-border/10 shrink-0">
            <div className="px-5 py-4 bg-blue-500/[0.02]">
              <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">Per Month</p>
              <p className="text-xl font-black tabular-nums">{sym}{Math.round(total.monthly).toLocaleString()}</p>
            </div>
            <div className="px-5 py-4 bg-red-500/[0.02]">
              <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-1">Still Left</p>
              <p className="text-xl font-black text-red-500 tabular-nums">{sym}{Math.round(total.outstanding).toLocaleString()}</p>
            </div>
          </div>

          {/* EMI List */}
          <div className="flex flex-col flex-1 divide-y divide-border/10">
            {emis.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 opacity-20">
                <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500" />
                <p className="text-[11px] font-black uppercase tracking-widest">No active loans</p>
              </div>
            ) : emis.map(e => {
              const isUrgent = (e.days_until_payment ?? 999) <= 7;
              return (
                <div key={e._id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/10 transition-colors group">
                  <div className={cn("w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border transition-transform group-hover:scale-110",
                    isUrgent ? "border-red-500/20 bg-red-500/10 text-red-500" : "border-blue-500/20 bg-blue-500/10 text-blue-500")}>
                    {isUrgent ? <AlertCircle className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[12px] font-black truncate">{e.name}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className={cn("text-[9px] font-black shrink-0 px-1.5 py-0.5 rounded-full", isUrgent ? "bg-red-500 text-white" : "bg-blue-500/10 text-blue-500")}>
                        {e.days_until_payment != null ? `${e.days_until_payment}d left` : "—"}
                      </p>
                      <div className="flex-1 bg-muted/40 h-1.5 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-1000", isUrgent ? "bg-red-500" : "bg-blue-500")} style={{ width: `${Math.min(100, e.progress_pct || 0)}%` }} />
                      </div>
                      <p className="text-[9px] text-muted-foreground/40 font-bold">{e.months_remaining}mo</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black tabular-nums">{sym}{Math.round(e.monthly_emi).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}



// ─── Bank Breakdown Widget ─────────────────────────────────────────────────────
const PIE_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#f97316", "#6366f1"];

function BankBreakdownWidget({ banks, sym, loading }: { banks: any[]; sym: string; loading: boolean }) {
  if (loading) return <div className="bg-card border border-border h-full animate-pulse" />;
  const valid = banks.filter(b => b.current_balance > 0).sort((a, b) => b.current_balance - a.current_balance);
  const total = valid.reduce((s, b) => s + b.current_balance, 0);
  const pieData = valid.map((b, i) => ({ name: b.bank_name, value: b.current_balance, color: PIE_COLORS[i % PIE_COLORS.length] }));

  return (
    <div className="bg-card border border-border flex flex-col overflow-hidden h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 shrink-0">
        <BarChart3 className="w-4 h-4 text-blue-500" />
        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Account Balance Breakdown</span>
      </div>
      {valid.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 opacity-20">
          <BarChart3 className="w-8 h-8 mb-2" />
          <p className="text-[9px] font-black uppercase tracking-widest">No accounts</p>
        </div>
      ) : (
        <div className="flex flex-col items-center flex-1 px-3 py-2">
          {/* Donut chart */}
          <div className="relative w-full" style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={56} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-sm font-black tabular-nums">{sym}{Math.round(total).toLocaleString()}</p>
              <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40">Total Balance</p>
            </div>
          </div>
          {/* Bank list */}
          <div className="flex flex-col gap-1.5 w-full mt-1">
            {valid.map((b, i) => (
              <div key={b.bank_name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <p className="text-[9px] font-bold truncate text-muted-foreground">{b.bank_name}</p>
                </div>
                <p className="text-[9px] font-black tabular-nums shrink-0">{sym}{Math.round(b.current_balance).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Spending Insights Banner ──────────────────────────────────────────────────
function SpendingInsightsBanner({ txData, monthlyTrend, sym, loading }: { txData: { total_debit: number; total_credit: number; count: number }; monthlyTrend: any[]; sym: string; loading: boolean }) {
  if (loading) return <div className="h-16 bg-muted/20 animate-pulse border border-border rounded-xl" />;
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dailyAvg = dayOfMonth > 0 ? txData.total_debit / dayOfMonth : 0;
  const monthlyRunRate = dailyAvg * daysInMonth;
  const lastMonth = monthlyTrend[monthlyTrend.length - 2];
  const thisMonth = monthlyTrend[monthlyTrend.length - 1];
  const spendDelta = thisMonth && lastMonth ? ((thisMonth.amount - lastMonth.amount) / (lastMonth.amount || 1)) * 100 : 0;
  const incomeVsSpend = txData.total_credit > 0 ? ((txData.total_credit - txData.total_debit) / txData.total_credit) * 100 : 0;
  
  const stats = [
    { label: "Daily Avg Spend", value: fmt(dailyAvg, sym), sub: `Est. ${fmt(monthlyRunRate, sym)}/mo`, color: "text-orange-500", icon: <Flame className="w-4 h-4" />, bg: "bg-orange-500/10" },
    { label: "vs Last Month", value: `${spendDelta >= 0 ? "+" : ""}${spendDelta.toFixed(1)}%`, sub: lastMonth ? "Previous period" : "Initial data", color: spendDelta > 10 ? "text-red-500" : spendDelta < 0 ? "text-emerald-500" : "text-amber-500", icon: spendDelta > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />, bg: spendDelta > 0 ? "bg-red-500/10" : "bg-emerald-500/10" },
    { label: "Savings Rate", value: `${Math.max(0, incomeVsSpend).toFixed(1)}%`, sub: "Net efficiency", color: incomeVsSpend >= 20 ? "text-emerald-500" : incomeVsSpend > 0 ? "text-amber-500" : "text-red-500", icon: <Gauge className="w-4 h-4" />, bg: incomeVsSpend >= 20 ? "bg-emerald-500/10" : "bg-amber-500/10" },
    { label: "Txn Count", value: txData.count.toLocaleString(), sub: "Total activity", color: "text-blue-500", icon: <Activity className="w-4 h-4" />, bg: "bg-blue-500/10" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {stats.map(s => (
        <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 group hover:shadow-sm transition-all duration-300 overflow-hidden relative">
          <div className={cn("absolute inset-0 opacity-[0.02] pointer-events-none bg-gradient-to-br from-transparent to-current", s.bg)} />
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", s.bg, s.color)}>{s.icon}</div>
          <div className="min-w-0 flex-1">
            <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40 truncate">{s.label}</p>
            <p className={cn("text-sm font-black tabular-nums leading-tight truncate mt-0.5", s.color)}>{s.value}</p>
            <p className="text-[7px] text-muted-foreground/30 font-bold truncate">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Top Spenders / Income Bars ────────────────────────────────────────────────
function SpendBarWidget({ data, sym, loading, type }: { data: any[]; sym: string; loading: boolean; type: "debit" | "credit" }) {
  if (loading) return <div className="h-64 bg-muted/20 animate-pulse border border-border rounded-xl" />;
  if (!data || data.length === 0) return null;
  const top = data.slice(0, 8);
  const total = top.reduce((s, d) => s + d.amount, 0);
  const isDebit = type === "debit";
  const GRADIENTS = isDebit
    ? ["from-red-600 to-red-400", "from-orange-600 to-orange-400", "from-amber-600 to-amber-400", "from-pink-600 to-pink-400", "from-rose-600 to-rose-400", "from-violet-600 to-violet-400", "from-purple-600 to-purple-400", "from-fuchsia-600 to-fuchsia-400"]
    : ["from-emerald-600 to-emerald-400", "from-teal-600 to-teal-400", "from-green-600 to-green-400", "from-cyan-600 to-cyan-400", "from-sky-600 to-sky-400", "from-lime-600 to-lime-400", "from-emerald-700 to-emerald-300", "from-green-700 to-green-300"];
  return (
    <div className="bg-card border border-border flex flex-col overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 shrink-0 bg-muted/5">
        <div className={cn("w-7 h-7 flex items-center justify-center rounded-lg border", isDebit ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500")}>
          {isDebit ? <Flame className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </div>
        <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isDebit ? "text-red-500" : "text-emerald-500")}>
          {isDebit ? "Top Spend Payees" : "Top Income Sources"}
        </span>
        <span className="ml-auto text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">{top.length} Items</span>
      </div>
      <div className="p-4 flex flex-col gap-4">
        {top.map((item, i) => (
          <div key={item._id} className="flex flex-col gap-1.5 group/bar">
            <div className="flex items-center justify-between gap-3">
               <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[8px] font-black text-muted-foreground/30 w-4 shrink-0">#{i + 1}</span>
                  <p className="text-[10px] font-black truncate text-foreground group-hover/bar:text-primary transition-colors">{item._id || "Other"}</p>
               </div>
               <p className={cn("text-[11px] font-black tabular-nums shrink-0", isDebit ? "text-red-500" : "text-emerald-500")}>
                 {sym}{item.amount >= 1000 ? new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(item.amount) : item.amount.toLocaleString()}
               </p>
            </div>
            <div className="w-full bg-muted/20 h-2 rounded-full overflow-hidden relative">
              <div className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-1000 ease-out shadow-sm", GRADIENTS[i % GRADIENTS.length])}
                style={{ width: `${total > 0 ? (item.amount / total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mini stat card ────────────────────────────────────────────────────────────
function MiniCard({ title, value, sub, icon, border, loading }: { title: string; value: string; sub?: string; icon: React.ReactNode; border: string; loading: boolean }) {
  if (loading) return <div className="h-16 bg-muted/40 animate-pulse border border-border/40 rounded-xl" />;
  return (
    <div className={cn("px-4 py-4 rounded-xl bg-card border border-border flex items-center justify-between gap-3 group hover:shadow-md transition-all duration-300 w-full overflow-hidden relative", border)}>
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-gradient-to-br from-transparent to-current" />
      <div className="flex flex-col min-w-0 flex-1 relative z-10">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 truncate">{title}</p>
        <p className="text-[13px] font-black break-all leading-tight mt-1 text-foreground">{value}</p>
        {sub && <p className="text-[8px] font-bold text-muted-foreground/40 uppercase break-words mt-1 truncate">{sub}</p>}
      </div>
      <div className="opacity-20 group-hover:opacity-100 transition-opacity shrink-0 flex-none bg-muted/10 p-2 rounded-lg relative z-10">{icon}</div>
    </div>
  );
}

// ─── Leaderboard ───────────────────────────────────────────────────────────────
function LeaderboardWidget({ data, sym, loading, title, type }: { data: any[]; sym: string; loading: boolean; title: string; type: "debit" | "credit" }) {
  const total = data.reduce((s, x) => s + (x.amount || 0), 0);
  if (loading) return <div className="bg-card border border-border h-[400px] animate-pulse rounded-xl" />;
  const isDebit = type === "debit";

  return (
    <div className="bg-card border border-border flex flex-col overflow-hidden h-[400px] rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-muted/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border",
            isDebit ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500")}>
            {isDebit ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground leading-none">{title}</h3>
            <p className="text-[8px] font-bold text-muted-foreground/40 uppercase mt-1">Ranking by total volume</p>
          </div>
        </div>
        <Trophy className="w-4 h-4 text-amber-500" />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-border/5">
        {data.length === 0 ? (
          <div className="py-20 flex flex-col items-center opacity-20">
             <Trophy className="w-12 h-12 mb-2" />
             <p className="text-[10px] font-black uppercase tracking-widest">No data available</p>
          </div>
        ) : data.map((item, i) => {
          const isTop = i < 3;
          const mc = ["text-amber-500", "text-slate-400", "text-orange-600"];
          return (
            <div key={i} className={cn("flex items-center gap-4 px-5 py-3.5 transition-colors", isTop ? "bg-muted/10" : "hover:bg-muted/20")}>
              <div className="w-6 shrink-0 flex justify-center">
                {isTop ? <Medal className={cn("w-4 h-4", mc[i])} /> : <span className="text-[9px] font-black text-muted-foreground/30">#{i + 1}</span>}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-[11px] font-black leading-snug break-words text-foreground group-hover:text-primary transition-colors">{item._id || "—"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">{item.count} Transactions</span>
                  <div className="flex-1 h-[2px] bg-muted/20 rounded-full">
                     <div className={cn("h-full rounded-full opacity-40", isDebit ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${(item.amount / (data[0].amount || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={cn("text-[12px] font-black tabular-nums", isDebit ? "text-red-500" : "text-emerald-500")}>
                  {sym}{item.amount >= 1000 ? new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(item.amount) : item.amount.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border/30 bg-muted/5 flex justify-between items-center shrink-0">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Total Volume</span>
        <span className={cn("text-base font-black tabular-nums", isDebit ? "text-red-500" : "text-emerald-500")}>
          {sym}{new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(total)}
        </span>
      </div>
    </div>
  );
}

// ─── Recent list ───────────────────────────────────────────────────────────────
function RecentList({ txs, sym, loading, title, sub, color }: {
  txs: any[]; sym: string; loading: boolean; title: string; sub: string; color: "red" | "green";
}) {
  const isRed = color === "red";
  if (loading) return <div className="bg-card border border-border h-[320px] animate-pulse rounded-xl" />;
  return (
    <div className="bg-card border border-border flex flex-col overflow-hidden h-[320px] rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
      <div className="px-5 py-4 border-b border-border/40 bg-muted/5 shrink-0 flex items-center justify-between">
        <div>
          <h3 className={cn("text-[11px] font-black uppercase tracking-[0.15em]", isRed ? "text-red-500" : "text-emerald-500")}>{title}</h3>
          <p className="text-[8px] font-bold text-muted-foreground/40 uppercase mt-1 tracking-widest">{sub}</p>
        </div>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", isRed ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500")}>
           <Clock className="w-4 h-4" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-border/10">
        {txs.length === 0 ? (
          <div className="py-20 flex flex-col items-center opacity-20">
             <Activity className="w-10 h-10 mb-2" />
             <p className="text-[10px] font-black uppercase tracking-widest">No Recent Activity</p>
          </div>
        ) : txs.map((tx, i) => {
          const debit = (tx.debit || 0) > 0;
          return (
            <div key={tx._id || i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/10 transition-colors group/item">
              <div className={cn("w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border transition-transform group-hover/item:scale-110",
                debit ? "bg-red-500/5 border-red-500/10 text-red-500" : "bg-emerald-500/5 border-emerald-500/10 text-emerald-500")}>
                {debit ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-[12px] font-black leading-snug break-words text-foreground">{tx.description || tx.payee}</p>
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase mt-1 tracking-widest">{tx.date} · {tx.bank}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn("text-[13px] font-black tabular-nums", debit ? "text-red-500" : "text-emerald-500")}>
                  {sym}{(tx.debit || tx.credit).toLocaleString()}
                </p>
                <div className={cn("w-full h-1 mt-2 rounded-full", debit ? "bg-red-500/10" : "bg-emerald-500/10")}>
                   <div className={cn("h-full rounded-full opacity-40", debit ? "bg-red-500" : "bg-emerald-500")} style={{ width: "60%" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bounty Board ──────────────────────────────────────────────────────────────
function BountyBoard({ items, sym, loading }: { items: any[]; sym: string; loading: boolean }) {
  if (loading) return <div className="w-full h-24 bg-muted/20 animate-pulse border border-border" />;
  if (!items || items.length === 0) return null;
  return (
    <div className="w-full border-y-2 border-amber-600/25 bg-amber-500/[0.02] dark:bg-amber-900/5 py-4 px-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-amber-600 text-black">
          <Skull className="w-3 h-3 shrink-0" />
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] leading-none">
            <span className="hidden sm:inline">Most Wanted Montly</span>
            <span className="sm:hidden">Top Habits</span>
          </span>
          <Crosshair className="w-3 h-3 shrink-0" />
        </div>
        <div className="flex-1 h-px bg-amber-600/20" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item: any, idx: number) => (
          <div key={idx} className={cn("relative border-2 p-4 flex flex-col gap-2",
            idx === 0 ? "border-amber-600/40 bg-amber-500/5" : "border-border/30 hover:border-amber-600/20 transition-colors")}>
            <div className="absolute -top-2.5 -left-2.5 w-6 h-6 bg-amber-600 flex items-center justify-center text-black text-[9px] font-black">{idx + 1}</div>
            <p className="text-[8px] font-black text-amber-600/60 uppercase tracking-widest">Budget Item</p>
            <h4 className="text-base font-black break-words leading-tight">{item.name}</h4>
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[7px] text-muted-foreground/40 uppercase font-black">Avg/Month</p>
                <p className="text-xl font-black text-amber-600 tabular-nums break-all">{sym}{Math.round(item.amount).toLocaleString()}</p>
              </div>
              <span className="text-[8px] font-bold text-muted-foreground/40 shrink-0">{item.count} months</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Subscriptions Widget ──────────────────────────────────────────────────────
function SubscriptionsWidget({ sym }: { sym: string }) {
  const [subs, setSubs] = useState<any[]>([]);
  const [totalMonthly, setTotal] = useState(0);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const tok = localStorage.getItem("token"); if (!tok) return;
    fetch(`${API_BASE_URL}/my-subscriptions/`, { headers: { Authorization: `Bearer ${tok}` } })
      .then(r => r.json()).then(j => { setSubs(j.items || []); setTotal(j.total_monthly || 0); setBusy(false); })
      .catch(() => setBusy(false));
  }, []);

  const sorted = [...subs].filter(s => s.is_active).sort((a, b) => (a.days_until_billing ?? 999) - (b.days_until_billing ?? 999));

  if (busy) return <div className="h-40 bg-card/50 animate-pulse border border-border rounded-xl" />;
  if (sorted.length === 0) return null;

  return (
    <div className="flex flex-col lg:flex-row bg-card border border-border overflow-hidden group">
      {/* ── Summary Section ── */}
      <div className="w-full lg:w-1/3 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border/50 bg-muted/10 relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
           <RefreshCw className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 text-primary">
               <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground leading-none">Subscriptions</h3>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Monthly Recurring</p>
            </div>
          </div>
          
          <div>
            <p className="text-4xl font-black tabular-nums tracking-tighter text-foreground">
              {sym}{Math.round(totalMonthly).toLocaleString()}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">Total Monthly</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between mt-8 pt-4 border-t border-border/50">
          <div>
             <p className="text-lg font-black text-foreground">{sorted.length}</p>
             <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Active Links</p>
          </div>
          <div className="text-right">
             <p className="text-lg font-black text-primary">
               {sym}{Math.round(totalMonthly / 30).toLocaleString()}
             </p>
             <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Daily Average</p>
          </div>
        </div>
      </div>

      {/* ── Timeline Section ── */}
      <div className="flex-1 p-4 lg:p-6 bg-card flex flex-col">
         <div className="flex items-center justify-between mb-4">
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Upcoming Renewals</h4>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[160px] lg:max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
            {sorted.map(s => {
               const isUrgent = (s.days_until_billing ?? 999) <= 3;
               const initials = s.name.substring(0, 2).toUpperCase();
               
               return (
                  <div key={s._id} className="flex items-center p-3 border border-border/40 rounded-xl bg-card hover:bg-muted/30 hover:border-border/80 transition-all group/sub relative overflow-hidden">
                     {isUrgent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive" />}
                     
                     <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 border transition-colors",
                        isUrgent ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-primary/5 text-primary border-primary/10 group-hover/sub:bg-primary/10 group-hover/sub:border-primary/30"
                     )}>
                        {initials}
                     </div>
                     
                     <div className="ml-3 flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-1">
                           <p className="text-[11px] font-black text-foreground truncate pl-0.5">{s.name}</p>
                           <p className="text-[11px] font-black tabular-nums text-foreground shrink-0">{sym}{s.amount.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center justify-between">
                           <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5 truncate">{s.category}</p>
                           <p className={cn("text-[8px] font-black uppercase tracking-widest shrink-0", isUrgent ? "text-destructive" : "text-muted-foreground")}>
                              {s.days_until_billing === 0 ? "Today" : `In ${s.days_until_billing}d`}
                           </p>
                        </div>
                     </div>
                  </div>
               )
            })}
         </div>
      </div>
    </div>
  );
}

// ─── Financial Marquee ────────────────────────────────────────────────────────
function FinancialMarquee({ sym }: { sym: string }) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const tok = localStorage.getItem("token"); if (!tok) return;
    
    Promise.all([
      fetch(`${API_BASE_URL}/my-subscriptions/`, { headers: { Authorization: `Bearer ${tok}` } }).then(r => r.json()).catch(() => ({items:[]})),
      fetch(`${API_BASE_URL}/emis/`, { headers: { Authorization: `Bearer ${tok}` } }).then(r => r.json()).catch(() => ({items:[]}))
    ]).then(([subRes, emiRes]) => {
      const subs = (subRes.items || []).filter((s:any) => s.is_active && (s.days_until_billing ?? 999) <= 30).map((s:any) => ({
        id: `sub-${s._id}`, type: "Subscription", name: s.name, amount: s.amount, days: s.days_until_billing
      }));
      const emis = (emiRes.items || []).filter((e:any) => e.status === "active" && (e.days_until_emi ?? 999) <= 30).map((e:any) => ({
        id: `emi-${e._id}`, type: "EMI", name: e.name || e.loan_name, amount: e.emi_amount, days: e.days_until_emi
      }));
      
      const merged = [...subs, ...emis].sort((a, b) => a.days - b.days);
      setItems(merged);
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="w-full overflow-hidden bg-card border border-border py-3 flex items-center relative mb-2 -mt-2 group rounded-xl shadow-sm">
       <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-card via-card/80 to-transparent z-10 pointer-events-none" />
       <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-card via-card/80 to-transparent z-10 pointer-events-none" />
       
       <div className="flex whitespace-nowrap animate-marquee w-max group-hover:[animation-play-state:paused]">
         {[...items, ...items].map((item, idx) => (
           <div key={`${item.id}-${idx}`} className="flex items-center mx-8 gap-4 group/marqueeitem">
              <span className={cn(
                 "text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest shadow-inner transition-transform group-hover/marqueeitem:scale-105",
                 item.type === "EMI" ? "bg-primary/10 text-primary border border-primary/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              )}>{item.type}</span>
              <span className="text-[12px] font-black text-foreground">{item.name}</span>
              <span className="text-[12px] font-black tabular-nums text-foreground">{sym}{item.amount.toLocaleString()}</span>
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
                item.days <= 3 ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-muted/10 border-border/40 text-muted-foreground"
              )}>
                 <Clock className="w-3 h-3" />
                 <span className="text-[9px] font-black uppercase tracking-widest">
                    {item.days === 0 ? "Due Today" : `in ${item.days}d`}
                 </span>
              </div>
              <span className="text-muted-foreground/20 ml-4 text-sm font-black">•</span>
           </div>
         ))}
       </div>
    </div>
  );
}

// ─── Quick Overview Panel ──────────────────────────────────────────────────────
function QuickOverviewPanel({ sym, banks, loading }: { sym: string; banks: any[]; loading: boolean }) {
  const [emiTotal, setEmiTotal] = useState({ monthly: 0, outstanding: 0 });
  const [lendSummary, setLendSummary] = useState({ lent: 0, borrowed: 0 });
  const [propCount, setPropCount] = useState(0);

  useEffect(() => {
    const tok = localStorage.getItem("token"); if (!tok) return;
    Promise.all([
      fetch(`${API_BASE_URL}/emi/`, { headers: { Authorization: `Bearer ${tok}` } }).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE_URL}/lend-borrow/summary`, { headers: { Authorization: `Bearer ${tok}` } }).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE_URL}/properties/`, { headers: { Authorization: `Bearer ${tok}` } }).then(r => r.json()).catch(() => ({})),
    ]).then(([emiJ, lbJ, propJ]) => {
      setEmiTotal({ monthly: emiJ.total_monthly_burden || 0, outstanding: emiJ.total_outstanding || 0 });
      setLendSummary({ lent: lbJ.pending_lent || 0, borrowed: lbJ.pending_borrowed || 0 });
      setPropCount((propJ.items || []).length);
    });
  }, []);

  const rows = [
    { icon: <Home className="w-4 h-4" />, label: "Properties", value: propCount === 0 ? "No properties" : `${propCount} owned`, color: "text-zinc-500", bg: "bg-zinc-100 dark:bg-zinc-800" },
    { icon: <ArrowDownLeft className="w-4 h-4" />, label: "Receivables", value: lendSummary.lent === 0 ? `${sym}0` : fmt(lendSummary.lent, sym), color: "text-emerald-500", bg: "bg-emerald-50/50 dark:bg-emerald-500/10" },
    { icon: <ArrowUpRight className="w-4 h-4" />, label: "Payables", value: lendSummary.borrowed === 0 ? `${sym}0` : fmt(lendSummary.borrowed, sym), color: "text-red-500", bg: "bg-red-50/50 dark:bg-red-500/10" },
    { icon: <CreditCard className="w-4 h-4" />, label: "Loans & EMIs", valuePrimary: `${sym}${Math.round(emiTotal.monthly).toLocaleString()}`, valueSub: `${sym}${Math.round(emiTotal.outstanding).toLocaleString()} left`, color: "text-blue-500", bg: "bg-blue-50/50 dark:bg-blue-500/10" },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-border/40 flex flex-col overflow-hidden rounded-2xl shadow-sm h-full">
      <div className="px-5 py-4 shrink-0 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Quick Overview</span>
      </div>
      <div className="flex flex-col px-4 gap-2 flex-1">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/50 border border-border/20 rounded-xl hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors group">
            <div className={cn("w-9 h-9 shrink-0 flex items-center justify-center rounded-lg transition-transform group-hover:scale-110", row.bg, row.color)}>{row.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground/60">{row.label}</p>
              {row.valuePrimary ? (
                <div className="flex items-center justify-between gap-2 mt-0.5">
                   <div>
                      <p className="text-[8px] font-bold text-muted-foreground/40 uppercase">Per month</p>
                      <p className="text-sm font-black tabular-nums">{row.valuePrimary}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-bold text-muted-foreground/40 uppercase">Total Left</p>
                      <p className="text-sm font-black tabular-nums">{row.valueSub.split(" ")[0]}</p>
                   </div>
                </div>
              ) : (
                <p className="text-sm font-black tabular-nums mt-0.5">{row.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 mt-auto border-t border-border/10">
        <div className="bg-zinc-50 dark:bg-zinc-800/30 flex items-center justify-center gap-2 py-1.5 rounded-lg border border-border/20">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">All accounts clear</span>
        </div>
      </div>
    </div>
  );
}

// ─── Bounty Board Column ───────────────────────────────────────────────────────
function BountyBoardColumn({ items, sym, loading }: { items: any[]; sym: string; loading: boolean }) {
  if (loading) return <div className="bg-card border border-border h-full animate-pulse rounded-xl" />;
  if (!items || items.length === 0) return (
    <div className="bg-card border border-border flex flex-col items-center justify-center p-6 opacity-30 rounded-xl">
      <Skull className="w-8 h-8 mb-2" />
      <p className="text-[9px] font-black uppercase tracking-widest text-center">No budget data</p>
    </div>
  );
  return (
    <div className="bg-amber-500/[0.02] border-2 border-amber-600/20 flex flex-col overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-600/10 bg-amber-500/5 shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-600 text-black rounded-md">
          <Skull className="w-3.5 h-3.5" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Most Wanted</span>
        </div>
        <div className="ml-auto flex gap-1">
          <div className="w-1 h-1 rounded-full bg-amber-600/40" />
          <div className="w-1 h-1 rounded-full bg-amber-600/40" />
          <div className="w-1 h-1 rounded-full bg-amber-600/40" />
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4 flex-1">
        {items.slice(0, 3).map((item: any, idx: number) => (
          <div key={idx} className={cn("relative border-2 p-4 rounded-xl flex flex-col gap-1 transition-all hover:translate-x-1",
            idx === 0 ? "border-amber-600/40 bg-amber-500/5" : "border-border/40 bg-card")}>
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-black text-[10px] font-black shadow-lg shadow-amber-600/20">{idx + 1}</div>
            <p className="text-[8px] font-black text-amber-600/60 uppercase tracking-widest">Budget Item</p>
            <h4 className="text-sm font-black break-words leading-tight">{item.name}</h4>
            <div className="flex items-end justify-between gap-1 mt-1">
              <p className="text-xl font-black text-amber-600 tabular-nums">{sym}{Math.round(item.amount).toLocaleString()}</p>
              <span className="text-[8px] font-bold text-muted-foreground/40 shrink-0 pb-0.5">{item.count} months left</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── All-Time Stats Bar ────────────────────────────────────────────────────────
function AllTimeStatsBar({ txData, totalBalance, sym, loading }: { txData: { total_debit: number; total_credit: number; count: number }; totalBalance: number; sym: string; loading: boolean }) {
  const savings = txData.total_credit - txData.total_debit;
  const stats = [
    { label: "Total Transactions", value: txData.count.toLocaleString(), sub: "All time", icon: <Activity className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-500/10", sparkColor: "bg-blue-500" },
    { label: "Total Income", value: fmt(txData.total_credit, sym), sub: "All time", icon: <ArrowDownRight className="w-5 h-5" />, color: "text-emerald-500", bg: "bg-emerald-500/10", sparkColor: "bg-emerald-500" },
    { label: "Total Expenses", value: fmt(txData.total_debit, sym), sub: "All time", icon: <ArrowUpRight className="w-5 h-5" />, color: "text-red-500", bg: "bg-red-500/10", sparkColor: "bg-red-500" },
    { label: "Savings", value: fmt(Math.max(0, savings), sym), sub: "All time", icon: <PiggyBank className="w-5 h-5" />, color: savings >= 0 ? "text-amber-500" : "text-red-500", bg: savings >= 0 ? "bg-amber-500/10" : "bg-red-500/10", sparkColor: savings >= 0 ? "bg-amber-500" : "bg-red-500" },
  ];
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
      {stats.map(s => (
        <div key={s.label} className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4 group hover:shadow-md transition-all duration-300 relative overflow-hidden">
          <div className={cn("absolute inset-0 opacity-[0.02] pointer-events-none bg-gradient-to-br", s.bg, "from-transparent to-current")} />
          {loading
            ? <div className="w-full h-12 bg-muted/30 animate-pulse rounded-lg" />
            : <>
              <div className={cn("w-10 h-10 flex items-center justify-center rounded-xl transition-transform group-hover:scale-110", s.bg, s.color)}>{s.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 truncate">{s.label}</p>
                <p className={cn("text-lg font-black tabular-nums leading-tight truncate mt-0.5", s.color)}>{s.value}</p>
                <p className="text-[8px] text-muted-foreground/30 font-bold truncate">{s.sub}</p>
              </div>
              <div className="shrink-0 flex items-end gap-[2px] h-8 mb-1">
                {[40, 70, 50, 90, 60].map((h, i) => (
                  <div key={i} className={cn("w-1.5 rounded-full opacity-20 group-hover:opacity-60 transition-all duration-500", s.sparkColor)} style={{ height: `${h * 0.3}px` }} />
                ))}
              </div>
            </>
          }
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [banks, setBanks] = useState<any[]>([]);
  const [bankFilter, setBankFilter] = useState("All Banks");
  const [searchFilter, setSearchFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [recentDebit, setRecentDebit] = useState<any[]>([]);
  const [recentCredit, setRecentCredit] = useState<any[]>([]);
  const [topDebits, setTopDebits] = useState<any[]>([]);
  const [topCredits, setTopCredits] = useState<any[]>([]);
  const [txData, setTxData] = useState({ total_debit: 0, total_credit: 0, count: 0 });
  const [stats, setStats] = useState<any>(null);
  const sym = "₹";

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token"); if (!token) return;
    const p = new URLSearchParams();
    if (bankFilter !== "All Banks") p.append("bank", bankFilter);
    if (searchFilter) p.append("search", searchFilter);
    if (startDate) p.append("start_date", startDate);
    if (endDate) p.append("end_date", endDate);
    const key = p.toString(); const now = Date.now();
    if (dashboardFetchCache[key] && now - dashboardFetchCache[key].timestamp < CACHE_TTL) {
      const c = dashboardFetchCache[key].data;
      setTxData(c.summary); setMonthlyTrend(c.monthly_trend);
      setTopDebits(c.top_debits); setTopCredits(c.top_credits);
      setRecentDebit(c.recent_debit); setRecentCredit(c.recent_credit);
      setBanks(c.banks); setStats(c.records); setLoading(false); return;
    }
    setLoading(true);
    try {
      const [bR, iR, dR, cR] = await Promise.all([
        fetch(`${API_BASE_URL}/transactions/banks-summary`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/insights?${p}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/transactions?limit=15&type=debit&${p}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/transactions?limit=15&type=credit&${p}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [bJ, iJ, dJ, cJ] = await Promise.all([bR.json(), iR.json(), dR.json(), cR.json()]);
      const fd = {
        summary: { total_debit: iJ.summary?.expense || 0, total_credit: iJ.summary?.income || 0, count: iJ.summary?.total_transactions || 0 },
        monthly_trend: iJ.monthly_data || [], top_debits: iJ.top_debits || [], top_credits: iJ.top_credits || [],
        recent_debit: dJ.data || [], recent_credit: cJ.data || [], records: iJ.records || null, banks: bJ.data || [],
      };
      setTxData(fd.summary); setMonthlyTrend(fd.monthly_trend);
      setTopDebits(fd.top_debits); setTopCredits(fd.top_credits);
      setRecentDebit(fd.recent_debit); setRecentCredit(fd.recent_credit);
      setStats(fd.records); setBanks(fd.banks);
      dashboardFetchCache[key] = { data: fd, timestamp: now };
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [bankFilter, searchFilter, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalBalance = useMemo(() => {
    if (bankFilter === "All Banks") return banks.reduce((s, b) => s + (b.current_balance || 0), 0);
    return banks.find(b => b.bank_name === bankFilter)?.current_balance || 0;
  }, [banks, bankFilter]);

  const walletBalance = useMemo(() =>
    banks.find(b => b.bank_name.toLowerCase().includes("wallet"))?.current_balance || 0, [banks]);

  const net = txData.total_credit - txData.total_debit;


  return (
    <AdminPageLayout
      title="Dashboard"
      description="Your financial overview at a glance."
      filters={[
        { key: "search", label: "Search", type: "input", value: searchFilter, onChange: setSearchFilter, placeholder: "Search..." },
        { key: "bank", label: "Account", type: "select", value: bankFilter, onChange: (v: string) => setBankFilter(v || "All Banks"), options: [{ label: "All Banks", value: "All Banks" }, ...banks.map(b => ({ label: b.bank_name, value: b.bank_name }))], placeholder: "Account" },
        { key: "start_date", label: "From", type: "date", value: startDate, onChange: setStartDate },
        { key: "end_date", label: "To", type: "date", value: endDate, onChange: setEndDate },
      ]}
      onClearFilters={() => { setBankFilter("All Banks"); setSearchFilter(""); setStartDate(""); setEndDate(""); }}
    >
      <div className="flex flex-col gap-3 w-full pb-6">

        {/* Financial Ticker */}
        <FinancialMarquee sym={sym} />

        {/* MAIN: left column + right sidebar */}
        <div className="flex flex-col xl:flex-row gap-3 items-start w-full">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">

            {/* ROW 1: 4 KPI stats + Overall */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 items-stretch">
              <StatCard
                title="Balance"
                subtitle="Total Balance"
                value={`${sym}${Math.round(totalBalance).toLocaleString()}`}
                icon={<Wallet className="w-4 h-4" />}
                colorType="primary"
                loading={loading}
                data={(monthlyTrend || []).map(d => (d.income || 0) - (d.expense || 0))}
              />
              <StatCard
                title="Money In"
                subtitle="Total Income"
                value={`${sym}${Math.round(txData.total_credit).toLocaleString()}`}
                icon={<ArrowDownRight className="w-4 h-4" />}
                colorType="emerald"
                loading={loading}
                data={(monthlyTrend || []).map(d => d.income || d.amount || 0)}
              />
              <StatCard
                title="Money Out"
                subtitle="Total Expenses"
                value={`${sym}${Math.round(txData.total_debit).toLocaleString()}`}
                icon={<ArrowUpRight className="w-4 h-4" />}
                colorType="destructive"
                loading={loading}
                data={(monthlyTrend || []).map(d => d.expense || d.amount || 0)}
              />
              <StatCard
                title="Transactions"
                subtitle="Total Transactions"
                value={Math.round(txData.count).toLocaleString()}
                icon={<Activity className="w-4 h-4" />}
                colorType="amber"
                loading={loading}
                data={(monthlyTrend || []).map(d => (d.income || 0) + (d.expense || d.amount || 0))}
              />
              {/* Overall Card */}
              <div className="bg-white dark:bg-zinc-900 border border-border/40 p-5 flex flex-col justify-between relative overflow-hidden rounded-2xl shadow-sm h-[160px]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">Overall</span>
                  <p className="text-[11px] font-bold text-foreground mt-1">{net >= 0 ? "You're saving money! 🎉" : "Overspending"}</p>
                </div>
                <div>
                  <p className={cn("text-2xl font-black tabular-nums tracking-tighter", net >= 0 ? "text-emerald-500" : "text-destructive")}>
                    {sym}{Math.abs(net).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground/40 mt-1 uppercase tracking-tight leading-tight">
                    {Math.abs(net).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                    {net >= 0 ? "more earned" : "more spent"} than {net >= 0 ? "spent" : "earned"}
                  </p>
                </div>
                <div className="w-full bg-muted/30 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000", net >= 0 ? "bg-emerald-500" : "bg-destructive")}
                    style={{ width: `${Math.min(100, txData.total_credit > 0 ? (Math.min(txData.total_credit, txData.total_debit) / txData.total_credit) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ROW 2: Metals */}
            <MetalsWidget sym={sym} />

            {/* ROW 3: Spending | Income | Budget charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <SpendingPulseGraph trendData={monthlyTrend} totalSpend={txData.total_debit} currencySymbol={sym} loading={loading} />
              <IncomeTrendGraph trendData={monthlyTrend} totalIncome={txData.total_credit} currencySymbol={sym} loading={loading} />
              <BudgetComparisonGraph budgetData={stats?.budget_trend} currencySymbol={sym} loading={loading} />
            </div>

            {/* ROW 4: Leaderboards + Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <LeaderboardWidget title="Where Money Goes" data={topDebits} sym={sym} loading={loading} type="debit" />
              <LeaderboardWidget title="Where Money Comes From" data={topCredits} sym={sym} loading={loading} type="credit" />
              <div className="flex flex-col gap-2">
                <div className="bg-gradient-to-br from-amber-600/20 via-card to-background border-2 border-amber-500/20 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden hover:border-amber-500/50 transition-all duration-500 group flex-1 rounded-xl">
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <Star className="w-32 h-32 -rotate-12" />
                  </div>
                  <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-500 mb-2">
                    <Trophy className="w-5 h-5 text-amber-500 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                  </div>
                  <p className="text-[7px] font-black uppercase tracking-[0.25em] text-amber-600/60 mb-1">Main Income Source</p>
                  <p className="text-sm font-black tracking-tight mb-2 underline decoration-amber-500/40 underline-offset-4 break-words w-full">
                    {stats?.top_income_source?.source || "N/A"}
                  </p>
                  <p className="text-[7px] font-black uppercase tracking-widest text-foreground/30 mb-0.5">Total Earned</p>
                  <p className="text-2xl font-black text-amber-600 tabular-nums break-all">
                    {sym}{stats?.top_income_source?.amount?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MiniCard title="Biggest Payment" value={fmt(stats?.highest_payment?.amount || 0, sym)} sub={stats?.highest_payment?.name} icon={<Zap className="w-4 h-4 text-destructive" />} border="border-l-destructive/50" loading={loading} />
                  <MiniCard title="Biggest Income" value={fmt(stats?.highest_income?.amount || 0, sym)} sub={stats?.highest_income?.name} icon={<Sparkles className="w-4 h-4 text-emerald-500" />} border="border-l-emerald-500/50" loading={loading} />
                  <MiniCard title="Common Amount" value={fmt(stats?.frequent_amount?.amount || 0, sym)} sub={`Used ${stats?.frequent_amount?.count}x`} icon={<Repeat className="w-4 h-4 text-amber-500" />} border="border-l-amber-500/50" loading={loading} />
                  <MiniCard title="Top Contact" value={stats?.frequent_spender?.name || "N/A"} sub={`${stats?.frequent_spender?.count} txns`} icon={<Target className="w-4 h-4 text-indigo-500" />} border="border-l-indigo-500/50" loading={loading} />
                </div>
              </div>
            </div>

            {/* ROW 5: Recent Payments | Recent Income */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <RecentList txs={recentDebit} sym={sym} loading={loading} title="Recent Payments" sub="Last 10 transactions" color="red" />
              <RecentList txs={recentCredit} sym={sym} loading={loading} title="Recent Income" sub="Last 10 transactions" color="green" />
            </div>

            {/* ROW 6: Subscriptions */}
            <SubscriptionsWidget sym={sym} />

          </div>
          {/* END LEFT COLUMN */}

          {/* RIGHT SIDEBAR */}
          <div className="flex flex-col gap-3 w-full xl:w-[240px] shrink-0 xl:sticky xl:top-4">
            <QuickOverviewPanel sym={sym} banks={banks} loading={loading} />
            <BountyBoardColumn items={stats?.top_budget_items} sym={sym} loading={loading} />
            <BankBreakdownWidget banks={banks} sym={sym} loading={loading} />
          </div>
          {/* END RIGHT SIDEBAR */}

        </div>
        {/* END MAIN LAYOUT */}

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(120, 120, 120, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(120, 120, 120, 0.8); }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 30s linear infinite; }
      `}</style>
    </AdminPageLayout>
  );
}
