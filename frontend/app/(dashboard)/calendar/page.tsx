"use client";

import React, { useState, useEffect, useRef } from "react";
import { authFetch } from "@/lib/authFetch";
import {
    ChevronLeft, ChevronRight, Plus,
    CheckCircle2, Circle, Info, ChevronDown, X
} from "lucide-react";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [data, setData] = useState<any>({ daily_spending: {}, needs: [] });
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
    const pickerRef = useRef<HTMLDivElement>(null);

    // Form state
    const [needName, setNeedName] = useState("");
    const [needAmount, setNeedAmount] = useState("");

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const fetchCalendarData = async () => {
        setLoading(true);
        try {
            const res = await authFetch(
                `${process.env.NEXT_PUBLIC_API_URL}/calendar/summary?month=${currentMonth + 1}&year=${currentYear}`
            );
            if (res.ok) setData(await res.json());
        } catch (err) {
            console.error("Failed to fetch calendar data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCalendarData(); }, [currentDate]);

    // Close picker on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowMonthPicker(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));

    const goToMonth = (month: number, year: number) => {
        setCurrentDate(new Date(year, month, 1));
        setShowMonthPicker(false);
    };

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blankDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    const handleCreateNeed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDay || !needName || !needAmount) return;
        const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/needs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: needName, amount: parseFloat(needAmount), date: formattedDate })
            });
            if (res.ok) {
                setIsAddModalOpen(false);
                setNeedName(""); setNeedAmount("");
                fetchCalendarData();
            }
        } catch (err) { console.error(err); }
    };

    const toggleNeedStatus = async (need: any) => {
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/needs/${need.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_paid: !need.is_paid })
            });
            if (res.ok) fetchCalendarData();
        } catch (err) { console.error(err); }
    };

    const totalNeeds = data.needs.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const totalSpent = Object.values(data.daily_spending).reduce((acc: number, curr: any) => acc + curr, 0);

    return (
        <div className="page-enter cal-page">

            {/* ── HEADER ── */}
            <div className="cal-header">
                <div className="cal-header-left">
                    <p className="section-label" style={{ marginBottom: "4px" }}>mybalance Planning</p>
                    <div className="cal-nav-row">
                        {/* Month/Year picker trigger */}
                        <div ref={pickerRef} style={{ position: "relative" }}>
                            <button
                                className="cal-month-title"
                                onClick={() => { setShowMonthPicker(v => !v); setPickerYear(currentYear); }}
                            >
                                <h1 style={{ margin: 0, fontSize: "clamp(18px, 4vw, 28px)" }}>
                                    {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </h1>
                                <ChevronDown size={16} style={{ flexShrink: 0, color: "var(--text-muted)" }} />
                            </button>

                            {showMonthPicker && (
                                <div className="cal-picker-dropdown">
                                    {/* Year row */}
                                    <div className="cal-picker-year-row">
                                        <button className="gov-btn-neutral" style={{ padding: "4px 8px" }} onClick={() => setPickerYear(y => y - 1)}>
                                            <ChevronLeft size={14} />
                                        </button>
                                        <span style={{ fontWeight: 700, fontSize: "14px" }}>{pickerYear}</span>
                                        <button className="gov-btn-neutral" style={{ padding: "4px 8px" }} onClick={() => setPickerYear(y => y + 1)}>
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                    {/* Month grid */}
                                    <div className="cal-picker-months">
                                        {MONTHS.map((m, i) => {
                                            const isActive = i === currentMonth && pickerYear === currentYear;
                                            return (
                                                <button
                                                    key={m}
                                                    className={`cal-picker-month-btn${isActive ? " active" : ""}`}
                                                    onClick={() => goToMonth(i, pickerYear)}
                                                >
                                                    {m.slice(0, 3)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Prev / Next arrows */}
                        <div style={{ display: "flex", gap: "4px" }}>
                            <button onClick={prevMonth} className="gov-btn-neutral" style={{ padding: "6px" }} title="Previous Month">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={nextMonth} className="gov-btn-neutral" style={{ padding: "6px" }} title="Next Month">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats chips */}
                <div className="cal-stats-row">
                    <div className="cal-stat-chip">
                        <span className="cal-stat-label">Monthly Needs</span>
                        <span className="cal-stat-value" style={{ color: "var(--warning)" }}>₹{totalNeeds.toLocaleString()}</span>
                    </div>
                    <div className="cal-stat-divider" />
                    <div className="cal-stat-chip">
                        <span className="cal-stat-label">Actual Spent</span>
                        <span className="cal-stat-value">₹{Number(totalSpent).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* ── CALENDAR GRID ── */}
            {loading ? (
                <div className="gov-panel skeleton" style={{ height: "480px", borderRadius: "12px" }} />
            ) : (
                <div className="cal-grid-wrapper">
                    {/* Day headers */}
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="cal-day-header">{day}</div>
                    ))}

                    {/* Blank cells */}
                    {blankDays.map(d => (
                        <div key={`blank-${d}`} className="cal-cell cal-cell--empty" />
                    ))}

                    {/* Active days */}
                    {calendarDays.map(day => {
                        const spent = data.daily_spending[day] || 0;
                        const dayNeeds = data.needs.filter((n: any) => new Date(n.date).getDate() === day);
                        const today = new Date();
                        const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

                        return (
                            <div
                                key={day}
                                className={`cal-cell${isToday ? " cal-cell--today" : ""}`}
                            >
                                {/* Date number + spend */}
                                <div className="cal-cell-header">
                                    <span className={`cal-date-num${isToday ? " cal-date-num--today" : ""}`}>{day}</span>
                                    {spent > 0 && (
                                        <span className="cal-spent-badge">₹{Number(spent).toLocaleString()}</span>
                                    )}
                                </div>

                                {/* Needs list */}
                                <div className="cal-needs-list">
                                    {dayNeeds.map((need: any) => (
                                        <div
                                            key={need.id}
                                            onClick={() => toggleNeedStatus(need)}
                                            className={`cal-need-tag${need.is_paid ? " cal-need-tag--paid" : ""}`}
                                            title={`${need.name} — ₹${need.amount}`}
                                        >
                                            {need.is_paid
                                                ? <CheckCircle2 size={9} style={{ flexShrink: 0 }} />
                                                : <Circle size={9} style={{ flexShrink: 0 }} />
                                            }
                                            <span className="cal-need-name">{need.name}</span>
                                            <span className="cal-need-amt">₹{need.amount}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Add button */}
                                <button
                                    className="cal-add-btn"
                                    onClick={() => { setSelectedDay(day); setIsAddModalOpen(true); }}
                                    title={`Add payment on ${day}`}
                                >
                                    <Plus size={11} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── LEGEND ── */}
            <div className="cal-legend">
                <div className="cal-legend-item">
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--warning)", flexShrink: 0 }} />
                    <span>Planned</span>
                </div>
                <div className="cal-legend-item">
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)", flexShrink: 0 }} />
                    <span>Settled</span>
                </div>
                <div className="cal-legend-item">
                    <Info size={11} style={{ flexShrink: 0 }} />
                    <span>Tap a planned payment to toggle status</span>
                </div>
            </div>

            {/* ── MODAL ── */}
            {isAddModalOpen && (
                <div className="cal-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
                    <div className="cal-modal" onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                            <h2 style={{ margin: 0, fontSize: "18px" }}>Schedule Payment</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="gov-btn-neutral" style={{ padding: "4px" }}>
                                <X size={16} />
                            </button>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
                            Planned for {selectedDay} {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </p>
                        <form onSubmit={handleCreateNeed} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Payment Name</label>
                                <input required autoFocus value={needName} onChange={e => setNeedName(e.target.value)}
                                    placeholder="e.g. Rent, Internet Bill" className="gov-input" style={{ width: "100%" }} />
                            </div>
                            <div>
                                <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Amount (₹)</label>
                                <input required type="number" min="0" step="0.01" value={needAmount}
                                    onChange={e => setNeedAmount(e.target.value)} placeholder="0.00"
                                    className="gov-input" style={{ width: "100%" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="gov-btn-secondary">Cancel</button>
                                <button type="submit" className="gov-btn-primary">Add to Calendar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── SCOPED STYLES ── */}
            <style>{`
        /* Page layout */
        .cal-page {
          display: flex; flex-direction: column; gap: 20px;
          min-height: 100vh; padding-bottom: 40px;
        }

        /* Header */
        .cal-header {
          display: flex; flex-wrap: wrap; align-items: flex-start;
          justify-content: space-between; gap: 12px;
          border-bottom: 1px solid var(--border-default);
          padding-bottom: 16px;
        }
        .cal-header-left { display: flex; flex-direction: column; gap: 6px; }
        .cal-nav-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        /* Month title button */
        .cal-month-title {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer; padding: 0;
          color: var(--text-primary);
        }
        .cal-month-title:hover h1 { color: var(--brand); }

        /* Month picker dropdown */
        .cal-picker-dropdown {
          position: absolute; top: calc(100% + 8px); left: 0; z-index: 200;
          background: var(--bg-surface); border: 1px solid var(--border-default);
          border-radius: 10px; padding: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          min-width: 240px;
        }
        .cal-picker-year-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px; gap: 8px;
        }
        .cal-picker-months {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
        }
        .cal-picker-month-btn {
          padding: 6px 4px; border: 1px solid var(--border-light);
          border-radius: 6px; background: transparent; font-size: 12px;
          font-weight: 600; color: var(--text-secondary); cursor: pointer;
          transition: all 0.15s;
        }
        .cal-picker-month-btn:hover { background: var(--brand-light); color: var(--brand); border-color: var(--brand); }
        .cal-picker-month-btn.active { background: var(--brand); color: #fff; border-color: var(--brand); }

        /* Stats row */
        .cal-stats-row {
          display: flex; align-items: center; gap: 12px;
          background: var(--bg-surface); border: 1px solid var(--border-default);
          border-radius: 10px; padding: 10px 16px;
          flex-wrap: wrap;
        }
        .cal-stat-chip { display: flex; flex-direction: column; align-items: flex-end; }
        .cal-stat-label { font-size: 9px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; white-space: nowrap; }
        .cal-stat-value { font-size: 14px; font-weight: 700; }
        .cal-stat-divider { width: 1px; height: 28px; background: var(--border-light); }

        /* Calendar grid */
        .cal-grid-wrapper {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: var(--border-default);
          border-radius: 12px;
          overflow: hidden;
          gap: 1px;
        }

        /* Day header */
        .cal-day-header {
          background: var(--bg-sidebar);
          padding: 10px 4px;
          text-align: center;
          font-size: 11px; font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Calendar cell */
        .cal-cell {
          background: var(--bg-surface);
          min-height: 110px;
          padding: 6px;
          display: flex; flex-direction: column; gap: 4px;
          transition: background 0.15s;
          position: relative;
        }
        .cal-cell--empty { background: var(--bg-page); opacity: 0.35; min-height: 110px; }
        .cal-cell--today { background: rgba(99,102,241,0.04) !important; }
        .cal-cell:not(.cal-cell--empty):hover { background: var(--bg-page); }

        /* Cell header row */
        .cal-cell-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 2px;
        }

        /* Date number */
        .cal-date-num {
          font-size: 13px; font-weight: 500;
          color: var(--text-primary);
          width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%; flex-shrink: 0;
        }
        .cal-date-num--today {
          background: var(--brand); color: #fff; font-weight: 800;
        }

        /* Spent badge */
        .cal-spent-badge {
          font-size: 9px; font-weight: 700;
          color: var(--text-secondary);
          white-space: nowrap;
          max-width: 60px;
          overflow: hidden; text-overflow: ellipsis;
        }

        /* Needs list */
        .cal-needs-list {
          display: flex; flex-direction: column; gap: 3px; flex: 1;
          overflow: hidden;
        }

        /* Need tag */
        .cal-need-tag {
          display: flex; align-items: center; gap: 3px;
          padding: 3px 5px; border-radius: 4px;
          background: var(--warning-bg);
          border: 1px solid rgba(234, 179, 8, 0.25);
          font-size: 9px; cursor: pointer;
          transition: opacity 0.15s;
          overflow: hidden;
        }
        .cal-need-tag--paid {
          background: var(--success-bg);
          border-color: rgba(34, 197, 94, 0.25);
        }
        .cal-need-tag:hover { opacity: 0.8; }
        .cal-need-name {
          flex: 1; font-weight: 600; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap;
        }
        .cal-need-amt { opacity: 0.8; white-space: nowrap; }

        /* Add button */
        .cal-add-btn {
          width: 100%; padding: 3px;
          background: var(--border-light);
          border: none; border-radius: 4px;
          color: var(--text-muted); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s;
          margin-top: auto;
        }
        .cal-cell:hover .cal-add-btn { opacity: 1; }

        /* Legend */
        .cal-legend {
          display: flex; flex-wrap: wrap; gap: 16px;
          color: var(--text-muted); font-size: 11px;
        }
        .cal-legend-item { display: flex; align-items: center; gap: 6px; }

        /* Modal */
        .cal-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .cal-modal {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 24px;
          width: 100%; max-width: 380px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 640px) {
          .cal-day-header { font-size: 9px; padding: 8px 2px; }
          .cal-cell { min-height: 72px; padding: 4px 3px; gap: 3px; }
          .cal-cell--empty { min-height: 72px; }
          .cal-date-num { font-size: 11px; width: 18px; height: 18px; }
          .cal-spent-badge { display: none; }
          .cal-need-amt { display: none; }
          .cal-need-tag { padding: 2px 4px; }
          .cal-need-name { font-size: 8px; }
          .cal-stat-chip { align-items: flex-start; }
          .cal-picker-dropdown { left: 50%; transform: translateX(-50%); }
        }

        @media (max-width: 400px) {
          .cal-day-header {
            font-size: 8px;
            padding: 6px 1px;
            letter-spacing: 0;
          }
          /* Show only first letter on very small phones */
          .cal-day-header::first-letter { }
          .cal-cell { min-height: 56px; padding: 3px 2px; }
          .cal-cell--empty { min-height: 56px; }
          .cal-date-num { font-size: 10px; width: 16px; height: 16px; }
          .cal-need-tag { display: none; }
        }
      `}</style>
        </div>
    );
}
