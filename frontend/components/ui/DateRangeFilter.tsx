"use client";

import React from "react";
import { Calendar as CalendarIcon, X, ArrowRight, ArrowDown, Clock } from "lucide-react";
import { format } from "date-fns";

interface DateRangeFilterProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  setEndDate: (date: Date | undefined) => void;
}

export default function DateRangeFilter({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}: DateRangeFilterProps) {
  const isSelected = startDate || endDate;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto group">
      {/* Label - Hidden on mobile to keep it clean */}
      <div className="hidden lg:flex items-center gap-2 px-1 text-slate-400">
        <Clock className="w-3 h-3" />
        <span className="text-[10px] font-black uppercase tracking-widest text-nowrap">Filter Period</span>
      </div>

      <div className={`
        relative flex flex-col sm:flex-row items-stretch sm:items-center gap-1 p-1.5 
        bg-white dark:bg-slate-900 
        border rounded-[1.5rem] sm:rounded-2xl transition-all duration-300
        ${isSelected 
          ? "border-violet-200 dark:border-violet-500/30 shadow-md shadow-violet-500/5" 
          : "border-slate-200 dark:border-slate-800 shadow-sm"}
      `}>
        
        {/* Start Date Input Group */}
        <div className="relative flex items-center group/input min-h-[40px] sm:min-h-0">
          <CalendarIcon className={`
            absolute left-3 w-3.5 h-3.5 transition-colors z-10
            ${startDate ? "text-violet-500" : "text-slate-400"}
          `} />
          <input
            type="date"
            value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
            onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
            className={`
              pl-9 pr-3 py-2 w-full sm:w-[135px] bg-slate-50/50 dark:bg-slate-800/20 sm:bg-transparent
              rounded-xl sm:rounded-none
              text-[11px] font-black uppercase tracking-tighter
              focus:outline-none cursor-pointer appearance-none relative
              ${startDate ? "text-slate-900 dark:text-white" : "text-slate-400"}
            `}
          />
        </div>

        {/* Separator - Changes icon based on layout */}
        <div className="flex items-center justify-center py-1 sm:py-0">
          <ArrowRight className="hidden sm:block w-3 h-3 text-slate-300 dark:text-slate-700" />
          <ArrowDown className="sm:hidden w-3 h-3 text-slate-300 dark:text-slate-700" />
        </div>

        {/* End Date Input Group */}
        <div className="relative flex items-center group/input min-h-[40px] sm:min-h-0">
          <CalendarIcon className={`
            absolute left-3 w-3.5 h-3.5 transition-colors z-10
            ${endDate ? "text-violet-500" : "text-slate-400"}
          `} />
          <input
            type="date"
            value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
            min={startDate ? format(startDate, "yyyy-MM-dd") : undefined}
            onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
            className={`
              pl-9 pr-3 py-2 w-full sm:w-[135px] bg-slate-50/50 dark:bg-slate-800/20 sm:bg-transparent
              rounded-xl sm:rounded-none
              text-[11px] font-black uppercase tracking-tighter
              focus:outline-none cursor-pointer appearance-none relative
              ${endDate ? "text-slate-900 dark:text-white" : "text-slate-400"}
            `}
          />
        </div>

        {/* Clear Action - Floating or inline depending on state */}
        {isSelected && (
          <button
            onClick={() => {
              setStartDate(undefined);
              setEndDate(undefined);
            }}
            className="sm:ml-1 mt-1 sm:mt-0 p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            title="Clear Date Range"
          >
            <X className="w-3.5 h-3.5" />
            <span className="sm:hidden text-[9px] font-black uppercase tracking-widest">Clear Filter</span>
          </button>
        )}
      </div>
      
      {/* Visual Indicator for Active Selection (Mobile Only) */}
      {isSelected && (
        <div className="sm:hidden flex items-center justify-center mt-1">
           <span className="text-[8px] font-black text-violet-500 uppercase tracking-widest bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-full border border-violet-100 dark:border-violet-800">
             Custom Range Active
           </span>
        </div>
      )}
    </div>
  );
}