"use client";

import React, { useState } from "react";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import StatsOverview from "@/components/dashboard/StatsOverview";
import PayeeLeaderboard from "@/components/dashboard/PayeeLeaderboard";
import MonthlySpendingChart from "@/components/dashboard/MonthlySpendingChart";
import CategorySpending from "@/components/dashboard/CategorySpending";
import AdvancedInsights from "@/components/dashboard/AdvancedInsights";
import SpendingPulse from "@/components/dashboard/SpendingPulse";
import { Sparkles, Calendar, Activity } from "lucide-react";

export default function DashboardPage() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  return (
    <div className="p-4 md:p-6 space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto">

      {/* --- HEADER --- */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Financial Insights</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            Executive Summary
          </h1>
        </div>

        {/* Date Controls Container - Fixed Responsiveness */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto">
          <div className="w-full sm:w-auto">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm w-full sm:w-auto justify-center sm:justify-start">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{currentDate}</span>
          </div>
        </div>
      </div>

      {/* --- TOP ROW STATS --- */}
      <section>
        <StatsOverview startDate={startDate} endDate={endDate} />
      </section>

      {/* --- ADVANCED HEALTH METRICS --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-violet-500" />
          <h2 className="text-xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
            Health Metrics
          </h2>
        </div>
        <AdvancedInsights />
      </section>

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PayeeLeaderboard startDate={startDate} endDate={endDate} />
        </div>
        <div className="lg:col-span-2">
          <MonthlySpendingChart startDate={startDate} endDate={endDate} />
        </div>
      </div>

      {/* --- LOWER GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategorySpending startDate={startDate} endDate={endDate} />
        <SpendingPulse startDate={startDate} endDate={endDate} />
      </div>
    </div>
  );
}