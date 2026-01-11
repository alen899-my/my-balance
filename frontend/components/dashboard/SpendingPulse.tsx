"use client";

import React, { useEffect, useState, useMemo } from "react";
import { authFetch } from "@/lib/authFetch";
import { Activity } from "lucide-react";

interface SpendingPulseProps {
  startDate?: Date;
  endDate?: Date;
  selectedBank?: string; // 1. Added selectedBank prop
}

export default function SpendingPulse({ startDate, endDate, selectedBank }: SpendingPulseProps) {
  const [dailyData, setDailyData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPulse() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate.toISOString());
        if (endDate) params.append("end_date", endDate.toISOString());
        
        // 2. Append bank parameter to API request
        if (selectedBank && selectedBank !== "All Banks") {
          params.append("bank", selectedBank);
        }

        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/insights?${params.toString()}`);
        const json = await res.json();
        
        // Transform the backend daily_trend array into a lookup object for easy grid mapping
        // Logic: backend returns array of {_id: Date, daily_spend: amount}
        const lookup: Record<string, number> = {};
        if (json.summary?.daily_trend) {
           json.summary.daily_trend.forEach((item: any) => {
             // Use only the date part as key
             const dateKey = new Date(item._id).toDateString();
             lookup[dateKey] = item.daily_spend;
           });
        }
        setDailyData(lookup);
      } catch (err) {
        console.error("Pulse fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPulse();
    // 3. Added selectedBank to dependency array
  }, [startDate, endDate, selectedBank]);

  // Generate the last 30 days based on the end date or today
  const calendarGrid = useMemo(() => {
    const end = endDate || new Date();
    return [...Array(30)].map((_, i) => {
      const d = new Date(end);
      d.setDate(d.getDate() - (29 - i)); // Go back 30 days and list forward
      return {
        date: d.toDateString(),
        displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        amount: dailyData[d.toDateString()] || 0
      };
    });
  }, [dailyData, endDate]);

  const getIntensity = (amount: number) => {
    if (amount === 0) return "bg-slate-100 dark:bg-slate-800/50";
    if (amount < 500) return "bg-blue-200 dark:bg-blue-900/30";
    if (amount < 2000) return "bg-blue-400 dark:bg-blue-700/60";
    if (amount < 5000) return "bg-blue-600 dark:bg-blue-500";
    return "bg-blue-800 dark:bg-blue-400"; // High spending
  };

  if (loading) return (
    <div className="h-[300px] w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse p-6">
       <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full mb-4" />
       <div className="grid grid-cols-10 gap-2">
         {[...Array(30)].map((_, i) => <div key={i} className="aspect-square bg-slate-50 dark:bg-slate-800/50 rounded-md" />)}
       </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Spending Pulse</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              {selectedBank !== "All Banks" ? `${selectedBank} Activity` : "Global Cash Flow"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
        {calendarGrid.map((day, i) => (
          <div
            key={i}
            className={`aspect-square rounded-md transition-all hover:scale-110 hover:ring-2 hover:ring-blue-500/20 cursor-pointer ${getIntensity(day.amount)}`}
            title={`${day.date}: ₹${day.amount.toLocaleString()}`}
          />
        ))}
      </div>

      <div className="mt-auto pt-6 flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
        <span>Low Spend</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-blue-200 rounded-sm" />
          <div className="w-2 h-2 bg-blue-400 rounded-sm" />
          <div className="w-2 h-2 bg-blue-600 rounded-sm" />
          <div className="w-2 h-2 bg-blue-800 rounded-sm" />
        </div>
        <span>High Spend</span>
      </div>
    </div>
  );
}