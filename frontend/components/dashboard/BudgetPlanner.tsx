"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Copy,
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
  Layers,
  Calculator,
  ArrowDownRight,
  Info,
  Tag,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTable, ColumnDef } from "@/components/common/Datatable";
import { Modal, ModalFooterActions } from "@/components/common/Modal";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/Forminput";
import { Select } from "@/components/ui/Select";
import getSymbolFromCurrency from "currency-symbol-map";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// --- Types ---

interface CalcRow {
  description: string;
  amount: number;
}

interface BudgetItem {
  _id: string;
  category: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  notes?: string;
  is_completed: boolean;
  month: number;
  year: number;
  calculation_rows?: CalcRow[];
}

interface BudgetSummary {
  income: number;
  expenses: number;
  savings: number;
  savings_rate: number;
  item_count: number;
}

// --- Constants ---

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DEFAULT_CATEGORIES = [
  "Food & Dining", "Groceries", "Transport", "Shopping", "Entertainment",
  "Health", "Utilities", "Rent", "Education", "Personal", "Travel", "Debt", "Savings", "Other"
];

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  Groceries: "bg-green-500/15 text-green-600 dark:text-green-400",
  Transport: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  Shopping: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  Entertainment: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  Health: "bg-red-500/15 text-red-600 dark:text-red-400",
  Utilities: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  Rent: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  Education: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  Personal: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  Travel: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  Debt: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  Savings: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Other: "bg-muted text-muted-foreground",
};

// --- Sub-components ---

function AddBudgetItemModal({
  open,
  onClose,
  onSuccess,
  month,
  year,
  editItem,
  currencySymbol,
  existingCategories,
  defaultType
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (item: BudgetItem) => void;
  month: number;
  year: number;
  editItem?: BudgetItem | null;
  currencySymbol: string;
  existingCategories: string[];
  defaultType?: "income" | "expense";
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Groceries");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">(defaultType || "expense");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For Price x Count helper
  const [useMultiCalc, setUseMultiCalc] = useState(false);
  const [price, setPrice] = useState("");
  const [count, setCount] = useState("");

  const categories = useMemo(() => {
    const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories]));
    return combined.map(c => ({ label: c, value: c }));
  }, [existingCategories]);

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setCategory(editItem.category);
      // If it uses multicalc we can just show value in amount, or we could parse. For now fallback to simple amount.
      setAmount(String(editItem.amount));
      setType(editItem.type);
      setNotes(editItem.notes || "");
      setUseMultiCalc(false);
      setPrice("");
      setCount("");
    } else {
      setTitle("");
      setCategory(defaultType === "income" ? "Salary" : "Groceries");
      setAmount("");
      setType(defaultType || "expense");
      setNotes("");
      setUseMultiCalc(false);
      setPrice("");
      setCount("");
    }
  }, [editItem, open, defaultType]);

  useEffect(() => {
    // Reset category default toggle if custom
    setIsCustomCategory(false);
    setCustomCategory("");
    setError(null);
  }, [editItem, open, defaultType]);

  const handleSave = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    
    let finalAmount = 0;
    if (type === "expense" && useMultiCalc) {
      finalAmount = Number(price) * Number(count);
    } else {
      finalAmount = parseFloat(amount);
    }

    if (isNaN(finalAmount) || finalAmount < 0) { setError("Valid amount is required"); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const finalCategory = isCustomCategory ? customCategory.trim() : category;
      
      const payload = {
        title: title.trim(),
        category: type === "income" ? "Salary" : (finalCategory || "Other"),
        amount: finalAmount,
        type,
        notes: type === "expense" ? notes.trim() : "",
        month,
        year,
        // Optional calculation metadata can still be attached for history, but we omit general rows.
        calculation_rows: (type === "expense" && useMultiCalc) ? [{ description: `${price} x ${count}`, amount: finalAmount }] : undefined
      };

      const url = editItem 
        ? `${API_BASE_URL}/budget/${editItem._id}` 
        : `${API_BASE_URL}/budget/`;
      
      const res = await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Failed to save budget item");
      }
      
      const saved = await res.json();
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editItem ? "Edit Budget Item" : "New Budget Item"} size="md">
      <div className="flex flex-col gap-4 py-1">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <X className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        {/* Type Toggle Removed - Handled by the button that opens the modal */}

        {/* Title & Category */}
        <div className={cn("grid gap-3", type === "expense" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
          <FormInput 
            label={type === "income" ? "Income Source" : "What is this for?"} 
            placeholder={type === "income" ? "e.g. Monthly Salary" : "e.g. Monthly Rent"} 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
          />
          {type === "expense" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
                <button 
                  type="button" 
                  onClick={() => setIsCustomCategory(!isCustomCategory)} 
                  className="text-[10px] font-bold text-primary hover:underline uppercase"
                >
                  {isCustomCategory ? "Select Existing" : "+ New"}
                </button>
              </div>
              {isCustomCategory ? (
                <FormInput 
                  placeholder="Enter new category..." 
                  value={customCategory} 
                  onChange={e => setCustomCategory(e.target.value)} 
                  autoFocus
                />
              ) : (
                <Select 
                  value={category} 
                  onChange={setCategory} 
                  options={categories} 
                />
              )}
            </div>
          )}
        </div>

        {/* Amount / Calculation Section */}
        {type === "expense" ? (
          <div className="flex flex-col gap-3 p-3 rounded-2xl border border-border bg-muted/20">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <Calculator className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold uppercase text-foreground">Amount Calculation</span>
               </div>
               <div className="flex items-center gap-1 bg-background rounded-lg border border-border p-0.5">
                  <button 
                    type="button" 
                    onClick={() => setUseMultiCalc(false)}
                    className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-all", !useMultiCalc ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
                  >SINGLE</button>
                  <button 
                    type="button" 
                    onClick={() => setUseMultiCalc(true)}
                    className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-all", useMultiCalc ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
                  >MULTIPLY</button>
               </div>
            </div>

            {!useMultiCalc ? (
              <FormInput 
                label={`Amount (${currencySymbol})`} 
                type="number" 
                placeholder="0.00"
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 items-end">
                 <FormInput label="Price" type="number" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
                 <FormInput label="Count" type="number" placeholder="1" value={count} onChange={e => setCount(e.target.value)} />
              </div>
            )}

            {/* Result Preview */}
            {useMultiCalc && (
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase">Calculated Total</span>
                 <span className={cn(
                   "text-lg font-black tabular-nums",
                   type === "expense" ? "text-destructive" : "text-emerald-500"
                 )}>
                   {currencySymbol}{ (Number(price) * Number(count)).toFixed(2) }
                 </span>
              </div>
            )}
          </div>
        ) : (
          <FormInput 
            label={`Amount (${currencySymbol})`} 
            type="number" 
            placeholder="0.00"
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
          />
        )}

        {type === "expense" && (
          <FormInput 
            label="Notes" 
            placeholder="Optional notes or memos..." 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
          />
        )}
      </div>

      <ModalFooterActions className="mt-4">
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          variant="primary" 
          onClick={handleSave} 
          loading={loading}
          leftIcon={!loading && <Check className="h-4 w-4" />}
        >
          {editItem ? "Save Changes" : "Create Item"}
        </Button>
      </ModalFooterActions>
    </Modal>
  );
}

// --- Sub-components ---

function ViewBudgetItemModal({ 
  open, 
  onClose, 
  item, 
  currencySymbol 
}: { 
  open: boolean; 
  onClose: () => void; 
  item: BudgetItem | null; 
  currencySymbol: string;
}) {
  if (!item) return null;
  const isIncome = item.type === "income";

  return (
    <Modal open={open} onClose={onClose} title="Item Details" size="sm">
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col items-center justify-center py-4 bg-muted/20 border border-border rounded-none">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{isIncome ? "Income" : "Expense"}</span>
          <span className={cn(
            "text-3xl font-black tabular-nums tracking-tighter",
            isIncome ? "text-emerald-500" : "text-destructive"
          )}>
            {isIncome ? "+" : "-"}{currencySymbol}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Title / For</span>
            <span className="text-sm font-semibold text-foreground">{item.title}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Category</span>
            <span className="text-sm font-semibold text-foreground">{item.category}</span>
          </div>
          {item.notes && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Notes</span>
              <span className="text-sm font-medium text-foreground bg-muted/30 p-2 border border-border/50 rounded-none leading-relaxed">{item.notes}</span>
            </div>
          )}
          {item.calculation_rows && item.calculation_rows.length > 0 && (
            <div className="flex flex-col mt-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Calculation Breakdown</span>
              <div className="flex flex-col gap-2 p-3 bg-card border border-border rounded-none">
                {item.calculation_rows.map((row, i) => (
                  <div key={i} className="flex justify-between text-xs font-medium border-b border-border/40 last:border-0 pb-1.5 last:pb-0">
                    <span className="text-muted-foreground">{row.description}</span>
                    <span className="text-foreground tabular-nums font-bold">{currencySymbol}{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <ModalFooterActions className="mt-4">
        <Button variant="ghost" onClick={onClose} className="rounded-none">Close</Button>
      </ModalFooterActions>
    </Modal>
  );
}

export function BudgetPlanner() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<"income" | "expense">("expense");
  const [editItem, setEditItem] = useState<BudgetItem | null>(null);
  const [viewItem, setViewItem] = useState<BudgetItem | null>(null);
  const [cloning, setCloning] = useState(false);
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purging, setPurging] = useState(false);

  const existingCategories = useMemo(() => {
    return Array.from(new Set(items.map(i => i.category)));
  }, [items]);

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [listRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/budget/list?month=${currentMonth}&year=${currentYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/budget/stats/summary?month=${currentMonth}&year=${currentYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (listRes.ok) {
        const data = await listRes.json();
        setItems(data.items);
      }
      if (statsRes.ok) {
        setSummary(await statsRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    const pref = localStorage.getItem("preferred_currency");
    if (pref) setCurrencySymbol(getSymbolFromCurrency(pref) || "₹");
    fetchBudget();
  }, [fetchBudget]);

  const changeMonth = (delta: number) => {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m > 12) { m = 1; y++; }
    else if (m < 1) { m = 12; y--; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const handleToggle = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/budget/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setItems(prev => prev.map(i => i._id === id ? { ...i, is_completed: !i.is_completed } : i));
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/budget/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setItems(prev => prev.filter(i => i._id !== id));
        fetchBudget(); // Refresh summary
      }
    } catch (e) { console.error(e); }
  };

  const handlePurgeMonth = async () => {
    setPurging(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/budget/purge?month=${currentMonth}&year=${currentYear}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchBudget();
        setPurgeModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPurging(false);
    }
  };

  const handleClone = async () => {
    setCloning(true);
    try {
      const token = localStorage.getItem("token");
      let prevM = currentMonth - 1;
      let prevY = currentYear;
      if (prevM < 1) { prevM = 12; prevY--; }

      const res = await fetch(`${API_BASE_URL}/budget/clone`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          from_month: prevM,
          from_year: prevY,
          to_month: currentMonth,
          to_year: currentYear
        })
      });
      if (res.ok) {
        fetchBudget();
      }
    } catch (e) { console.error(e); }
    finally { setCloning(false); }
  };

  const columns: ColumnDef<BudgetItem>[] = [
    {
      key: "status",
      header: "Status",
      width: "60px",
      align: "center",
      noTruncate: true,
      cell: (_, row) => (
        <button 
          onClick={() => handleToggle(row._id)}
          className={cn(
            "h-5 w-5 rounded border flex items-center justify-center transition-all",
            row.is_completed 
              ? "bg-emerald-500 border-emerald-600 text-white" 
              : "bg-background border-border text-muted-foreground hover:border-primary"
          )}
        >
          {row.is_completed && <Check className="h-3 w-3" />}
        </button>
      )
    },
    {
      key: "title",
      header: "Description",
      cell: (val, row) => (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className={cn("text-sm font-semibold truncate", row.is_completed && "text-muted-foreground line-through opacity-60")}>
            {String(val)}
          </span>
          {row.notes && <span className="text-[10px] text-muted-foreground truncate opacity-70 italic">{row.notes}</span>}
        </div>
      )
    },
    {
      key: "category",
      header: "Category",
      noTruncate: true,
      cell: (val) => (
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap uppercase tracking-wider",
          CATEGORY_COLORS[String(val)] || CATEGORY_COLORS["Other"] || "bg-muted text-muted-foreground"
        )}>
          {String(val)}
        </span>
      )
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (val, row) => {
        const isIncome = row.type === "income";
        return (
          <span className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight border tabular-nums",
            isIncome 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
              : "bg-destructive/10 text-destructive border-destructive/20"
          )}>
            {isIncome ? "+" : "-"}{currencySymbol}{Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      noTruncate: true,
      cell: (_: unknown, row: BudgetItem) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewItem(row)}
            className="w-7 h-7 flex items-center justify-center rounded-none text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setEditItem(row); setAddModalOpen(true); }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    }
  ];

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col p-5 rounded-none bg-card border border-border shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center justify-between mb-3 z-10 w-full">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Income</span>
              <div className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-500 rounded-none border border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-black tabular-nums text-foreground relative z-10 tracking-tight">{currencySymbol}{(summary?.income || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex flex-col p-5 rounded-none bg-card border border-border shadow-sm relative overflow-hidden group hover:border-destructive/30 transition-colors">
            <div className="flex items-center justify-between mb-3 z-10 w-full">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Expenses</span>
              <div className="w-8 h-8 flex items-center justify-center bg-destructive/10 text-destructive rounded-none border border-destructive/20">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-black tabular-nums text-foreground relative z-10 tracking-tight">{currencySymbol}{(summary?.expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex flex-col p-5 rounded-none bg-card border border-border shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-3 z-10 w-full">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expected Balance</span>
              <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-none border border-primary/20">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-black tabular-nums text-foreground relative z-10 tracking-tight">{currencySymbol}{(summary?.savings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* ── Navigator ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 bg-card border border-border rounded-2xl p-1.5">
            <button
              onClick={() => changeMonth(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl border border-transparent transition-all">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground leading-tight whitespace-nowrap">
                  {MONTHS[currentMonth - 1]} {currentYear}
                </span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                  Monthly Budget
                </span>
              </div>
            </div>
            <button
              onClick={() => changeMonth(1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="sm:ml-auto flex flex-wrap items-center gap-2">
            {items.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setPurgeModalOpen(true)}
                leftIcon={<Trash2 className="h-4 w-4" />}
                title="Clear Month"
              >
                Clear
              </Button>
            )}
            {items.length === 0 && (
              <Button
                variant="secondary"
                onClick={handleClone}
                disabled={cloning}
                loading={cloning}
                leftIcon={!cloning && <Copy className="h-4 w-4" />}
              >
                Clone Previous
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => { setEditItem(null); setAddType("income"); setAddModalOpen(true); }}
              className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Income
            </Button>
            <Button
              variant="primary"
              onClick={() => { setEditItem(null); setAddType("expense"); setAddModalOpen(true); }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Expense
            </Button>
          </div>
        </div>

        {/* ── Main List ── */}
        <DataTable 
          data={items} 
          columns={columns} 
          rowKey="_id"
          loading={loading}
          striped
          compact
          searchable={false}
          hideToolbar
          emptyState={
            <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
              <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 opacity-40" />
              </div>
              <p className="text-sm font-semibold mb-1">Plan your month</p>
              <p className="text-xs text-center max-w-xs">
                Add items for your monthly needs or clone from previous month to get started.
              </p>
              <button
                onClick={() => { setEditItem(null); setAddType("expense"); setAddModalOpen(true); }}
                className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Needs
              </button>
            </div>
          }
          footerSummarySlot={
            !loading && items.length > 0 ? (
              <div className="px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Monthly Summary
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-x-8 gap-y-4 w-full sm:w-auto">
                  <div className="flex flex-col items-end min-w-[100px]">
                    <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-tight">Planned Income</span>
                    <span className="text-sm font-bold text-emerald-500 tabular-nums">
                      +{currencySymbol}{(summary?.income || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end min-w-[100px]">
                    <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-tight">Planned Expenses</span>
                    <span className="text-sm font-bold text-destructive tabular-nums">
                      -{currencySymbol}{(summary?.expenses || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-4 sm:pt-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-border/60 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto mt-2 sm:mt-0">
                    <span className="text-[10px] uppercase text-foreground font-black tracking-tight sm:mb-1">Proj. Savings</span>
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "text-base sm:text-lg font-black tabular-nums tracking-tighter leading-none",
                        (summary?.savings || 0) >= 0 ? "text-primary" : "text-destructive"
                      )}>
                        {(summary?.savings || 0) >= 0 ? "+" : ""}{currencySymbol}{Math.abs(summary?.savings || 0).toFixed(2)}
                      </span>
                      <span className="text-[9px] font-bold text-primary/70">{summary?.savings_rate || 0}% Rate</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : undefined
          }
        />
      </div>

      <AddBudgetItemModal 
        open={addModalOpen} 
        onClose={() => setAddModalOpen(false)} 
        onSuccess={() => fetchBudget()} 
        month={currentMonth} 
        year={currentYear}
        editItem={editItem}
        currencySymbol={currencySymbol}
        existingCategories={existingCategories}
        defaultType={addType}
      />

      <ViewBudgetItemModal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        item={viewItem}
        currencySymbol={currencySymbol}
      />

      <Modal open={purgeModalOpen} onClose={() => setPurgeModalOpen(false)} title="Clear Month" size="sm">
        <div className="flex flex-col gap-3 py-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2 border border-destructive/20 shadow-sm">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black tracking-tight text-foreground">Are you absolutely sure?</h3>
          <p className="text-sm font-medium text-muted-foreground leading-relaxed px-2">
            This will securely delete ALL incomes and expenses for this month. This action cannot be undone.
          </p>
        </div>
        <ModalFooterActions className="mt-4">
          <Button variant="ghost" onClick={() => setPurgeModalOpen(false)} disabled={purging}>Cancel</Button>
          <Button variant="destructive" onClick={handlePurgeMonth} loading={purging}>Yes, Clear Month</Button>
        </ModalFooterActions>
      </Modal>
    </>
  );
}

