"use client";

import React from "react";
import { Eye, Trash2, ShoppingBag, Coffee, Car, Home, Receipt } from "lucide-react";

export default function DailySurvivalTable({ items, onView, onDelete }: any) {
  const getIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes("food") || c.includes("lunch") || c.includes("dinner") || c.includes("coffee")) return <Coffee style={{ width: "13px", height: "13px" }} />;
    if (c.includes("travel") || c.includes("uber") || c.includes("fuel") || c.includes("auto")) return <Car style={{ width: "13px", height: "13px" }} />;
    if (c.includes("rent") || c.includes("home")) return <Home style={{ width: "13px", height: "13px" }} />;
    return <ShoppingBag style={{ width: "13px", height: "13px" }} />;
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="gov-table" style={{ minWidth: "480px" }}>
        <thead>
          <tr>
            <th>Transaction Details</th>
            <th style={{ textAlign: "right" }}>Amount (₹)</th>
            <th style={{ textAlign: "center", width: "80px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? items.map((item: any) => (
            <tr key={item._id}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "28px", height: "28px", borderRadius: "6px",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      background: item.type === "income" ? "var(--success-bg)" : "var(--danger-bg)",
                      color: item.type === "income" ? "var(--success)" : "var(--danger)",
                    }}
                  >
                    {/* The getIcon function is defined inside the component */}
                    {getIcon ? getIcon(item.category) : <ShoppingBag style={{ width: "13px", height: "13px" }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: "2px" }}>
                      {item.title || item.category}
                    </p>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>
                        {item.category}
                      </span>
                      <span style={{ color: "var(--border-default)" }}>•</span>
                      {item.source === "bank_statement" ? (
                        <span className="badge-warning" style={{ fontSize: "9px", padding: "1px 4px" }} title={`Imported from ${item.bank || "Bank"}`}>Bank Sync</span>
                      ) : (
                        <span className="badge-neutral" style={{ fontSize: "9px", padding: "1px 4px" }}>Manual Entry</span>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td style={{ textAlign: "right", fontSize: "15px", fontWeight: 700, color: item.type === "income" ? "var(--success)" : "var(--text-primary)" }}>
                {item.type === "income" ? "+" : "−"}₹{(item.amount || 0).toLocaleString()}
              </td>
              <td>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <button onClick={() => onView(item)} title="View Details" style={{ padding: "6px", background: "var(--info-bg)", border: "1px solid #b9e6fe", borderRadius: "6px", cursor: "pointer", display: "flex", color: "var(--info)", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#e0f2fe"} onMouseLeave={(e) => e.currentTarget.style.background = "var(--info-bg)"}>
                    <Eye style={{ width: "14px", height: "14px" }} />
                  </button>
                  <button
                    onClick={() => item.source !== "bank_statement" && onDelete(item._id)}
                    title={item.source === "bank_statement" ? "Bank imports cannot be deleted here" : "Delete"}
                    style={{
                      padding: "6px",
                      background: item.source === "bank_statement" ? "var(--bg-surface)" : "var(--danger-bg)",
                      border: `1px solid ${item.source === "bank_statement" ? "var(--border-default)" : "#fda29b"}`,
                      borderRadius: "6px",
                      cursor: item.source === "bank_statement" ? "not-allowed" : "pointer",
                      display: "flex",
                      color: item.source === "bank_statement" ? "var(--text-muted)" : "var(--danger)",
                      opacity: item.source === "bank_statement" ? 0.5 : 1,
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => { if (item.source !== "bank_statement") e.currentTarget.style.background = "#fee2e2"; }}
                    onMouseLeave={(e) => { if (item.source !== "bank_statement") e.currentTarget.style.background = "var(--danger-bg)"; }}
                  >
                    <Trash2 style={{ width: "14px", height: "14px" }} />
                  </button>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={3} style={{ padding: "48px 14px", textAlign: "center" }}>
                <Receipt style={{ width: "28px", height: "28px", color: "var(--text-muted)", margin: "0 auto 8px" }} />
                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>No entries for this date</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}