"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";

export default function BudgetModal({ isOpen, onClose, onSave }: any) {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number>(0);

  const [showCalc, setShowCalc] = useState(false);
  const [calcRows, setCalcRows] = useState<{ label: string; value: string }[]>([
    { label: "Rate", value: "" },
    { label: "Qty", value: "" },
  ]);

  useEffect(() => {
    if (showCalc) {
      const hasValid = calcRows.some(r => r.value && !isNaN(parseFloat(r.value)));
      if (!hasValid) { setAmount(0); return; }
      const total = calcRows.reduce((acc, row) => {
        const v = parseFloat(row.value);
        if (!row.value || isNaN(v)) return acc;
        return acc * v;
      }, 1);
      setAmount(total);
    }
  }, [calcRows, showCalc]);

  if (!isOpen) return null;

  const addRow = () => setCalcRows([...calcRows, { label: "", value: "" }]);
  const removeRow = (i: number) => calcRows.length > 1 && setCalcRows(calcRows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: "label" | "value", v: string) => {
    const next = [...calcRows]; next[i] = { ...next[i], [field]: v }; setCalcRows(next);
  };

  function handleSave() {
    const payload: any = { category, title, amount };
    if (showCalc) payload.calculation_rows = calcRows.map(r => ({ label: r.label || "Factor", value: parseFloat(r.value) || 0 }));
    onSave(payload);
    setCategory(""); setTitle(""); setAmount(0);
    setCalcRows([{ label: "Rate", value: "" }, { label: "Qty", value: "" }]);
    setShowCalc(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <div className="gov-panel" style={{ position: "relative", width: "100%", maxWidth: "480px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 20px 0" }}>
          <div>
            <p className="section-label" style={{ marginBottom: "2px" }}>Budget Register</p>
            <h2 style={{ margin: 0, fontSize: "18px" }}>Add Budget Item</h2>
          </div>
          <button onClick={onClose} style={{ padding: "6px", background: "#161616", border: "1px solid var(--border-default)", borderRadius: "6px", cursor: "pointer", display: "flex", color: "var(--text-secondary)", flexShrink: 0 }}>
            <X style={{ width: "16px", height: "16px" }} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ padding: "16px 20px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Category */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Category</label>
            <input type="text" placeholder="e.g. Groceries" value={category} onChange={e => setCategory(e.target.value)} className="gov-input" />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Description</label>
            <input type="text" placeholder="e.g. Weekly Eggs" value={title} onChange={e => setTitle(e.target.value)} className="gov-input" />
          </div>

          {/* Amount */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Total Amount (₹)</label>
              <button
                onClick={() => setShowCalc(!showCalc)}
                style={{
                  fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  padding: "4px 10px", border: "1px solid", borderRadius: "4px", cursor: "pointer",
                  background: showCalc ? "var(--brand)" : "var(--bg-surface)",
                  color: showCalc ? "var(--bg-surface)" : "var(--text-secondary)",
                  borderColor: showCalc ? "var(--brand)" : "var(--border-default)",
                  transition: "all 0.1s",
                }}
              >
                {showCalc ? "Calculator Active" : "Multiplier"}
              </button>
            </div>

            {!showCalc ? (
              <input
                type="number" placeholder="0" value={amount || ""}
                onChange={e => setAmount(Number(e.target.value))}
                className="gov-input"
                style={{ fontSize: "22px", fontWeight: 700, height: "52px" }}
              />
            ) : (
              <div style={{ background: "#161616", border: "1px solid var(--border-default)", borderRadius: "6px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {calcRows.map((row, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input type="text" placeholder="Factor" value={row.label} onChange={e => updateRow(i, "label", e.target.value)} className="gov-input" style={{ flex: 1 }} />
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-muted)" }}>×</span>
                    <input type="number" placeholder="0" value={row.value} onChange={e => updateRow(i, "value", e.target.value)} className="gov-input" style={{ width: "80px" }} />
                    <button onClick={() => removeRow(i)} style={{ padding: "6px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                      <Trash2 style={{ width: "14px", height: "14px" }} />
                    </button>
                  </div>
                ))}
                <button onClick={addRow} style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--brand)", background: "none", border: "1px dashed var(--brand)", borderRadius: "4px", padding: "6px", cursor: "pointer" }}>
                  + Add Row
                </button>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--border-default)" }}>
                  <span className="section-label">Subtotal</span>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--brand)" }}>₹{amount.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button onClick={handleSave} className="gov-btn-primary" style={{ justifyContent: "center", padding: "12px", marginTop: "4px" }}>
            <Plus style={{ width: "14px", height: "14px" }} /> Add to Register
          </button>
        </div>
      </div>
    </div>
  );
}