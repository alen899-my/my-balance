"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, Wallet, ShieldAlert, TrendingDown, 
  Sparkles, ArrowUpCircle 
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
  
  // Modal Visibility States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active Item for View/Edit/Delete
  const [activeItem, setActiveItem] = useState<any>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => { fetchBudgetList(); }, []);

  async function fetchBudgetList() {
    setLoading(true);
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/list?month=${currentMonth}&year=${currentYear}`);
      const json = await res.json();
      setItems(json.items || []);
    } catch (err) { console.error("Fetch error:", err); } 
    finally { setLoading(false); }
  }

  const summary = useMemo(() => {
    const income = items.filter(i => i.type === "income").reduce((a, b) => a + (b.total_amount || 0), 0);
    const expenses = items.filter(i => i.type === "expense").reduce((a, b) => a + (b.total_amount || 0), 0);
    return { income, target: expenses, balance: income - expenses };
  }, [items]);

  const survivalItems = items.filter(item => item.type === "expense");

  // --- ACTIONS ---
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
        body: JSON.stringify({
          ...data,
          month: currentMonth,
          year: currentYear,
          amount_per_unit: data.amount,
          units: data.times || 1,
          type: "expense"
        })
      });
      fetchBudgetList();
      setIsModalOpen(false);
    } catch (err) { console.error(err); }
  }

  async function handleSaveIncome(amount: number) {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/`, {
        method: "POST",
        body: JSON.stringify({
          category: "Monthly Income",
          amount_per_unit: amount,
          units: 1,
          month: currentMonth,
          year: currentYear,
          type: "income"
        })
      });
      fetchBudgetList();
      setIsIncomeModalOpen(false);
    } catch (err) { console.error(err); }
  }

  async function handleConfirmDelete() {
    if (!activeItem) return;
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/${activeItem._id}`, { method: 'DELETE' });
      setItems(items.filter(item => item._id !== activeItem._id));
      setIsDeleteOpen(false);
    } catch (err) { console.error(err); }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Survival Planning</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Monthly Planner</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
          <button onClick={() => setIsIncomeModalOpen(true)} className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
            <ArrowUpCircle className="w-4 h-4 text-emerald-500" /> Add Income
          </button>
          <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-violet-500/20">
            <Plus className="w-4 h-4" /> New Budget Item
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard title="Monthly Income" value={summary.income} icon={<Wallet className="w-4 h-4" />} color="text-emerald-500" bgColor="bg-emerald-50 dark:bg-emerald-900/10" />
        <SummaryCard title="Survival Target" value={summary.target} icon={<ShieldAlert className="w-4 h-4" />} color="text-rose-500" bgColor="bg-rose-50 dark:bg-rose-900/10" />
        <SummaryCard title="Projected Balance" value={summary.balance} icon={<TrendingDown className="w-4 h-4" />} color="text-violet-500" bgColor="bg-violet-50 dark:bg-violet-900/10" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="h-64 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 animate-pulse flex items-center justify-center text-slate-400 text-xs font-black uppercase tracking-widest">
          Syncing Inventory...
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

      {/* MODALS */}
      <BudgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveItem} />
      <IncomeModal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} onSave={handleSaveIncome} currentIncome={summary.income} />
      <ViewBudgetModal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} item={activeItem} />
      <EditBudgetModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} item={activeItem} onSave={fetchBudgetList} />
      <DeleteBudgetModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleConfirmDelete} itemName={activeItem?.category} />
    </div>
  );
}

function SummaryCard({ title, value, icon, color, bgColor }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 shadow-sm">
      <div className={`p-2.5 rounded-xl ${bgColor} ${color}`}>{icon}</div>
      <div>
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{title}</p>
        <h4 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white leading-none">₹{value.toLocaleString()}</h4>
      </div>
    </div>
  );
}