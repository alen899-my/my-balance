"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Loader2, Trash2 } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

export default function EditBudgetModal({ isOpen, onClose, item, onSave }: any) {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [calcRows, setCalcRows] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    if (item) {
      setCategory(item.category);
      setTitle(item.title || "");
      setAmount(item.amount);
      if (item.calculation_rows?.length > 0) {
        setShowCalc(true);
        setCalcRows(item.calculation_rows.map((r: any) => ({ label: r.label, value: r.value.toString() })));
      } else {
        setShowCalc(false);
        setCalcRows([{ label: "Rate", value: "" }, { label: "Qty", value: "" }]);
      }
    }
  }, [item]);

  useEffect(() => {
    if (showCalc && calcRows.length > 0 && calcRows.some(r => r.value && !isNaN(parseFloat(r.value)))) {
      setAmount(calcRows.reduce((acc, row) => {
        const v = parseFloat(row.value);
        return !row.value || isNaN(v) ? acc : acc * v;
      }, 1));
    }
  }, [calcRows, showCalc]);

  const addRow = () => setCalcRows([...calcRows, { label: "", value: "" }]);
  const removeRow = (i: number) => setCalcRows(calcRows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: "label" | "value", v: string) => {
    const next = [...calcRows]; next[i] = { ...next[i], [field]: v }; setCalcRows(next);
  };

  async function handleUpdate() {
    setLoading(true);
    try {
      const payload: any = { category, title, amount, type: "expense", month: item.month, year: item.year };
      payload.calculation_rows = showCalc
        ? calcRows.map(r => ({ label: r.label || "Factor", value: parseFloat(r.value) || 0 }))
        : null;
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onSave(); onClose();
    } catch (err) { console.error("Update error:", err); }
    finally { setLoading(false); }
  }

  if (!isOpen || !item) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <div className="gov-panel" style={{ position: "relative", width: "100%", maxWidth: "480px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 20px 0", flexShrink: 0 }}>
          <div>
            <p className="section-label" style={{ marginBottom: "2px" }}>Budget Register</p>
            <h2 style={{ margin: 0, fontSize: "18px" }}>Modify Item</h2>
          </div>
          <button onClick={onClose} style={{ padding: "6px", background: "#161616", border: "1px solid var(--border-default)", borderRadius: "6px", cursor: "pointer", display: "flex", color: "var(--text-secondary)", flexShrink: 0 }}>
            <X style={{ width: "16px", height: "16px" }} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ padding: "16px 20px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>

          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Category</label>
            <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="gov-input" />
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Description</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="gov-input" />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
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
              <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="gov-input" style={{ fontSize: "22px", fontWeight: 700, height: "52px" }} />
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

          <button onClick={handleUpdate} disabled={loading} className="gov-btn-primary" style={{ justifyContent: "center", padding: "12px", opacity: loading ? 0.6 : 1 }}>
            {loading
              ? <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
              : <><Save style={{ width: "14px", height: "14px" }} /> Save Changes</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}