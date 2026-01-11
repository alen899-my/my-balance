"use client";

import React, { useState, useEffect, useCallback } from "react";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import StatsOverview from "@/components/dashboard/StatsOverview";
import PayeeLeaderboard from "@/components/dashboard/PayeeLeaderboard";
import MonthlySpendingChart from "@/components/dashboard/MonthlySpendingChart";
import CategorySpending from "@/components/dashboard/CategorySpending";
import AdvancedInsights from "@/components/dashboard/AdvancedInsights";
import SpendingPulse from "@/components/dashboard/SpendingPulse";
import SavingsSpeedometer from "@/components/dashboard/SavingsSpeedometer";
import BankFilter from "@/components/dashboard/BankFilter";
// Changed ListFilter to SlidersHorizontal for a modern look
import { Sparkles, Calendar, Activity, Zap, SlidersHorizontal } from "lucide-react"; 
import { authFetch } from "@/lib/authFetch";

export default function DashboardPage() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [stats, setStats] = useState({ income: 0, expenses: 0 });
  
  const [availableBanks, setAvailableBanks] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState("All Banks");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/unique-banks`);
        if (res.ok) setAvailableBanks(await res.json());
      } catch (err) {
        console.error("Bank fetch failed", err);
      }
    };
    fetchBanks();
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const m = startDate ? startDate.getMonth() + 1 : now.getMonth() + 1;
      const y = startDate ? startDate.getFullYear() : now.getFullYear();
      const bankQuery = selectedBank !== "All Banks" ? `&bank=${selectedBank}` : "";

      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/budget/stats/summary?month=${m}&year=${y}${bankQuery}`
      );
      const data = await res.json();
      setStats({ income: data.income || 0, expenses: data.expenses || 0 });
    } catch (err) {
      console.error("Stats fetch failed", err);
    }
  }, [startDate, selectedBank]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="p-4 md:p-6 space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-20">

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

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto">
          {/* IMPROVED FILTER TOGGLE BUTTON */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`group relative p-3 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center gap-2 
              ${showFilters 
                ? "bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/40 scale-105" 
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-violet-500/50 hover:text-violet-600"
              }`}
          >
            <SlidersHorizontal className={`w-5 h-5 transition-transform duration-300 ${showFilters ? 'rotate-180' : 'group-hover:rotate-12'}`} />
            {/* Added hidden text for accessibility and clarity on larger screens */}
            <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${showFilters ? 'inline-block px-1' : 'hidden md:group-hover:inline-block'}`}>
               {showFilters ? 'Close' : 'Filter'}
            </span>
          </button>
          
          <div className="w-full sm:w-auto">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm w-full sm:w-auto justify-center sm:justify-start text-slate-500">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold whitespace-nowrap">{currentDate}</span>
          </div>
        </div>
      </div>

      {/* --- COLLAPSIBLE BANK FILTER --- */}
      {showFilters && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-500 bg-violet-50/50 dark:bg-violet-900/10 p-5 rounded-[2.5rem] border border-violet-100 dark:border-violet-900/30">
           <div className="flex items-center gap-2 mb-4 ml-1">
              <Zap className="w-3 h-3 text-violet-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">Institution Intelligence</p>
           </div>
           <BankFilter 
              selectedBank={selectedBank} 
              onBankChange={setSelectedBank} 
              availableBanks={availableBanks} 
           />
        </div>
      )}

      {/* --- STATS SECTIONS --- */}
      <section>
        <StatsOverview startDate={startDate} endDate={endDate} selectedBank={selectedBank} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-violet-500" />
          <h2 className="text-xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
            Health Metrics
          </h2>
        </div>
        <AdvancedInsights selectedBank={selectedBank} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PayeeLeaderboard startDate={startDate} endDate={endDate} selectedBank={selectedBank} />
        </div>
        <div className="lg:col-span-2">
          <MonthlySpendingChart startDate={startDate} endDate={endDate} selectedBank={selectedBank} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategorySpending startDate={startDate} endDate={endDate} selectedBank={selectedBank} />
        <SpendingPulse startDate={startDate} endDate={endDate} selectedBank={selectedBank} />
      </div>

      <section className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
            Efficiency
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <SavingsSpeedometer 
              income={stats.income} 
              expenses={stats.expenses} 
            />
          </div>
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 flex flex-col justify-center shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Performance insight</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {stats.income > stats.expenses 
                ? `You are operating with a ₹${(stats.income - stats.expenses).toLocaleString()} surplus this period.` 
                : "Your spending currently exceeds your recorded income for this period."}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm leading-relaxed max-w-2xl">
              The savings efficiency rate is calculated by comparing your total income against your survival target. 
              Aim for a consistent <span className="text-violet-500 font-bold">20% or higher</span> to reach "Healthy" status.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}