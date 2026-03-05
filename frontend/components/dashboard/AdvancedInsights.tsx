"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import {
  PieChart, ShieldCheck, Flame, RefreshCcw,
  Activity, Timer, Calendar, CreditCard, Zap, TrendingUp, BarChart, Target
} from "lucide-react";

interface AdvancedInsightsProps {
  selectedBank?: string;
}

export default function AdvancedInsights({ selectedBank }: AdvancedInsightsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdvancedData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedBank && selectedBank !== "All Banks") params.append("bank", selectedBank);
        const res = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/insights/advanced?${params.toString()}`
        );
        setData(await res.json());
      } catch (err) {
        console.error("Advanced Insights Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdvancedData();
  }, [selectedBank]);

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px" }}>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: "80px" }} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  if (data.error_traceback) {
    return (
      <div className="gov-panel" style={{ padding: "16px", background: "#fee2e2", border: "1px solid #ef4444", color: "#b91c1c", overflow: "auto" }}>
        <strong>Backend Crash Detected:</strong>
        <pre style={{ fontSize: "11px", marginTop: "8px", whiteSpace: "pre-wrap" }}>{data.error_traceback}</pre>
      </div>
    );
  }

  const metrics = [
    { label: "Savings Rate", value: `${data.savings_rate}%`, icon: PieChart, border: "#abefc6", color: "var(--success)", bg: "var(--success-bg)", note: "Target ≥20%", title: "Percentage of income saved after expenses (Target: 20%+)." },
    { label: "Safety Net", value: `${data.safety_net_score} mo.`, icon: ShieldCheck, border: "#b9e6fe", color: "var(--info)", bg: "var(--info-bg)", note: "Months covered", title: "How many months you can survive on your current total balance based on average historical burn rate." },
    { label: "Lifestyle Creep", value: `+${data.lifestyle_inflation}%`, icon: Flame, border: "#fedf89", color: "var(--warning)", bg: "var(--warning-bg)", note: "Spend increase", title: "Percentage increase in spending compared to your last completed month." },
    { label: "Recurring", value: `₹${(data.recurring_total || 0).toLocaleString()}`, icon: RefreshCcw, border: "#ddd6fe", color: "#7c3aed", bg: "#f5f3ff", note: "Monthly subs", title: "Estimated fixed monthly recurring expenses based on historical analysis." },
    { label: "Burn Variance", value: `${data.burn_variance}%`, icon: Activity, border: "#fda29b", color: "var(--danger)", bg: "var(--danger-bg)", note: "Vs avg", title: "How much more (or less) you spent this month compared to your historical average." },
    { label: "End Balance", value: `₹${(data.predicted_end_balance || 0).toLocaleString()}`, icon: Timer, border: "#d0d5dd", color: "var(--text-secondary)", bg: "#f9fafb", note: "Forecasted", title: "Predicted total balance at the end of the current month based on daily average burn." },
    { label: "Weekend Spend", value: `${data.weekend_intensity}%`, icon: Calendar, border: "#bfcfef", color: "var(--brand)", bg: "var(--brand-light)", note: "Of total spend", title: "Percentage of your total monthly expenses that occurred on weekends." },
    { label: "DTI Ratio", value: data.dti_ratio !== undefined ? data.dti_ratio.toString() : "0", icon: CreditCard, border: "#fda29b", color: "var(--danger)", bg: "var(--danger-bg)", note: "Debt risk indicator", title: "Estimated Debt-to-Income ratio based on recurring spend vs historical average income." },
    { label: "Payday Velocity", value: data.payday_velocity, icon: Zap, border: "#fedf89", color: "var(--warning)", bg: "var(--warning-bg)", note: "First 48h spend", title: "High indicates heavy spending immediately after receiving salary/income." },
    { label: "Financial Age", value: data.financial_age || "Unknown", icon: TrendingUp, border: "#b9e6fe", color: "var(--info)", bg: "var(--info-bg)", note: "Based on wealth", title: "Estimated financial maturity based on asset accumulation and burn efficiency." },
    { label: "Savings Status", value: data.savings_status || "Unknown", icon: Target, border: data.savings_status === "Excellent" ? "#abefc6" : data.savings_status === "Stable" ? "#b9e6fe" : "#fda29b", color: data.savings_status === "Excellent" ? "var(--success)" : data.savings_status === "Stable" ? "var(--info)" : "var(--danger)", bg: data.savings_status === "Excellent" ? "var(--success-bg)" : data.savings_status === "Stable" ? "var(--info-bg)" : "var(--danger-bg)", note: "Overall Health", title: "General indicator of holistic monthly cashflow standing." },
    { label: "Daily TXNs", value: `${data.tx_frequency || 0}/day`, icon: Activity, border: "#d0d5dd", color: "var(--text-secondary)", bg: "#f9fafb", note: "Interaction rate", title: "Average count of daily transactions made per day across the period." },
    { label: "Income Volatility", value: `${data.income_volatility || 0}%`, icon: BarChart, border: "#ddd6fe", color: "#7c3aed", bg: "#f5f3ff", note: "Income Spikes", title: "Max month-over-month variance calculated within income streams." },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px" }}>
      {metrics.map((m, i) => (
        <div
          key={i}
          className="gov-kpi-card"
          style={{ borderLeft: `3px solid ${m.border}`, padding: "10px 12px" }}
          title={m.title}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <div
              style={{
                width: "24px", height: "24px",
                background: m.bg,
                borderRadius: "4px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <m.icon style={{ width: "12px", height: "12px", color: m.color }} />
            </div>
            <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {m.note}
            </span>
          </div>
          <p className="section-label" style={{ marginBottom: "2px" }}>{m.label}</p>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
            {m.value}
          </p>
        </div>
      ))}
    </div>
  );
}