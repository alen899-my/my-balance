"use client";

import { useState, useEffect } from "react";
import { Trash2, Loader2, AlertTriangle, CheckCircle2, AlertCircle, X } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

export default function DeleteAllDataButton() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "idle"; msg: string }>({ type: "idle", msg: "" });

  useEffect(() => {
    if (toast.type !== "idle") {
      const t = setTimeout(() => setToast({ type: "idle", msg: "" }), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleClear = async () => {
    setIsDeleting(true);
    setIsConfirmOpen(false);
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/clear`, { method: "DELETE" });
      if (res.ok) {
        setToast({ type: "success", msg: "Database cleared successfully" });
        setTimeout(() => window.location.reload(), 1200);
      } else throw new Error();
    } catch {
      setToast({ type: "error", msg: "Failed to clear transactions" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsConfirmOpen(true)}
        disabled={isDeleting}
        className="gov-btn-danger"
        style={{ opacity: isDeleting ? 0.5 : 1 }}
      >
        {isDeleting
          ? <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
          : <Trash2 style={{ width: "14px", height: "14px" }} />}
        Clear Data
      </button>

      {/* Toast */}
      {toast.type !== "idle" && (
        <div
          style={{
            position: "fixed", top: "72px", right: "20px", zIndex: 150,
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 16px",
            background: "var(--bg-surface)",
            border: `1px solid ${toast.type === "success" ? "#abefc6" : "#fda29b"}`,
            borderRadius: "6px",
            boxShadow: "var(--shadow-dropdown)",
            color: toast.type === "success" ? "var(--success)" : "var(--danger)",
          }}
        >
          {toast.type === "success"
            ? <CheckCircle2 style={{ width: "14px", height: "14px" }} />
            : <AlertCircle style={{ width: "14px", height: "14px" }} />}
          <span style={{ fontSize: "12px", fontWeight: 600 }}>{toast.msg}</span>
        </div>
      )}

      {/* Confirm Modal */}
      {isConfirmOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 140, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            onClick={() => setIsConfirmOpen(false)}
          />
          <div
            className="gov-panel"
            style={{ position: "relative", width: "100%", maxWidth: "400px", padding: "24px" }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ width: "52px", height: "52px", background: "var(--danger-bg)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <AlertTriangle style={{ width: "24px", height: "24px", color: "var(--danger)" }} />
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>Confirm Data Deletion</h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                This will permanently delete <strong style={{ color: "var(--danger)" }}>all transactions</strong> from the database. This action cannot be undone.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => setIsConfirmOpen(false)} className="gov-btn-secondary" style={{ justifyContent: "center", padding: "10px" }}>
                Cancel
              </button>
              <button onClick={handleClear} className="gov-btn-danger" style={{ justifyContent: "center", padding: "10px" }}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}