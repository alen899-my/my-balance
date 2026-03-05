"use client";

import React, { useState, useEffect, useCallback } from "react";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import StatsOverview from "@/components/dashboard/StatsOverview";
import PayeeLeaderboard from "@/components/dashboard/PayeeLeaderboard";
import MonthlySpendingChart from "@/components/dashboard/MonthlySpendingChart";
import CategorySpending from "@/components/dashboard/CategorySpending";
import AdvancedInsights from "@/components/dashboard/AdvancedInsights";
import SpendingPulse from "@/components/dashboard/SpendingPulse";
import SavingsSpeedometer from "@/components/dashboard/SavingsSpeedometer";
import BankFilter from "@/components/dashboard/BankFilter";
import { SlidersHorizontal, Calendar, TrendingUp, Activity, Gauge, Download } from "lucide-react";
import IncomeVsExpenseChart from "@/components/dashboard/IncomeVsExpenseChart";
import DayOfWeekSpending from "@/components/dashboard/DayOfWeekSpending";
import { authFetch } from "@/lib/authFetch";

export default function DashboardPage() {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [stats, setStats] = useState({ income: 0, expenses: 0 });
  const [availableBanks, setAvailableBanks] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState("All Banks");
  const [showFilters, setShowFilters] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    authFetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/unique-banks`)
      .then(r => r.ok ? r.json() : [])
      .then(setAvailableBanks)
      .catch(console.error);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const m = startDate ? startDate.getMonth() + 1 : now.getMonth() + 1;
      const y = startDate ? startDate.getFullYear() : now.getFullYear();
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/budget/stats/summary?month=${m}&year=${y}`
      );
      const data = await res.json();
      setStats({ income: data.income || 0, expenses: data.expenses || 0 });
    } catch (err) { console.error("Stats fetch failed", err); }
  }, [startDate]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const downloadReport = async () => {
    try {
      setIsDownloading(true);
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate.toISOString());
      if (endDate) params.append("end_date", endDate.toISOString());
      if (selectedBank && selectedBank !== "All Banks") params.append("bank", selectedBank);

      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/download?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to download PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Financial_Summary_${startDate ? startDate.toISOString().split('T')[0] : 'All_Time'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Error generating report. Please check server logs.");
    } finally {
      setIsDownloading(false);
    }
  };

  const surplus = stats.income - stats.expenses;
  const surplusPositive = stats.income >= stats.expenses;

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
          <p className="section-label" style={{ marginBottom: "4px" }}>mybalance</p>
          <h1 style={{ margin: 0 }}>Executive Summary</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
            <Calendar style={{ width: "13px", height: "13px", color: "var(--text-muted)" }} />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{currentDate}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <button
            onClick={downloadReport}
            disabled={isDownloading}
            className="gov-btn-secondary"
            style={{ gap: "6px", opacity: isDownloading ? 0.7 : 1 }}
          >
            <Download style={{ width: "14px", height: "14px" }} />
            {isDownloading ? "Generating PDF..." : "Download Report"}
          </button>

          <DateRangeFilter
            startDate={startDate} endDate={endDate}
            setStartDate={setStartDate} setEndDate={setEndDate}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "gov-btn-primary" : "gov-btn-neutral"}
            style={{ padding: "8px", borderRadius: "6px" }}
            title={showFilters ? "Hide Filters" : "Filter by Bank"}
          >
            <SlidersHorizontal style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
      </div>

      {/* ── Bank Filter Panel ── */}
      {showFilters && (
        <div
          style={{
            background: "var(--brand-light)",
            border: "1px solid #bfcfef",
            borderRadius: "8px",
            padding: "14px 16px",
          }}
        >
          <p className="section-label" style={{ marginBottom: "10px" }}>Bank Filter</p>
          <BankFilter
            selectedBank={selectedBank}
            onBankChange={setSelectedBank}
            availableBanks={availableBanks}
          />
        </div>
      )}

      {/* ── KPI Strip ── */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <TrendingUp style={{ width: "15px", height: "15px", color: "var(--brand)" }} />
          <h2 style={{ margin: 0, fontSize: "14px" }}>Key Performance Indicators</h2>
        </div>
        <StatsOverview startDate={startDate} endDate={endDate} selectedBank={selectedBank} />
      </section>

      {/* ── Health Metrics ── */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <Activity style={{ width: "15px", height: "15px", color: "var(--brand)" }} />
          <h2 style={{ margin: 0, fontSize: "14px" }}>Health Metrics</h2>
        </div>
        <AdvancedInsights selectedBank={selectedBank} />
      </section>

      {/* ── Charts Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}
        className="lg-grid-3">
        <div className="lg-col-1">
          <PayeeLeaderboard startDate={startDate} endDate={endDate} selectedBank={selectedBank} />
        </div>
        <div className="lg-col-2">
          <MonthlySpendingChart startDate={startDate} endDate={endDate} selectedBank={selectedBank} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: "16px", marginBottom: "16px" }}>
        <IncomeVsExpenseChart startDate={startDate} endDate={endDate} selectedBank={selectedBank} />
        <DayOfWeekSpending startDate={startDate} endDate={endDate} selectedBank={selectedBank} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "16px" }}>
        <CategorySpending startDate={startDate} endDate={endDate} selectedBank={selectedBank} />
        <SpendingPulse startDate={startDate} endDate={endDate} selectedBank={selectedBank} />
      </div>

      {/* ── Financial Efficiency ── */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <Gauge style={{ width: "15px", height: "15px", color: "var(--brand)" }} />
          <h2 style={{ margin: 0, fontSize: "14px" }}>Financial Efficiency</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
          <SavingsSpeedometer income={stats.income} expenses={stats.expenses} />

          {/* Performance Insight Panel */}
          <div className="gov-panel" style={{ padding: "20px 24px" }}>
            <p className="section-label" style={{ marginBottom: "8px" }}>Performance Insight</p>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: surplusPositive ? "var(--success)" : "var(--danger)",
                marginBottom: "10px",
                lineHeight: 1.4,
              }}
            >
              {surplusPositive
                ? `Operating surplus of ₹${surplus.toLocaleString()} this period.`
                : "Expenditure exceeds recorded income for this period."}
            </h3>
            <div
              style={{
                background: surplusPositive ? "var(--success-bg)" : "var(--danger-bg)",
                border: `1px solid ${surplusPositive ? "#abefc6" : "#fda29b"}`,
                borderRadius: "6px",
                padding: "10px 14px",
                marginBottom: "12px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: surplusPositive ? "var(--success)" : "var(--danger)",
                  fontWeight: 600,
                }}
              >
                {surplusPositive ? "✓ Within budget parameters" : "⚠ Budget deficit detected"}
              </p>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Savings efficiency is calculated by comparing total income against survival target expenditure.
              Maintain a consistent{" "}
              <strong style={{ color: "var(--brand)" }}>20% or higher</strong> savings rate to achieve a
              &ldquo;Financially Healthy&rdquo; status classification.
            </p>
          </div>
        </div>
      </section>

      {/* Responsive grid helpers */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-grid-3 { grid-template-columns: 1fr 2fr !important; }
        }
      `}</style>
    </div>
  );
}