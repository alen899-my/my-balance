"use client";

import React from "react";
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

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Changed text-blue-600 to text-violet-600 */}
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Financial Insights</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
            Executive Summary
          </h1>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500">{currentDate}</span>
        </div>
      </div>

      {/* --- TOP ROW STATS (BASIC) --- */}
      <section>
        <StatsOverview />
      </section>

      {/* --- ADVANCED HEALTH METRICS --- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          {/* Changed text-blue-500 to text-violet-500 */}
          <Activity className="w-5 h-5 text-violet-500" />
          <h2 className="text-xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
            Health Metrics
          </h2>
        </div>
        <AdvancedInsights />
      </section>

      {/* --- MAIN GRID (LEADERBOARD & MONTHLY CHART) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <PayeeLeaderboard />
          </div>

          <div className="lg:col-span-2">
            <MonthlySpendingChart />
          </div>
      </div>

      {/* --- LOWER GRID (CATEGORY & HEATMAP) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="w-full">
           <CategorySpending />
        </div>
        <div className="w-full">
           <SpendingPulse /> 
        </div>
      </div>
      
    </div>
  );
}