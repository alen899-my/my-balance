"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface IncomeTrendGraphProps {
  totalIncome: number;
  currencySymbol: string;
  loading: boolean;
  trendData: any[];
}

export function IncomeTrendGraph({ totalIncome, currencySymbol, loading, trendData }: IncomeTrendGraphProps) {
  const [yearFilter, setYearFilter] = useState("All Year");

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    (trendData || []).forEach(item => {
      if (item?.month) {
        const parts = item.month.split("/");
        if (parts[1]) years.add(parts[1]);
      }
    });
    return ["All Year", ...Array.from(years).sort()];
  }, [trendData]);

  const processedData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const months = monthNames.map(name => ({ name, income: 0 }));

    if (trendData && Array.isArray(trendData)) {
      trendData.forEach(item => {
        if (!item?.month) return;
        const parts = item.month.split("/");
        const idx = parseInt(parts[0]) - 1;
        const yr = parts[1];
        if (yearFilter !== "All Year" && yr !== yearFilter) return;
        if (idx >= 0 && idx < 12) months[idx].income += item.income || 0;
      });
    }

    const maxVal = Math.max(...months.map(m => m.income), 1);
    return months.map(m => ({
      ...m,
      height: Math.max(Math.pow(m.income / maxVal, 1.2) * 100, m.income > 0 ? 5 : 0),
    }));
  }, [trendData, yearFilter]);

  return (
    <div className="w-full bg-card border border-border flex flex-col overflow-hidden group">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-border/40 shrink-0">
        <div>
          <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] leading-none">Income Trend</h3>
          <p className="text-[8px] text-muted-foreground/50 mt-1 uppercase tracking-tight font-bold">Monthly inflow · all year</p>
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="mt-1.5 bg-card border border-border/40 text-[9px] font-bold text-muted-foreground px-1.5 py-0.5 focus:outline-none cursor-pointer hover:border-emerald-500/40 transition-colors appearance-none pr-4"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 4px center" }}
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="text-right">
          {loading ? (
            <div className="h-6 w-20 bg-emerald-500/10 animate-pulse" />
          ) : (
            <span className="text-emerald-600 font-black text-xl tabular-nums tracking-tighter">
              {currencySymbol}{totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          )}
          <p className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5">Total Earned</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end justify-between gap-0.5 px-3 pt-3 pb-0 min-h-[100px] flex-1">
        {processedData.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-0 group/bar relative">
            {/* Tooltip */}
            <div className="opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[8px] py-0.5 px-1.5 font-black whitespace-nowrap shadow-lg z-30">
              {currencySymbol}{d.income.toLocaleString()}
            </div>
            {/* Bar */}
            <div
              className={cn("w-full relative transition-all duration-700 ease-out origin-bottom", loading ? "opacity-20" : "opacity-100")}
              style={{ height: `${d.height}%`, animationDelay: `${i * 50}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-700 via-emerald-500 to-emerald-400 rounded-t-sm" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/20 -translate-x-1/2" />
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/40" />
            </div>
          </div>
        ))}
      </div>

      {/* Month labels */}
      <div className="flex justify-between px-3 pb-2 pt-1">
        {processedData.map((d, i) => (
          <span key={i} className={`text-[6px] font-bold text-muted-foreground/40 uppercase text-center flex-1 ${i % 2 !== 0 ? "hidden sm:block" : ""}`}>
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}
