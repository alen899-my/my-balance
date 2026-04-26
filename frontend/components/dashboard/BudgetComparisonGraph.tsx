"use client";

import React, { useMemo, useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Target, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetComparisonGraphProps {
  budgetData: any[];
  currencySymbol: string;
  loading: boolean;
}

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
  const monthLabel = (v: string) => {
    if (!v) return "";
    const [yr, mo] = v.split("-");
    return new Date(Number(yr), Number(mo) - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
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
      .map(d => ({ ...d, income: Number(d.income || 0), need: Number(d.need || 0) }));
  }, [budgetData, selectedKey]);

  const totalBudget = data.reduce((a, d) => a + d.need, 0);
  const totalIncome = data.reduce((a, d) => a + d.income, 0);
  const surplus = totalIncome - totalBudget;
  const usedPct = totalIncome > 0 ? Math.min(100, Math.round((totalBudget / totalIncome) * 100)) : 0;

  const pieData = [
    { name: "Budget", value: totalBudget > 0 ? totalBudget : 0, color: "#8b5cf6" },
    { name: "Income", value: totalIncome > 0 ? totalIncome : 0, color: "#10b981" },
  ];
  const minVal = availableMonths.length ? toInputVal(availableMonths[0]) : "";
  const maxVal = availableMonths.length ? toInputVal(availableMonths[availableMonths.length - 1]) : "";

  if (loading) return (
    <div className="w-full bg-card border border-border animate-pulse flex items-center justify-center h-[280px] gap-3">
      <Activity className="w-5 h-5 text-violet-500 animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Loading...</span>
    </div>
  );

  return (
    <div className="w-full bg-card border border-border flex flex-col overflow-hidden group">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 shrink-0 bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Target className="w-3.5 h-3.5 text-violet-500" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] leading-none">Budget vs Income</h3>
            <p className="text-[8px] text-muted-foreground/50 uppercase font-bold mt-0.5">Monthly plan vs what came in</p>
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
        <div className="px-3 py-2 border-r border-border/20 min-w-0">
          <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Budget</p>
          <p className="text-xs font-black tabular-nums break-all">{currencySymbol}{totalBudget.toLocaleString()}</p>
        </div>
        <div className="px-3 py-2 border-r border-border/20 min-w-0">
          <p className="text-[7px] font-black text-violet-500 uppercase tracking-widest">Planned</p>
          <p className="text-xs font-black tabular-nums break-all">{currencySymbol}{totalIncome.toLocaleString()}</p>
        </div>
        <div className="px-3 py-2 min-w-0">
          <p className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-widest">{surplus >= 0 ? "Left" : "Short"}</p>
          <p className={cn("text-xs font-black tabular-nums break-all", surplus >= 0 ? "text-emerald-500" : "text-destructive")}>
            {surplus >= 0 ? "+" : "-"}{currencySymbol}{Math.abs(surplus).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="flex-1 flex flex-col items-center justify-center px-2 py-2 relative min-h-[150px]">
        {totalBudget === 0 && totalIncome === 0 ? (
          <div className="flex flex-col items-center justify-center opacity-20 gap-2">
            <Target className="w-8 h-8" />
            <p className="text-[9px] font-black uppercase tracking-widest">No data</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0];
                    return (
                      <div className="bg-card border border-border/50 p-2 text-[10px] font-black shadow-xl">
                        <span style={{ color: d.payload.color }}>{d.name}</span>: {currencySymbol}{Number(d.value).toLocaleString()}
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute flex flex-col items-center justify-center pointer-events-none" style={{ top: "50%", transform: "translateY(-50%)" }}>
              <span className="text-lg font-black tabular-nums text-violet-500 leading-none">{usedPct}%</span>
              <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/50 mt-0.5">Budget Used</span>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-1">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">{d.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
