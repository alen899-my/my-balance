"use client";

import React from "react";
import { PiggyBank } from "lucide-react";

interface SavingsSpeedometerProps {
  income: number;
  expenses: number;
}

export default function SavingsSpeedometer({ income, expenses }: SavingsSpeedometerProps) {
  const savings = Math.max(0, income - expenses);
  const rate = income > 0 ? (savings / income) * 100 : 0;

  const radius = 80;
  const circumference = radius * Math.PI;
  const strokeDashoffset = circumference - (Math.min(rate, 100) / 100) * circumference;

  const getColor = () => {
    if (rate < 15) return "#b42318";
    if (rate < 30) return "#b54708";
    return "#027a48";
  };

  const getStatus = () => {
    if (rate < 15) return { text: "Critical", cls: "badge-danger" };
    if (rate < 30) return { text: "Moderate", cls: "badge-warning" };
    if (rate < 50) return { text: "Healthy", cls: "badge-success" };
    return { text: "Excellent", cls: "badge-success" };
  };

  const status = getStatus();

  return (
    <div className="gov-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: "16px" }}>
        <div>
          <p className="section-label" style={{ marginBottom: "2px" }}>Savings Efficiency</p>
          <h2 style={{ margin: 0, fontSize: "14px" }}>Rate Gauge</h2>
        </div>
        <div style={{ padding: "6px", background: "var(--brand-light)", borderRadius: "6px" }}>
          <PiggyBank style={{ width: "16px", height: "16px", color: "var(--brand)" }} />
        </div>
      </div>

      {/* SVG Gauge */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="200" height="120" viewBox="0 0 200 120">
          {/* Track */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none" stroke="#e4e7ec"
            strokeWidth="14" strokeLinecap="round"
          />
          {/* Progress */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke={getColor()}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1.5s ease, stroke 0.5s ease" }}
          />
        </svg>
        {/* Readout */}
        <div style={{ position: "absolute", bottom: "6px", textAlign: "center" }}>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
            {Math.round(rate)}%
          </p>
          <span className={status.cls} style={{ marginTop: "4px" }}>{status.text}</span>
        </div>
      </div>

      {/* Footer metrics */}
      <div
        style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          width: "100%", marginTop: "16px",
          paddingTop: "14px", borderTop: "1px solid var(--border-light)",
          gap: "1px",
        }}
      >
        <div style={{ textAlign: "center", paddingRight: "12px", borderRight: "1px solid var(--border-light)" }}>
          <p className="section-label" style={{ marginBottom: "2px" }}>Surplus</p>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--success)" }}>₹{savings.toLocaleString()}</p>
        </div>
        <div style={{ textAlign: "center", paddingLeft: "12px" }}>
          <p className="section-label" style={{ marginBottom: "2px" }}>Target</p>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--brand)" }}>≥20%</p>
        </div>
      </div>
    </div>
  );
}