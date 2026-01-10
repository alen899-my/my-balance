"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Wallet, ShieldAlert, TrendingDown,
  Sparkles, ArrowUpCircle, Edit3, CalendarDays,
  ChevronLeft, ChevronRight, Copy, Trash2, 
  Loader2, Zap, LayoutGrid, CheckCircle2
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

  // Date Filter State
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<any>(null);

  useEffect(() => { fetchBudgetList(); }, [selectedMonth, selectedYear]);

  async function fetchBudgetList() {
    setLoading(true);
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/list?month=${selectedMonth}&year=${selectedYear}`);
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
      income, 
      target: expenses, 
      balance: income - expenses,
      progress: expenses > 0 ? (paid / expenses) * 100 : 0
    };
  }, [items]);

  const survivalItems = items.filter(item => item.type === "expense");

  // Handlers
  const changeMonth = (inc: number) => {
    let m = selectedMonth + inc;
    let y = selectedYear;
    if (m > 12) { m = 1; y++; } else if (m < 1) { m = 12; y--; }
    setSelectedMonth(m); setSelectedYear(y);
  };

  async function handleToggle(id: string) {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/${id}/toggle`, { method: 'PATCH' });
      setItems(items.map(item => item._id === id ? { ...item, is_completed: !item.is_completed } : item));
    } catch (err) { console.error(err); }
  }

  async function handleSaveItem(data: any) {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, month: selectedMonth, year: selectedYear, type: "expense" })
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
        body: JSON.stringify({ from_month: pm, from_year: py, to_month: selectedMonth, to_year: selectedYear })
      });
      fetchBudgetList();
    } catch (err) { console.error(err); }
    finally { setIsCloning(false); }
  }

  async function handlePurgeMonth() {
   
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/purge?month=${selectedMonth}&year=${selectedYear}`, { method: "DELETE" });
      fetchBudgetList();
    } catch (err) { console.error(err); }
  }

  async function handleConfirmDelete() {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/${activeItem._id}`, { method: 'DELETE' });
      setItems(items.filter(item => item._id !== activeItem._id));
      setIsDeleteOpen(false);
    } catch (err) { console.error(err); }
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-24">

      {/* --- TOP NAV BAR --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Financial Command</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            Monthly <span className="text-violet-600">Planner.</span>
          </h1>
        </div>

        {/* Dynamic Month Selector */}
        <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all"><ChevronLeft className="w-5 h-5" /></button>
          <div className="px-6 flex items-center gap-3 min-w-[180px] justify-center border-x border-slate-100 dark:border-slate-800">
            <CalendarDays className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white text-center">
              {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
            </span>
          </div>
          <button onClick={() => changeMonth(1)} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {/* --- ANALYSIS STRIP --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Monthly Revenue" value={summary.income} icon={<Wallet />} color="text-emerald-500" bgColor="bg-emerald-50 dark:bg-emerald-950/30" />
        <SummaryCard title="Survival Cap" value={summary.target} icon={<ShieldAlert />} color="text-rose-500" bgColor="bg-rose-50 dark:bg-rose-950/30" />
        <SummaryCard title="Safe Balance" value={summary.balance} icon={<TrendingDown />} color="text-violet-500" bgColor="bg-violet-50 dark:bg-violet-950/30" />
        
        {/* New Feature: Health Meter */}
        <div className="bg-slate-900 dark:bg-violet-600 p-4 rounded-[1.5rem] flex flex-col justify-center relative overflow-hidden shadow-xl">
            <CheckCircle2 className="absolute -right-2 -bottom-2 w-20 h-20 text-white/10 rotate-12" />
            <p className="text-[10px] font-black uppercase text-white/60 tracking-widest mb-1">Clearance Rate</p>
            <h4 className="text-2xl font-black text-white">{Math.round(summary.progress)}%</h4>
            <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-white h-full transition-all duration-1000" style={{ width: `${summary.progress}%` }} />
            </div>
        </div>
      </div>

      {/* --- STRATEGIC ACTIONS --- */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-slate-100/50 dark:bg-slate-800/30 rounded-[2rem] border border-slate-200/50 dark:border-slate-800">
        <div className="flex gap-2 ml-2">
            <button onClick={handleClonePrevious} disabled={isCloning} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-violet-600 transition-all">
                {isCloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />} Clone History
            </button>
            <button onClick={handlePurgeMonth} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-all">
                <Trash2 className="w-3.5 h-3.5" /> Purge Month
            </button>
        </div>

        <div className="flex gap-2 pr-2">
            <button onClick={() => setIsIncomeModalOpen(true)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:shadow-lg transition-all active:scale-95">
                <Edit3 className="w-4 h-4 text-violet-500" /> {summary.income > 0 ? "Edit Income" : "Set Salary"}
            </button>
            <button onClick={() => setIsModalOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-xl shadow-violet-600/20 transition-all active:scale-95">
                <Plus className="w-4 h-4" /> Add Requirement
            </button>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 to-transparent blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative">
            {loading ? (
                <div className="h-96 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Inventory</span>
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
      </div>

      {/* Modals remain the same... */}
      <BudgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveItem} />
      <IncomeModal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} onSave={handleSaveItem } currentIncome={summary.income} month={selectedMonth} year={selectedYear} />
      <ViewBudgetModal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} item={activeItem} />
      <EditBudgetModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} item={activeItem} onSave={fetchBudgetList} />
      <DeleteBudgetModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleConfirmDelete} itemName={activeItem?.category} />
    </div>
  );
}

function SummaryCard({ title, value, icon, color, bgColor }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-[1.8rem] border border-slate-200 dark:border-slate-800 flex items-center gap-5 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group">
      <div className={`p-4 rounded-2xl ${bgColor} ${color} transition-all group-hover:scale-110`}>
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{title}</p>
        <h4 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">₹{value.toLocaleString()}</h4>
      </div>
    </div>
  );
}