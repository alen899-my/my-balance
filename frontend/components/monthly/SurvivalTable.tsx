"use client";

import React from "react";
import { Eye, Edit3, Trash2, CheckCircle2, Circle, ListTodo } from "lucide-react";

interface SurvivalTableProps {
  items: any[];
  onToggle: (id: string) => void;
  onView: (item: any) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

export default function SurvivalTable({ items, onToggle, onView, onEdit, onDelete }: SurvivalTableProps) {
  return (
    <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "520px" }}>
      <table className="gov-table" style={{ minWidth: "600px" }}>
        <thead>
          <tr>
            <th style={{ width: "60px", textAlign: "center" }}>Done</th>
            <th>Category / Description</th>
            <th style={{ textAlign: "right" }}>Amount (₹)</th>
            <th style={{ textAlign: "center", width: "120px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? items.map(item => (
            <tr key={item._id}>
              <td style={{ textAlign: "center" }}>
                <button
                  onClick={() => onToggle(item._id)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}
                >
                  {item.is_completed
                    ? <CheckCircle2 style={{ width: "18px", height: "18px", color: "var(--success)" }} />
                    : <Circle style={{ width: "18px", height: "18px", color: "var(--border-default)" }} />}
                </button>
              </td>
              <td>
                <p style={{ fontSize: "13px", fontWeight: 600, color: item.is_completed ? "var(--text-muted)" : "var(--text-primary)", textDecoration: item.is_completed ? "line-through" : "none", marginBottom: "2px" }}>
                  {item.category}
                </p>
                {item.title && (
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.title}</p>
                )}
              </td>
              <td style={{ textAlign: "right", fontSize: "14px", fontWeight: 700, color: item.is_completed ? "var(--text-muted)" : "var(--text-primary)" }}>
                ₹{(item.amount || 0).toLocaleString()}
              </td>
              <td>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <button onClick={() => onView(item)} title="View" style={{ padding: "5px", background: "var(--info-bg)", border: "1px solid #b9e6fe", borderRadius: "4px", cursor: "pointer", display: "flex", color: "var(--info)" }}>
                    <Eye style={{ width: "13px", height: "13px" }} />
                  </button>
                  <button onClick={() => onEdit(item)} title="Edit" style={{ padding: "5px", background: "var(--brand-light)", border: "1px solid #bfcfef", borderRadius: "4px", cursor: "pointer", display: "flex", color: "var(--brand)" }}>
                    <Edit3 style={{ width: "13px", height: "13px" }} />
                  </button>
                  <button onClick={() => onDelete(item._id)} title="Delete" style={{ padding: "5px", background: "var(--danger-bg)", border: "1px solid #fda29b", borderRadius: "4px", cursor: "pointer", display: "flex", color: "var(--danger)" }}>
                    <Trash2 style={{ width: "13px", height: "13px" }} />
                  </button>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={4} style={{ padding: "48px 14px", textAlign: "center" }}>
                <ListTodo style={{ width: "28px", height: "28px", color: "var(--text-muted)", margin: "0 auto 8px" }} />
                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>No items in register</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}