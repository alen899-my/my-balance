"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Wallet, ShieldAlert, TrendingDown,
  CalendarDays, ChevronLeft, ChevronRight,
  Copy, Trash2, Loader2, Edit3, CheckCircle2
} from "lucide-react";
import BudgetModal from "@/components/monthly/BudgetModal";
import IncomeModal from "@/components/monthly/IncomeModal";
import ViewBudgetModal from "@/components/monthly/ViewBudgetModal";
import EditBudgetModal from "@/components/monthly/EditBudgetModal";
import DeleteBudgetModal from "@/components/monthly/DeleteBudgetModal";
import SurvivalTable from "@/components/monthly/SurvivalTable";
import { authFetch } from "@/lib/authFetch";

export default function MonthlyPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCloning, setIsCloning] = useState(false);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen,] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<any>(null);

  useEffect(() => { fetchBudgetList(); }, [selectedMonth, selectedYear]);

  async function fetchBudgetList() {
    setLoading(true);
    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/budget/list?month=${selectedMonth}&year=${selectedYear}`
      );
      const json = await res.json();
      setItems(json.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const summary = useMemo(() => {
    const income = items.filter(i => i.type === "income").reduce((a, b) => a + (b.amount || 0), 0);
    const expenses = items.filter(i => i.type === "expense").reduce((a, b) => a + (b.amount || 0), 0);
    const paid = items.filter(i => i.type === "expense" && i.is_completed).reduce((a, b) => a + (b.amount || 0), 0);
    return {
      income, target: expenses,
      balance: income - expenses,
      progress: expenses > 0 ? (paid / expenses) * 100 : 0,
    };
  }, [items]);

  const survivalItems = items.filter(item => item.type === "expense");

  const changeMonth = (inc: number) => {
    let m = selectedMonth + inc, y = selectedYear;
    if (m > 12) { m = 1; y++; } else if (m < 1) { m = 12; y--; }
    setSelectedMonth(m); setSelectedYear(y);
  };

  async function handleToggle(id: string) {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/${id}/toggle`, { method: "PATCH" });
      setItems(items.map(item => item._id === id ? { ...item, is_completed: !item.is_completed } : item));
    } catch (err) { console.error(err); }
  }

  async function handleSaveItem(data: any) {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, month: selectedMonth, year: selectedYear, type: "expense" }),
      });
      fetchBudgetList();
      setIsModalOpen(false);
    } catch (err) { console.error(err); }
  }

  async function handleClonePrevious() {
    setIsCloning(true);
    try {
      const pm = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const py = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_month: pm, from_year: py, to_month: selectedMonth, to_year: selectedYear }),
      });
      fetchBudgetList();
    } catch (err) { console.error(err); }
    finally { setIsCloning(false); }
  }

  async function handlePurgeMonth() {
    try {
      await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/budget/purge?month=${selectedMonth}&year=${selectedYear}`,
        { method: "DELETE" }
      );
      fetchBudgetList();
    } catch (err) { console.error(err); }
  }

  async function handleConfirmDelete() {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/${activeItem._id}`, { method: "DELETE" });
      setItems(items.filter(item => item._id !== activeItem._id));
      setIsDeleteOpen(false);
    } catch (err) { console.error(err); }
  }

  const monthName = new Date(selectedYear, selectedMonth - 1)
    .toLocaleString("default", { month: "long" });

  return (
    <div className="page-enter" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex", flexWrap: "wrap",
          alignItems: "flex-start", justifyContent: "space-between",
          gap: "12px", paddingBottom: "16px",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <div>
          <p className="section-label" style={{ marginBottom: "4px" }}>Budget Planning</p>
          <h1 style={{ margin: 0 }}>Monthly Budget Planner</h1>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
            Manage income, expenditure targets, and track monthly clearance.
          </p>
        </div>

        {/* Month Navigator */}
        <div
          style={{
            display: "flex", alignItems: "center",
            border: "1px solid var(--border-default)",
            borderRadius: "6px",
            background: "var(--bg-surface)",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => changeMonth(-1)}
            style={{
              padding: "8px 12px", border: "none",
              borderRight: "1px solid var(--border-light)",
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", cursor: "pointer",
              color: "var(--text-secondary)", display: "flex",
            }}
          >
            <ChevronLeft style={{ width: "16px", height: "16px" }} />
          </button>
          <div
            style={{
              padding: "8px 20px", display: "flex",
              alignItems: "center", gap: "6px", minWidth: "160px", justifyContent: "center",
            }}
          >
            <CalendarDays style={{ width: "14px", height: "14px", color: "var(--brand)" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
              {monthName} {selectedYear}
            </span>
          </div>
          <button
            onClick={() => changeMonth(1)}
            style={{
              padding: "8px 12px", border: "none",
              borderLeft: "1px solid var(--border-light)",
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", cursor: "pointer",
              color: "var(--text-secondary)", display: "flex",
            }}
          >
            <ChevronRight style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
      </div>

      {/* ── Summary KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
        <SummaryKPI
          title="Monthly Revenue" value={summary.income}
          icon={<Wallet />} color="var(--success)" border="#abefc6" bg="var(--success-bg)"
        />
        <SummaryKPI
          title="Expenditure Target" value={summary.target}
          icon={<ShieldAlert />} color="var(--danger)" border="#fda29b" bg="var(--danger-bg)"
        />
        <SummaryKPI
          title="Safe Balance" value={summary.balance}
          icon={<TrendingDown />} color="var(--brand)" border="#bfcfef" bg="var(--brand-light)"
        />

        {/* Clearance Progress */}
        <div
          className="gov-kpi-card"
          style={{ borderLeft: "3px solid var(--border-default)", background: "#1a2744" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <CheckCircle2 style={{ width: "14px", height: "14px", color: "#4f93ff" }} />
            <p className="section-label" style={{ color: "rgba(255,255,255,0.5)" }}>Clearance Rate</p>
          </div>
          <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--bg-surface)", lineHeight: 1 }}>
            {Math.round(summary.progress)}%
          </p>
          <div style={{ marginTop: "8px", background: "rgba(255,255,255,0.15)", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%", background: "#4f93ff",
                width: `${summary.progress}%`,
                transition: "width 1s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Action Toolbar ── */}
      <div
        style={{
          display: "flex", flexWrap: "wrap",
          alignItems: "center", justifyContent: "space-between",
          gap: "8px", padding: "10px 14px",
          background: "#161616",
          border: "1px solid var(--border-default)",
          borderRadius: "6px",
        }}
      >
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={handleClonePrevious}
            disabled={isCloning}
            className="gov-btn-secondary"
            style={{ fontSize: "12px", padding: "7px 14px" }}
          >
            {isCloning
              ? <Loader2 style={{ width: "13px", height: "13px", animation: "spin 1s linear infinite" }} />
              : <Copy style={{ width: "13px", height: "13px" }} />
            }
            Clone Previous Month
          </button>
          <button
            onClick={handlePurgeMonth}
            className="gov-btn-danger"
            style={{ fontSize: "12px", padding: "7px 14px" }}
          >
            <Trash2 style={{ width: "13px", height: "13px" }} />
            Purge Month
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setIsIncomeModalOpen(true)}
            className="gov-btn-secondary"
            style={{ fontSize: "12px", padding: "7px 14px" }}
          >
            <Edit3 style={{ width: "13px", height: "13px" }} />
            {summary.income > 0 ? "Edit Income" : "Set Salary"}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="gov-btn-primary"
            style={{ fontSize: "12px", padding: "7px 14px" }}
          >
            <Plus style={{ width: "13px", height: "13px" }} />
            Add Requirement
          </button>
        </div>
      </div>

      {/* ── Budget Table ── */}
      <div className="gov-panel" style={{ overflow: "hidden" }}>
        <div className="gov-panel-header">
          <h2 style={{ margin: 0, fontSize: "14px" }}>Expenditure Register — {monthName} {selectedYear}</h2>
          <span className="badge-neutral">{survivalItems.length} Items</span>
        </div>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", gap: "12px" }}>
            <Loader2 style={{ width: "32px", height: "32px", color: "var(--brand)", animation: "spin 1s linear infinite" }} />
            <p className="section-label">Loading Expenditure Data...</p>
          </div>
        ) : (
          <SurvivalTable
            items={survivalItems}
            onToggle={handleToggle}
            onView={(i) => { setActiveItem(i); setIsViewOpen(true); }}
            onEdit={(i) => { setActiveItem(i); setIsEditOpen(true); }}
            onDelete={(id) => { setActiveItem(items.find(i => i._id === id)); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <BudgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveItem} />
      <IncomeModal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} onSave={handleSaveItem} currentIncome={summary.income} month={selectedMonth} year={selectedYear} />
      <ViewBudgetModal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} item={activeItem} />
      <EditBudgetModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} item={activeItem} onSave={fetchBudgetList} />
      <DeleteBudgetModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleConfirmDelete} itemName={activeItem?.category} />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SummaryKPI({ title, value, icon, color, border, bg }: any) {
  return (
    <div className="gov-kpi-card" style={{ borderLeft: `3px solid ${border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <div
          style={{
            width: "28px", height: "28px", background: bg,
            borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {React.cloneElement(icon, { style: { width: "14px", height: "14px", color } })}
        </div>
        <p className="section-label">{title}</p>
      </div>
      <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
        ₹{value.toLocaleString()}
      </p>
    </div>
  );
}