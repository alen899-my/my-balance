"use client";

import React from "react";
import { X, Calendar, Tag, Hash, ArrowDownCircle, ArrowUpCircle, Clock } from "lucide-react";

export default function DailyViewModal({ isOpen, onClose, item }: any) {
  if (!isOpen || !item) return null;
  const isExpense = item.type === "expense";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 160, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <div className="gov-panel" style={{ position: "relative", width: "100%", maxWidth: "380px", padding: "24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <p className="section-label" style={{ marginBottom: "2px" }}>Daily Transaction Log</p>
            <h2 style={{ margin: 0, fontSize: "16px", lineHeight: 1.3 }}>{item.title || item.category || "Entry Details"}</h2>
            {item.source === "bank_statement" ? (
              <span className="badge-warning" style={{ fontSize: "10px", padding: "2px 6px", marginTop: "4px", display: "inline-block" }}>Bank Sync</span>
            ) : (
              <span className="badge-neutral" style={{ fontSize: "10px", padding: "2px 6px", marginTop: "4px", display: "inline-block" }}>Manual Entry</span>
            )}
          </div>
          <button onClick={onClose} style={{ padding: "6px", background: "#161616", border: "1px solid var(--border-default)", borderRadius: "6px", cursor: "pointer", display: "flex", color: "var(--text-secondary)" }}>
            <X style={{ width: "16px", height: "16px" }} />
          </button>
        </div>

        {/* Amount Hero */}
        <div
          style={{
            padding: "16px", marginBottom: "14px",
            background: isExpense ? "var(--danger-bg)" : "var(--success-bg)",
            border: `1px solid ${isExpense ? "#fda29b" : "#abefc6"}`,
            borderRadius: "6px", textAlign: "center",
          }}
        >
          <p className="section-label" style={{ marginBottom: "4px" }}>Transaction Total</p>
          <p style={{ fontSize: "30px", fontWeight: 700, color: isExpense ? "var(--danger)" : "var(--success)" }}>
            {isExpense ? "−" : "+"}₹{item.amount?.toLocaleString()}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            ...(item.source === "bank_statement" ? [{ icon: <Hash style={{ width: "13px", height: "13px" }} />, label: "Source Bank", value: item.bank || "Unknown Bank" }] : []),
            { icon: <Tag style={{ width: "13px", height: "13px" }} />, label: "Category", value: item.category },
            {
              icon: isExpense ? <ArrowDownCircle style={{ width: "13px", height: "13px" }} /> : <ArrowUpCircle style={{ width: "13px", height: "13px" }} />,
              label: "Type",
              value: <span className={isExpense ? "badge-danger" : "badge-success"}>{item.type}</span>,
            },
            {
              icon: <Calendar style={{ width: "13px", height: "13px" }} />,
              label: "Date Logged",
              value: new Date(item.entry_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" }),
            },
            {
              icon: <Hash style={{ width: "13px", height: "13px" }} />,
              label: "Reference ID",
              value: <span style={{ fontFamily: "monospace", fontSize: "10px", color: "var(--text-muted)", wordBreak: "break-all" }}>{item._id}</span>,
            },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "9px 12px", background: "#161616", border: "1px solid var(--border-light)", borderRadius: "6px" }}>
              <div style={{ marginTop: "2px", color: "var(--brand)", flexShrink: 0 }}>{row.icon}</div>
              <div>
                <p className="section-label" style={{ marginBottom: "1px" }}>{row.label}</p>
                {typeof row.value === "string"
                  ? <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{row.value}</p>
                  : row.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <Clock style={{ width: "11px", height: "11px", color: "var(--text-muted)" }} />
          <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Verified Entry</span>
        </div>
      </div>
    </div>
  );
}