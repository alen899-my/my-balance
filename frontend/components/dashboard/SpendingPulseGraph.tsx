"use client";

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SpendingPulseGraphProps {
  totalSpend: number;
  currencySymbol: string;
  loading: boolean;
  trendData: any[];
}

export function SpendingPulseGraph({ totalSpend, currencySymbol, loading, trendData }: SpendingPulseGraphProps) {
  
  // Prepare data for the 12 months
  const processedData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const months = Array.from({ length: 12 }, (_, i) => ({
      name: monthNames[i],
      expense: 0,
    }));

    if (trendData && Array.isArray(trendData)) {
      trendData.forEach(item => {
        if (!item || !item.month) return;
        const [m] = item.month.split('/');
        const mIdx = parseInt(m) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          months[mIdx].expense = item.expense || item.amount || 0;
        }
      });
    }

    const maxVal = Math.max(...months.map(m => m.expense), 500);
    
    return months.map((m, i) => {
      const x = (i / 11) * 100;
      const heightPercent = (m.expense / maxVal) * 70; 
      const y = 90 - heightPercent;
      return { x, y, name: m.name, raw: m.expense };
    });
  }, [trendData]);

  const linePath = useMemo(() => {
    if (!processedData || processedData.length === 0) return "";
    return processedData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [processedData]);

  const areaPath = useMemo(() => {
    if (!linePath) return "";
    return `${linePath} L 100 100 L 0 100 Z`;
  }, [linePath]);

  return (
    <div className="w-full h-56 bg-card text-card-foreground rounded-none border border-border flex flex-col shadow-sm transition-all duration-500 hover:shadow-lg group overflow-hidden relative">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-destructive/[0.02] blur-[100px] pointer-events-none" />

      {/* Header Info */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-start justify-between z-20">
         <div>
            <h3 className="text-xs font-black text-destructive uppercase tracking-[0.2em] leading-none drop-shadow-sm">Spending Trend</h3>
            <p className="text-[10px] text-muted-foreground/60 mt-1.5 uppercase tracking-tighter font-bold">
              Annual Outflow Analysis
            </p>
         </div>

         {/* Stats Display */}
         <div className="flex flex-col items-end">
            <div className="text-destructive font-black text-2xl tabular-nums tracking-tighter sm:text-3xl drop-shadow-sm">
                {loading ? (
                    <div className="h-8 w-24 bg-destructive/10 animate-pulse rounded-none" />
                ) : (
                    <span>{currencySymbol}{totalSpend.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                )}
            </div>
            <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mt-0.5">Yearly Expenditure</span>
         </div>
      </div>

      {/* Spike Line Chart Container */}
      <div className="mt-auto px-6 pb-12 h-[100px] z-10 relative">
         <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area under the line */}
            {!loading && linePath && (
              <path 
                d={areaPath} 
                fill="url(#redGradient)" 
                className="transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              />
            )}

            {/* Connection Line */}
            {!loading && linePath && (
              <path 
                d={linePath} 
                fill="none" 
                stroke="#ef4444" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] opacity-70"
              />
            )}
         </svg>

         {/* Data Points (Dots) */}
         <div className="absolute inset-x-6 top-0 bottom-12 pointer-events-none">
            {processedData.map((p, i) => (
              <div 
                key={i} 
                className="absolute w-2.5 h-2.5 bg-card border-[1.5px] border-[#ef4444] rounded-full -translate-x-1/2 -translate-y-1/2 group/point pointer-events-auto shadow-sm transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{ left: `${p.x}%`, top: `${p.y}%`, transitionDelay: `${i * 30}ms` }}
              >
                {/* Tooltip */}
                <div className="opacity-0 group-hover/point:opacity-100 transition-opacity absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#ef4444] text-white text-[10px] py-1 px-2 rounded-md font-black whitespace-nowrap shadow-lg z-30">
                  {p.name}: {currencySymbol}{p.raw.toLocaleString()}
                </div>
              </div>
            ))}
         </div>
      </div>

      {/* X-Axis Month Labels */}
      <div className="absolute bottom-4 left-6 right-6 flex justify-between z-10">
         {processedData.map((d, i) => (
           <span key={i} className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter w-0 overflow-visible text-center">
             {d.name}
           </span>
         ))}
      </div>

    </div>
  );
}
