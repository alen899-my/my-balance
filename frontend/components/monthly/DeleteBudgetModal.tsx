"use client";

import React from "react";
import { Trash2, AlertTriangle } from "lucide-react";

export default function DeleteBudgetModal({ isOpen, onClose, onConfirm, itemName }: any) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 160, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <div className="gov-panel" style={{ position: "relative", width: "100%", maxWidth: "360px", padding: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", background: "var(--danger-bg)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #fda29b" }}>
            <AlertTriangle style={{ width: "22px", height: "22px", color: "var(--danger)" }} />
          </div>
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: "16px" }}>Confirm Deletion</h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Remove <strong style={{ color: "var(--text-primary)" }}>"{itemName}"</strong> from the expenditure register?
            </p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "20px" }}>
          <button onClick={onClose} className="gov-btn-secondary" style={{ justifyContent: "center", padding: "10px" }}>Cancel</button>
          <button onClick={onConfirm} className="gov-btn-danger" style={{ justifyContent: "center", padding: "10px" }}><Trash2 style={{ width: "13px", height: "13px" }} />Delete</button>
        </div>
      </div>
    </div>
  );
}