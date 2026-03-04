"use client";

import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/authFetch";
import { CalendarDays, AlertCircle, CheckCircle2, TrendingDown, DollarSign, Clock, Hash } from "lucide-react";
import BankFilter from "@/components/dashboard/BankFilter";

export default function SubscriptionsPage() {
    const [data, setData] = useState<any>({ subscriptions: [], metrics: {} });
    const [loading, setLoading] = useState(true);
    const [availableBanks, setAvailableBanks] = useState<string[]>([]);
    const [selectedBank, setSelectedBank] = useState("All Banks");
    const [markingId, setMarkingId] = useState<string | null>(null);

    // For the custom Calendar UI
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Create an array [1, 2, ..., daysInMonth]
    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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
            // Refresh to get updated status
            await fetchSubs();
        } catch (err) {
            console.error("Failed to mark paid", err);
        } finally {
            setMarkingId(null);
        }
    };

    const getSubForDay = (day: number) => {
        // Look for a subscription due on literally this exact day of the current month
        const targetDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return data.subscriptions.filter((s: any) => s.next_due === targetDateStr);
    };

    return (
        <div className="page-enter" style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "40px" }}>

            {/* ── HEADER ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid var(--border-default)", paddingBottom: "16px" }}>
                <div>
                    <p className="section-label" style={{ marginBottom: "4px" }}>mybalance Tracking</p>
                    <h1 style={{ margin: 0 }}>Subscriptions & Bills</h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                        <CalendarDays style={{ width: "13px", height: "13px", color: "var(--text-muted)" }} />
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            {today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </span>
                    </div>
                </div>
                <div style={{ width: "240px" }}>
                    <BankFilter selectedBank={selectedBank} onBankChange={setSelectedBank} availableBanks={availableBanks} />
                </div>
            </div>

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
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                            <div className="gov-kpi-card">
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                    <div style={{ background: "var(--danger-bg)", padding: "6px", borderRadius: "6px" }}>
                                        <AlertCircle style={{ width: "14px", height: "14px", color: "var(--danger)" }} />
                                    </div>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Total Fixed Costs</span>
                                </div>
                                <div style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                                    ₹{Number(data.metrics?.total_monthly_fixed || 0).toLocaleString()}
                                    <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "4px", fontWeight: 500 }}>/mo</span>
                                </div>
                            </div>

                            <div className="gov-kpi-card">
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                    <div style={{ background: "var(--brand-light)", padding: "6px", borderRadius: "6px" }}>
                                        <Clock style={{ width: "14px", height: "14px", color: "var(--brand)" }} />
                                    </div>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Active Subscriptions</span>
                                </div>
                                <div style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                                    {data.metrics?.active_count || 0}
                                </div>
                            </div>

                            <div className="gov-kpi-card">
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                    <div style={{ background: "var(--warning-bg)", padding: "6px", borderRadius: "6px" }}>
                                        <Hash style={{ width: "14px", height: "14px", color: "var(--warning)" }} />
                                    </div>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Income Burn Rate</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                                    <div style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", color: (data.metrics?.fixed_cost_ratio || 0) > 30 ? "var(--warning)" : "var(--text-primary)" }}>
                                        {data.metrics?.fixed_cost_ratio || 0}%
                                    </div>
                                </div>
                                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                                    of strict monthly income
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── TWO COLUMN GRID: CALENDAR + LIST ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }} className="lg-grid-subs">

                        {/* ── LEFT: UPCOMING CALENDAR ── */}
                        <section className="gov-panel" style={{ padding: "20px" }}>
                            <h3 style={{ margin: "0 0 16px", fontSize: "14px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
                                Bill Calendar — {today.toLocaleDateString("en-US", { month: "long" })}
                            </h3>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(7, 1fr)",
                                gap: "8px",
                                textAlign: "center"
                            }}>
                                {/* Day Headers */}
                                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                                    <div key={i} style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>{d}</div>
                                ))}

                                {/* Empty offset for first day of month */}
                                {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
                                    <div key={`empty-${i}`} style={{ padding: "10px" }} />
                                ))}

                                {/* Calendar Days */}
                                {calendarDays.map(day => {
                                    const subsOnDay = getSubForDay(day);
                                    const isToday = day === today.getDate();
                                    const hasDue = subsOnDay.length > 0;
                                    const hasUnpaid = subsOnDay.some((s: any) => s.status !== "paid");

                                    return (
                                        <div
                                            key={day}
                                            style={{
                                                minHeight: "70px",
                                                padding: "4px",
                                                border: isToday ? "1px solid var(--brand)" : "1px solid var(--border-light)",
                                                borderRadius: "8px",
                                                background: hasUnpaid ? "var(--danger-bg)" : hasDue ? "var(--success-bg)" : "transparent",
                                                display: "flex", flexDirection: "column", alignItems: "center", gap: "4px"
                                            }}
                                        >
                                            <span style={{ fontSize: "12px", fontWeight: isToday ? 800 : 500, color: isToday ? "var(--brand)" : "var(--text-secondary)" }}>
                                                {day}
                                            </span>
                                            {/* Dots / Indicators */}
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", justifyContent: "center" }}>
                                                {subsOnDay.map((s: any, i: number) => (
                                                    <div
                                                        key={i}
                                                        title={`${s.name} - ₹${s.amount}`}
                                                        style={{
                                                            width: "6px", height: "6px", borderRadius: "50%",
                                                            background: s.status === "paid" ? "var(--success)" : "var(--danger)"
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* ── RIGHT: DETAILED LIST ── */}
                        <section className="gov-panel" style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                            <div className="gov-panel-header">
                                <h3 style={{ margin: 0, fontSize: "14px" }}>Active Service Ledger</h3>
                                <span className="badge-neutral" style={{ fontSize: "10px" }}>AI Detected</span>
                            </div>
                            <div style={{ overflowY: "auto", maxHeight: "600px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ background: "var(--bg-page)", borderBottom: "1px solid var(--border-light)", textAlign: "left", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                            <th style={{ padding: "12px 16px", fontWeight: 600 }}>Merchant</th>
                                            <th style={{ padding: "12px 16px", fontWeight: 600 }}>Due Date</th>
                                            <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.subscriptions.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                                                    No recurring transactions detected yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            data.subscriptions.map((s: any) => (
                                                <tr key={s.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.1s" }} className="hover:bg-slate-900/40">
                                                    <td style={{ padding: "16px" }}>
                                                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13px" }}>{s.name}</div>
                                                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px", display: "flex", gap: "6px", alignItems: "center" }}>
                                                            <span className="badge-neutral" style={{ padding: "2px 6px", fontSize: "9px" }}>{s.frequency}</span>
                                                            ₹{s.amount.toLocaleString()}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "16px" }}>
                                                        <div style={{ fontSize: "13px", color: (s.status === "overdue" && s.status !== "paid") ? "var(--danger)" : "var(--text-primary)", fontWeight: 500 }}>
                                                            {new Date(s.next_due).toLocaleDateString()}
                                                        </div>
                                                        <div style={{ fontSize: "11px", color: s.status === "paid" ? "var(--success)" : "var(--warning)", marginTop: "2px", fontWeight: 600, textTransform: "uppercase" }}>
                                                            {s.status}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "16px", textAlign: "right" }}>
                                                        {s.status === "paid" ? (
                                                            <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--success)", fontSize: "11px", fontWeight: 600 }}>
                                                                <CheckCircle2 style={{ width: "14px", height: "14px" }} />
                                                                Settled
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleMarkPaid(s.name, s.next_due)}
                                                                disabled={markingId === s.name}
                                                                className="gov-btn-secondary"
                                                                style={{ padding: "6px 12px", fontSize: "11px" }}
                                                            >
                                                                {markingId === s.name ? "Updating..." : "Mark Paid"}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </>
            )}

            {/* Grid helper for responsive layout */}
            <style>{`
        @media (min-width: 1024px) {
          .lg-grid-subs { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
        </div>
    );
}
