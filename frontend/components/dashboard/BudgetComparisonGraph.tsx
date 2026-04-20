"use client";

import React, { useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend
} from "recharts";
import { Target, ShieldCheck, Search, Activity, TrendUp, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetComparisonGraphProps {
  budgetData: any[]; // { month: "1/2026", income: 5000, need: 4500 }
  currencySymbol: string;
  loading: boolean;
}

/**
 * Premium Custom Bar to mimic "High-Sensitivity" look in Recharts
 */
const CustomBar = (props: any) => {
  const { fill, x, y, width, height, radius } = props;
  if (!height) return null;

  return (
    <g>
      {/* Main Bar with Gradient Fill via CSS or ID */}
      <rect 
        x={x} 
        y={y} 
        width={width} 
        height={height} 
        fill={fill} 
        rx={radius} 
        ry={radius} 
        className="transition-all duration-500" 
      />
      {/* Precision Cap (Bright Top Line) */}
      <rect 
        x={x} 
        y={y} 
        width={width} 
        height={2} 
        fill="white" 
        fillOpacity={0.4} 
        className="shadow-[0_0_8px_white]"
      />
      {/* Vertical Highlight Line */}
      <line 
        x1={x + width / 2} 
        y1={y} 
        x2={x + width / 2} 
        y2={y + height} 
        stroke="white" 
        strokeOpacity={0.1} 
        strokeWidth={1} 
      />
    </g>
  );
};

export function BudgetComparisonGraph({ budgetData, currencySymbol, loading }: BudgetComparisonGraphProps) {
  const data = useMemo(() => {
    if (!budgetData || budgetData.length === 0) return [];
    
    return budgetData.map(item => ({
      ...item,
      income: Number(item.income || 0),
      expense: Number(item.need || 0),
      monthLabel: item.month ? item.month.split('/')[0] : ""
    })).slice(-12);
  }, [budgetData]);

  if (loading) {
    return (
      <div className="w-full h-80 bg-card border border-border animate-pulse flex flex-col items-center justify-center gap-4">
        <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
        <div className="text-muted-foreground/20 text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing Analytics...</div>
      </div>
    );
  }

  const hasData = data.length > 0;

  return (
    <div className="w-full h-80 bg-card border border-border rounded-none flex flex-col relative overflow-hidden group shadow-sm transition-all duration-500 hover:shadow-xl">
      {/* Visual Accents & Headers */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-start justify-between z-40">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-none border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center rotate-45 group-hover:rotate-0 transition-all duration-700">
               <Target className="w-5 h-5 text-indigo-500 -rotate-45 group-hover:rotate-0 transition-all duration-700" />
            </div>
            <div>
               <h3 className="text-[12px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em] leading-none">Fiscal Flow Comparison</h3>
               <p className="text-[10px] text-muted-foreground mt-1.5 uppercase font-bold tracking-tight opacity-70">Revenue Target vs Allocation Monitoring</p>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500 opacity-60" />
            <div className="h-6 w-[1px] bg-border/40 mx-2" />
            <div className="flex flex-col items-end">
               <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">Analytics Mode</span>
               <span className="text-[10px] font-black text-indigo-500 uppercase">Precision-V2</span>
            </div>
         </div>
      </div>

      <div className="flex-1 w-full relative z-10 px-6 pt-24 pb-6 h-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} barGap={6}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#065f46" />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#3730a3" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(var(--border), 0.3)" />
              <XAxis 
                dataKey="monthLabel" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "currentColor", fontSize: 10, fontWeight: 900, opacity: 0.3 }}
                className="text-muted-foreground"
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "currentColor", fontSize: 9, fontWeight: 900, opacity: 0.3 }}
                tickFormatter={(v) => `${currencySymbol}${Intl.NumberFormat('en-US', { notation: 'compact' }).format(v)}`}
              />
              <Tooltip 
                cursor={{ fill: 'hsla(var(--primary), 0.03)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const inc = payload[0].value as number;
                    const exp = payload[1].value as number;
                    return (
                      <div className="bg-popover/90 border border-border p-4 shadow-2xl backdrop-blur-xl rounded-none min-w-[200px] border-l-4 border-l-indigo-500">
                        <div className="text-[10px] font-black text-muted-foreground uppercase mb-3 border-b border-border/40 pb-2">
                           Month: {payload[0].payload.month}
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-emerald-500 uppercase">Expected Revenue</span>
                              <span className="text-[12px] font-black tabular-nums">{currencySymbol}{inc.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-indigo-500 uppercase">Allocation Plan</span>
                              <span className="text-[12px] font-black tabular-nums">{currencySymbol}{exp.toLocaleString()}</span>
                           </div>
                           <div className="pt-2 mt-2 border-t border-border/40 flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase text-foreground">Projected Delta</span>
                              <span className={cn("text-[14px] font-black tabular-nums", inc >= exp ? "text-emerald-500" : "text-destructive")}>
                                 {currencySymbol}{Math.abs(inc - exp).toLocaleString()}
                              </span>
                           </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                name="Income" 
                dataKey="income" 
                fill="url(#incomeGrad)" 
                shape={<CustomBar />}
                animationDuration={1500}
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                name="Expense" 
                dataKey="expense" 
                fill="url(#expenseGrad)" 
                shape={<CustomBar />}
                animationDuration={1500}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-10 select-none">
             <Search className="w-12 h-12 mb-4" />
             <p className="text-[14px] font-black uppercase tracking-[0.5em]">Analytics Offline</p>
          </div>
        )}
      </div>

      {/* Decorative Grid Perspective */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(transparent,rgba(var(--primary),0.02))] pointer-events-none" />
    </div>
  );
}
