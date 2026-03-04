"use client";

import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { authFetch } from "@/lib/authFetch";
import { BarChart3 } from "lucide-react";

interface MonthlySpendingChartProps {
  startDate?: Date;
  endDate?: Date;
  selectedBank?: string;
}

export default function MonthlySpendingChart({ startDate, endDate, selectedBank }: MonthlySpendingChartProps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChartData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate.toISOString());
        if (endDate) params.append("end_date", endDate.toISOString());
        if (selectedBank && selectedBank !== "All Banks") params.append("bank", selectedBank);
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/insights?${params.toString()}`);
        const json = await res.json();
        setData(json.monthly_data || []);
      } catch (err) { console.error("Chart load error:", err); }
      finally { setLoading(false); }
    }
    fetchChartData();
  }, [startDate, endDate, selectedBank]);

  if (loading) {
    return <div className="gov-panel skeleton" style={{ height: "500px" }} />;
  }

  return (
    <div className="gov-panel" style={{ height: "500px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="gov-panel-header" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BarChart3 style={{ width: "15px", height: "15px", color: "var(--brand)" }} />
          <div>
            <h2 style={{ margin: 0, fontSize: "14px" }}>Monthly Spending Trend</h2>
            <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {selectedBank && selectedBank !== "All Banks" ? selectedBank : "All Banks"}
            </p>
          </div>
        </div>
        <span className="badge-info">Area Chart</span>
      </div>

      <div style={{ flex: 1, padding: "16px 8px 8px", overflow: "hidden" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="govAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1a3a8f" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1a3a8f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e7ec" />
            <XAxis
              dataKey="month"
              axisLine={false} tickLine={false}
              tick={{ fill: "#98a2b3", fontSize: 10, fontWeight: 600 }}
              dy={8}
            />
            <YAxis
              axisLine={false} tickLine={false}
              tick={{ fill: "#98a2b3", fontSize: 10, fontWeight: 600 }}
              tickFormatter={v => `₹${Number(v).toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "6px", border: "1px solid #d0d5dd",
                background: "var(--bg-surface)", color: "#101828",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: "12px",
              }}
              itemStyle={{ color: "#1a3a8f", fontWeight: 600 }}
              labelStyle={{ color: "#475467", fontWeight: 700, marginBottom: "4px" }}
              formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, "Amount"]}
            />
            <Area
              type="monotone" dataKey="amount"
              stroke="#1a3a8f" strokeWidth={2}
              fillOpacity={1} fill="url(#govAreaFill)"
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}