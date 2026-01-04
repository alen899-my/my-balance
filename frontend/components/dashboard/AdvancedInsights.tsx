"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { 
  Zap, ShieldCheck, Flame, TrendingUp, RefreshCcw, 
  Calendar, Activity, CreditCard, PieChart, Timer 
} from "lucide-react";

export default function AdvancedInsights() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`${process.env.NEXT_PUBLIC_API_URL}/insights/advanced`)
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false); });
  }, []);

  if (loading) return <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-pulse">
    {[...Array(10)].map((_, i) => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
  </div>;

  const insights = [
    { label: "Savings Rate", val: `${data.savings_rate}%`, icon: PieChart, color: "text-emerald-500", desc: "Goal: 20%+" },
    { label: "Safety Net", val: `${data.safety_net_score}m`, icon: ShieldCheck, color: "text-blue-500", desc: "Months covered" },
    { label: "Lifestyle Creep", val: `+${data.lifestyle_inflation}%`, icon: Flame, color: "text-orange-500", desc: "Spend increase" },
    { label: "Monthly Subs", val: `₹${data.recurring_total}`, icon: RefreshCcw, color: "text-purple-500", desc: "Fixed commitments" },
    { label: "Burn Variance", val: `${data.burn_variance}%`, icon: Activity, color: "text-red-500", desc: "Vs historical avg" },
    { label: "End Balance", val: `₹${data.predicted_end_balance}`, icon: Timer, color: "text-slate-500", desc: "Forecasted" },
    { label: "Weekend %", val: `${data.weekend_intensity}%`, icon: Calendar, color: "text-indigo-500", desc: "Lifestyle cost" },
    { label: "DTI Ratio", val: "0.2", icon: CreditCard, color: "text-pink-500", desc: "Debt risk: Low" },
    { label: "Payday Speed", val: data.payday_velocity, icon: Zap, color: "text-amber-500", desc: "First 48h spend" },
    { label: "Financial Age", val: "28y", icon: TrendingUp, color: "text-cyan-500", desc: "Based on wealth" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {insights.map((item, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-lg transition-all cursor-default group">
          <div className="flex justify-between items-start">
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <span className="text-[9px] font-black text-slate-300 uppercase group-hover:text-slate-500">{item.desc}</span>
          </div>
          <div className="mt-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.label}</p>
            <h4 className="text-xl font-black text-slate-900 dark:text-white">{item.val}</h4>
          </div>
        </div>
      ))}
    </div>
  );
}