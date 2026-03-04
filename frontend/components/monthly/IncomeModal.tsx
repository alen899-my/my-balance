"use client";

import React, { useState, useEffect } from "react";
import { X, Wallet, ArrowUpCircle, Loader2, Edit3 } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

export default function IncomeModal({ isOpen, onClose, currentIncome, onSave, month, year }: any) {
  const [incomeValue, setIncomeValue] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setIncomeValue(currentIncome > 0 ? currentIncome.toString() : "");
  }, [currentIncome, isOpen]);

  const isEditing = currentIncome > 0;

  async function handleSubmit() {
    if (!incomeValue || isNaN(Number(incomeValue))) return;
    setLoading(true);
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/income`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(incomeValue), month: Number(month), year: Number(year) }),
      });
      if (res.ok) { onSave(); onClose(); }
    } catch (err) { console.error("Income Update Error:", err); }
    finally { setLoading(false); }
  }

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <div className="gov-panel" style={{ position: "relative", width: "100%", maxWidth: "360px", padding: "24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <p className="section-label" style={{ marginBottom: "2px" }}>Budget Register</p>
            <h2 style={{ margin: 0, fontSize: "18px" }}>{isEditing ? "Update Monthly Income" : "Set Monthly Income"}</h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>{isEditing ? "Modify existing income entry" : "Define base budget for this month"}</p>
          </div>
          <button onClick={onClose} style={{ padding: "6px", background: "#161616", border: "1px solid var(--border-default)", borderRadius: "6px", cursor: "pointer", display: "flex", color: "var(--text-secondary)", flexShrink: 0 }}>
            <X style={{ width: "16px", height: "16px" }} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
              Monthly Amount (₹)
            </label>
            <div style={{ position: "relative" }}>
              <Wallet style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-muted)" }} />
              <input
                type="number"
                placeholder="0.00"
                value={incomeValue}
                autoFocus
                onChange={e => setIncomeValue(e.target.value)}
                className="gov-input"
                style={{ paddingLeft: "32px", fontSize: "20px", fontWeight: 700, height: "52px" }}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="gov-btn-primary"
            style={{ justifyContent: "center", padding: "12px", opacity: loading ? 0.6 : 1 }}
          >
            {loading
              ? <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
              : <>{isEditing ? <Edit3 style={{ width: "14px", height: "14px" }} /> : <ArrowUpCircle style={{ width: "14px", height: "14px" }} />}</>}
            {isEditing ? "Update Income" : "Confirm Income"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}