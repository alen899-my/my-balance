"use client";

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface IncomeTrendGraphProps {
  totalIncome: number;
  currencySymbol: string;
  loading: boolean;
  trendData: any[];
}

export function IncomeTrendGraph({ totalIncome, currencySymbol, loading, trendData }: IncomeTrendGraphProps) {
  
  // Prepare data for the 12 months
  const processedData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const months = Array.from({ length: 12 }, (_, i) => ({
      name: monthNames[i],
      income: 0,
    }));

    if (trendData && Array.isArray(trendData)) {
      trendData.forEach(item => {
        if (!item || !item.month) return;
        const [m] = item.month.split('/');
        const mIdx = parseInt(m) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          months[mIdx].income = item.income || 0;
        }
      });
    }

    const incomeValues = months.map(m => m.income);
    const maxVal = Math.max(...incomeValues, 1);
    
    // To make small differences visible, we use an exponential multiplier
    // This accentuates the "Delta" between bars
    return months.map(m => {
      const ratio = m.income / maxVal;
      // Raising to power > 1 makes small differences compared to the MAX more pronounced
      // But we also want to ensure a minimum height for visibility
      const sensitiveHeight = Math.pow(ratio, 1.2) * 100;
      
      return {
        ...m,
        height: Math.max(sensitiveHeight, m.income > 0 ? 5 : 0),
      };
    });
  }, [trendData]);

  return (
    <div className="w-full h-56 bg-card text-card-foreground rounded-none border border-border flex flex-col shadow-sm transition-all duration-500 hover:shadow-lg group overflow-hidden relative">
      <style>{`
        @keyframes dynamicRise {
          0% { height: 0%; opacity: 0; }
          100% { opacity: 1; }
        }
        .revenue-pill {
          animation: dynamicRise 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      {/* Header Info */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-start justify-between z-20">
         <div>
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] leading-none drop-shadow-sm"> Incoming Trends</h3>
            <p className="text-[10px] text-muted-foreground/60 mt-1.5 uppercase tracking-tighter font-bold">
               High-Sensitivity Monitoring
            </p>
         </div>

         {/* Stats Display */}
         <div className="flex flex-col items-end">
            <div className="text-emerald-600 font-black text-2xl tabular-nums tracking-tighter sm:text-3xl drop-shadow-sm">
                {loading ? (
                    <div className="h-8 w-24 bg-emerald-500/10 animate-pulse rounded-none" />
                ) : (
                    <span>{currencySymbol}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                )}
            </div>
            <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mt-0.5">Total Revenue</span>
         </div>
      </div>

      {/* High-Sensitivity Chart Container */}
      <div className="mt-auto px-6 pb-8 h-[110px] z-10 flex items-end justify-between gap-1 sm:gap-2">
         {processedData.map((data, idx) => (
           <div 
             key={idx} 
             className="flex-1 flex flex-col items-center gap-2 group/bar h-full justify-end relative"
           >
              {/* Value Tooltip */}
              <div className="opacity-0 group-hover/bar:opacity-100 transition-opacity absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[9px] py-1 px-2 rounded font-black whitespace-nowrap shadow-lg z-30 pointer-events-none">
                {currencySymbol}{data.income.toLocaleString()}
              </div>

              {/* The "High Sensitivity" Bar: Double-layered with Glow Top */}
              <div 
                className={cn(
                  "w-full transition-all duration-700 ease-out revenue-pill relative group-hover/bar:scale-y-105 origin-bottom",
                  loading ? "opacity-20" : "opacity-100"
                )}
                style={{ 
                  height: `${data.height}%`,
                  animationDelay: `${idx * 0.05}s`
                }}
              >
                  {/* Outer gradient fill */}
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-700 via-emerald-500 to-emerald-400 rounded-t-sm" />
                  
                  {/* Internal vertical highlight line */}
                  <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/20 transform -translate-x-1/2" />

                  {/* The Precision Cap: Bright horizontal line + glow */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 shadow-[0_0_12px_rgba(52,211,153,0.8)] border-t border-white/30" />
              </div>
              
              <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                {data.name}
              </span>
           </div>
         ))}
      </div>

      {/* Fine-grain background grid for scale perspective */}
      <div className="absolute inset-x-6 bottom-[44px] h-[60px] border-y border-emerald-500/5 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:100%_10px] pointer-events-none z-0" />

    </div>
  );
}
