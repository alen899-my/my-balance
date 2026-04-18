"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/common/Modal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailySpending { [day: number]: number; }
interface CalendarSummary {
  month: number; year: number;
  daily_spending: DailySpending; needs: Need[];
}
interface Need { id: string; name: string; amount: number; date: string; is_paid: boolean; }
interface BillCalendarProps { currencySymbol?: string; }

interface DayTransaction {
  _id: string;
  description: string;
  payee: string;
  debit: number;
  credit: number;
  balance?: number;
  type?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_FULL  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAY_CHAR  = ["S","M","T","W","T","F","S"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
const getFirstDay    = (y: number, m: number) => new Date(y, m - 1, 1).getDay();

function fmtAmt(n: number, sym: string) {
  if (n >= 100000) return `${sym}${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `${sym}${(n / 1000).toFixed(1)}K`;
  return `${sym}${n.toFixed(0)}`;
}

function fmtFull(n: number, sym: string) {
  return `${sym}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function tier(n: number, max: number) {
  if (n === 0) return 0;
  const r = n / max;
  if (r < 0.2) return 1;
  if (r < 0.45) return 2;
  if (r < 0.7) return 3;
  return 4;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IcoLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);
const IcoRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);
const IcoSpinner = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IcoClose = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);
const IcoFlame = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c0 0-7 6-7 13a7 7 0 0 0 14 0c0-7-7-13-7-13zm0 18a5 5 0 0 1-5-5c0-3.5 3-7.5 5-9.5 2 2 5 6 5 9.5a5 5 0 0 1-5 5z"/>
  </svg>
);

// ─── Tier colours ─────────────────────────────────────────────────────────────
// 0 = no spend, 1–4 = progressive intensity using our teal palette
const TIER_BG = [
  "",                                          // 0 – none (CSS handles default)
  "bg-[oklch(0.94_0.04_168)]  dark:bg-[oklch(0.20_0.04_168)]",   // 1 low
  "bg-[oklch(0.88_0.07_168)]  dark:bg-[oklch(0.24_0.07_168)]",   // 2 medium
  "bg-[oklch(0.78_0.10_168)]  dark:bg-[oklch(0.30_0.10_168)]",   // 3 high
  "bg-[oklch(0.65_0.12_168)]  dark:bg-[oklch(0.42_0.12_168)]",   // 4 peak
];
const TIER_AMOUNT_COLOR = [
  "",
  "text-[oklch(0.42_0.09_168)] dark:text-[oklch(0.72_0.10_168)]",
  "text-[oklch(0.38_0.09_168)] dark:text-[oklch(0.80_0.11_168)]",
  "text-[oklch(0.32_0.09_168)] dark:text-[oklch(0.90_0.11_168)]",
  "text-white                  dark:text-white",
];

// ─── Day Cell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  day: number; spending: number; maxSpend: number;
  isToday: boolean; isSelected: boolean; isWeekend: boolean;
  isPeak: boolean; currencySymbol: string; onClick: () => void;
}

function DayCell({ day, spending, maxSpend, isToday, isSelected, isWeekend, isPeak, currencySymbol, onClick }: DayCellProps) {
  const t = tier(spending, maxSpend);
  const hasSpend = spending > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col rounded-xl border overflow-hidden",
        "transition-all duration-200 cursor-pointer select-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        // sizing
        "min-h-[3.2rem] sm:min-h-[5rem]",
        // selected overrides everything
        isSelected
          ? "bg-[var(--primary)] border-[var(--primary)] shadow-lg shadow-primary/30 scale-[1.04] z-10"
          : isToday
          ? "border-primary/60 bg-primary/6 dark:bg-primary/10 shadow-[inset_0_0_0_1.5px_var(--primary)]"
          : hasSpend
          ? cn(TIER_BG[t], "border-transparent")
          : "bg-card border-border/60 hover:border-primary/30 hover:bg-primary/4"
      )}
    >
      {/* ── Date number ── */}
      <div className={cn(
        "flex items-start justify-between px-1 pt-1 sm:px-2 sm:pt-2",
      )}>
        <span className={cn(
          "font-black leading-none tabular-nums",
          "text-base sm:text-xl",
          isSelected
            ? "text-white"
            : isToday
            ? "text-primary"
            : isWeekend
            ? "text-[oklch(0.55_0.13_25)] dark:text-[oklch(0.72_0.14_25)]"
            : "text-foreground",
        )}>
          {day}
        </span>

        {/* Peak flame badge */}
        {isPeak && !isSelected && (
          <span className="text-amber-500 dark:text-amber-400 opacity-80">
            <IcoFlame />
          </span>
        )}

        {/* Today dot */}
        {isToday && !isSelected && (
          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-0.5" />
        )}
      </div>

      {/* ── Spend amount ── */}
      {hasSpend && (
        <div className="px-1 sm:px-2 pb-1 sm:pb-2 mt-auto">
          <span className={cn(
            "text-[8px] sm:text-[10px] font-bold leading-none block line-clamp-1",
            isSelected
              ? "text-white/90"
              : TIER_AMOUNT_COLOR[t],
          )}>
            {fmtAmt(spending, currencySymbol)}
          </span>
        </div>
      )}

      {/* ── Heat fill bar from bottom ── */}
      {hasSpend && !isSelected && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 transition-all duration-500",
            t === 4 ? "opacity-30" : "opacity-25",
            "bg-primary rounded-b-xl"
          )}
          style={{ height: `${Math.min(70, Math.max(10, (spending / maxSpend) * 70))}%` }}
        />
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BillCalendar({ currencySymbol = "₹" }: BillCalendarProps) {
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [monthValue, setMonthValue] = useState(todayValue);
  const year  = Number(monthValue.split("-")[0]);
  const month = Number(monthValue.split("-")[1]);

  const [data,       setData]       = useState<CalendarSummary | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // ── Day modal state ────────────────────────────────────────────────────────
  const [modalOpen,    setModalOpen]    = useState(false);
  const [modalDay,     setModalDay]     = useState<number | null>(null);
  const [modalTxns,    setModalTxns]    = useState<DayTransaction[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const toMV = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;

  // ── Fetch day transactions ─────────────────────────────────────────────────
  const openDayModal = useCallback(async (day: number) => {
    setModalDay(day);
    setModalOpen(true);
    setModalLoading(true);
    setModalTxns([]);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const pad = (n: number) => String(n).padStart(2, "0");
      const dateStr = `${year}-${pad(month)}-${pad(day)}`;
      const params = new URLSearchParams({
        start_date: dateStr,
        end_date:   dateStr,
        limit:      "200",
        sort:       "desc",
      });
      const res = await fetch(`${API_BASE_URL}/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setModalTxns(Array.isArray(json.data) ? json.data : []);
    } catch {
      setModalTxns([]);
    } finally {
      setModalLoading(false);
    }
  }, [year, month]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(
        `${API_BASE_URL}/calendar/summary?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setData({ month, year, daily_spending: {}, needs: [] });
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goPrev = () => { const nm = month === 1 ? 12 : month - 1; const ny = month === 1 ? year - 1 : year; setMonthValue(toMV(ny, nm)); setSelectedDay(null); };
  const goNext = () => { const nm = month === 12 ? 1 : month + 1; const ny = month === 12 ? year + 1 : year; setMonthValue(toMV(ny, nm)); setSelectedDay(null); };
  const goToday = () => { setMonthValue(todayValue); setSelectedDay(today.getDate()); };

  // ── Derived ────────────────────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDay(year, month);
  const spending    = data?.daily_spending ?? {};
  const maxSpend    = Math.max(1, ...Object.values(spending));
  const totalSpend  = Object.values(spending).reduce((a, b) => a + b, 0);
  const spendDays   = Object.values(spending).filter(v => v > 0).length;
  const avgSpend    = spendDays ? totalSpend / spendDays : 0;
  const peakDay     = Object.keys(spending).reduce<number | null>((b, k) => (!b || spending[+k] > spending[b]) ? +k : b, null);
  const isCurrentMonth = monthValue === todayValue;

  // grid
  const cells: Array<{ type: "empty" | "day"; day?: number; dayOfWeek?: number }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ type: "empty" });
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (firstDay + d - 1) % 7;
    cells.push({ type: "day", day: d, dayOfWeek: dow });
  }
  const rem = cells.length % 7;
  if (rem > 0) for (let i = 0; i < 7 - rem; i++) cells.push({ type: "empty" });

  const selSpend = selectedDay != null ? (spending[selectedDay] ?? 0) : null;
  const selDOW   = selectedDay != null ? (firstDay + selectedDay - 1) % 7 : null;

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = [
    {
      label: "Total Spent",
      value: fmtFull(totalSpend, currencySymbol),
      sub: `${spendDays} active days`,
      accent: "from-red-500/15 to-red-500/5 border-red-500/20",
      dot: "bg-red-500",
      valcls: "text-red-500 dark:text-red-400",
    },
    {
      label: "Daily Average",
      value: fmtFull(avgSpend, currencySymbol),
      sub: "per spend day",
      accent: "from-amber-500/15 to-amber-500/5 border-amber-500/20",
      dot: "bg-amber-500",
      valcls: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Peak Day",
      value: peakDay ? fmtFull(spending[peakDay] ?? 0, currencySymbol) : "—",
      sub: peakDay ? `${MONTH_SHORT[month - 1]} ${peakDay}, ${year}` : "no data yet",
      accent: "from-primary/15 to-primary/5 border-primary/20",
      dot: "bg-primary",
      valcls: "text-primary",
    },
    {
      label: "Coverage",
      value: `${spendDays}/${daysInMonth}`,
      sub: `${Math.round((spendDays / daysInMonth) * 100)}% of month`,
      accent: "from-violet-500/15 to-violet-500/5 border-violet-500/20",
      dot: "bg-violet-500",
      valcls: "text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="bc-root flex flex-col gap-5 lg:gap-6 w-full">

      {/* ══════════════════════════════════════════════════════════════════════
          CALENDAR CARD
          ══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-lg dark:shadow-black/30">

        {/* ── Rich header ── */}
        <div
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--dt-header-from) 0%, var(--dt-header-to) 100%)",
          }}
        >
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white/5" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 sm:px-8 py-5 sm:py-6">

            {/* Month + Year display */}
            <div className="flex flex-col gap-0.5">
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                Bill Calendar
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                  {MONTH_NAMES[month - 1]}
                </span>
                <span className="text-lg sm:text-xl font-bold text-white/50 leading-none">
                  {year}
                </span>
              </div>
              {!loading && totalSpend > 0 && (
                <span className="text-xs text-white/70 font-medium mt-1">
                  {fmtFull(totalSpend, currencySymbol)} spent this month
                </span>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {loading && <span className="text-white/50"><IcoSpinner /></span>}

              {!isCurrentMonth && (
                <button
                  onClick={goToday}
                  className="h-8 px-3 rounded-lg text-[11px] font-bold border border-white/20 text-white/80 bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Today
                </button>
              )}

              <button onClick={goPrev} aria-label="Previous month"
                className="h-9 w-9 rounded-xl border border-white/15 bg-white/8 hover:bg-white/18 text-white transition-colors flex items-center justify-center">
                <IcoLeft />
              </button>

              <input
                type="month"
                value={monthValue}
                onChange={e => { if (e.target.value) { setMonthValue(e.target.value); setSelectedDay(null); } }}
                className="h-9 px-3 rounded-xl text-sm font-bold border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer [color-scheme:dark]"
              />

              <button onClick={goNext} aria-label="Next month"
                className="h-9 w-9 rounded-xl border border-white/15 bg-white/8 hover:bg-white/18 text-white transition-colors flex items-center justify-center">
                <IcoRight />
              </button>
            </div>
          </div>

          {/* Stats strip inside header */}
          <div className="relative grid grid-cols-2 sm:grid-cols-4 border-t border-white/10">
            {stats.map((s, i) => (
              <div key={i} className={cn(
                "flex flex-col gap-0.5 px-3 sm:px-5 py-2.5 sm:py-3",
                i % 2 === 0 && "border-r border-white/10",
                i === 1 && "sm:border-r sm:border-white/10",
                i < 2 && "border-b border-white/10 sm:border-b-transparent"
              )}>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40">{s.label}</span>
                <span className={cn("text-xs sm:text-sm font-black tabular-nums leading-tight text-white")}>{s.value}</span>
                <span className="text-[9px] text-white/40 hidden sm:block">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Day-of-week header row ── */}
        <div className="grid grid-cols-7 bg-muted/40 dark:bg-muted/20 border-b border-border">
          {DAY_SHORT.map((d, i) => (
            <div key={d} className={cn(
              "text-center py-1.5 sm:py-3",
              "text-[9px] sm:text-[11px] font-black uppercase tracking-widest",
              i === 0 || i === 6
                ? "text-[oklch(0.55_0.13_25)] dark:text-[oklch(0.72_0.14_25)]"
                : "text-muted-foreground"
            )}>
              <span className="hidden sm:inline">{d}</span>
              <span className="inline sm:hidden">{DAY_CHAR[i]}</span>
            </div>
          ))}
        </div>

        {/* ── Calendar grid ── */}
        <div className={cn(
          "grid grid-cols-7 gap-1 sm:gap-2 p-1.5 sm:p-4",
          loading && "opacity-40 pointer-events-none"
        )}>
          {cells.map((cell, idx) => {
            if (cell.type === "empty") return (
              <div key={`e-${idx}`} className="min-h-[3.2rem] sm:min-h-[5rem] rounded-xl bg-muted/20 dark:bg-white/[0.02]" />
            );
            const d = cell.day!;
            const sp = spending[d] ?? 0;
            const isWeekend = cell.dayOfWeek === 0 || cell.dayOfWeek === 6;
            return (
              <DayCell
                key={d}
                day={d}
                spending={sp}
                maxSpend={maxSpend}
                isToday={isCurrentMonth && d === today.getDate()}
                isSelected={selectedDay === d}
                isWeekend={isWeekend}
                isPeak={d === peakDay}
                currencySymbol={currencySymbol}
                onClick={() => openDayModal(d)}
              />
            );
          })}
        </div>

        {/* ── Legend ── */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-border bg-muted/20 flex-wrap">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Spend</span>
            {[
              { label: "None",   cls: "bg-muted" },
              { label: "Low",    cls: TIER_BG[1].split(" ")[0] },
              { label: "Mid",    cls: TIER_BG[2].split(" ")[0] },
              { label: "High",   cls: TIER_BG[3].split(" ")[0] },
              { label: "Peak",   cls: TIER_BG[4].split(" ")[0] },
            ].map(it => (
              <div key={it.label} className="flex items-center gap-1">
                <span className={cn("h-2.5 w-2.5 rounded-sm dark:hidden", it.cls)} />
                <span className={cn(
                  "h-2.5 w-2.5 rounded-sm hidden dark:block",
                  it.cls.replace(/^bg-\[/, "bg-[").split(" ").find(c => c.includes("dark")) ?? it.cls
                )} />
                <span className="text-[9px] text-muted-foreground">{it.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-[oklch(0.55_0.13_25)] dark:text-[oklch(0.72_0.14_25)]"><IcoFlame /></span>
              <span className="text-[9px] text-muted-foreground">Peak day</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[oklch(0.55_0.13_25)] dark:text-[oklch(0.72_0.14_25)] text-[9px] font-black">SUN/SAT</span>
              <span className="text-[9px] text-muted-foreground">Weekend</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Day Transactions Modal ────────────────────────────────────────── */}
      <DayTransactionsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        day={modalDay}
        month={month}
        year={year}
        transactions={modalTxns}
        loading={modalLoading}
        currencySymbol={currencySymbol}
        spending={spending}
        dayOfWeek={modalDay != null ? (firstDay + modalDay - 1) % 7 : 0}
      />

    </div>
  );
}

// ─── Day Transactions Modal ───────────────────────────────────────────────────

interface DayTransactionsModalProps {
  open: boolean;
  onClose: () => void;
  day: number | null;
  month: number;
  year: number;
  transactions: DayTransaction[];
  loading: boolean;
  currencySymbol: string;
  spending: DailySpending;
  dayOfWeek: number;
}

function DayTransactionsModal({
  open, onClose, day, month, year,
  transactions, loading, currencySymbol, spending, dayOfWeek,
}: DayTransactionsModalProps) {
  if (!open || day === null) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const dateLabel = `${DAY_FULL[dayOfWeek]}, ${MONTH_NAMES[month - 1]} ${day}, ${year}`;
  const totalDebit  = transactions.reduce((s, t) => s + (t.debit  ?? 0), 0);
  const totalCredit = transactions.reduce((s, t) => s + (t.credit ?? 0), 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      position="center"
      noPadding
      header={
        /* ── Custom header ── */
        <div
          className="px-5 py-4 flex items-center gap-4"
          style={{
            background: "linear-gradient(135deg, var(--dt-header-from) 0%, var(--dt-header-to) 100%)",
          }}
        >
          {/* Date badge */}
          <div className="h-12 w-12 rounded-xl bg-white/15 border border-white/20 flex flex-col items-center justify-center shrink-0">
            <span className="text-xl font-black text-white leading-none">{day}</span>
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-wide mt-0.5">
              {MONTH_SHORT[month - 1]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">{dateLabel}</p>
            <p className="text-white/55 text-[11px] mt-0.5">
              {loading ? "Loading…" : `${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      }
      footer={
        transactions.length > 0 ? (
          /* ── Totals footer ── */
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Day Summary
            </span>
            <div className="flex items-center gap-4 flex-wrap">
              {totalDebit > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-xs text-muted-foreground">Spent</span>
                  <span className="text-sm font-black text-red-500">
                    {currencySymbol}{totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {totalCredit > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">Received</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}{totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : undefined
      }
    >
      {/* ── Body ── */}
      <div className="px-5 py-4">

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-9 w-9 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 w-3/4 rounded-full bg-muted" />
                  <div className="h-2.5 w-1/2 rounded-full bg-muted" />
                </div>
                <div className="h-4 w-16 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M2 10h20"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No transactions</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nothing recorded for {MONTH_SHORT[month - 1]} {day}
              </p>
            </div>
          </div>
        )}

        {/* Transaction list */}
        {!loading && transactions.length > 0 && (
          <div className="flex flex-col divide-y divide-border/60">
            {transactions.map((txn, i) => {
              const isDebit  = (txn.debit  ?? 0) > 0;
              const isCredit = (txn.credit ?? 0) > 0;
              const amount   = isDebit ? txn.debit : txn.credit;
              const initials = (txn.description || txn.payee || "?")
                .trim().slice(0, 2).toUpperCase();

              return (
                <div
                  key={txn._id ?? i}
                  className="flex items-center gap-3 py-3 group"
                >
                  {/* Avatar */}
                  <div className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-black",
                    isDebit
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  )}>
                    {initials}
                  </div>

                  {/* Description + payee */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate leading-tight">
                      {txn.description || txn.payee || "—"}
                    </p>
                    {txn.payee && txn.description && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {txn.payee}
                      </p>
                    )}
                  </div>

                  {/* Amount + type chip */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn(
                      "text-sm font-black tabular-nums leading-none",
                      isDebit
                        ? "text-red-500 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {isDebit ? "−" : "+"}{currencySymbol}
                      {(amount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                      isDebit
                        ? "bg-red-500/10 text-red-600 dark:text-red-300"
                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    )}>
                      {isDebit ? "Debit" : "Credit"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default BillCalendar;
