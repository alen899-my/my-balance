"use client";

import React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
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
    return (
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Period
                </span>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative group">
                    <input
                        type="date"
                        value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                        onChange={(e) =>
                            setStartDate(e.target.value ? new Date(e.target.value) : undefined)
                        }
                        className="w-[110px] bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none uppercase tracking-tight cursor-pointer"
                    />
                </div>
                <span className="text-slate-300 dark:text-slate-700 font-bold">-</span>
                <div className="relative group">
                    <input
                        type="date"
                        value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                        min={startDate ? format(startDate, "yyyy-MM-dd") : undefined}
                        onChange={(e) =>
                            setEndDate(e.target.value ? new Date(e.target.value) : undefined)
                        }
                        className="w-[110px] bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none uppercase tracking-tight cursor-pointer"
                    />
                </div>
            </div>

            {(startDate || endDate) && (
                <button
                    onClick={() => {
                        setStartDate(undefined);
                        setEndDate(undefined);
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                    title="Clear Dates"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
