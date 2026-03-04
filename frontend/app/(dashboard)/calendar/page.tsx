"use client";

import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/authFetch";
import {
    ChevronLeft, ChevronRight, Plus,
    CheckCircle2, Circle, AlertCircle,
    DollarSign, TrendingUp, Info
} from "lucide-react";

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [data, setData] = useState<any>({ daily_spending: {}, needs: [] });
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    // Form state for new need
    const [needName, setNeedName] = useState("");
    const [needAmount, setNeedAmount] = useState("");

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const fetchCalendarData = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/summary?month=${currentMonth + 1}&year=${currentYear}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error("Failed to fetch calendar data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalendarData();
    }, [currentDate]);

    const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)

    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blankDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    const handleCreateNeed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDay || !needName || !needAmount) return;

        const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/needs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: needName,
                    amount: parseFloat(needAmount),
                    date: formattedDate
                })
            });
            if (res.ok) {
                setIsAddModalOpen(false);
                setNeedName(""); setNeedAmount("");
                fetchCalendarData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleNeedStatus = async (need: any) => {
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/needs/${need.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_paid: !need.is_paid })
            });
            if (res.ok) fetchCalendarData();
        } catch (err) {
            console.error(err);
        }
    };

    const totalNeeds = data.needs.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const totalSpent = Object.values(data.daily_spending).reduce((acc: number, curr: any) => acc + curr, 0);

    return (
        <div className="page-enter" style={{ display: "flex", flexDirection: "column", gap: "24px", minHeight: "100vh", paddingBottom: "40px" }}>

            {/* ── HEADER ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-default)", paddingBottom: "16px" }}>
                <div>
                    <p className="section-label" style={{ marginBottom: "4px" }}>mybalance Planning</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <h1 style={{ margin: 0 }}>{currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h1>
                        <div style={{ display: "flex", gap: "4px" }}>
                            <button onClick={prevMonth} className="gov-btn-neutral" style={{ padding: "4px" }}><ChevronLeft size={16} /></button>
                            <button onClick={nextMonth} className="gov-btn-neutral" style={{ padding: "4px" }}><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                    <div className="gov-panel" style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "12px", background: "var(--bg-surface)" }}>
                        <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Monthly Needs</p>
                            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--warning)" }}>₹{totalNeeds.toLocaleString()}</p>
                        </div>
                        <div style={{ width: "1px", height: "24px", background: "var(--border-light)" }} />
                        <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Actual Spent</p>
                            <p style={{ fontSize: "14px", fontWeight: 700 }}>₹{Number(totalSpent).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CALENDAR GRID ── */}
            <div className="gov-panel" style={{ padding: "1px", background: "var(--border-default)", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderRadius: "12px", overflow: "hidden" }}>
                {/* Day Headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} style={{ background: "var(--bg-sidebar)", padding: "12px", textAlign: "center", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-default)" }}>
                        {day}
                    </div>
                ))}

                {/* Blank days from prev month */}
                {blankDays.map(d => (
                    <div key={`blank-${d}`} style={{ background: "var(--bg-page)", minHeight: "120px", opacity: 0.3 }} />
                ))}

                {/* Active Days */}
                {calendarDays.map(day => {
                    const spent = data.daily_spending[day] || 0;
                    const dayNeeds = data.needs.filter((n: any) => new Date(n.date).getDate() === day);
                    const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();

                    return (
                        <div
                            key={day}
                            className="calendar-cell"
                            style={{
                                background: isToday ? "rgba(99, 102, 241, 0.05)" : "var(--bg-surface)",
                                minHeight: "140px",
                                padding: "8px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                borderRight: "1px solid var(--border-light)",
                                borderBottom: "1px solid var(--border-light)",
                                transition: "background 0.2s"
                            }}
                        >
                            {/* Cell Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <span style={{
                                    fontSize: "14px",
                                    fontWeight: isToday ? 800 : 500,
                                    color: isToday ? "var(--brand)" : "var(--text-primary)",
                                    background: isToday ? "var(--brand-light)" : "transparent",
                                    width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%"
                                }}>
                                    {day}
                                </span>

                                {spent > 0 && (
                                    <div style={{ textAlign: "right" }}>
                                        <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)" }}>₹{Number(spent).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>

                            {/* Needs List */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                                {dayNeeds.map((need: any) => (
                                    <div
                                        key={need.id}
                                        onClick={() => toggleNeedStatus(need)}
                                        style={{
                                            padding: "4px 8px",
                                            borderRadius: "6px",
                                            background: need.is_paid ? "var(--success-bg)" : "var(--warning-bg)",
                                            fontSize: "10px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            cursor: "pointer",
                                            border: `1px solid ${need.is_paid ? "var(--success)" : "var(--warning)"}40`
                                        }}
                                    >
                                        {need.is_paid ? <CheckCircle2 size={10} color="var(--success)" /> : <Circle size={10} color="var(--warning)" />}
                                        <span style={{ flex: 1, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{need.name}</span>
                                        <span style={{ opacity: 0.8 }}>₹{need.amount}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Quick Add Button on Hover */}
                            <button
                                onClick={() => { setSelectedDay(day); setIsAddModalOpen(true); }}
                                className="add-need-btn"
                                style={{
                                    width: "100%", padding: "4px",
                                    background: "var(--border-light)",
                                    border: "none", borderRadius: "4px",
                                    color: "var(--text-muted)", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center"
                                }}
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* ── INFO LEGEND ── */}
            <div style={{ display: "flex", gap: "24px", color: "var(--text-muted)", fontSize: "11px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--warning)" }} />
                    <span>Planned Payment</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)" }} />
                    <span>Settled Payment</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Info size={12} />
                    <span>Click on a planned payment to toggle status.</span>
                </div>
            </div>

            {/* ── MODAL ── */}
            {isAddModalOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="gov-panel" style={{ width: "100%", maxWidth: "360px", padding: "24px", background: "var(--bg-surface)" }}>
                        <h2 style={{ margin: "0 0 4px", fontSize: "18px" }}>Schedule Payment</h2>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
                            Planned for {selectedDay} {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </p>

                        <form onSubmit={handleCreateNeed} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Payment Name</label>
                                <input required autoFocus value={needName} onChange={e => setNeedName(e.target.value)} placeholder="e.g. Rent, Internet Bill" className="gov-input" style={{ width: "100%" }} />
                            </div>
                            <div>
                                <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Amount (₹)</label>
                                <input required type="number" value={needAmount} onChange={e => setNeedAmount(e.target.value)} placeholder="0.00" className="gov-input" style={{ width: "100%" }} />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="gov-btn-secondary">Cancel</button>
                                <button type="submit" className="gov-btn-primary">Add to Calendar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
        .calendar-cell .add-need-btn { opacity: 0; transition: opacity 0.2s; }
        .calendar-cell:hover .add-need-btn { opacity: 1; }
        .calendar-cell:hover { background: var(--bg-page) !important; }
      `}</style>

        </div>
    );
}
