"use client";

import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { authFetch } from "@/lib/authFetch";
import { BarChart3 } from "lucide-react";

export default function MonthlySpendingChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChartData() {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/insights`);
        const json = await res.json();
        setData(json.monthly_data || []);
      } catch (err) {
        console.error("Chart load error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchChartData();
  }, []);

  if (loading) return <div className="h-[400px] w-full bg-slate-50 dark:bg-slate-900 animate-pulse rounded-3xl border border-slate-200" />;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Monthly Spending</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expense Trends</p>
        </div>
        <BarChart3 className="w-5 h-5 text-blue-500" />
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorTotal)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}