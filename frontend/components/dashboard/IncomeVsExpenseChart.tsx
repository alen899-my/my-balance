"use client";

import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { authFetch } from "@/lib/authFetch";
import { TrendingUp } from "lucide-react";

interface IncomeVsExpenseChartProps {
    startDate?: Date;
    endDate?: Date;
    selectedBank?: string;
}

export default function IncomeVsExpenseChart({ startDate, endDate, selectedBank }: IncomeVsExpenseChartProps) {
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
        return <div className="gov-panel skeleton" style={{ height: "400px" }} />;
    }

    return (
        <div className="gov-panel" style={{ height: "400px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div className="gov-panel-header" style={{ flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <TrendingUp style={{ width: "15px", height: "15px", color: "var(--brand)" }} />
                    <div>
                        <h2 style={{ margin: 0, fontSize: "14px" }}>Income vs Expense</h2>
                        <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {selectedBank && selectedBank !== "All Banks" ? selectedBank : "All Banks"}
                        </p>
                    </div>
                </div>
                <span className="badge-success">Area Chart</span>
            </div>

            <div style={{ flex: 1, padding: "16px 8px 8px", overflow: "hidden" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#abefc6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#abefc6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fda29b" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#fda29b" stopOpacity={0} />
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
                            labelStyle={{ color: "#475467", fontWeight: 700, marginBottom: "4px" }}
                            formatter={(value: any, name: any) => [`₹${Number(value || 0).toLocaleString()}`, name === "income" ? "Income" : "Expense"]}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }} />
                        <Area
                            type="monotone" dataKey="income" name="Income"
                            stroke="#17b26a" strokeWidth={2}
                            fillOpacity={1} fill="url(#colorIncome)"
                            animationDuration={1200}
                        />
                        <Area
                            type="monotone" dataKey="expense" name="Expense"
                            stroke="#f04438" strokeWidth={2}
                            fillOpacity={1} fill="url(#colorExpense)"
                            animationDuration={1200}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
