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
  gold: { label: "Gold", icon: "Au", emoji: "🥇", bg: "from-yellow-950 via-yellow-900 to-amber-900", border: "border-yellow-600/40", shine: "from-yellow-400/30 via-transparent to-transparent", text: "text-yellow-300", sub: "text-yellow-500/70" },
  silver: { label: "Silver", icon: "Ag", emoji: "🥈", bg: "from-slate-800 via-slate-700 to-zinc-800", border: "border-slate-400/30", shine: "from-slate-300/25 via-transparent to-transparent", text: "text-slate-200", sub: "text-slate-400/70" },
  platinum: { label: "Platinum", icon: "Pt", emoji: "💎", bg: "from-indigo-950 via-slate-800 to-indigo-900", border: "border-indigo-400/30", shine: "from-indigo-300/20 via-transparent to-transparent", text: "text-indigo-200", sub: "text-indigo-400/70" },
  diamond: { label: "Diamond", icon: "Dm", emoji: "💠", bg: "from-cyan-950 via-sky-900 to-blue-900", border: "border-cyan-400/30", shine: "from-cyan-300/25 via-transparent to-transparent", text: "text-cyan-200", sub: "text-cyan-400/70" },
  palladium: { label: "Palladium", icon: "Pd", emoji: "⚪", bg: "from-neutral-800 via-zinc-700 to-neutral-900", border: "border-neutral-400/30", shine: "from-neutral-300/20 via-transparent to-transparent", text: "text-neutral-200", sub: "text-neutral-400/70" },
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
    icon: fallbackLabel.substring(0, 2).charAt(0).toUpperCase() + fallbackLabel.substring(1, 2).toLowerCase(),
    emoji: "💰",
    bg: "from-amber-950 via-amber-900 to-orange-900",
    border: "border-amber-500/30",
    shine: "from-amber-300/20 via-transparent to-transparent",
    text: "text-amber-200",
    sub: "text-amber-400/70",
  };
}

function MetalCard({ g, sym }: { g: any; sym: string }) {
  const cfg = getMetalCfg(g.type, g.name);
  const gain = g.curr - g.inv;
  const pct = g.inv > 0 ? ((gain / g.inv) * 100).toFixed(1) : "0.0";
  const isGain = gain >= 0;

  return (
    <div className={cn(
      "relative overflow-hidden border flex flex-col justify-between p-0 group cursor-default",
      "transition-all duration-500 hover:-translate-y-0.5 hover:shadow-xl",
      `bg-gradient-to-br ${cfg.bg}`, cfg.border
    )}>
      {/* Shine sweep overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-br pointer-events-none", cfg.shine)} />
      {/* Shimmer line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -inset-x-full top-0 bottom-0 w-[200%] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.2s] ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Top section */}
      <div className="relative z-10 px-3 pt-3 pb-2 flex items-start justify-between">
        <div>
          {/* Metal symbol badge */}
          <div className={cn("inline-flex items-center justify-center w-8 h-8 rounded-none border text-[11px] font-black mb-1.5", cfg.border, cfg.text,
            "bg-black/20 backdrop-blur-sm")}
          >
            {cfg.icon.length <= 2 ? cfg.icon : "M"}
          </div>
          <p className={cn("text-[8px] font-black uppercase tracking-[0.2em]", cfg.sub)}>{cfg.label}</p>
        </div>
        {/* Big decorative emoji */}
        <span className="text-3xl sm:text-4xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 select-none leading-none pt-1">
          {cfg.emoji}
        </span>
      </div>

      {/* Value */}
      <div className="relative z-10 px-3 pb-1 min-w-0">
        <p className={cn("text-lg sm:text-xl font-black tabular-nums tracking-tight truncate", cfg.text)}>
          {sym}{Math.round(g.curr).toLocaleString()}
        </p>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 px-3 py-2 mt-1 border-t border-white/10 flex items-center justify-between gap-2">
        <span className={cn("text-[8px] font-bold", cfg.sub)}>
          {g.grams >= 1000 ? `${(g.grams / 1000).toFixed(2)}kg` : `${g.grams.toFixed(1)}g`}
        </span>
        <span className={cn("text-[9px] font-black tabular-nums", isGain ? "text-emerald-400" : "text-red-400")}>
          {isGain ? "▲" : "▼"} {Math.abs(Number(pct))}%
        </span>
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
        const g = Object.values(map);
        setGroups(g);
        setTotalVal(g.reduce((s, x) => s + x.curr, 0));
        setTotalGain(g.reduce((s, x) => s + (x.curr - x.inv), 0));
      } catch { }
      setBusy(false);
    })();
  }, []);

  return (
    <div className="bg-card border border-border flex flex-col overflow-hidden h-[360px] lg:h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40 shrink-0 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <Gem className="w-3.5 h-3.5 text-yellow-500" />
          <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] hidden sm:inline">Metal Portfolio</span>
          <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] sm:hidden">Metals</span>
        </div>
        <div className="text-right min-w-0">
          <p className="text-[7px] font-black text-muted-foreground/40 uppercase">Total Value</p>
          <p className="text-xs font-black tabular-nums break-all">{sym}{Math.round(totalVal).toLocaleString()}</p>
        </div>
      </div>

      {/* Cards */}
      {busy ? (
        <div className="flex items-center justify-center p-6 min-h-[120px]">
          <Activity className="w-5 h-5 text-yellow-500 animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex items-center justify-center p-6 opacity-30 min-h-[100px]">
          <p className="text-[9px] font-black uppercase tracking-widest text-center">No metals added yet</p>
        </div>
      ) : (
        /* Always stack in exactly 1 column per user request, now perfectly scrollable */
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-2 min-h-0">
          {groups.map(g => <MetalCard key={g.type} g={g} sym={sym} />)}
        </div>
      )}

      {/* Footer gain/loss */}
      <div className="px-3 py-2 border-t border-border/20 flex justify-between items-center bg-muted/5 shrink-0 mt-auto">
        <span className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-widest">Overall Gain / Loss</span>
        <span className={cn("text-xs font-black tabular-nums", totalGain >= 0 ? "text-emerald-500" : "text-destructive")}>
          {totalGain >= 0 ? "+" : "-"}{sym}{Math.round(Math.abs(totalGain)).toLocaleString()}
        </span>
      </div>
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

  return (
    <div className="bg-card border border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Property</span>
        </div>
        <div className="text-right">
          <p className="text-[7px] font-black text-muted-foreground/40 uppercase">{props.length} {props.length === 1 ? "asset" : "assets"}</p>
          <p className="text-xs font-black tabular-nums">{sym}{Math.round(totalPortfolio).toLocaleString()}</p>
        </div>
      </div>

      {busy ? (
        <div className="flex items-center justify-center py-5">
          <Activity className="w-4 h-4 text-emerald-500 animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex items-center justify-center py-5 opacity-30">
          <p className="text-[9px] font-black uppercase tracking-widest">No properties yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border/10">
          {sorted.map((p) => {
            const val = p.current_value || p.purchase_price;
            const gain = p.purchase_price > 0 ? ((val - p.purchase_price) / p.purchase_price) * 100 : null;
            const isGain = gain !== null && gain >= 0;
            return (
              <div key={p._id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/10 transition-colors">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title || p.name} className="w-7 h-7 object-cover shrink-0 rounded-[2px]" />
                ) : (
                  <div className="w-7 h-7 shrink-0 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black truncate leading-tight">{p.title || p.name}</p>
                  <p className="text-[7px] font-bold text-muted-foreground/40 uppercase tracking-widest">{p.type}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-black tabular-nums text-emerald-500">{sym}{Math.round(val).toLocaleString()}</p>
                  {gain !== null && (
                    <p className={cn("text-[9px] font-black tabular-nums", isGain ? "text-emerald-400" : "text-destructive")}>
                      {isGain ? "+" : ""}{gain.toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            );
          })}
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
        setSummary(await sR.json());
        const lj = await lR.json(); setLent((lj.items || []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        const bj = await bR.json(); setBor((bj.items || []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      } catch { }
      setBusy(false);
    })();
  }, []);

  const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

  return (
    <div className="bg-card border border-border flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <HandCoins className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Money Tracker</span>
        </div>
      </div>

      {busy ? (
        <div className="flex items-center justify-center py-5">
          <Activity className="w-4 h-4 text-orange-500 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 border-b border-border/20">
            <div className="px-3 py-2 border-r border-border/20 min-w-0">
              <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">They owe me</p>
              <p className="text-sm font-black tabular-nums break-all">{sym}{Math.round(summary?.pending_lent || 0).toLocaleString()}</p>
              <p className="text-[7px] text-muted-foreground/40 font-bold">{lent.length} people</p>
            </div>
            <div className="px-3 py-2 min-w-0">
              <p className="text-[7px] font-black text-destructive uppercase tracking-widest">I owe them</p>
              <p className="text-sm font-black text-destructive tabular-nums break-all">{sym}{Math.round(summary?.pending_borrowed || 0).toLocaleString()}</p>
              <p className="text-[7px] text-muted-foreground/40 font-bold">{bor.length} people</p>
            </div>
          </div>

          <div className="divide-y divide-border/10">
            {lent.slice(0, 4).map((item: any) => {
              const d = daysSince(item.date); const old = d > 30;
              return (
                <div key={item._id} className={cn("flex items-center justify-between px-3 py-1.5", old && "bg-red-500/5")}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {old && <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-[10px] font-black truncate">{item.name}</p>
                      <p className="text-[7px] text-muted-foreground/40 font-bold">{d}d ago</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-emerald-500 tabular-nums shrink-0 ml-2">{sym}{Math.round(item.amount).toLocaleString()}</span>
                </div>
              );
            })}
            {bor.slice(0, 3).map((item: any) => (
              <div key={item._id} className="flex items-center justify-between px-3 py-1.5 bg-destructive/5">
                <div className="min-w-0">
                  <p className="text-[10px] font-black truncate">{item.name}</p>
                  <p className="text-[7px] text-muted-foreground/40 font-bold">{daysSince(item.date)}d ago</p>
                </div>
                <span className="text-[11px] font-black text-destructive tabular-nums shrink-0 ml-2">-{sym}{Math.round(item.amount).toLocaleString()}</span>
              </div>
            ))}
            {lent.length === 0 && bor.length === 0 && (
              <div className="py-4 flex flex-col items-center gap-1 opacity-30">
                <CheckCircle2 className="w-5 h-5" />
                <p className="text-[8px] font-black uppercase tracking-widest">All settled!</p>
              </div>
            )}
          </div>
        </>
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

// ─── Goals Widget ──────────────────────────────────────────────────────────────
function GoalsWidget({ sym }: { sym: string }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({ current_monthly_savings: 0, total_saved: 0, total_target: 0 });
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const tok = localStorage.getItem("token"); if (!tok) return;
    fetch(`${API_BASE_URL}/goals/`, { headers: { Authorization: `Bearer ${tok}` } })
      .then(r => r.json()).then(j => { setGoals(j.goals || []); setMetrics(j.metrics || {}); setBusy(false); })
      .catch(() => setBusy(false));
  }, []);

  const overallPct = metrics.total_target > 0 ? Math.min(100, (metrics.total_saved / metrics.total_target) * 100) : 0;

  return (
    <div className="bg-card border border-border flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-start justify-between px-4 py-3 border-b border-border/40 shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-pink-500" />
          <span className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em]">Savings Goals</span>
        </div>
        <div className="text-right min-w-0">
          <p className="text-[7px] font-black text-muted-foreground/40 uppercase">Total</p>
          <p className="text-xs font-black tabular-nums text-pink-400 break-all">{sym}{Math.round(metrics.total_saved || 0).toLocaleString()} / {sym}{Math.round(metrics.total_target || 0).toLocaleString()}</p>
        </div>
      </div>
      {busy ? (
        <div className="flex items-center justify-center p-6 min-h-[100px]"><Activity className="w-5 h-5 text-pink-500 animate-spin" /></div>
      ) : goals.length === 0 ? (
        <div className="py-8 flex flex-col items-center gap-2 opacity-30">
          <PiggyBank className="w-8 h-8" />
          <p className="text-[8px] font-black uppercase tracking-widest">No goals yet</p>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-4">
          {/* Overall ring */}
          <div className="flex items-center gap-4 p-3 bg-pink-500/5 border border-pink-500/20">
            <div className="relative w-14 h-14 shrink-0">
              <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3"
                  strokeDasharray={`${overallPct * 0.942} 94.2`} className="text-pink-500 transition-all duration-1000" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-pink-400">{Math.round(overallPct)}%</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[7px] font-black text-muted-foreground/40 uppercase">Overall Progress</p>
              <p className="text-lg font-black tabular-nums">{sym}{Math.round(metrics.total_saved || 0).toLocaleString()}</p>
              <p className="text-[8px] text-muted-foreground/40">of {sym}{Math.round(metrics.total_target || 0).toLocaleString()} target</p>
            </div>
            {(metrics.current_monthly_savings || 0) > 0 && (
              <div className="text-right shrink-0">
                <p className="text-[7px] font-black text-muted-foreground/40 uppercase">Saving</p>
                <p className="text-xs font-black text-emerald-400 tabular-nums">{sym}{Math.round(metrics.current_monthly_savings).toLocaleString()}<span className="text-[7px]">/mo</span></p>
              </div>
            )}
          </div>
          {/* Individual goals */}
          {goals.map((g: any) => {
            const pct = g.percentage || 0;
            const done = pct >= 100;
            return (
              <div key={g.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn("w-2 h-2 shrink-0", done ? "bg-emerald-500" : "bg-pink-500")} />
                    <p className="text-[11px] font-black truncate">{g.name}</p>
                    {done && <span className="text-[8px] font-black text-emerald-500 shrink-0">✓</span>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-black tabular-nums">{sym}{Math.round(g.current_amount).toLocaleString()}</p>
                    <p className="text-[7px] text-muted-foreground/40">{Math.round(pct)}%</p>
                  </div>
                </div>
                <div className="w-full bg-muted/30 h-1.5 overflow-hidden">
                  <div className={cn("h-1.5 transition-all duration-1000", done ? "bg-emerald-500" : "bg-pink-500")} style={{ width: `${pct}%` }} />
                </div>
                {g.eta_date && !done && (
                  <p className="text-[7px] text-muted-foreground/30 font-bold">ETA: {g.eta_date} &middot; {sym}{Math.round(g.target_amount - g.current_amount).toLocaleString()} left</p>
                )}
              </div>
            );
          })}
        </div>
      )}
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
  const renewingSoon = sorted.filter(s => (s.days_until_billing ?? 999) <= 7);
  const CAT_COLORS: Record<string, string> = {
    Streaming: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Utilities: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Food: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Software: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    Finance: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Other: "bg-muted/40 text-muted-foreground border-border/40",
  };

  return (
    <div className="bg-card border border-border flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-border/40 shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-purple-500" />
          <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">Subscriptions</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {renewingSoon.length > 0 && (
            <span className="flex items-center gap-1 text-[8px] font-black text-amber-500 animate-pulse">
              <BellRing className="w-3 h-3" />{renewingSoon.length} renewing soon
            </span>
          )}
          <div className="text-right">
            <p className="text-[7px] font-black text-muted-foreground/40 uppercase">Monthly</p>
            <p className="text-xs font-black tabular-nums text-purple-400">{sym}{Math.round(totalMonthly).toLocaleString()}</p>
          </div>
        </div>
      </div>
      {busy ? (
        <div className="flex items-center justify-center p-6 min-h-[80px]"><Activity className="w-5 h-5 text-purple-500 animate-spin" /></div>
      ) : sorted.length === 0 ? (
        <div className="py-6 flex flex-col items-center gap-1 opacity-30">
          <RefreshCw className="w-6 h-6" />
          <p className="text-[8px] font-black uppercase tracking-widest">No subscriptions</p>
        </div>
      ) : (
        <>
          {renewingSoon.length > 0 && (
            <div className="px-3 pt-3 flex flex-col gap-1.5 shrink-0">
              {renewingSoon.map(s => (
                <div key={s._id} className="relative overflow-hidden border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500" />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <BellRing className="w-3 h-3 text-amber-500 shrink-0" />
                      <p className="text-[10px] font-black truncate">{s.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[8px] font-bold text-amber-500">{s.days_until_billing === 0 ? "TODAY" : `in ${s.days_until_billing}d`}</span>
                      <span className="text-[11px] font-black tabular-nums">{sym}{s.amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="divide-y divide-border/10 max-h-[280px] overflow-y-auto custom-scrollbar">
            {sorted.map(s => {
              const catKey = Object.keys(CAT_COLORS).find(k => s.category?.toLowerCase().includes(k.toLowerCase())) || "Other";
              return (
                <div key={s._id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-muted/10 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-black truncate">{s.name}</p>
                      <span className={cn("text-[7px] font-bold px-1 py-0.5 border shrink-0", CAT_COLORS[catKey])}>{s.category}</span>
                    </div>
                    <p className="text-[7px] text-muted-foreground/40 mt-0.5">Day {s.billing_day} every month</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-black tabular-nums">{sym}{s.amount.toLocaleString()}</p>
                    <p className="text-[7px] text-muted-foreground/30">{s.days_until_billing}d away</p>
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
            <span className="hidden sm:inline">Most Expensive Habits</span>
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

        {/* ── Asset widgets (1-col mobile → 2-col sm → 4-col xl) ─────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
          <MetalsWidget sym={sym} />
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

        {/* ── Goals + Subscriptions ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <GoalsWidget sym={sym} />
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
      `}</style>
    </AdminPageLayout>
  );
}
