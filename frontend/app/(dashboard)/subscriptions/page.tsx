"use client";

import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/authFetch";
import { CalendarDays, AlertCircle, CheckCircle2, TrendingDown, Clock, Hash, SlidersHorizontal, Info } from "lucide-react";
import BankFilter from "@/components/dashboard/BankFilter";

export default function SubscriptionsPage() {
    const [data, setData] = useState<any>({ subscriptions: [], metrics: {} });
    const [loading, setLoading] = useState(true);
    const [availableBanks, setAvailableBanks] = useState<string[]>([]);
    const [selectedBank, setSelectedBank] = useState("All Banks");
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Calendar UI variables
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blankDays = Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }, (_, i) => i);

    const fetchSubs = async () => {
        setLoading(true);
        try {
            const q = selectedBank !== "All Banks" ? `?bank=${selectedBank}` : "";
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions${q}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        authFetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/unique-banks`)
            .then(r => r.ok ? r.json() : [])
            .then(setAvailableBanks)
            .catch(console.error);
    }, []);

    useEffect(() => {
        fetchSubs();
    }, [selectedBank]);

    const handleMarkPaid = async (subName: string, next_due: string) => {
        setMarkingId(subName);
        try {
            await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/mark-paid`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: subName, marked_paid_date: next_due })
            });
            await fetchSubs();
        } catch (err) {
            console.error("Failed to mark paid", err);
        } finally {
            setMarkingId(null);
        }
    };

    // Calculate smart status for "this month"
    const getComputedStatus = (s: any) => {
        const nextDue = new Date(s.next_due);
        if (s.status === "paid") return "paid";

        // If next_due is completely in a future month, it means it already got paid this month!
        if (nextDue.getFullYear() > currentYear || (nextDue.getFullYear() === currentYear && nextDue.getMonth() > currentMonth)) {
            return "paid";
        }

        return s.status; // pending or overdue
    };

    return (
        <div className="page-enter subs-page">
            {/* ── HEADER ── */}
            <div className="subs-header">
                <div>
                    <p className="section-label" style={{ marginBottom: "4px" }}>mybalance Tracking</p>
                    <h1 style={{ margin: 0, fontSize: "clamp(20px, 4vw, 24px)" }}>Subscriptions & Bills</h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                        <CalendarDays style={{ width: "13px", height: "13px", color: "var(--text-muted)" }} />
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            {today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </span>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={showFilters ? "gov-btn-primary" : "gov-btn-secondary"}
                        title="Toggle Bank Filter"
                    >
                        <SlidersHorizontal style={{ width: "14px", height: "14px" }} />
                        {showFilters ? "Hide Filter" : "Filter"}
                    </button>
                </div>
            </div>

            {/* ── Filter Panel ── */}
            {showFilters && (
                <div className="subs-filter-panel">
                    <p className="section-label" style={{ marginBottom: "10px" }}>Filter by Bank</p>
                    <BankFilter
                        selectedBank={selectedBank}
                        onBankChange={setSelectedBank}
                        availableBanks={availableBanks}
                    />
                </div>
            )}

            {loading ? (
                <div className="gov-panel skeleton" style={{ height: "400px" }} />
            ) : (
                <>
                    {/* ── MONTHLY RUNWAY METRICS ── */}
                    <section>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                            <TrendingDown style={{ width: "15px", height: "15px", color: "var(--brand)" }} />
                            <h2 style={{ margin: 0, fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Monthly Runway</h2>
                        </div>
                        <div className="subs-kpi-grid">
                            <div className="gov-kpi-card">
                                <div className="kpi-header">
                                    <div className="kpi-icon-wrapper danger"><AlertCircle size={14} /></div>
                                    <span className="kpi-title">Total Fixed Costs</span>
                                </div>
                                <div className="kpi-value">
                                    ₹{Number(data.metrics?.total_monthly_fixed || 0).toLocaleString()} <span className="kpi-sub">/mo</span>
                                </div>
                            </div>

                            <div className="gov-kpi-card">
                                <div className="kpi-header">
                                    <div className="kpi-icon-wrapper brand"><Clock size={14} /></div>
                                    <span className="kpi-title">Active Subscriptions</span>
                                </div>
                                <div className="kpi-value">{data.metrics?.active_count || 0}</div>
                            </div>

                            <div className="gov-kpi-card">
                                <div className="kpi-header">
                                    <div className="kpi-icon-wrapper warning"><Hash size={14} /></div>
                                    <span className="kpi-title">Income Burn Rate</span>
                                </div>
                                <div className="kpi-value" style={{ color: (data.metrics?.fixed_cost_ratio || 0) > 30 ? "var(--warning)" : "var(--text-primary)" }}>
                                    {data.metrics?.fixed_cost_ratio || 0}%
                                </div>
                                <div className="kpi-footer">of strict monthly income</div>
                            </div>
                        </div>
                    </section>

                    {/* ── TWO COLUMN GRID: CALENDAR + LIST ── */}
                    <div className="subs-main-grid">

                        {/* ── LEFT: UPCOMING CALENDAR ── */}
                        <section className="gov-panel subs-calendar-panel">
                            <div className="gov-panel-header" style={{ paddingBottom: "16px", marginBottom: "16px", borderBottom: "1px solid var(--border-light)" }}>
                                <h3 style={{ margin: 0, fontSize: "14px" }}>Bill Calendar</h3>
                                <span className="badge-warning" style={{ fontSize: "10px" }}>{today.toLocaleDateString("en-US", { month: "long" })}</span>
                            </div>

                            <div className="subs-cal-grid">
                                {/* Day Headers */}
                                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                                    <div key={i} className="subs-cal-day-header">{d}</div>
                                ))}

                                {/* Blank Offset */}
                                {blankDays.map(d => <div key={`blank-${d}`} className="subs-cal-cell empty" />)}

                                {/* Calendar Days */}
                                {calendarDays.map(day => {
                                    const subsOnDay = data.subscriptions.filter((s: any) => new Date(s.next_due).getDate() === day);
                                    const isToday = day === today.getDate();

                                    // Determine cell style based on computed statuses
                                    let hasUnpaid = false;
                                    let hasPaid = false;

                                    subsOnDay.forEach((s: any) => {
                                        if (getComputedStatus(s) === "paid") hasPaid = true;
                                        else hasUnpaid = true;
                                    });

                                    const cellClass = hasUnpaid ? "danger-cell" : hasPaid ? "success-cell" : "";

                                    return (
                                        <div key={day} className={`subs-cal-cell ${cellClass} ${isToday ? "today" : ""}`}>
                                            <span className="subs-cal-num">{day}</span>

                                            {/* Indicators */}
                                            {subsOnDay.length > 0 && (
                                                <div className="subs-cal-dots">
                                                    {subsOnDay.map((s: any, i: number) => {
                                                        const isPaid = getComputedStatus(s) === "paid";
                                                        return (
                                                            <div
                                                                key={i}
                                                                title={`${s.name} - ₹${s.amount}`}
                                                                className={`subs-cal-dot ${isPaid ? "paid" : "unpaid"}`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="subs-cal-legend">
                                <div className="legend-item"><div className="dot unpaid" /> Upcoming / Overdue</div>
                                <div className="legend-item"><div className="dot paid" /> Paid</div>
                            </div>
                        </section>

                        {/* ── RIGHT: DETAILED LIST ── */}
                        <section className="gov-panel subs-ledger-panel">
                            <div className="gov-panel-header" style={{ flexShrink: 0 }}>
                                <h3 style={{ margin: 0, fontSize: "14px" }}>Active Service Ledger</h3>
                                <span className="badge-neutral" style={{ fontSize: "10px", display: "flex", gap: "4px", alignItems: "center" }}><Info size={10} /> AI Detected</span>
                            </div>

                            <div className="ledger-table-wrap">
                                <table className="ledger-table">
                                    <thead>
                                        <tr>
                                            <th>Merchant</th>
                                            <th>Due Date</th>
                                            <th style={{ textAlign: "right" }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.subscriptions.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="empty-state">No recurring transactions detected.</td>
                                            </tr>
                                        ) : (
                                            data.subscriptions.map((s: any) => {
                                                const computedStatus = getComputedStatus(s);
                                                const isPaid = computedStatus === "paid";

                                                return (
                                                    <tr key={s.id}>
                                                        <td>
                                                            <div className="ledger-merchant">{s.name}</div>
                                                            <div className="ledger-meta">
                                                                <span className="badge-neutral">{s.frequency}</span>
                                                                ₹{s.amount.toLocaleString()}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className={`ledger-date ${computedStatus === "overdue" ? "text-danger" : ""}`}>
                                                                {new Date(s.next_due).toLocaleDateString()}
                                                            </div>
                                                            <div className={`ledger-status ${isPaid ? "text-success" : "text-warning"}`}>
                                                                {computedStatus}
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: "right" }}>
                                                            {isPaid ? (
                                                                <div className="ledger-success-msg">
                                                                    <CheckCircle2 size={14} /> Settled
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleMarkPaid(s.name, s.next_due)}
                                                                    disabled={markingId === s.name}
                                                                    className="gov-btn-secondary ledger-btn"
                                                                >
                                                                    {markingId === s.name ? "Wait..." : "Mark Paid"}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </>
            )}

            {/* Scoped Responsive Styles */}
            <style>{`
        .subs-page { display: flex; flex-direction: column; gap: 24px; padding-bottom: 40px; }
        
        .subs-header {
            display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px;
            border-bottom: 1px solid var(--border-default); padding-bottom: 16px;
        }

        .subs-filter-panel {
            background: var(--brand-light); border: 1px solid #bfcfef; border-radius: 8px; padding: 14px 16px;
        }

        .subs-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .kpi-header { display: flex; alignItems: center; gap: 8px; margin-bottom: 8px; }
        .kpi-icon-wrapper { padding: 6px; border-radius: 6px; display: flex; }
        .kpi-icon-wrapper.danger { background: var(--danger-bg); color: var(--danger); }
        .kpi-icon-wrapper.brand { background: var(--brand-light); color: var(--brand); }
        .kpi-icon-wrapper.warning { background: var(--warning-bg); color: var(--warning); }
        .kpi-title { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
        .kpi-value { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; display: flex; align-items: baseline; gap: 4px; }
        .kpi-sub { font-size: 12px; color: var(--text-muted); font-weight: 500; }
        .kpi-footer { font-size: 10px; color: var(--text-muted); margin-top: 4px; }

        .subs-main-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 1024px) {
            .subs-main-grid { grid-template-columns: 1fr 1.2fr; }
        }

        /* Calendar Grid */
        .subs-calendar-panel { padding: 20px; display: flex; flex-direction: column; }
        .subs-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; text-align: center; }
        .subs-cal-day-header { font-size: 10px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; }
        .subs-cal-cell { 
            aspect-ratio: 1; padding: 4px; border: 1px solid var(--border-light); border-radius: 8px; 
            display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 4px;
            background: transparent; transition: background 0.2s;
        }
        .subs-cal-cell.empty { border: none; background: transparent; }
        .subs-cal-cell.today { border-color: var(--brand); }
        .subs-cal-cell.danger-cell { background: var(--danger-bg); border-color: rgba(240, 68, 56, 0.3); }
        .subs-cal-cell.success-cell { background: var(--success-bg); border-color: rgba(23, 178, 106, 0.3); }
        
        .subs-cal-num { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
        .subs-cal-cell.today .subs-cal-num { font-weight: 800; color: var(--brand); }
        
        .subs-cal-dots { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; }
        .subs-cal-dot { width: 6px; height: 6px; border-radius: 50%; }
        .subs-cal-dot.paid { background: var(--success); }
        .subs-cal-dot.unpaid { background: var(--danger); box-shadow: 0 0 0 1px rgba(240,68,56,0.2); }

        .subs-cal-legend { display: flex; gap: 16px; margin-top: auto; padding-top: 16px; font-size: 11px; color: var(--text-muted); justify-content: center; }
        .legend-item { display: flex; align-items: center; gap: 6px; }
        .legend-item .dot { width: 8px; height: 8px; border-radius: 50%; }
        .legend-item .dot.paid { background: var(--success); }
        .legend-item .dot.unpaid { background: var(--danger); }

        /* Ledger Table */
        .subs-ledger-panel { padding: 0; display: flex; flex-direction: column; overflow: hidden; }
        .ledger-table-wrap { overflow-x: auto; overflow-y: auto; max-height: 600px; flex: 1; }
        .ledger-table { width: 100%; border-collapse: collapse; min-width: 320px; }
        .ledger-table th { padding: 12px 16px; font-weight: 600; background: var(--bg-page); border-bottom: 1px solid var(--border-light); text-align: left; font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
        .ledger-table td { padding: 16px; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
        .ledger-table tr:hover td { background: var(--bg-page); }
        
        .empty-state { padding: 32px !important; text-align: center; color: var(--text-muted); font-size: 13px; }
        .ledger-merchant { font-weight: 600; color: var(--text-primary); font-size: 13px; margin-bottom: 4px; }
        .ledger-meta { font-size: 11px; color: var(--text-secondary); display: flex; gap: 6px; align-items: center; }
        .ledger-meta .badge-neutral { padding: 2px 6px; font-size: 9px; }
        .ledger-date { font-size: 13px; font-weight: 500; color: var(--text-primary); }
        .ledger-status { font-size: 11px; font-weight: 600; text-transform: uppercase; margin-top: 4px; }
        
        .text-success { color: var(--success); }
        .text-warning { color: var(--warning); }
        .text-danger { color: var(--danger); }
        
        .ledger-success-msg { display: inline-flex; align-items: center; gap: 4px; color: var(--success); font-size: 11px; font-weight: 600; }
        .ledger-btn { padding: 6px 12px; font-size: 11px; white-space: nowrap; }

        @media (max-width: 640px) {
            .subs-cal-grid { gap: 4px; }
            .subs-cal-cell { padding: 2px; border-radius: 4px; aspect-ratio: auto; min-height: 40px; }
            .subs-cal-num { font-size: 11px; }
            .subs-cal-dot { width: 5px; height: 5px; }
            .ledger-table td { padding: 12px 10px; }
            .ledger-merchant { font-size: 12px; }
        }
      `}</style>
        </div>
    );
}
