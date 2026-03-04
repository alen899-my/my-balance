"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function BackgroundSyncProgress() {
  const [isVisible, setIsVisible] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const handleSyncStart = () => {
      setIsVisible(true);
      setIsComplete(false);
      setTimeout(() => {
        setIsComplete(true);
        setTimeout(() => setIsVisible(false), 5000);
      }, 120000);
    };
    window.addEventListener("sync-started", handleSyncStart);
    return () => window.removeEventListener("sync-started", handleSyncStart);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      style={{
        padding: "12px 16px",
        background: isComplete ? "var(--success-bg)" : "var(--info-bg)",
        border: `1px solid ${isComplete ? "#abefc6" : "#b9e6fe"}`,
        borderRadius: "6px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "28px", height: "28px", borderRadius: "6px",
            background: isComplete ? "var(--success)" : "var(--info)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          {isComplete
            ? <CheckCircle2 style={{ width: "14px", height: "14px", color: "var(--bg-surface)" }} />
            : <Loader2 style={{ width: "14px", height: "14px", color: "var(--bg-surface)", animation: "spin 1s linear infinite" }} />}
        </div>
        <div>
          <p className="section-label">{isComplete ? "Sync Complete" : "Processing"}</p>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            {isComplete ? "Statement records updated successfully." : "Parsing and indexing statement pages..."}
          </p>
        </div>
      </div>

      {!isComplete && (
        <span className="badge-info">Page-by-page indexing</span>
      )}

      {/* Progress bar */}
      <div style={{ display: "none" }} />
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}