"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Target, Search, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetComparisonGraphProps {
  budgetData: any[];
  currencySymbol: string;
  loading: boolean;
}

const CustomBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  if (!height || height <= 0) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={3} ry={3} />
      <rect x={x} y={y} width={width} height={3} fill="white" fillOpacity={0.3} rx={3} />
    </g>
  );
};

export function BudgetComparisonGraph({ budgetData, currencySymbol, loading }: BudgetComparisonGraphProps) {
  const availableMonths = useMemo<string[]>(() => {
    if (!budgetData || budgetData.length === 0) return [];
    const seen = new Set<string>();
    const list: string[] = [];
    for (const d of budgetData) {
      if (d.month && !seen.has(d.month)) { seen.add(d.month); list.push(d.month); }
    }
    return list.sort((a, b) => {
      const [m1, y1] = a.split("/").map(Number);
      const [m2, y2] = b.split("/").map(Number);
      return y1 !== y2 ? y1 - y2 : m1 - m2;
    });
  }, [budgetData]);

  const toInputVal = (m: string) => {
    const [mo, yr] = m.split("/");
    return `${yr}-${mo.padStart(2, "0")}`;
  };
  const fromInputVal = (v: string) => {
    const [yr, mo] = v.split("-");
    return `${Number(mo)}/${yr}`;
  };

  const defaultInputVal = useMemo(() => {
    if (availableMonths.length === 0) return "";
    return toInputVal(availableMonths[availableMonths.length - 1]);
  }, [availableMonths]);

  const [inputVal, setInputVal] = useState("");
  useEffect(() => { if (defaultInputVal && !inputVal) setInputVal(defaultInputVal); }, [defaultInputVal, inputVal]);

  const selectedKey = inputVal ? fromInputVal(inputVal) : "";

  const data = useMemo(() => {
    if (!budgetData || budgetData.length === 0) return [];
    return budgetData
      .filter(d => !selectedKey || d.month === selectedKey)
      .map(d => ({ ...d, income: Number(d.income || 0), need: Number(d.need || 0), label: "Budget" }));
  }, [budgetData, selectedKey]);

  const totalIncome = data.reduce((a, d) => a + d.income, 0);
  const totalNeed = data.reduce((a, d) => a + d.need, 0);
  const surplus = totalIncome - totalNeed;

  const minVal = availableMonths.length ? toInputVal(availableMonths[0]) : "";
  const maxVal = availableMonths.length ? toInputVal(availableMonths[availableMonths.length - 1]) : "";

  if (loading) return (
    <div className="w-full bg-card border border-border animate-pulse flex items-center justify-center h-[280px] gap-3">
      <Activity className="w-5 h-5 text-violet-500 animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Loading...</span>
    </div>
  );

  return (
    <div className="w-full bg-card border border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 shrink-0 bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Target className="w-3.5 h-3.5 text-violet-500" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] leading-none">Budget vs Income</h3>
            <p className="text-[8px] text-muted-foreground/50 uppercase font-bold mt-0.5 hidden sm:block">Monthly plan vs what came in</p>
          </div>
        </div>
        <input
          type="month"
          value={inputVal}
          min={minVal}
          max={maxVal}
          onChange={e => setInputVal(e.target.value)}
          className="bg-card border border-violet-500/20 text-[10px] font-bold text-violet-400 px-2 py-1
                     focus:outline-none focus:border-violet-500 cursor-pointer appearance-none
                     hover:border-violet-500/50 transition-colors"
        />
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-3 border-b border-border/20">
        <div className="px-2 sm:px-3 py-2 border-r border-border/20 min-w-0">
          <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">In</p>
          <p className="text-xs sm:text-sm font-black tabular-nums break-all">{currencySymbol}{totalIncome.toLocaleString()}</p>
        </div>
        <div className="px-2 sm:px-3 py-2 border-r border-border/20 min-w-0">
          <p className="text-[7px] font-black text-violet-500 uppercase tracking-widest">Planned</p>
          <p className="text-xs sm:text-sm font-black tabular-nums break-all">{currencySymbol}{totalNeed.toLocaleString()}</p>
        </div>
        <div className="px-2 sm:px-3 py-2 min-w-0">
          <p className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-widest">{surplus >= 0 ? "Left" : "Short"}</p>
          <p className={cn("text-xs sm:text-sm font-black tabular-nums break-all", surplus >= 0 ? "text-emerald-500" : "text-destructive")}>
            {surplus >= 0 ? "+" : "-"}{currencySymbol}{Math.abs(surplus).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-44 w-full px-2 py-3">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 2, right: 4, left: -22, bottom: 0 }} barGap={10} barCategoryGap="40%">
              <defs>
                <linearGradient id="bgIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#065f46" />
                </linearGradient>
                <linearGradient id="bgNeed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#4c1d95" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="hsla(var(--border),0.4)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "currentColor", fontSize: 8, fontWeight: 900, opacity: 0.3 }} dy={6} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "currentColor", fontSize: 7, fontWeight: 700, opacity: 0.3 }}
                tickFormatter={v => `${currencySymbol}${Intl.NumberFormat("en-US", { notation: "compact" }).format(v)}`} width={40} />
              <Tooltip cursor={{ fill: "hsla(var(--primary),0.03)" }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length < 2) return null;
                  const inc = Number(payload[0]?.value || 0);
                  const exp = Number(payload[1]?.value || 0);
                  return (
                    <div className="bg-popover border border-border p-3 shadow-xl min-w-[150px] border-l-4 border-l-violet-500 text-xs">
                      <p className="text-[9px] font-black uppercase text-muted-foreground mb-2">{selectedKey}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4"><span className="text-emerald-500 font-bold">In</span><span className="font-black">{currencySymbol}{inc.toLocaleString()}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-violet-500 font-bold">Plan</span><span className="font-black">{currencySymbol}{exp.toLocaleString()}</span></div>
                        <div className="flex justify-between gap-4 pt-1 border-t border-border/40">
                          <span className="font-black">Balance</span>
                          <span className={cn("font-black", inc >= exp ? "text-emerald-500" : "text-destructive")}>
                            {inc >= exp ? "+" : "-"}{currencySymbol}{Math.abs(inc - exp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar name="Income" dataKey="income" fill="url(#bgIncome)" shape={<CustomBar />} animationDuration={900} />
              <Bar name="Need" dataKey="need" fill="url(#bgNeed)" shape={<CustomBar />} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 opacity-20">
            <Search className="w-8 h-8" />
            <p className="text-[10px] font-black uppercase tracking-widest">No data</p>
          </div>
        )}
      </div>
    </div>
  );
}
