"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { Activity } from "lucide-react";

export default function SpendingPulse() {
  const [days, setDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`${process.env.NEXT_PUBLIC_API_URL}/insights`)
      .then(res => res.json())
      .then(json => {
        // Assume daily_trend returns [{_id: "01/01/2025", daily_spend: 500}, ...]
        setDays(json.summary.daily_trend || []);
        setLoading(false);
      });
  }, []);

  const getIntensity = (amount: number) => {
    if (amount === 0) return "bg-slate-100 dark:bg-slate-800";
    if (amount < 500) return "bg-blue-200 dark:bg-blue-900/40";
    if (amount < 2000) return "bg-blue-400";
    if (amount < 5000) return "bg-blue-600";
    return "bg-blue-800"; // High spending
  };

  if (loading) return <div className="h-full w-full bg-slate-50 animate-pulse rounded-3xl" />;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-blue-500" />
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Spending Pulse</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Last 30 Days Activity</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Generating a 30-day grid */}
        {[...Array(30)].map((_, i) => (
          <div 
            key={i}
            className={`w-8 h-8 rounded-md transition-all hover:scale-110 cursor-pointer ${getIntensity(Math.random() * 6000)}`} // Replace Math.random with real data
            title={`Day ${i+1}`}
          />
        ))}
      </div>
      
      <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
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