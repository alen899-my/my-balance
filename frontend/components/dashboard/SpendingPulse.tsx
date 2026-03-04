"use client";

import React, { useEffect, useState, useMemo } from "react";
import { authFetch } from "@/lib/authFetch";
import { Activity } from "lucide-react";

interface SpendingPulseProps {
  startDate?: Date;
  endDate?: Date;
  selectedBank?: string;
}

export default function SpendingPulse({ startDate, endDate, selectedBank }: SpendingPulseProps) {
  const [dailyData, setDailyData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPulse() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate.toISOString());
        if (endDate) params.append("end_date", endDate.toISOString());
        if (selectedBank && selectedBank !== "All Banks") params.append("bank", selectedBank);
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/insights?${params.toString()}`);
        const json = await res.json();
        const lookup: Record<string, number> = {};
        if (json.summary?.daily_trend) {
          json.summary.daily_trend.forEach((item: any) => {
            lookup[new Date(item._id).toDateString()] = item.daily_spend;
          });
        }
        setDailyData(lookup);
      } catch (err) { console.error("Pulse fetch error:", err); }
      finally { setLoading(false); }
    }
    fetchPulse();
  }, [startDate, endDate, selectedBank]);

  const calendarGrid = useMemo(() => {
    const end = endDate || new Date();
    return [...Array(30)].map((_, i) => {
      const d = new Date(end);
      d.setDate(d.getDate() - (29 - i));
      return {
        date: d.toDateString(),
        displayDate: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        amount: dailyData[d.toDateString()] || 0,
      };
    });
  }, [dailyData, endDate]);

  const getColor = (amount: number) => {
    if (amount === 0) return "#f0f2f5";
    if (amount < 500) return "#bfcfef";
    if (amount < 2000) return "#6b96d4";
    if (amount < 5000) return "#2563eb";
    return "#1a3a8f";
  };

  if (loading) return (
    <div className="gov-panel" style={{ height: "320px" }}>
      <div className="gov-panel-header">
        <div className="skeleton" style={{ width: "180px", height: "18px" }} />
      </div>
      <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "6px" }}>
        {[...Array(30)].map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: "1" }} />)}
      </div>
    </div>
  );

  return (
    <div className="gov-panel" style={{ display: "flex", flexDirection: "column" }}>
      <div className="gov-panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity style={{ width: "15px", height: "15px", color: "var(--brand)" }} />
          <div>
            <h2 style={{ margin: 0, fontSize: "14px" }}>Daily Spend Activity</h2>
            <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {selectedBank && selectedBank !== "All Banks" ? selectedBank : "All Banks"} — Last 30 Days
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "5px", marginBottom: "16px" }}>
          {calendarGrid.map((day, i) => (
            <div
              key={i}
              title={`${day.displayDate}: ₹${day.amount.toLocaleString()}`}
              style={{
                aspectRatio: "1",
                borderRadius: "3px",
                background: getColor(day.amount),
                cursor: "pointer",
                transition: "opacity 0.1s",
                border: "1px solid rgba(0,0,0,0.04)",
              }}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Low</span>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            {["#f0f2f5", "#bfcfef", "#6b96d4", "#2563eb", "#1a3a8f"].map((c, i) => (
              <div key={i} style={{ width: "10px", height: "10px", background: c, borderRadius: "2px", border: "1px solid rgba(0,0,0,0.06)" }} />
            ))}
          </div>
          <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>High</span>
        </div>
      </div>
    </div>
  );
}