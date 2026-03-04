"use client";

import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { authFetch } from "@/lib/authFetch";
import { Layers } from "lucide-react";

const COLORS = ["#1a3a8f", "#027a48", "#b42318", "#b54708", "#7c3aed", "#026aa2", "#c4320a", "#475467"];

interface CategorySpendingProps {
  startDate?: Date;
  endDate?: Date;
  selectedBank?: string;
}

export default function CategorySpending({ startDate, endDate, selectedBank }: CategorySpendingProps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate.toISOString());
        if (endDate) params.append("end_date", endDate.toISOString());
        if (selectedBank && selectedBank !== "All Banks") params.append("bank", selectedBank);
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/insights?${params.toString()}`);
        const json = await res.json();
        setData(json.category_data || []);
      } catch (err) { console.error("Category fetch error:", err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [startDate, endDate, selectedBank]);

  if (loading) return (
    <div className="gov-panel skeleton" style={{ height: "380px" }} />
  );

  return (
    <div className="gov-panel" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="gov-panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers style={{ width: "15px", height: "15px", color: "var(--brand)" }} />
          <h2 style={{ margin: 0, fontSize: "14px" }}>Expenditure by Category</h2>
        </div>
        {selectedBank && selectedBank !== "All Banks" && (
          <span className="badge-info">{selectedBank}</span>
        )}
      </div>

      <div style={{ flex: 1, minHeight: "300px", padding: "8px 0" }}>
        {data.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "260px" }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>No categorized data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data} innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="amount" nameKey="category" animationDuration={1000}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "6px", border: "1px solid var(--border-default)",
                  background: "var(--bg-surface)", fontSize: "12px",
                  boxShadow: "var(--shadow-dropdown)",
                }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Amount"]}
              />
              <Legend
                verticalAlign="bottom" align="center" iconType="circle"
                formatter={v => <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}