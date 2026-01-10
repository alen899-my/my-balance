"use client";

import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { authFetch } from "@/lib/authFetch";
import { Layers } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#06b6d4", "#f43f5e", "#64748b"];

interface CategorySpendingProps {
  startDate?: Date;
  endDate?: Date;
}

export default function CategorySpending({ startDate, endDate }: CategorySpendingProps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate.toISOString());
        if (endDate) params.append("end_date", endDate.toISOString());

        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/insights?${params.toString()}`);
        const json = await res.json();
        setData(json.category_data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [startDate, endDate]);

  if (loading) return <div className="h-[380px] w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 animate-pulse" />;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase">Spending Categories</h2>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="amount"
              nameKey="category"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
              formatter={(value) => `₹${Number(value).toLocaleString()}`}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              formatter={(value) => <span className="text-[10px] font-bold text-slate-500 uppercase">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}