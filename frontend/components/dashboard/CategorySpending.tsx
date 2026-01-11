"use client";

import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { authFetch } from "@/lib/authFetch";
import { Layers } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#06b6d4", "#f43f5e", "#64748b"];

interface CategorySpendingProps {
  startDate?: Date;
  endDate?: Date;
  selectedBank?: string; // 1. Added selectedBank prop
}

export default function CategorySpending({ startDate, endDate, selectedBank }: CategorySpendingProps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true); // Reset loading state when bank/date changes
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
        setData(json.category_data || []);
      } catch (err) { 
        console.error("Category fetch error:", err); 
      } finally { 
        setLoading(false); 
      }
    }
    fetchData();
    // 3. Added selectedBank to dependency array
  }, [startDate, endDate, selectedBank]);

  if (loading) return (
    <div className="h-[380px] w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse flex items-center justify-center">
        <Layers className="w-8 h-8 text-slate-200 dark:text-slate-800 animate-bounce" />
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase">Spending Categories</h2>
        </div>
        {selectedBank && selectedBank !== "All Banks" && (
            <span className="text-[9px] font-black bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-1 rounded-lg uppercase border border-emerald-100 dark:border-emerald-800">
                {selectedBank}
            </span>
        )}
      </div>

      <div className="flex-1 min-h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="amount"
              nameKey="category"
              animationBegin={0}
              animationDuration={1200}
            >
              {data.map((_, index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                backgroundColor: '#0f172a',
                color: '#fff',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', 
                fontSize: '12px' 
              }}
              itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              formatter={(value) => `₹${Number(value).toLocaleString()}`}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              layout="horizontal"
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {data.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
            <p className="text-xs font-bold uppercase tracking-widest">No Categorized Data</p>
        </div>
      )}
    </div>
  );
}