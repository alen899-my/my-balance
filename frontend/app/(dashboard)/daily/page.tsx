"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    Plus, Wallet, TrendingDown,
    CalendarDays, ChevronLeft, ChevronRight,
    Loader2, ArrowUpRight, ArrowDownRight, Camera
} from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import DailyBudgetModal from "@/components/daily/DailyBudgetModal";
import DailySurvivalTable from "@/components/daily/DailySurvivalTable";
import DailyViewModal from "@/components/daily/DailyViewModal";
import DeleteConfirmModal from "@/components/daily/DeleteConfirmModal";

export default function DailyPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

    const dateInputRef = useRef<HTMLInputElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [activeItem, setActiveItem] = useState<any>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedData, setScannedData] = useState<any>(null);
    const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchDailyList(); }, [selectedDate]);

    async function fetchDailyList() {
        setLoading(true);
        try {
            const res = await authFetch(
                `${process.env.NEXT_PUBLIC_API_URL}/daily-budget/range?start_date=${selectedDate}&end_date=${selectedDate}`
            );
            const json = await res.json();
            setItems(json.items || []);
        } catch (err) { console.error("Fetch Error:", err); }
        finally { setLoading(false); }
    }

    const summary = useMemo(() => {
        const income = items.filter(i => i.type === "income").reduce((a, b) => a + (b.amount || 0), 0);
        const expenses = items.filter(i => i.type === "expense").reduce((a, b) => a + (b.amount || 0), 0);
        return { income, expenses, balance: income - expenses };
    }, [items]);

    const changeDate = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().split("T")[0]);
    };

    const handleOpenPicker = () => {
        if (dateInputRef.current) {
            if ("showPicker" in HTMLInputElement.prototype) {
                dateInputRef.current.showPicker();
            } else {
                dateInputRef.current.focus();
            }
        }
    };

    const initiateDelete = (itemId: string) => {
        setActiveItem(items.find(i => i._id === itemId));
        setIsDeleteOpen(true);
    };

    async function handleConfirmDelete() {
        if (!activeItem?._id) return;
        try {
            const res = await authFetch(
                `${process.env.NEXT_PUBLIC_API_URL}/daily-budget/${activeItem._id}`,
                { method: "DELETE" }
            );
            if (res.ok) { setIsDeleteOpen(false); fetchDailyList(); }
        } catch (err) { console.error("Delete failed:", err); }
    }

    async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // 2MB Limit
        if (file.size > 2 * 1024 * 1024) {
            alert("File too large. Max 2MB allowed.");
            return;
        }

        setIsScanning(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("model", selectedModel);

            const ocrRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/ocr/scan`, {
                method: "POST",
                body: formData
            });

            if (ocrRes.ok) {
                const results = await ocrRes.json();
                setScannedData(results);
                setIsModalOpen(true);
            } else {
                const errJson = await ocrRes.json();
                throw new Error(errJson.detail || "Scanning failed");
            }
        } catch (err: any) {
            console.error("OCR Error:", err);
            alert(`OCR Error: ${err.message || "Unknown error"}. Please try manual entry.`);
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    const displayDate = new Date(selectedDate).toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const isNet = summary.balance >= 0;

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
                    <p className="section-label" style={{ marginBottom: "4px" }}>Daily Tracking</p>
                    <h1 style={{ margin: 0 }}>Daily Tracking</h1>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                        Log and track individual daily transactions.
                    </p>
                </div>

                {/* Date Navigator */}
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
                        onClick={() => changeDate(-1)}
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
                        onClick={handleOpenPicker}
                        style={{
                            position: "relative", padding: "8px 20px",
                            display: "flex", alignItems: "center",
                            gap: "6px", minWidth: "200px", justifyContent: "center",
                            cursor: "pointer",
                        }}
                    >
                        <CalendarDays style={{ width: "14px", height: "14px", color: "var(--brand)" }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                            {new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                        />
                    </div>

                    <button
                        onClick={() => changeDate(1)}
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

            {/* ── Daily KPI Strip ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>

                <div className="gov-kpi-card" style={{ borderLeft: "3px solid #abefc6" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <div style={{ width: "28px", height: "28px", background: "var(--success-bg)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Wallet style={{ width: "14px", height: "14px", color: "var(--success)" }} />
                        </div>
                        <p className="section-label">Daily Inflow</p>
                    </div>
                    <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--success)" }}>
                        ₹{summary.income.toLocaleString()}
                    </p>
                </div>

                <div className="gov-kpi-card" style={{ borderLeft: "3px solid #fda29b" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <div style={{ width: "28px", height: "28px", background: "var(--danger-bg)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <TrendingDown style={{ width: "14px", height: "14px", color: "var(--danger)" }} />
                        </div>
                        <p className="section-label">Daily Outflow</p>
                    </div>
                    <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--danger)" }}>
                        ₹{summary.expenses.toLocaleString()}
                    </p>
                </div>

                {/* Net Balance – highlighted */}
                <div
                    className="gov-kpi-card"
                    style={{
                        borderLeft: `3px solid ${isNet ? "#abefc6" : "#fda29b"}`,
                        background: isNet ? "var(--success-bg)" : "var(--danger-bg)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <div style={{ width: "28px", height: "28px", background: "var(--bg-surface)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isNet
                                ? <ArrowUpRight style={{ width: "14px", height: "14px", color: "var(--success)" }} />
                                : <ArrowDownRight style={{ width: "14px", height: "14px", color: "var(--danger)" }} />
                            }
                        </div>
                        <p className="section-label">Daily Net</p>
                    </div>
                    <p style={{ fontSize: "20px", fontWeight: 700, color: isNet ? "var(--success)" : "var(--danger)" }}>
                        {isNet ? "+" : ""}₹{summary.balance.toLocaleString()}
                    </p>
                    <span className={isNet ? "badge-success" : "badge-danger"} style={{ marginTop: "6px" }}>
                        {isNet ? "Surplus" : "Deficit"}
                    </span>
                </div>
            </div>

            {/* ── Action Bar ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface rounded-xl p-4 border border-default">
                <div className="flex flex-col gap-1">
                    <p className="text-xs text-secondary font-medium uppercase tracking-wider">{displayDate}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleReceiptUpload}
                        accept="image/*"
                        style={{ display: "none" }}
                    />

                    <div className="flex items-center gap-2 flex-1 sm:flex-none">
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="gov-input !py-1.5 !px-3 font-medium flex-1 sm:flex-none"
                            style={{ minWidth: "160px", fontSize: "12px" }}
                            disabled={isScanning}
                        >
                            <optgroup label="Google Gemini">
                                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                <option value="gemini-2.0-flash-lite">Gemini 2.0 Lite</option>
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                            </optgroup>
                            <optgroup label="Groq (Lightning Fast)">
                                <option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout</option>
                                <option value="llama-3.2-11b-vision-preview">Llama 3.2 11B (Beta)</option>
                            </optgroup>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="gov-btn-secondary flex-1 sm:flex-none"
                            disabled={isScanning}
                            style={{ padding: "6px 12px" }}
                        >
                            {isScanning ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
                            <span style={{ fontSize: "13px" }}>{isScanning ? "Scanning..." : "Scan"}</span>
                        </button>

                        <button
                            onClick={() => { setScannedData(null); setIsModalOpen(true); }}
                            className="gov-btn-primary flex-1 sm:flex-none"
                            style={{ padding: "6px 12px" }}
                        >
                            <Plus size={14} />
                            <span style={{ fontSize: "13px" }}>Add Entry</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Daily Transaction Table ── */}
            <div className="gov-panel" style={{ overflow: "hidden", minHeight: "320px" }}>
                <div className="gov-panel-header">
                    <h2 style={{ margin: 0, fontSize: "14px" }}>
                        Transaction Log —{" "}
                        {new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </h2>
                    <span className="badge-neutral">{items.length} Entries</span>
                </div>

                {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: "12px" }}>
                        <Loader2 style={{ width: "28px", height: "28px", color: "var(--brand)", animation: "spin 1s linear infinite" }} />
                        <p className="section-label">Loading Transactions...</p>
                    </div>
                ) : (
                    <DailySurvivalTable
                        items={items}
                        onView={(i: any) => { setActiveItem(i); setIsViewOpen(true); }}
                        onDelete={initiateDelete}
                        onToggle={(id: string) =>
                            setItems(items.map(item =>
                                item._id === id ? { ...item, is_completed: !item.is_completed } : item
                            ))
                        }
                    />
                )}
            </div>

            <DailyBudgetModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setScannedData(null); }}
                onSave={fetchDailyList}
                selectedDate={selectedDate}
                initialData={scannedData}
            />
            <DailyViewModal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} item={activeItem} />
            <DeleteConfirmModal
                isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleConfirmDelete} itemName={activeItem?.category}
            />

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}