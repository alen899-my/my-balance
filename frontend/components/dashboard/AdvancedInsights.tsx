"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { 
  Zap, ShieldCheck, Flame, TrendingUp, RefreshCcw, 
  Calendar, Activity, CreditCard, PieChart, Timer 
} from "lucide-react";

interface AdvancedInsightsProps {
  selectedBank?: string; // 1. Added Prop
}

export default function AdvancedInsights({ selectedBank }: AdvancedInsightsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdvancedData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        // 2. Pass Bank to the API
        if (selectedBank && selectedBank !== "All Banks") {
          params.append("bank", selectedBank);
        }

        const res = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/insights/advanced?${params.toString()}`
        );
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Advanced Insights Error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAdvancedData();
    // 3. Dependency array ensures refetch on bank change
  }, [selectedBank]); 

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-pulse">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700" />
      ))}
    </div>
  );

  if (!data) return null;

  const insights = [
    { label: "Savings Rate", val: `${data.savings_rate}%`, icon: PieChart, color: "text-emerald-500", desc: "Goal: 20%+" },
    { label: "Safety Net", val: `${data.safety_net_score}m`, icon: ShieldCheck, color: "text-blue-500", desc: "Months covered" },
    { label: "Lifestyle Creep", val: `+${data.lifestyle_inflation}%`, icon: Flame, color: "text-orange-500", desc: "Spend increase" },
    { label: "Monthly Subs", val: `₹${(data.recurring_total || 0).toLocaleString()}`, icon: RefreshCcw, color: "text-purple-500", desc: "Fixed commitments" },
    { label: "Burn Variance", val: `${data.burn_variance}%`, icon: Activity, color: "text-red-500", desc: "Vs historical avg" },
    { label: "End Balance", val: `₹${(data.predicted_end_balance || 0).toLocaleString()}`, icon: Timer, color: "text-slate-500", desc: "Forecasted" },
    { label: "Weekend %", val: `${data.weekend_intensity}%`, icon: Calendar, color: "text-indigo-500", desc: "Lifestyle cost" },
    { label: "DTI Ratio", val: "0.2", icon: CreditCard, color: "text-pink-500", desc: "Debt risk: Low" },
    { label: "Payday Speed", val: data.payday_velocity, icon: Zap, color: "text-amber-500", desc: "First 48h spend" },
    { label: "Financial Age", val: "28y", icon: TrendingUp, color: "text-cyan-500", desc: "Based on wealth" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {insights.map((item, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-violet-500/30 transition-all cursor-default group shadow-sm">
          <div className="flex justify-between items-start">
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase group-hover:text-violet-500 transition-colors">
              {item.desc}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.label}</p>
            <h4 className="text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
              {item.val}
            </h4>
          </div>
        </div>
      ))}
    </div>
  );
}