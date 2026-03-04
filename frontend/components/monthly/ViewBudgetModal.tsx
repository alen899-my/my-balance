"use client";

import React from "react";
import { X, Calendar, Calculator, Tag, AlignLeft } from "lucide-react";

export default function ViewBudgetModal({ isOpen, onClose, item }: any) {
  if (!isOpen || !item) return null;

  const rows: { label: string; value: string }[] = item.calculation_rows || [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <div className="gov-panel" style={{ position: "relative", width: "100%", maxWidth: "400px", padding: "24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <p className="section-label" style={{ marginBottom: "2px" }}>Budget Register</p>
            <h2 style={{ margin: 0, fontSize: "18px" }}>Item Details</h2>
          </div>
          <button onClick={onClose} style={{ padding: "6px", background: "#161616", border: "1px solid var(--border-default)", borderRadius: "6px", cursor: "pointer", display: "flex", color: "var(--text-secondary)" }}>
            <X style={{ width: "16px", height: "16px" }} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Category */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "#161616", borderRadius: "6px", border: "1px solid var(--border-light)" }}>
            <Tag style={{ width: "14px", height: "14px", color: "var(--brand)", flexShrink: 0 }} />
            <div>
              <p className="section-label" style={{ marginBottom: "1px" }}>Category</p>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{item.category}</p>
            </div>
          </div>

          {/* Description */}
          {item.title && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "#161616", borderRadius: "6px", border: "1px solid var(--border-light)" }}>
              <AlignLeft style={{ width: "14px", height: "14px", color: "var(--text-muted)", flexShrink: 0 }} />
              <div>
                <p className="section-label" style={{ marginBottom: "1px" }}>Description</p>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>{item.title}</p>
              </div>
            </div>
          )}

          {/* Calculation Breakdown */}
          {rows.length > 0 && (
            <div style={{ background: "#161616", borderRadius: "6px", border: "1px solid var(--border-default)", overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-light)" }}>
                <p className="section-label">Calculation Breakdown</p>
              </div>
              {rows.map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", borderBottom: i < rows.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{row.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "var(--brand)", borderRadius: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--bg-surface)" }}>
              <Calculator style={{ width: "14px", height: "14px", opacity: 0.8 }} />
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Allocation</span>
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--bg-surface)" }}>₹{(item.amount || 0).toLocaleString()}</span>
          </div>

          {/* Period */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <Calendar style={{ width: "12px", height: "12px", color: "var(--text-muted)" }} />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Period: {item.month}/{item.year}</span>
          </div>
        </div>
      </div>
    </div>
  );
}