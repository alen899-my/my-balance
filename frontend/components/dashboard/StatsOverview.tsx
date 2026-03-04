"use client";

import { useEffect, useState, useMemo } from "react";
import { authFetch } from "@/lib/authFetch";
import { TrendingDown, Wallet, Trophy, Activity, Target, Repeat } from "lucide-react";

interface StatsOverviewProps {
  startDate?: Date;
  endDate?: Date;
  selectedBank?: string;
}

export default function StatsOverview({ startDate, endDate, selectedBank }: StatsOverviewProps) {
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate.toISOString());
        if (endDate) params.append("end_date", endDate.toISOString());
        if (selectedBank && selectedBank !== "All Banks") params.append("bank", selectedBank);

        const [resData, resInsights] = await Promise.all([
          authFetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions?limit=1&${params.toString()}`),
          authFetch(`${process.env.NEXT_PUBLIC_API_URL}/insights?${params.toString()}`),
        ]);
        const jsonD = await resData.json();
        const jsonI = await resInsights.json();
        setData(jsonD.data || []);
        setSummary(jsonI);
      } catch (err) {
        console.error("Stats Error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [startDate, endDate, selectedBank]);

  const cards = useMemo(() => {
    const s = summary?.summary;
    const leaderboard = summary?.leaderboard || [];
    const topPayee = leaderboard[0];
    return [
      { label: "Net Balance", value: `₹${(s?.balance || 0).toLocaleString()}`, icon: Wallet, color: "var(--brand)", border: "#bfcfef", bg: "var(--brand-light)", title: "Sum of actual balances across all filtered bank accounts." },
      { label: "Total Expense", value: `₹${(s?.expense || 0).toLocaleString()}`, icon: TrendingDown, color: "var(--danger)", border: "#fda29b", bg: "var(--danger-bg)", title: "Sum of all debit transactions (money spent) in this period." },
      { label: "Top Payee", value: topPayee?.name || "N/A", icon: Trophy, color: "var(--warning)", border: "#fedf89", bg: "var(--warning-bg)", title: "The merchant or individual you sent the most money to this period." },
      { label: "Daily Average", value: `₹${(s?.daily_avg || 0).toLocaleString()}`, icon: Activity, color: "#7c3aed", border: "#ddd6fe", bg: "#f5f3ff", title: "Average amount of money spent per day." },
      { label: "Savings Rate", value: `${s?.savings_rate || 0}%`, icon: Target, color: "var(--success)", border: "#abefc6", bg: "var(--success-bg)", title: "Percentage of total income that was not spent." },
      { label: "Transactions", value: (s?.total_transactions || 0).toString(), icon: Repeat, color: "var(--info)", border: "#b9e6fe", bg: "var(--info-bg)", title: "Total number of combined transactions in this period." },
    ];
  }, [data, summary]);

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: "88px" }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
      {cards.map((card, i) => (
        <div
          key={i}
          className="gov-kpi-card"
          style={{ borderLeft: `3px solid ${card.border}` }}
          title={card.title}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div
              style={{
                width: "28px", height: "28px",
                background: card.bg,
                borderRadius: "6px",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <card.icon style={{ width: "14px", height: "14px", color: card.color }} />
            </div>
            <p className="section-label">{card.label}</p>
          </div>
          <p
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={card.value.toString()}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}