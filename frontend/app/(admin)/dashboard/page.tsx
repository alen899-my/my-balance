"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import getSymbolFromCurrency from "currency-symbol-map";
import {
  Wallet, Activity, ArrowDownRight, ArrowUpRight, ArrowUp, ArrowDown,
  Trophy, TrendingDown, TrendingUp, Medal, Zap, Repeat, Target,
  Sparkles, Star, Skull, Crosshair, Building2, Gem, HandCoins,
  CreditCard, AlertCircle, CheckCircle2, Clock, MoveRight,
  PiggyBank, RefreshCw, Gauge, BarChart3, Flame, BellRing,
} from "lucide-react";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";
import { StatCard } from "@/components/ui/StatCard";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { SpendingPulseGraph } from "@/components/dashboard/SpendingPulseGraph";
import { IncomeTrendGraph } from "@/components/dashboard/IncomeTrendGraph";
import { BudgetComparisonGraph } from "@/components/dashboard/BudgetComparisonGraph";
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
      <div className={cn("h-32 border border-border bg-muted/20 animate-pulse")} />
    );
  }

  return (
    <div className={cn(
      "relative h-32 overflow-hidden border flex flex-col justify-between p-4 group transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl cursor-default",
      `bg-gradient-to-br ${cfg.bg}`, cfg.border
    )}>
      {/* Dynamic Shine Effect */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none", cfg.shine)} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -inset-x-full top-0 bottom-0 w-[200%] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s] ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Background Icon Decoration */}
      <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:opacity-25 transition-all duration-700 rotate-12 group-hover:rotate-0 scale-110 pointer-events-none">
        <Gem className="w-24 h-24" />
      </div>

      <div className="relative z-10 flex justify-between items-start">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("w-7 h-7 flex items-center justify-center border text-base bg-black/40 backdrop-blur-md", cfg.border)}>
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
          <span className={cn("text-[10px] font-black tabular-nums flex items-center justify-end gap-0.5", isGain ? "text-emerald-400" : "text-red-400")}>
            {isGain ? "▲" : "▼"} {Math.abs(Number(pct))}%
          </span>
          <p className={cn("text-[10px] font-bold mt-1", cfg.sub)}>
            {g.grams >= 1000 ? `${(g.grams / 1000).toFixed(2)}kg` : `${g.grams.toFixed(1)}g`}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <div className="w-full bg-black/20 h-[2px] overflow-hidden">
          <div className={cn("h-full transition-all duration-1000", isGain ? "bg-emerald-500" : "bg-red-500")} style={{ width: isGain ? "100%" : "30%" }} />
        </div>
      </div>
    </div>
  );
}

function TotalMetalCard({ totalVal, totalGain, sym, busy }: { totalVal: number; totalGain: number; sym: string; busy: boolean }) {
  const isGain = totalGain >= 0;

  if (busy) {
    return <div className="h-32 border border-border bg-muted/20 animate-pulse" />;
  }

  return (
    <div className={cn(
      "relative h-32 overflow-hidden border flex flex-col justify-between p-4 bg-zinc-950 border-white/10 group",
      "hover:border-yellow-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl cursor-default"
    )}>
      {/* Luxury Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,#09090b_0%,#18181b_100%)] pointer-events-none" />

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-yellow-500/20 group-hover:border-yellow-500/50 transition-colors pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-yellow-500 text-black">
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
          <p className={cn("text-xs font-black tabular-nums flex items-center gap-1", isGain ? "text-emerald-500" : "text-destructive")}>
            {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isGain ? "+" : "-"}{sym}{Math.round(Math.abs(totalGain)).toLocaleString()}
          </p>
        </div>
        <div className={cn(
          "px-3 py-1 text-[8px] font-black border transition-all duration-500",
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

  const totalPortfolio = props.reduce((s, p) => s + (p.current_value || p.purchase_price), 0);
  const sorted = [...props].sort((a, b) => (b.current_value || b.purchase_price) - (a.current_value || a.purchase_price));
  const topProp = sorted[0];

  return (
    <div className="bg-card border border-border flex flex-col overflow-hidden group">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40 shrink-0 bg-muted/5">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Properties</span>
        </div>
        <div className="text-right">


        </div>
      </div>

      {busy ? (
        <div className="h-[280px] bg-muted/20 animate-pulse" />
      ) : !topProp ? (
        <div className="flex items-center justify-center py-12 opacity-30">
          <p className="text-[9px] font-black uppercase tracking-widest text-center">No properties<br />tracked in portfolio</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Top Property Hero "Sharp Card" */}
          <div className="relative aspect-[16/10] overflow-hidden border-b border-border/20">
            {topProp.image_url ? (
              <img src={topProp.image_url} alt={topProp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" />
            ) : (
              <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center">
                <Building2 className="w-12 h-12 text-emerald-500/20" />
              </div>
            )}

            {/* Luxury Badges and Overlays */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
              <div className="px-2 py-0.5 bg-emerald-500 text-black text-[8px] font-black uppercase tracking-widest shadow-2xl">
                Prime Asset
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h4 className="text-lg font-black text-white truncate leading-tight group-hover:text-emerald-400 transition-colors">{topProp.title || topProp.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest truncate">{topProp.type}</p>
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest truncate">Highest Valuable Property</p>
                </div>
              </div>
              <div className="text-right shrink-0 pb-0.5">
                <p className="text-base font-black tabular-nums text-white leading-none">
                  {sym}{Math.round(topProp.current_value || topProp.purchase_price).toLocaleString()}
                </p>
                {(() => {
                  const val = topProp.current_value || topProp.purchase_price;
                  const gain = topProp.purchase_price > 0 ? ((val - topProp.purchase_price) / topProp.purchase_price) * 100 : 0;
                  return (
                    <></>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Secondary Assets List - Mini */}
          {sorted.length > 1 && (
            <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
              <div className="h-px bg-border/10 w-full mb-1" />
              <div className="flex flex-col gap-2">
                {sorted.slice(1, 2).map(p => (
                  <div key={p._id} className="flex items-center justify-between gap-3 group/item">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 bg-muted flex items-center justify-center border border-border/20 text-[8px] font-black opacity-40">SQ</div>
                      <p className="text-[10px] font-black truncate text-muted-foreground/60 group-hover/item:text-foreground transition-colors">{p.title || p.name}</p>
                    </div>
                    <span className="text-[10px] font-bold tabular-nums text-muted-foreground/40">{sym}{Math.round(p.current_value || p.purchase_price).toLocaleString()}</span>
                  </div>
                ))}
                {sorted.length > 2 && (
                  <button className="text-[8px] font-black uppercase tracking-widest text-emerald-500/60 hover:text-emerald-500 transition-colors mt-1">
                    + {sorted.length - 1} More Properties
                  </button>
                )}
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
    <div className="bg-card border border-border flex flex-col overflow-hidden group h-full">
      {/* ── High-Impact Split Header ── */}
      <div className="grid grid-cols-2 divide-x divide-border/20 border-b border-border/40">
        <div className="p-4 bg-emerald-500/[0.02]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-none bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Receivables</span>
          </div>
          <p className="text-xl font-black tabular-nums transition-transform group-hover:translate-x-1 duration-500 leading-none">
            {sym}{Math.round(summary?.pending_lent || 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-red-500/[0.02]">
          <div className="flex items-center gap-2 mb-1.5 justify-end">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none text-right">Payables</span>
            <div className="w-5 h-5 rounded-none bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-black tabular-nums text-right transition-transform group-hover:-translate-x-1 duration-500 leading-none text-red-500">
            {sym}{Math.round(summary?.pending_borrowed || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {busy ? (
        <div className="h-[200px] bg-muted/20 animate-pulse" />
      ) : (
        <div className="flex flex-col flex-1 divide-y divide-border/10">
          {/* ── HERO: Top Person Who Owes Me ── */}
          {maxLent && (
            <div className="p-4 flex items-center justify-between hover:bg-emerald-500/[0.03] transition-colors group/item">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-base shadow-inner">
                  {maxLent.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[8px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-0.5">Top Debtor</p>
                  <h4 className="text-xs font-black tracking-tight truncate max-w-[120px]">{maxLent.name}</h4>
                  <p className="text-[8px] font-bold text-muted-foreground/40 mt-0.5">{daysSince(maxLent.date)}d since loan</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-emerald-500 tabular-nums leading-none">
                  {sym}{Math.round(maxLent.amount).toLocaleString()}
                </p>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 mt-2">
                  <Clock className="w-2.5 h-2.5 text-emerald-500" />
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                </div>
              </div>
            </div>
          )}

          {/* ── HERO: Top Person I Owe ── */}
          {maxBor && (
            <div className="p-4 flex items-center justify-between hover:bg-red-500/[0.03] transition-colors group/item">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-red-500/20 bg-red-500/10 flex items-center justify-center text-red-500 font-black text-base shadow-inner">
                  {maxBor.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[8px] font-black text-red-500/60 uppercase tracking-[0.15em] mb-0.5">Major Liability</p>
                  <h4 className="text-xs font-black tracking-tight truncate max-w-[120px]">{maxBor.name}</h4>
                  <p className="text-[8px] font-bold text-muted-foreground/40 mt-0.5">{daysSince(maxBor.date)}d overdue</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-red-500 tabular-nums leading-none">
                  {sym}{Math.round(maxBor.amount).toLocaleString()}
                </p>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 mt-2">
                  <AlertCircle className="w-2.5 h-2.5 text-red-500" />
                  <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Urgent</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Secondary List - Quick Peek ── */}
          {(lent.length > 1 || bor.length > 1) && (
            <div className="p-4 mt-auto">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 h-px bg-border/20" />
                <span className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] shrink-0">Other Pending Trades</span>
                <div className="flex-1 h-px bg-border/20" />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="flex flex-col gap-1.5">
                  {lent.slice(1, 3).map(i => (
                    <div key={i._id} className="flex items-center justify-between text-[9px] font-bold text-muted-foreground truncate">
                      <span>{i.name}</span>
                      <span className="text-emerald-500 tabular-nums">{sym}{Math.round(i.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5">
                  {bor.slice(1, 3).map(i => (
                    <div key={i._id} className="flex items-center justify-between text-[9px] font-bold text-muted-foreground truncate">
                      <span>{i.name}</span>
                      <span className="text-red-500 tabular-nums">{sym}{Math.round(i.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {lent.length === 0 && bor.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-20">
              <CheckCircle2 className="w-10 h-10 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest">All Accounts Clear</p>
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
    <div className="bg-card border border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Loans & EMIs</span>
        </div>
        <div className="flex items-center gap-2">
          {urgent.length > 0 && (
            <span className="flex items-center gap-1 text-[8px] font-black text-red-500 animate-pulse">
              <AlertCircle className="w-3 h-3" />{urgent.length} due soon
            </span>
          )}
          <span className="text-[8px] font-black text-muted-foreground/40">{total.count} active</span>
        </div>
      </div>

      {busy ? (
        <div className="flex items-center justify-center py-5">
          <Activity className="w-5 h-5 text-blue-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Summary pills ── */}
          <div className="grid grid-cols-2 border-b border-border/20 shrink-0">
            <div className="px-3 py-2 border-r border-border/20 min-w-0">
              <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest truncate">Per Month</p>
              <p className="text-sm font-black tabular-nums break-all">{sym}{Math.round(total.monthly).toLocaleString()}</p>
            </div>
            <div className="px-3 py-2 min-w-0">
              <p className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-widest truncate">Still Left</p>
              <p className="text-sm font-black text-destructive tabular-nums break-all">{sym}{Math.round(total.outstanding).toLocaleString()}</p>
            </div>
          </div>

          {/* ── Urgent warning cards (due within 7 days) ── */}
          {urgent.length > 0 && (
            <div className="px-3 pt-3 flex flex-col gap-2 shrink-0">
              {urgent.map(e => (
                <div key={e._id} className="relative overflow-hidden rounded-md border border-red-500/30 bg-gradient-to-r from-red-500/10 to-transparent p-3">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 animate-pulse" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 pl-1">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5 bg-red-500/20 p-1.5 rounded text-red-500">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-red-400 break-words whitespace-normal leading-tight">{e.name}</p>
                        <p className="text-[9px] font-bold text-red-400/80 mt-0.5">
                          {e.days_until_payment === 0 ? "⚠️ DUE TODAY" : `DUE IN ${e.days_until_payment} DAY${e.days_until_payment === 1 ? "" : "S"}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-end sm:items-center sm:text-right shrink-0 mt-1 sm:mt-0 self-end sm:self-auto">
                      <div className="text-right">
                        <p className="text-sm font-black text-red-400 tabular-nums">{sym}{Math.round(e.monthly_emi).toLocaleString()}</p>
                        <p className="text-[8px] text-red-500/60 font-bold uppercase tracking-widest mt-0.5">Immediate Action</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── All active loans list ── */}
          <div className="divide-y divide-border/10">
            {emis.length === 0 ? (
              <div className="py-5 flex flex-col items-center gap-1 opacity-30">
                <CheckCircle2 className="w-6 h-6" />
                <p className="text-[8px] font-black uppercase tracking-widest">No active loans</p>
              </div>
            ) : emis.map(e => {
              const isUrgent = (e.days_until_payment ?? 999) <= 7;
              return (
                <div key={e._id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 py-2.5 hover:bg-muted/20 transition-colors">
                  <div className={cn("w-6 h-6 shrink-0 flex items-center justify-center border",
                    isUrgent ? "border-red-500/30 bg-red-500/10 text-red-500" : "border-blue-500/20 bg-blue-500/5 text-blue-400")}>
                    {isUrgent ? <AlertCircle className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[10px] font-black truncate">{e.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className={cn("text-[8px] font-bold shrink-0", isUrgent ? "text-red-500" : "text-muted-foreground/40")}>
                        {e.days_until_payment != null ? `${e.days_until_payment}d` : "—"}
                      </p>
                      <div className="flex-1 bg-muted/40 h-1 overflow-hidden">
                        <div className="bg-blue-500 h-1" style={{ width: `${Math.min(100, e.progress_pct || 0)}%` }} />
                      </div>
                      <p className="text-[8px] text-muted-foreground/40 font-bold">{e.months_remaining}mo</p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto text-right mt-1 sm:mt-0 flex justify-end">
                    <p className="text-[11px] font-black tabular-nums shrink-0">{sym}{Math.round(e.monthly_emi).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}



// ─── Bank Breakdown Widget ─────────────────────────────────────────────────────
function BankBreakdownWidget({ banks, sym, loading }: { banks: any[]; sym: string; loading: boolean }) {
  if (loading) return <div className="h-28 bg-muted/20 animate-pulse border border-border" />;
  const valid = banks.filter(b => b.current_balance > 0).sort((a, b) => b.current_balance - a.current_balance);
  const total = valid.reduce((s, b) => s + b.current_balance, 0);
  if (valid.length < 2) return null;
  const COLORS = ["bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500", "bg-indigo-500"];
  return (
    <div className="bg-card border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
        <BarChart3 className="w-4 h-4 text-blue-500" />
        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Account Balance Breakdown</span>
        <div className="ml-auto">
          <p className="text-xs font-black tabular-nums">{sym}{Math.round(total).toLocaleString()}</p>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex h-4 overflow-hidden bg-muted/20">
          {valid.map((b, i) => (
            <div key={b.bank_name} className={cn("h-full first:rounded-l last:rounded-r transition-all", COLORS[i % COLORS.length])}
              style={{ width: `${(b.current_balance / total) * 100}%` }} title={b.bank_name} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
          {valid.map((b, i) => (
            <div key={b.bank_name} className="flex items-center gap-2">
              <div className={cn("w-2.5 h-2.5 shrink-0", COLORS[i % COLORS.length])} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[9px] font-bold truncate text-muted-foreground">{b.bank_name}</p>
                  <p className="text-[9px] font-black tabular-nums shrink-0">{sym}{Math.round(b.current_balance).toLocaleString()}</p>
                </div>
                <p className="text-[7px] text-muted-foreground/30">{((b.current_balance / total) * 100).toFixed(1)}% of total</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Spending Insights Banner ──────────────────────────────────────────────────
function SpendingInsightsBanner({ txData, monthlyTrend, sym, loading }: {
  txData: { total_debit: number; total_credit: number; count: number };
  monthlyTrend: any[]; sym: string; loading: boolean;
}) {
  if (loading) return <div className="h-16 bg-muted/20 animate-pulse border border-border" />;
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
    { label: "Daily Avg Spend", value: fmt(dailyAvg, sym), sub: `Run rate ${fmt(monthlyRunRate, sym)}/mo`, color: "text-orange-400", icon: <Flame className="w-4 h-4" />, border: "border-l-orange-500/50" },
    { label: "vs Last Month", value: `${spendDelta >= 0 ? "+" : ""}${spendDelta.toFixed(1)}%`, sub: lastMonth ? `vs ${fmt(lastMonth.amount, sym)}` : "No data yet", color: spendDelta > 10 ? "text-red-400" : spendDelta < 0 ? "text-emerald-400" : "text-amber-400", icon: spendDelta > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />, border: spendDelta > 0 ? "border-l-red-500/50" : "border-l-emerald-500/50" },
    { label: "Savings Rate", value: `${Math.max(0, incomeVsSpend).toFixed(1)}%`, sub: txData.total_credit > 0 ? `${fmt(Math.max(0, txData.total_credit - txData.total_debit), sym)} saved` : "No income yet", color: incomeVsSpend >= 20 ? "text-emerald-400" : incomeVsSpend > 0 ? "text-amber-400" : "text-red-400", icon: <Gauge className="w-4 h-4" />, border: incomeVsSpend >= 20 ? "border-l-emerald-500/50" : incomeVsSpend > 0 ? "border-l-amber-500/50" : "border-l-red-500/50" },
    { label: "Txn Count", value: txData.count.toLocaleString(), sub: `~${dayOfMonth > 0 ? (txData.count / dayOfMonth).toFixed(1) : "0"} per day`, color: "text-blue-400", icon: <Activity className="w-4 h-4" />, border: "border-l-blue-500/50" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {stats.map(s => (
        <div key={s.label} className={cn("bg-card border border-l-4 border-border/30 px-3 py-3 flex items-center gap-3 group hover:bg-muted/10 transition-colors", s.border)}>
          <div className={cn("opacity-20 group-hover:opacity-60 transition-opacity shrink-0", s.color)}>{s.icon}</div>
          <div className="min-w-0">
            <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40 truncate">{s.label}</p>
            <p className={cn("text-base font-black tabular-nums leading-tight truncate", s.color)}>{s.value}</p>
            <p className="text-[7px] text-muted-foreground/30 font-bold truncate mt-0.5">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Top Spenders / Income Bars ────────────────────────────────────────────────
function SpendBarWidget({ data, sym, loading, type }: { data: any[]; sym: string; loading: boolean; type: "debit" | "credit" }) {
  if (loading) return <div className="h-64 bg-muted/20 animate-pulse border border-border" />;
  if (!data || data.length === 0) return null;
  const top = data.slice(0, 8);
  const total = top.reduce((s, d) => s + d.amount, 0);
  const isDebit = type === "debit";
  const GRADIENTS = isDebit
    ? ["from-red-600 to-red-400", "from-orange-600 to-orange-400", "from-amber-600 to-amber-400", "from-pink-600 to-pink-400", "from-rose-600 to-rose-400", "from-violet-600 to-violet-400", "from-purple-600 to-purple-400", "from-fuchsia-600 to-fuchsia-400"]
    : ["from-emerald-600 to-emerald-400", "from-teal-600 to-teal-400", "from-green-600 to-green-400", "from-cyan-600 to-cyan-400", "from-sky-600 to-sky-400", "from-lime-600 to-lime-400", "from-emerald-700 to-emerald-300", "from-green-700 to-green-300"];
  return (
    <div className="bg-card border border-border flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 shrink-0">
        {isDebit ? <Flame className="w-4 h-4 text-red-500" /> : <Sparkles className="w-4 h-4 text-emerald-500" />}
        <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isDebit ? "text-red-500" : "text-emerald-500")}>
          {isDebit ? "Top Spend Payees" : "Top Income Sources"}
        </span>
        <span className="ml-auto text-[8px] font-black text-muted-foreground/30">{top.length} entries</span>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {top.map((item, i) => (
          <div key={item._id} className="flex items-center gap-3">
            <span className="text-[8px] font-black text-muted-foreground/30 w-4 shrink-0 text-right">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1 gap-2">
                <p className="text-[10px] font-black truncate">{item._id || "Other"}</p>
                <p className={cn("text-[10px] font-black tabular-nums shrink-0", isDebit ? "text-red-400" : "text-emerald-400")}>
                  {sym}{item.amount >= 1000 ? new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(item.amount) : item.amount.toLocaleString()}
                </p>
              </div>
              <div className="w-full bg-muted/20 h-1.5 overflow-hidden">
                <div className={cn("h-1.5 bg-gradient-to-r", GRADIENTS[i % GRADIENTS.length])}
                  style={{ width: `${total > 0 ? (item.amount / total) * 100 : 0}%` }} />
              </div>
            </div>
            <span className="text-[8px] text-muted-foreground/30 shrink-0 w-7 text-right">{total > 0 ? ((item.amount / total) * 100).toFixed(0) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mini stat card ────────────────────────────────────────────────────────────
function MiniCard({ title, value, sub, icon, border, loading }: { title: string; value: string; sub?: string; icon: React.ReactNode; border: string; loading: boolean }) {
  if (loading) return <div className="h-14 bg-muted/40 animate-pulse border border-border/40" />;
  return (
    <div className={cn("px-3 py-3 border-l-4 bg-card flex items-center justify-between gap-2 group border border-border/20 hover:bg-muted/20 transition-colors w-full overflow-hidden", border)}>
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 truncate">{title}</p>
        <p className="text-[13px] font-black break-all leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[8px] font-bold text-muted-foreground/40 uppercase break-words mt-0.5">{sub}</p>}
      </div>
      <div className="opacity-10 group-hover:opacity-60 transition-opacity shrink-0 flex-none">{icon}</div>
    </div>
  );
}

// ─── Leaderboard ───────────────────────────────────────────────────────────────
function LeaderboardWidget({ data, sym, loading, title, type }: { data: any[]; sym: string; loading: boolean; title: string; type: "debit" | "credit" }) {
  const total = data.reduce((s, x) => s + (x.amount || 0), 0);
  if (loading) return <div className="bg-card border border-border h-[380px] animate-pulse" />;
  return (
    <div className="bg-card border border-border flex flex-col overflow-hidden h-[380px]">
      {/* Top accent */}
      <div className={cn("h-0.5 shrink-0", type === "debit" ? "bg-gradient-to-r from-red-500 to-amber-500" : "bg-gradient-to-r from-emerald-500 to-teal-400")} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className={cn("w-6 h-6 border flex items-center justify-center",
            type === "debit" ? "bg-destructive/10 border-destructive/20" : "bg-emerald-500/10 border-emerald-500/20")}>
            {type === "debit" ? <TrendingDown className="w-3 h-3 text-destructive" /> : <TrendingUp className="w-3 h-3 text-emerald-600" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">{title}</span>
        </div>
        <Trophy className="w-3.5 h-3.5 text-amber-500" />
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-0 px-4 py-1.5 border-b border-border/20 bg-muted/5 shrink-0">
        <span className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-widest w-6">#</span>
        <span className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-widest">Name / Description</span>
        <span className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-widest text-center w-8">Txns</span>
        <span className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-widest text-right w-20">Total</span>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {data.length === 0 ? (
          <div className="py-12 text-center text-[9px] font-black text-muted-foreground/20 uppercase tracking-widest">No data</div>
        ) : data.map((item, i) => {
          const isTop = i < 3;
          const mc = ["text-amber-400", "text-slate-300", "text-orange-400"];
          return (
            <div key={i}
              className={cn(
                "grid grid-cols-[24px_1fr_32px_80px] items-start px-4 py-2.5 border-b border-border/[0.07] last:border-0 transition-colors",
                isTop ? "bg-muted/10" : "hover:bg-muted/20"
              )}
            >
              {/* Rank */}
              <div className="pt-0.5">
                {isTop
                  ? <Medal className={cn("w-3.5 h-3.5", mc[i])} />
                  : <span className="text-[8px] font-black text-muted-foreground/20">#{i + 1}</span>
                }
              </div>

              {/* Name — wraps freely, no truncation */}
              <span className="text-[11px] font-semibold leading-snug pr-2 break-words whitespace-normal min-w-0">
                {item._id || "—"}
              </span>

              {/* Count */}
              <span className="text-[10px] font-black tabular-nums text-center text-muted-foreground/60 pt-0.5">{item.count}</span>

              {/* Amount */}
              <span className={cn("text-[12px] font-black tabular-nums text-right pt-0.5",
                type === "debit" ? "text-destructive" : "text-emerald-600")}>
                {sym}{item.amount >= 1000
                  ? new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(item.amount)
                  : item.amount.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer total */}
      <div className="px-4 py-2 border-t border-border/30 bg-muted/5 flex justify-between items-center shrink-0">
        <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40">Total ({data.length} entries)</span>
        <span className={cn("text-sm font-black tabular-nums", type === "debit" ? "text-destructive" : "text-emerald-600")}>
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
  if (loading) return <div className="bg-card border border-border h-[300px] animate-pulse" />;
  return (
    // Fixed height so inner scroll always works on any screen size
    <div className="bg-card border border-border flex flex-col overflow-hidden h-[300px]">
      <div className={cn("h-0.5 shrink-0", isRed ? "bg-destructive/40" : "bg-emerald-500/40")} />
      <div className="px-4 py-2.5 border-b border-border/30 bg-muted/5 shrink-0">
        <h3 className={cn("text-[10px] font-black uppercase tracking-[0.15em]", isRed ? "text-destructive" : "text-emerald-600")}>{title}</h3>
        <p className="text-[7px] font-bold text-muted-foreground/40 uppercase mt-0.5">{sub}</p>
      </div>
      {/* flex-1 + overflow-y-auto = scrollable list fills remaining height */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-border/10 min-h-0">
        {txs.length === 0 ? (
          <div className="py-8 text-center text-[9px] font-black text-muted-foreground/20 uppercase tracking-widest">No transactions</div>
        ) : txs.map((tx, i) => {
          const debit = (tx.debit || 0) > 0;
          return (
            <div key={tx._id || i} className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/30 transition-colors">
              <div className={cn("w-7 h-7 shrink-0 flex items-center justify-center border",
                debit ? "bg-destructive/5 border-destructive/10 text-destructive" : "bg-emerald-500/5 border-emerald-500/10 text-emerald-600")}>
                {debit ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black leading-snug break-words whitespace-normal">{tx.description || tx.payee}</p>
                <p className="text-[7px] font-bold text-muted-foreground/40 uppercase mt-0.5">{tx.date} · {tx.bank}</p>
              </div>
              <span className={cn("shrink-0 text-[11px] font-black tabular-nums", debit ? "text-destructive" : "text-emerald-600")}>
                {sym}{(tx.debit || tx.credit).toLocaleString()}
              </span>
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
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-500">
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
             <p className="text-lg font-black text-purple-500">
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
                     {isUrgent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}
                     
                     <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 border transition-colors",
                        isUrgent ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-purple-500/5 text-purple-600 border-purple-500/10 group-hover/sub:bg-purple-500/10 group-hover/sub:border-purple-500/30"
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
                           <p className={cn("text-[8px] font-black uppercase tracking-widest shrink-0", isUrgent ? "text-red-500" : "text-muted-foreground")}>
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
    <div className="w-full overflow-hidden bg-card border border-border py-2 flex items-center relative mb-1 -mt-2 group">
       <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
       <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />
       
       <div className="flex whitespace-nowrap animate-marquee w-max group-hover:[animation-play-state:paused]">
         {/* Duplicate twice to allow seamless 50% translation */}
         {[...items, ...items].map((item, idx) => (
           <div key={`${item.id}-${idx}`} className="flex items-center mx-6 gap-2.5">
              <span className={cn(
                 "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm tracking-widest",
                 item.type === "EMI" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-purple-500/10 text-purple-500 border border-purple-500/20"
              )}>{item.type}</span>
              <span className="text-[11px] font-bold text-foreground">{item.name}</span>
              <span className="text-[11px] font-black tabular-nums">{sym}{item.amount.toLocaleString()}</span>
              <span className={cn("text-[9px] font-black uppercase tracking-widest", item.days <= 3 ? "text-red-500" : "text-muted-foreground")}>
                 {item.days === 0 ? "Due Today" : `in ${item.days}d`}
              </span>
              <span className="text-muted-foreground/20 ml-6 text-xs">•</span>
           </div>
         ))}
       </div>
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

        {/* ── Financial Ticker ────────────────────────────────────────────── */}
        <FinancialMarquee sym={sym} />

        {/* ── KPI cards + Wallet ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <StatCard title="Balance" value={fmt(totalBalance, sym)} icon={<Wallet className="w-4 h-4" />} colorType="primary" loading={loading} />
          <StatCard title="Money In" value={fmt(txData.total_credit, sym)} icon={<ArrowDownRight className="w-4 h-4" />} colorType="emerald" loading={loading} />
          <StatCard title="Money Out" value={fmt(txData.total_debit, sym)} icon={<ArrowUpRight className="w-4 h-4" />} colorType="destructive" loading={loading} />
          <StatCard title="Transactions" value={fmt(txData.count, "")} icon={<Activity className="w-4 h-4" />} colorType="amber" loading={loading} />
          <div className="col-span-2 sm:col-span-1 min-h-[130px]">
            <WalletCard balance={walletBalance} currencySymbol={sym} loading={loading} />
          </div>
        </div>

        {/* ── Net insight banner ───────────────────────────────────────────── */}
        <div className={cn("w-full border px-4 py-3 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 relative overflow-hidden",
          net >= 0 ? "border-emerald-500/20 bg-emerald-500/5" : "border-destructive/20 bg-destructive/5")}>
          <div className="absolute right-3 opacity-5 pointer-events-none">
            {net >= 0 ? <TrendingUp className="w-16 h-16 text-emerald-500" /> : <TrendingDown className="w-16 h-16 text-destructive" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Overall</p>
            <h3 className="text-sm font-black mt-0.5 break-words">{net >= 0 ? "✅ You're saving money" : "⚠️ Spent more than earned"}</h3>
            <p className="text-[9px] text-muted-foreground/60 font-bold break-words">
              {net >= 0 ? `${sym}${Math.abs(net).toLocaleString()} more earned than spent` : `${sym}${Math.abs(net).toLocaleString()} more spent than earned`}
            </p>
          </div>
          <div className="shrink-0">
            <p className="text-[7px] font-black text-muted-foreground/40 uppercase">Net</p>
            <p className={cn("text-2xl font-black tabular-nums", net >= 0 ? "text-emerald-500" : "text-destructive")}>
              {net >= 0 ? "+" : "-"}{sym}{Math.abs(net).toLocaleString()}
            </p>
          </div>
        </div>

        {/* ── Metals Section (Promoted to 3-card Row) ────────────────────── */}
        <MetalsWidget sym={sym} />

        {/* ── Other Asset widgets ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          <PropertyWidget sym={sym} />
          <LendBorrowWidget sym={sym} />
          <EMIWidget sym={sym} />
        </div>

        {/* ── 3 charts row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <BudgetComparisonGraph budgetData={stats?.budget_trend} currencySymbol={sym} loading={loading} />
          <SpendingPulseGraph trendData={monthlyTrend} totalSpend={txData.total_debit} currencySymbol={sym} loading={loading} />
          <IncomeTrendGraph trendData={monthlyTrend} totalIncome={txData.total_credit} currencySymbol={sym} loading={loading} />
        </div>

        {/* ── Bounty board ────────────────────────────────────────────────────── */}
        <BountyBoard items={stats?.top_budget_items} sym={sym} loading={loading} />

        {/* ── Income source + Leaderboards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Primary income hero */}
          <div className="bg-gradient-to-br from-amber-600/20 via-card to-background border-2 border-amber-500/20 p-5 flex flex-col items-center justify-center text-center relative overflow-hidden hover:border-amber-500/50 transition-all duration-500 group min-h-[200px] md:min-h-[260px]">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-all duration-700">
              <Star className="w-48 h-48 -rotate-12" />
            </div>
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-500 mb-3">
              <Trophy className="w-6 h-6 text-amber-500 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
            </div>
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-amber-600/60 mb-2">Main Income Source</p>
            <p className="text-xl font-black tracking-tight mb-3 underline decoration-amber-500/40 underline-offset-4 break-words w-full">
              {stats?.top_income_source?.source || "N/A"}
            </p>
            <p className="text-[7px] font-black uppercase tracking-widest text-foreground/30 mb-1">Total Earned</p>
            <p className="text-3xl font-black text-amber-600 tabular-nums break-all">{sym}{stats?.top_income_source?.amount?.toLocaleString() || "0"}</p>
          </div>
          <LeaderboardWidget title="Where Money Goes" data={topDebits} sym={sym} loading={loading} type="debit" />
          <LeaderboardWidget title="Where Money Comes From" data={topCredits} sym={sym} loading={loading} type="credit" />
        </div>

        {/* ── Recent txs + quick stats ─────────────────────────────────────── */}
        {/* Each item is self-contained with its own height — no overlap at any breakpoint */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {/* Recent Payments */}
          <RecentList txs={recentDebit} sym={sym} loading={loading} title="Recent Payments" sub="Last 15 money-out" color="red" />

          {/* Recent Income */}
          <RecentList txs={recentCredit} sym={sym} loading={loading} title="Recent Income" sub="Last 15 money-in" color="green" />

          {/* Quick stat cards — always 2-col grid, stacks below lists on small screens */}
          <div className="grid grid-cols-2 gap-2 content-start sm:col-span-2 xl:col-span-1">
            <MiniCard title="Biggest Payment" value={fmt(stats?.highest_payment?.amount || 0, sym)} sub={stats?.highest_payment?.name} icon={<Zap className="w-4 h-4 text-destructive" />} border="border-l-destructive/50" loading={loading} />
            <MiniCard title="Biggest Income" value={fmt(stats?.highest_income?.amount || 0, sym)} sub={stats?.highest_income?.name} icon={<Sparkles className="w-4 h-4 text-emerald-500" />} border="border-l-emerald-500/50" loading={loading} />
            <MiniCard title="Common Amount" value={fmt(stats?.frequent_amount?.amount || 0, sym)} sub={`Used ${stats?.frequent_amount?.count}x`} icon={<Repeat className="w-4 h-4 text-amber-500" />} border="border-l-amber-500/50" loading={loading} />
            <MiniCard title="Top Contact" value={stats?.frequent_spender?.name || "N/A"} sub={`${stats?.frequent_spender?.count} txns`} icon={<Target className="w-4 h-4 text-indigo-500" />} border="border-l-indigo-500/50" loading={loading} />
          </div>
        </div>
        {/* ── Subscriptions Row ────────────────────────────────────────────── */}
        <div className="w-full">
           <SubscriptionsWidget sym={sym} />
        </div>

        {/* ── Bank balance breakdown ────────────────────────────────────────── */}
        <BankBreakdownWidget banks={banks} sym={sym} loading={loading} />

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
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </AdminPageLayout>
  );
}
