"use client";

import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { authFetch } from "@/lib/authFetch";
import { BarChart3 } from "lucide-react";

interface MonthlySpendingChartProps {
  startDate?: Date;
  endDate?: Date;
}

export default function MonthlySpendingChart({ startDate, endDate }: MonthlySpendingChartProps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChartData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate.toISOString());
        if (endDate) params.append("end_date", endDate.toISOString());

        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/insights?${params.toString()}`);
        const json = await res.json();
        setData(json.monthly_data || []);
      } catch (err) {
        console.error("Chart load error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchChartData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="h-[400px] w-full bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-[2.5rem] border border-slate-200 dark:border-slate-800" />
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Monthly Spending</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expense Trends</p>
        </div>
        <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-2xl">
          <BarChart3 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
      </div>

      {/* Responsive Chart Wrapper */}
      <div className="flex-1 w-full overflow-x-auto scrollbar-hide">
        {/* min-w-[600px] ensures the chart remains readable on mobile by triggering a scroll */}
        <div className="h-[300px] w-full min-w-[500px] md:min-w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke="#e2e8f0" 
                className="dark:stroke-slate-800" 
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' 
                }}
                itemStyle={{ color: '#ddd', fontSize: '12px', fontWeight: 'bold' }}
                labelStyle={{ color: '#fff', marginBottom: '4px', fontWeight: '900' }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#7c3aed"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTotal)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}