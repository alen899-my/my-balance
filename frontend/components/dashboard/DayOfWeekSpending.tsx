"use client";

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { authFetch } from "@/lib/authFetch";
import { CalendarDays } from "lucide-react";

interface DayOfWeekSpendingProps {
    startDate?: Date;
    endDate?: Date;
    selectedBank?: string;
}

export default function DayOfWeekSpending({ startDate, endDate, selectedBank }: DayOfWeekSpendingProps) {
    const [data, setData] = useState<any[]>([]);
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

                // Ensure proper day ordering
                const dayOrder = { "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 7 };
                const fetchedData = json.day_of_week_data || [];

                // Fill missing days
                const fullDays = Object.keys(dayOrder).map(day => {
                    const existing = fetchedData.find((d: any) => d.day === day);
                    return existing || { day, amount: 0 };
                });

                fullDays.sort((a, b) => (dayOrder as any)[a.day] - (dayOrder as any)[b.day]);
                setData(fullDays);

            } catch (err) { console.error("Chart load error:", err); }
            finally { setLoading(false); }
        }
        fetchChartData();
    }, [startDate, endDate, selectedBank]);

    if (loading) {
        return <div className="gov-panel skeleton" style={{ height: "400px" }} />;
    }

    // Find max value to highlight it
    const maxAmount = Math.max(...data.map(d => d.amount));

    return (
        <div className="gov-panel" style={{ height: "400px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div className="gov-panel-header" style={{ flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CalendarDays style={{ width: "15px", height: "15px", color: "var(--brand)" }} />
                    <div>
                        <h2 style={{ margin: 0, fontSize: "14px" }}>Weekly Spend Behavior</h2>
                        <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            Total Expenses Grouped by Day
                        </p>
                    </div>
                </div>
                <span className="badge-warning">Bar Chart</span>
            </div>

            <div style={{ flex: 1, padding: "16px 8px 8px", overflow: "hidden" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e7ec" />
                        <XAxis
                            dataKey="day"
                            axisLine={false} tickLine={false}
                            tick={{ fill: "#98a2b3", fontSize: 11, fontWeight: 600 }}
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
                            cursor={{ fill: "rgba(0,0,0,0.04)" }}
                            itemStyle={{ color: "#1a3a8f", fontWeight: 600 }}
                            labelStyle={{ color: "#475467", fontWeight: 700, marginBottom: "4px" }}
                            formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, "Total Spent"]}
                        />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]} animationDuration={1200}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.amount === maxAmount && maxAmount > 0 ? "var(--warning)" : "var(--brand)"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
