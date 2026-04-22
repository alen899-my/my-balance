"use client";

import React, { useMemo } from "react";
import { Activity } from "lucide-react";

interface SpendingPulseGraphProps {
  totalSpend: number;
  currencySymbol: string;
  loading: boolean;
  trendData: any[];
}

export function SpendingPulseGraph({ totalSpend, currencySymbol, loading, trendData }: SpendingPulseGraphProps) {
  const processedData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const months = monthNames.map(name => ({ name, expense: 0 }));

    if (trendData && Array.isArray(trendData)) {
      trendData.forEach(item => {
        if (!item?.month) return;
        const idx = parseInt(item.month.split("/")[0]) - 1;
        if (idx >= 0 && idx < 12) months[idx].expense = item.expense || item.amount || 0;
      });
    }

    const maxVal = Math.max(...months.map(m => m.expense), 500);
    return months.map((m, i) => ({
      ...m,
      x: (i / 11) * 100,
      y: 90 - (m.expense / maxVal) * 70,
    }));
  }, [trendData]);

  const linePath = processedData.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = linePath ? `${linePath} L 100 100 L 0 100 Z` : "";

  // Show every other label on very tight views using CSS
  return (
    <div className="w-full bg-gradient-to-br from-red-500/5 via-card to-background border border-border flex flex-col overflow-hidden group">
      {/* Header — normal flow, no absolute */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-border/40 shrink-0">
        <div>
          <h3 className="text-[10px] font-black text-destructive uppercase tracking-[0.2em] leading-none">Spending Trend</h3>
          <p className="text-[8px] text-muted-foreground/50 mt-1 uppercase tracking-tight font-bold">Monthly outflow · all year</p>
        </div>
        <div className="text-right">
          {loading ? (
            <div className="h-6 w-20 bg-destructive/10 animate-pulse" />
          ) : (
            <span className="text-destructive font-black text-xl tabular-nums tracking-tighter">
              {currencySymbol}{totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          )}
          <p className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5">Total Spent</p>
        </div>
      </div>

      {/* Chart area */}
      <div className="relative flex-1 min-h-[120px] px-3 pt-3 pb-0">
        {/* SVG line chart */}
        <svg
          className="w-full"
          style={{ height: "90px" }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="spendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>
          {!loading && areaPath && <path d={areaPath} fill="url(#spendGrad)" />}
          {!loading && linePath && (
            <path d={linePath} fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {/* Dots */}
          {!loading && processedData.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="1.8" fill="#ef4444" opacity="0.8" />
          ))}
        </svg>

        {/* Hover tooltips as HTML overlay (positioned over SVG) */}
        <div className="absolute inset-x-3 top-3" style={{ height: "90px" }}>
          {processedData.map((p, i) => (
            <div
              key={i}
              className="absolute group/pt -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <div className="w-3 h-3 cursor-default" />
              <div className="opacity-0 group-hover/pt:opacity-100 transition-opacity pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 bg-destructive text-white text-[9px] py-0.5 px-1.5 font-black whitespace-nowrap shadow-lg z-30">
                {p.name}: {currencySymbol}{p.expense?.toLocaleString() ?? 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Month labels — responsive: hide alternating months on small screens */}
      <div className="flex justify-between px-3 pb-2 pt-1">
        {processedData.map((d, i) => (
          <span
            key={i}
            className={`text-[7px] font-bold text-muted-foreground/40 uppercase text-center flex-1 ${i % 2 !== 0 ? "hidden sm:block" : ""}`}
          >
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}
