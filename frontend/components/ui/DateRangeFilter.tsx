"use client";

import React from "react";
import { Calendar as CalendarIcon, X, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface DateRangeFilterProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  setEndDate: (date: Date | undefined) => void;
}

export default function DateRangeFilter({ startDate, endDate, setStartDate, setEndDate }: DateRangeFilterProps) {
  const isSelected = startDate || endDate;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        border: `1px solid ${isSelected ? "var(--brand)" : "var(--border-default)"}`,
        borderRadius: "8px",
        background: "var(--bg-surface)",
        padding: "4px",
        boxShadow: isSelected ? "0 0 0 1px var(--brand-light)" : "0 1px 2px rgba(0,0,0,0.05)",
        transition: "all 0.2s ease",
      }}
    >
      {/* Start date */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          background: "var(--bg-surface)",
          borderRadius: "4px",
          padding: "2px 4px",
        }}
      >
        <CalendarIcon style={{ position: "absolute", left: "8px", width: "14px", height: "14px", color: startDate ? "var(--brand)" : "var(--text-muted)", pointerEvents: "none", zIndex: 1 }} />
        <input
          type="date"
          value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
          onChange={e => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
          className="date-input-clean"
          style={{
            paddingLeft: "28px", paddingRight: "8px", paddingTop: "6px", paddingBottom: "6px",
            border: "none", outline: "none",
            fontSize: "13px", fontWeight: 500, color: startDate ? "var(--text-primary)" : "var(--text-secondary)",
            background: "transparent", cursor: "pointer",
            width: "125px",
            fontFamily: "inherit",
          }}
        />
      </div>

      <ArrowRight style={{ width: "14px", height: "14px", color: "var(--border-default)", flexShrink: 0 }} />

      {/* End date */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          background: "var(--bg-surface)",
          borderRadius: "4px",
          padding: "2px 4px",
        }}
      >
        <CalendarIcon style={{ position: "absolute", left: "8px", width: "14px", height: "14px", color: endDate ? "var(--brand)" : "var(--text-muted)", pointerEvents: "none", zIndex: 1 }} />
        <input
          type="date"
          value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
          min={startDate ? format(startDate, "yyyy-MM-dd") : undefined}
          onChange={e => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
          className="date-input-clean"
          style={{
            paddingLeft: "28px", paddingRight: "8px", paddingTop: "6px", paddingBottom: "6px",
            border: "none", outline: "none",
            fontSize: "13px", fontWeight: 500, color: endDate ? "var(--text-primary)" : "var(--text-secondary)",
            background: "transparent", cursor: "pointer",
            width: "125px",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Clear */}
      {isSelected && (
        <button
          onClick={() => { setStartDate(undefined); setEndDate(undefined); }}
          style={{
            padding: "6px",
            background: "var(--danger-bg)",
            border: "1px solid #fda29b",
            borderRadius: "6px",
            color: "var(--danger)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            marginLeft: "2px",
          }}
          title="Clear date range"
          onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
          onMouseLeave={(e) => e.currentTarget.style.background = "var(--danger-bg)"}
        >
          <X style={{ width: "14px", height: "14px" }} />
        </button>
      )}
    </div>
  );
}