"use client";

import { Search, ArrowUpDown } from "lucide-react";

export default function TransactionFilters({ filters, setFilters }: any) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-muted)" }} />
        <input
          type="text"
          placeholder="Search UPI ID or Payee..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="gov-input"
          style={{ paddingLeft: "32px" }}
        />
      </div>

      {/* Type Segmented */}
      <div
        style={{
          display: "flex",
          border: "1px solid var(--border-default)",
          borderRadius: "6px",
          overflow: "hidden",
          background: "var(--bg-surface)",
        }}
      >
        {["all", "debit", "credit"].map((type) => (
          <button
            key={type}
            onClick={() => setFilters({ ...filters, type })}
            style={{
              flex: 1, padding: "8px 6px",
              fontSize: "11px", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.06em",
              border: "none", cursor: "pointer",
              borderRight: type !== "credit" ? "1px solid var(--border-default)" : "none",
              background: filters.type === type ? "var(--brand)" : "transparent",
              color: filters.type === type ? "var(--bg-surface)" : "var(--text-secondary)",
              transition: "background 0.12s, color 0.12s",
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div style={{ position: "relative" }}>
        <ArrowUpDown style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-muted)", pointerEvents: "none" }} />
        <select
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          className="gov-input"
          style={{ paddingLeft: "32px", appearance: "none", cursor: "pointer" }}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
        <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", borderTop: "5px solid var(--text-muted)", borderLeft: "4px solid transparent", borderRight: "4px solid transparent", pointerEvents: "none" }} />
      </div>
    </div>
  );
}