"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    Plus, Wallet, Zap, TrendingDown,
    Sparkles, CalendarDays, ChevronLeft,
    ChevronRight, Loader2, CheckCircle2, History
} from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import DailyBudgetModal from "@/components/daily/DailyBudgetModal";
import DailySurvivalTable from "@/components/daily/DailySurvivalTable";
import DailyViewModal from "@/components/daily/DailyViewModal";
import DeleteConfirmModal from "@/components/daily/DeleteConfirmModal";

export default function DailyPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Ref for the date input
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [activeItem, setActiveItem] = useState<any>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    useEffect(() => { fetchDailyList(); }, [selectedDate]);

    async function fetchDailyList() {
        setLoading(true);
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/daily-budget/range?start_date=${selectedDate}&end_date=${selectedDate}`);
            const json = await res.json();
            setItems(json.items || []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }

    const summary = useMemo(() => {
        const income = items.filter(i => i.type === "income").reduce((a, b) => a + (b.amount || 0), 0);
        const expenses = items.filter(i => i.type === "expense").reduce((a, b) => a + (b.amount || 0), 0);
        return { income, expenses, balance: income - expenses };
    }, [items]);

    const changeDate = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    // NEW: Function to manually open the calendar
    const handleOpenPicker = () => {
        if (dateInputRef.current) {
            // modern browsers support showPicker()
            if ('showPicker' in HTMLInputElement.prototype) {
                dateInputRef.current.showPicker();
            } else {
                dateInputRef.current.focus();
            }
        }
    };
    const initiateDelete = (itemId: string) => {
        const itemToDelete = items.find(i => i._id === itemId);
        setActiveItem(itemToDelete);
        setIsDeleteOpen(true);
    };
    async function handleConfirmDelete() {
        if (!activeItem?._id) return; // Guard clause

        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/daily-budget/${activeItem._id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setIsDeleteOpen(false); // Close modal first
                fetchDailyList();       // Refresh the list
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }
    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 max-w-[1200px] mx-auto pb-24">

            {/* --- HEADER --- */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-orange-500 mb-1">
                        <Zap className="w-4 h-4 fill-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Quick Dispatch</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                        Daily <span className="text-orange-500">Expenses.</span>
                    </h1>
                </div>

                {/* --- REFACTORED DATE PICKER --- */}
                <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
                    <button
                        onClick={() => changeDate(-1)}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Clickable container triggers the ref */}
                    <div
                        onClick={handleOpenPicker}
                        className="relative px-6 flex items-center gap-3 min-w-[180px] justify-center border-x border-slate-100 dark:border-slate-800 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <CalendarDays className="w-4 h-4 text-orange-500" />

                        <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                            {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>

                        {/* Hidden Input with Ref */}
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="absolute opacity-0 w-0 h-0"
                        />
                    </div>

                    <button
                        onClick={() => changeDate(1)}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* --- STATS STRIP --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DailyStatCard title="Inflow" value={summary.income} color="text-emerald-500" />
                <DailyStatCard title="Outflow" value={summary.expenses} color="text-rose-500" />
                <div className="bg-slate-900 dark:bg-slate-950 p-5 rounded-[1.8rem] flex justify-between items-center shadow-lg">
                    <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Daily Net</p>
                        <h4 className="text-2xl font-black text-white">₹{summary.balance.toLocaleString()}</h4>
                    </div>
                    <TrendingDown className={`w-8 h-8 ${summary.balance >= 0 ? 'text-emerald-400 rotate-180' : 'text-rose-400'}`} />
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Log Transaction
                </button>
            </div>

            <div className="relative min-h-[400px]">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Dispatch...</span>
                    </div>
                ) : (
                    <DailySurvivalTable
                        items={items}
                        onView={(i: any) => { setActiveItem(i); setIsViewOpen(true); }}
                        onDelete={initiateDelete}
                        onToggle={(id: string) => setItems(items.map(item => item._id === id ? { ...item, is_completed: !item.is_completed } : item))}
                    />
                )}
            </div>

            <DailyBudgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={fetchDailyList} selectedDate={selectedDate} />
            <DailyViewModal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} item={activeItem} />
            <DeleteConfirmModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                itemName={activeItem?.category}
            />

        </div>
    );
}

function DailyStatCard({ title, value, color }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[1.8rem] border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{title}</p>
            <h4 className={`text-2xl font-black ${color}`}>₹{value.toLocaleString()}</h4>
        </div>
    );
}