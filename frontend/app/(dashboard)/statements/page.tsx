"use client";

import { useState, useEffect } from "react";
import { Plus, X, FileText, SlidersHorizontal, RefreshCw } from "lucide-react";
import StatementUploadForm from "@/components/dashboard/StatementUploadForm";
import TransactionTable from "@/components/dashboard/TransactionTable";
import DeleteAllDataButton from "@/components/dashboard/DeleteAllDataButton";
import TransactionFilters from "@/components/dashboard/TransactionFilters";
import BackgroundSyncProgress from "@/components/dashboard/BackgroundSyncProgress";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import BankFilter from "@/components/dashboard/BankFilter";
import { authFetch } from "@/lib/authFetch";

export default function StatementsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [availableBanks, setAvailableBanks] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState("All Banks");
  const [filters, setFilters] = useState({ search: "", type: "all", sort: "desc" });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const handleReExtract = async () => {
    setIsRefreshing(true);
    setRefreshMsg("");
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/re-extract-payees`, { method: "POST" });
      const data = await res.json();
      setRefreshMsg(data.message || "Done!");
      // Auto-clear after 5s
      setTimeout(() => setRefreshMsg(""), 5000);
    } catch (e) {
      setRefreshMsg("Failed to refresh payee names.");
      setTimeout(() => setRefreshMsg(""), 4000);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    authFetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/unique-banks`)
      .then(r => r.ok ? r.json() : [])
      .then(setAvailableBanks)
      .catch(console.error);
  }, [isModalOpen]);

  return (
    <div className="page-enter" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <div>
          <p className="section-label" style={{ marginBottom: "4px" }}>Document Management</p>
          <h1 style={{ margin: 0 }}>Statements & Transactions</h1>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
            Upload bank statements and review your transaction history.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <DateRangeFilter
            startDate={startDate} endDate={endDate}
            setStartDate={setStartDate} setEndDate={setEndDate}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "gov-btn-primary" : "gov-btn-secondary"}
          >
            <SlidersHorizontal style={{ width: "14px", height: "14px" }} />
            {showFilters ? "Hide Filters" : "Filters"}
          </button>
          
          <DeleteAllDataButton />
          <button
            onClick={() => setIsModalOpen(true)}
            className="gov-btn-primary"
          >
            <Plus style={{ width: "14px", height: "14px" }} />
            Add Statement
          </button>
        </div>
      </div>

      {/* ── Refresh Feedback ── */}
      {refreshMsg && (
        <div style={{
          background: "var(--success-bg)", border: "1px solid #abefc6",
          borderRadius: "8px", padding: "10px 16px",
          fontSize: "13px", fontWeight: 600, color: "var(--success)"
        }}>
          ✓ {refreshMsg}
        </div>
      )}

      {/* ── Background Sync ── */}
      <BackgroundSyncProgress />

      {/* ── Filter Panel ── */}
      {showFilters && (
        <div
          style={{
            background: "var(--brand-light)",
            border: "1px solid #bfcfef",
            borderRadius: "8px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div>
            <p className="section-label" style={{ marginBottom: "8px" }}>Filter by Bank</p>
            <BankFilter
              selectedBank={selectedBank}
              onBankChange={setSelectedBank}
              availableBanks={availableBanks}
            />
          </div>
          <TransactionFilters filters={filters} setFilters={setFilters} />
        </div>
      )}

      {/* ── Transactions Table ── */}
      <div className="gov-panel" style={{ overflow: "hidden" }}>
        <div className="gov-panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText style={{ width: "16px", height: "16px", color: "var(--brand)" }} />
            <h2 style={{ margin: 0, fontSize: "14px" }}>Transactions</h2>
          </div>
          <span className="badge-neutral">
            {selectedBank === "All Banks" ? "All Banks" : selectedBank}
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <TransactionTable
            filters={filters}
            startDate={startDate}
            endDate={endDate}
            selectedBank={selectedBank}
          />
        </div>
      </div>

      {/* ── Upload Modal ── */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 140,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px",
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
          }}
        >
          {/* Backdrop — closes modal on click */}
          <div style={{ position: "fixed", inset: 0 }} onClick={() => setIsModalOpen(false)} />

          {/* Modal Panel */}
          <div
            className="gov-panel"
            style={{ position: "relative", width: "100%", maxWidth: "520px", padding: "24px", zIndex: 1 }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid var(--border-light)" }}>
              <div>
                <p className="section-label" style={{ marginBottom: "2px" }}>Statements</p>
                <h2 style={{ margin: 0, fontSize: "16px" }}>Add Bank Statement</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  color: "var(--text-secondary)", background: "#161616",
                  border: "1px solid var(--border-default)",
                  borderRadius: "6px", padding: "6px 12px",
                  fontSize: "12px", fontWeight: 600, cursor: "pointer",
                }}
              >
                <X style={{ width: "13px", height: "13px" }} /> Close
              </button>
            </div>

            <StatementUploadForm />
          </div>
        </div>
      )}
    </div>
  );
}