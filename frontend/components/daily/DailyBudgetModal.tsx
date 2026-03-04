"use client";

import React, { useState } from "react";
import { X, Plus, Tag, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

export default function DailyBudgetModal({ isOpen, onClose, onSave, selectedDate, initialData }: any) {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [type, setType] = useState("expense");

  React.useEffect(() => {
    if (initialData) {
      setCategory(initialData.merchant || "");
      setAmount(initialData.amount || 0);
      setType("expense");
    }
  }, [initialData]);

  if (!isOpen) return null;

  async function handleSave() {
    if (!category || amount <= 0) return;
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/daily-budget/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, amount, type, entry_date: selectedDate }),
      });
      onSave();
      onClose();
      setCategory(""); setAmount(0); setType("expense");
    } catch (err) { console.error(err); }
  }

  const dateLabel = new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <div className="gov-panel" style={{ position: "relative", width: "100%", maxWidth: "440px", padding: "24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <p className="section-label" style={{ marginBottom: "2px" }}>Daily Tracking</p>
            <h2 style={{ margin: "0 0 2px", fontSize: "18px" }}>Log Transaction</h2>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>{dateLabel}</p>
          </div>
          <button
            onClick={onClose}
            style={{ padding: "6px", background: "#161616", border: "1px solid var(--border-default)", borderRadius: "6px", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}
          >
            <X style={{ width: "16px", height: "16px" }} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Type Toggle */}
          <div style={{ display: "flex", border: "1px solid var(--border-default)", borderRadius: "6px", overflow: "hidden" }}>
            {(["expense", "income"] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  padding: "9px 12px", border: "none", cursor: "pointer",
                  borderRight: t === "expense" ? "1px solid var(--border-default)" : "none",
                  fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
                  background: type === t ? (t === "expense" ? "var(--danger-bg)" : "var(--success-bg)") : "var(--bg-surface)",
                  color: type === t ? (t === "expense" ? "var(--danger)" : "var(--success)") : "var(--text-secondary)",
                  transition: "all 0.12s",
                }}
              >
                {t === "expense"
                  ? <ArrowDownLeft style={{ width: "13px", height: "13px" }} />
                  : <ArrowUpRight style={{ width: "13px", height: "13px" }} />}
                {t}
              </button>
            ))}
          </div>

          {/* Category */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
              Category / Description
            </label>
            <div style={{ position: "relative" }}>
              <Tag style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="e.g. Lunch, Groceries, Transport"
                className="gov-input"
                style={{ paddingLeft: "32px" }}
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
              Amount (₹)
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", fontWeight: 700, color: "var(--text-muted)" }}>₹</span>
              <input
                type="number"
                placeholder="0"
                className="gov-input"
                style={{ paddingLeft: "32px", fontSize: "22px", fontWeight: 700, height: "52px" }}
                value={amount || ""}
                onChange={e => setAmount(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSave}
            className="gov-btn-primary"
            style={{
              justifyContent: "center", padding: "12px",
              background: type === "expense" ? "var(--danger)" : "var(--success)",
              borderColor: type === "expense" ? "var(--danger)" : "var(--success)",
            }}
          >
            <Plus style={{ width: "14px", height: "14px" }} />
            {type === "expense" ? "Log Expense" : "Log Income"}
          </button>
        </div>
      </div>
    </div>
  );
}