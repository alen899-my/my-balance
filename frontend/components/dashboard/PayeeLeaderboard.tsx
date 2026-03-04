"use client";

import React, { useEffect, useState, useMemo } from "react";
import { authFetch } from "@/lib/authFetch";
import { Receipt, Search, ArrowUpRight, ArrowDownLeft, Landmark } from "lucide-react";

interface PayeeLeaderboardProps {
  startDate?: Date;
  endDate?: Date;
  selectedBank?: string;
}

export default function PayeeLeaderboard({ startDate, endDate, selectedBank }: PayeeLeaderboardProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"spent" | "received">("spent");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate.toISOString());
        if (endDate) params.append("end_date", endDate.toISOString());
        if (selectedBank && selectedBank !== "All Banks") params.append("bank", selectedBank);
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/insights?${params.toString()}`);
        const json = await res.json();
        setData(json.leaderboard || []);
      } catch (err) { console.error("Leaderboard error:", err); }
      finally { setLoading(false); }
    }
    fetchLeaderboard();
  }, [startDate, endDate, selectedBank]);

  const filteredList = useMemo(() =>
    data
      .filter(item => {
        const name = item.name || "Unknown";
        return name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (view === "spent" ? item.spent > 0 : item.received > 0);
      })
      .sort((a, b) => view === "spent" ? b.spent - a.spent : b.received - a.received),
    [data, view, searchTerm]);

  if (loading) {
    return (
      <div className="gov-panel" style={{ height: "500px" }}>
        <div className="gov-panel-header"><div className="skeleton" style={{ width: "160px", height: "18px" }} /></div>
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: "52px" }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="gov-panel" style={{ height: "500px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div className="gov-panel-header" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Landmark style={{ width: "15px", height: "15px", color: "var(--brand)" }} />
          <h2 style={{ margin: 0, fontSize: "14px" }}>Payee Ranking</h2>
        </div>
        {/* Toggle */}
        <div style={{ display: "flex", border: "1px solid var(--border-default)", borderRadius: "6px", overflow: "hidden" }}>
          {(["spent", "received"] as const).map(t => (
            <button
              key={t}
              onClick={() => setView(t)}
              style={{
                padding: "5px 14px", fontSize: "11px", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.06em", border: "none",
                cursor: "pointer", transition: "background 0.12s",
                background: view === t ? "var(--brand)" : "var(--bg-surface)",
                color: view === t ? "var(--bg-surface)" : "var(--text-secondary)",
              }}
            >
              {t === "spent" ? "Outflow" : "Inflow"}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-light)", flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search payee or UPI ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="gov-input"
            style={{ paddingLeft: "32px" }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {filteredList.length > 0 ? filteredList.map((item, idx) => {
          const amount = view === "spent" ? item.spent : item.received;
          const isFirst = idx === 0 && !searchTerm;
          return (
            <div
              key={`${item.name}-${idx}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px",
                background: isFirst ? "var(--brand-light)" : "transparent",
                borderBottom: "1px solid var(--border-light)",
                transition: "background 0.1s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "28px", height: "28px", borderRadius: "4px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: idx === 0 ? "var(--warning-bg)" : idx === 1 ? "#161616" : "#161616",
                    border: "1px solid var(--border-default)",
                    fontSize: "11px", fontWeight: 700,
                    color: idx === 0 ? "var(--warning)" : "var(--text-secondary)",
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "150px" }}>
                    {item.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Receipt style={{ width: "10px", height: "10px", color: "var(--text-muted)" }} />
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>{item.count} txns</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: view === "spent" ? "var(--danger)" : "var(--success)" }}>
                  ₹{amount.toLocaleString()}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "2px" }}>
                  {view === "spent"
                    ? <ArrowUpRight style={{ width: "10px", height: "10px", color: "var(--danger)" }} />
                    : <ArrowDownLeft style={{ width: "10px", height: "10px", color: "var(--success)" }} />}
                  <span style={{ fontSize: "9px", fontWeight: 700, color: view === "spent" ? "var(--danger)" : "var(--success)", textTransform: "uppercase" }}>
                    {view === "spent" ? "Paid" : "Received"}
                  </span>
                </div>
              </div>
            </div>
          );
        }) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px" }}>
            <Search style={{ width: "24px", height: "24px", color: "var(--text-muted)", marginBottom: "8px" }} />
            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>No records found</p>
          </div>
        )}
      </div>
    </div>
  );
}