"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Eye,
  Receipt,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Building2,
  Tag,
  X,
  Check,
  Upload,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTable, ColumnDef } from "@/components/common/Datatable";
import { Modal, ModalFooterActions } from "@/components/common/Modal";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/Forminput";
import { Select } from "@/components/ui/Select";
import getSymbolFromCurrency from "currency-symbol-map";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalcRow {
  description: string;
  amount: number;
}

interface DailyEntry {
  _id: string;
  title: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  entry_date: string;
  source: "manual" | "bank_statement";
  bank?: string;
  description?: string;
  receipt_url?: string | null;
  calculation_rows?: CalcRow[];
}

interface DaySummary {
  date: string;
  items: DailyEntry[];
  total_income: number;
  total_expenses: number;
  balance: number;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isToday(dateStr: string): boolean {
  return dateStr === toLocalDateStr(new Date());
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Utilities",
  "Rent",
  "Education",
  "Personal",
  "Travel",
  "Income",
  "Freelance",
  "Investment",
  "Other",
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
  Income: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Freelance: "bg-lime-500/15 text-lime-600 dark:text-lime-400",
  Investment: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  Other: "bg-muted text-muted-foreground",
};

// ─── Receipt Upload Component (reuses the Vercel Blob upload) ─────────────────

function ReceiptUpload({
  currentUrl,
  onFileChange,
  onClear,
  disabled,
}: {
  currentUrl?: string | null;
  onFileChange: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayImg = preview || currentUrl || null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Only images or PDFs accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Max file size is 10 MB.");
      return;
    }
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null); // PDF – no preview
    }
    onFileChange(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Receipt / Bill Image
      </label>
      <div className="flex items-center gap-3">
        {/* Thumbnail */}
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            "group relative flex items-center justify-center h-20 w-20 rounded-xl border-2 border-dashed overflow-hidden transition-all shrink-0",
            !disabled && "cursor-pointer hover:border-primary/60 hover:bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed",
            !displayImg && "border-border bg-muted/20"
          )}
        >
          {displayImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayImg} alt="Receipt preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 p-2">
              <Receipt className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[9px] font-bold uppercase text-muted-foreground group-hover:text-primary text-center leading-tight">
                Upload
              </span>
            </div>
          )}
          {displayImg && !disabled && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Info text + clear */}
        <div className="flex flex-col gap-1.5 min-w-0">
          {displayImg ? (
            <>
              <span className="text-xs text-foreground font-medium truncate">Receipt attached</span>
              <button
                type="button"
                onClick={() => { setPreview(null); onClear(); }}
                disabled={disabled}
                className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
              >
                <X className="h-3 w-3" /> Remove
              </button>
            </>
          ) : (
            <>
              <span className="text-xs text-muted-foreground">
                Attach a photo of your bill or receipt.
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Upload className="h-3 w-3" /> Choose file
              </button>
            </>
          )}
          {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}

// ─── Add / Edit Transaction Modal ─────────────────────────────────────────────

interface AddEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (entry: DailyEntry) => void;
  selectedDate: string;
  editEntry?: DailyEntry | null;
  currencySymbol: string;
}

function AddEntryModal({
  open,
  onClose,
  onSuccess,
  selectedDate,
  editEntry,
  currencySymbol,
}: AddEntryModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food & Dining");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [calcRows, setCalcRows] = useState<CalcRow[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate when editing
  useEffect(() => {
    if (editEntry) {
      setTitle(editEntry.title || "");
      setCategory(editEntry.category || "Food & Dining");
      setAmount(String(editEntry.amount));
      setType(editEntry.type === "income" ? "income" : "expense");
      setCalcRows(editEntry.calculation_rows || []);
      setReceiptUrl(editEntry.receipt_url || null);
    } else {
      setTitle("");
      setCategory("Food & Dining");
      setAmount("");
      setType("expense");
      setCalcRows([]);
      setReceiptFile(null);
      setReceiptUrl(null);
    }
    setError(null);
  }, [editEntry, open]);

  const handleAddCalcRow = () =>
    setCalcRows((prev) => [...prev, { description: "", amount: 0 }]);

  const handleCalcRowChange = (i: number, field: keyof CalcRow, val: string) => {
    setCalcRows((prev) =>
      prev.map((r, idx) =>
        idx === i ? { ...r, [field]: field === "amount" ? Number(val) : val } : r
      )
    );
  };

  const handleRemoveCalcRow = (i: number) =>
    setCalcRows((prev) => prev.filter((_, idx) => idx !== i));

  // Auto-sum calc rows into amount
  const calcTotal = calcRows.reduce((s, r) => s + (r.amount || 0), 0);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    const finalAmount = calcRows.length > 0 ? calcTotal : Number(amount);
    if (!finalAmount || finalAmount <= 0) { setError("Enter a valid amount."); return; }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      let finalReceiptUrl = receiptUrl;

      // Upload receipt if a new file was selected
      if (receiptFile) {
        const fd = new FormData();
        fd.append("file", receiptFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) {
          const ud = await uploadRes.json();
          throw new Error(ud.error || "Receipt upload failed");
        }
        const uploadData = await uploadRes.json();
        finalReceiptUrl = uploadData.url;
      }

      const payload = {
        title: title.trim(),
        category,
        amount: finalAmount,
        type,
        entry_date: selectedDate,
        receipt_url: finalReceiptUrl || null,
        calculation_rows: calcRows.length > 0 ? calcRows : undefined,
      };

      let res: Response;
      if (editEntry) {
        res = await fetch(`${API_BASE_URL}/daily-budget/${editEntry._id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/daily-budget/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Failed to save entry");
      }

      const saved = await res.json();
      onSuccess({
        _id: saved._id || editEntry?._id || "",
        title: payload.title,
        description: payload.title,   // used by the description column
        category: payload.category,
        amount: payload.amount,
        type: payload.type as "income" | "expense",
        entry_date: payload.entry_date,
        source: "manual",
        bank: "Manually Added",
        receipt_url: finalReceiptUrl,
        calculation_rows: calcRows.length > 0 ? calcRows : [],
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!editEntry;
  const displayAmount = calcRows.length > 0 ? calcTotal : Number(amount) || 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Transaction" : "Add Daily Transaction"}
      size="md"
    >
      <div className="flex flex-col gap-4 py-1">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <X className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        {/* Type Toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={cn(
                "flex items-center justify-center gap-2 h-10 rounded-xl border-2 text-sm font-bold transition-all",
                type === "expense"
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-border bg-transparent text-muted-foreground hover:border-border/80"
              )}
            >
              <ArrowDownRight className="h-4 w-4" /> Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={cn(
                "flex items-center justify-center gap-2 h-10 rounded-xl border-2 text-sm font-bold transition-all",
                type === "income"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-border bg-transparent text-muted-foreground hover:border-border/80"
              )}
            >
              <ArrowUpRight className="h-4 w-4" /> Income
            </button>
          </div>
        </div>

        {/* Description + Category */}
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Description"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lunch at café"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Category
            </label>
            <Select
              value={category}
              onChange={setCategory}
              options={CATEGORIES.map(c => ({ value: c, label: c }))}
              placeholder="Select category"
            />
          </div>
        </div>

        {/* Locked bank field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Bank
          </label>
          <div className="h-9 px-3 flex items-center gap-2 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground select-none cursor-not-allowed">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">Manually Added</span>
            <span className="ml-auto text-[10px] uppercase tracking-wider font-bold opacity-50">Locked</span>
          </div>
        </div>

        {/* Amount OR Calc Rows */}
        {calcRows.length === 0 ? (
          <FormInput
            label={`Amount (${currencySymbol})`}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Bill Breakdown
            </label>
            {calcRows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => handleCalcRowChange(i, "description", e.target.value)}
                  placeholder="Item name"
                  className="flex-1 h-8 px-3 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
                <input
                  type="number"
                  value={row.amount || ""}
                  onChange={(e) => handleCalcRowChange(i, "amount", e.target.value)}
                  placeholder="0.00"
                  className="w-24 h-8 px-3 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
                <button
                  onClick={() => handleRemoveCalcRow(i)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {/* Total row */}
            <div className="flex items-center justify-between px-1 py-1 border-t border-border/60 mt-1">
              <span className="text-xs font-bold text-muted-foreground uppercase">Total</span>
              <span className={cn(
                "text-sm font-bold tabular-nums",
                type === "expense" ? "text-destructive" : "text-emerald-500"
              )}>
                {currencySymbol}{calcTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Add breakdown toggle */}
        <button
          type="button"
          onClick={calcRows.length === 0 ? handleAddCalcRow : handleAddCalcRow}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-semibold transition-colors self-start"
        >
          <Plus className="h-3.5 w-3.5" />
          {calcRows.length === 0 ? "Add bill breakdown" : "Add another item"}
        </button>

        {/* Date display */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border/50">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-foreground font-medium">{formatDisplayDate(selectedDate)}</span>
        </div>

        {/* Receipt Upload */}
        <ReceiptUpload
          currentUrl={receiptUrl}
          onFileChange={setReceiptFile}
          onClear={() => { setReceiptFile(null); setReceiptUrl(null); }}
          disabled={loading}
        />

        {/* Amount preview */}
        {displayAmount > 0 && (
          <div className={cn(
            "flex items-center justify-between px-4 py-3 rounded-xl border",
            type === "expense"
              ? "bg-destructive/5 border-destructive/15"
              : "bg-emerald-500/5 border-emerald-500/15"
          )}>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {type === "expense" ? "Total Expense" : "Total Income"}
            </span>
            <span className={cn(
              "text-lg font-black tabular-nums",
              type === "expense" ? "text-destructive" : "text-emerald-500"
            )}>
              {type === "expense" ? "-" : "+"}{currencySymbol}{displayAmount.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <ModalFooterActions className="mt-4">
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={loading}
          leftIcon={!loading ? <Check className="h-4 w-4" /> : undefined}
        >
          {isEdit ? "Save Changes" : "Add Transaction"}
        </Button>
      </ModalFooterActions>
    </Modal>
  );
}

// ─── View Entry Modal ─────────────────────────────────────────────────────────

function ViewEntryModal({
  open,
  entry,
  onClose,
  currencySymbol,
}: {
  open: boolean;
  entry: DailyEntry | null;
  onClose: () => void;
  currencySymbol: string;
}) {
  if (!entry) return null;
  const isIncome = entry.type === "income";

  return (
    <Modal open={open} onClose={onClose} title="Transaction Details" size="sm">
      <div className="flex flex-col gap-4 py-2">
        {/* Amount hero */}
        <div className={cn(
          "flex flex-col items-center py-5 px-4 rounded-2xl border",
          isIncome
            ? "bg-emerald-500/8 border-emerald-500/20"
            : "bg-destructive/8 border-destructive/20"
        )}>
          <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-2">
            {entry.type}
          </span>
          <span className={cn(
            "text-4xl font-black tabular-nums",
            isIncome ? "text-emerald-500" : "text-destructive"
          )}>
            {isIncome ? "+" : "-"}{currencySymbol}{entry.amount.toFixed(2)}
          </span>
          <span className={cn(
            "mt-2 px-3 py-1 rounded-full text-xs font-semibold",
            CATEGORY_COLORS[entry.category] || CATEGORY_COLORS["Other"]
          )}>
            {entry.category}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-0">
          <DetailRow icon={<FileText />} label="Title" value={entry.title} />
          <DetailRow icon={<Calendar />} label="Date" value={formatDisplayDate(entry.entry_date)} />
          {entry.bank && <DetailRow icon={<Building2 />} label="Bank" value={entry.bank} />}
          {entry.description && entry.description !== entry.title && (
            <DetailRow icon={<Tag />} label="Description" value={entry.description} />
          )}
          <DetailRow
            icon={<Tag />}
            label="Source"
            value={entry.source === "manual" ? "Manually Added" : "Bank Statement"}
          />
        </div>

        {/* Calculation breakdown */}
        {entry.calculation_rows && entry.calculation_rows.length > 0 && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/30">
              <span className="text-xs font-bold uppercase text-muted-foreground">Bill Breakdown</span>
            </div>
            <div className="divide-y divide-border/50">
              {entry.calculation_rows.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-foreground">{r.description}</span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {currencySymbol}{r.amount.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20">
                <span className="text-xs font-bold uppercase text-muted-foreground">Total</span>
                <span className={cn(
                  "text-sm font-black tabular-nums",
                  isIncome ? "text-emerald-500" : "text-destructive"
                )}>
                  {currencySymbol}{entry.amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Receipt */}
        {entry.receipt_url && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase text-muted-foreground">Receipt</span>
            <a href={entry.receipt_url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.receipt_url}
                alt="Receipt"
                className="w-full rounded-xl border border-border object-cover max-h-48 hover:opacity-90 transition-opacity cursor-pointer"
              />
            </a>
          </div>
        )}
      </div>
      <ModalFooterActions className="mt-4">
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </ModalFooterActions>
    </Modal>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-3.5 h-3.5" })}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-0.5">{label}</span>
        <span className="text-sm font-medium text-foreground truncate">{value || "—"}</span>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteEntryModal({
  open,
  entry,
  onClose,
  onSuccess,
  currencySymbol,
}: {
  open: boolean;
  entry: DailyEntry | null;
  onClose: () => void;
  onSuccess: (id: string) => void;
  currencySymbol: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!entry) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/daily-budget/${entry._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete.");
      onSuccess(entry._id);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete Transaction" size="sm">
      <div className="py-2">
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <strong className="text-foreground">{entry?.title}</strong> for{" "}
          <strong className="text-foreground">{currencySymbol}{entry?.amount.toFixed(2)}</strong>?
          This action cannot be undone.
        </p>
      </div>
      <ModalFooterActions>
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          loading={loading}
          leftIcon={<Trash2 className="h-4 w-4" />}
        >
          Delete
        </Button>
      </ModalFooterActions>
    </Modal>
  );
}


// ─── Main DailyTracker Component ──────────────────────────────────────────────

export function DailyTracker() {
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()));
  const [daySummary, setDaySummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<DailyEntry | null>(null);
  const [viewEntry, setViewEntry] = useState<DailyEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<DailyEntry | null>(null);

  // Currency
  useEffect(() => {
    const pref = localStorage.getItem("preferred_currency");
    if (pref) {
      setCurrencySymbol(getSymbolFromCurrency(pref) || "₹");
    }
  }, []);

  const fetchDay = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/daily-budget/day?target_date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setDaySummary(data);
    } catch (err) {
      console.error(err);
      setDaySummary(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchDay(); }, [fetchDay]);

  const goDay = (delta: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const next = new Date(y, m - 1, d + delta);
    setSelectedDate(toLocalDateStr(next));
  };

  const handleAddSuccess = (entry: DailyEntry) => {
    setDaySummary((prev) => {
      if (!prev) return prev;
      const items = editEntry
        ? prev.items.map((i) => (i._id === entry._id ? entry : i))
        : [...prev.items, entry];
      const income = items.filter((i) => i.type === "income").reduce((s, i) => s + i.amount, 0);
      const expenses = items.filter((i) => i.type === "expense").reduce((s, i) => s + i.amount, 0);
      return { ...prev, items, total_income: income, total_expenses: expenses, balance: income - expenses };
    });
    setEditEntry(null);
  };

  const handleDeleteSuccess = (id: string) => {
    setDaySummary((prev) => {
      if (!prev) return prev;
      const items = prev.items.filter((i) => i._id !== id);
      const income = items.filter((i) => i.type === "income").reduce((s, i) => s + i.amount, 0);
      const expenses = items.filter((i) => i.type === "expense").reduce((s, i) => s + i.amount, 0);
      return { ...prev, items, total_income: income, total_expenses: expenses, balance: income - expenses };
    });
  };

  // DataTable columns
  const columns: ColumnDef<DailyEntry>[] = [
    {
      key: "sno",
      header: "#",
      align: "center",
      noTruncate: true,
      cell: (_: unknown, __: DailyEntry, index: number) => (
        <span className="text-muted-foreground/60 font-mono text-[11px]">{index + 1}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      noTruncate: true,
      cell: (val: unknown, row: DailyEntry) => (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate max-w-[220px]">
            {String(val || row.title || "—")}
          </span>
          {row.source === "bank_statement" && row.bank && (
            <span className="text-[10px] text-muted-foreground/70 font-medium">via {row.bank}</span>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      noTruncate: true,
      cell: (val: unknown, row: DailyEntry) => {
        const displayCat = row.source === "bank_statement" ? "Online" : String(val);
        return (
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold",
            row.source === "bank_statement"
              ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
              : (CATEGORY_COLORS[String(val)] || CATEGORY_COLORS["Other"])
          )}>
            {displayCat}
          </span>
        );
      },
    },
    {
      key: "source",
      header: "Source",
      noTruncate: true,
      cell: (val: unknown) => (
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border",
          val === "manual"
            ? "bg-primary/10 text-primary border-primary/20"
            : "bg-muted text-muted-foreground border-border"
        )}>
          {val === "manual" ? <Plus className="h-2.5 w-2.5" /> : <Building2 className="h-2.5 w-2.5" />}
          {val === "manual" ? "Manual" : "Bank"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (val: unknown, row: DailyEntry) => {
        const isIncome = row.type === "income";
        return (
          <span className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight border tabular-nums",
            isIncome
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          )}>
            {isIncome ? "+" : "-"}{currencySymbol}{Number(val).toFixed(2)}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      noTruncate: true,
      cell: (_: unknown, row: DailyEntry) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewEntry(row)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
            title="View"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {row.source === "manual" && (
            <>
              <button
                onClick={() => { setEditEntry(row); setAddModalOpen(true); }}
                className="w-7 h-7 flex items-center justify-center rounded-md text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                title="Edit"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeleteEntry(row)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const entries = daySummary?.items || [];

  return (
    <>
      {/* Modals */}
      <AddEntryModal
        open={addModalOpen}
        onClose={() => { setAddModalOpen(false); setEditEntry(null); }}
        onSuccess={handleAddSuccess}
        selectedDate={selectedDate}
        editEntry={editEntry}
        currencySymbol={currencySymbol}
      />
      <ViewEntryModal
        open={!!viewEntry}
        entry={viewEntry}
        onClose={() => setViewEntry(null)}
        currencySymbol={currencySymbol}
      />
      <DeleteEntryModal
        open={!!deleteEntry}
        entry={deleteEntry}
        onClose={() => setDeleteEntry(null)}
        onSuccess={handleDeleteSuccess}
        currencySymbol={currencySymbol}
      />

      <div className="flex flex-col gap-6">
        {/* ── Date Navigator ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 bg-card border border-border rounded-2xl p-1.5">
            <button
              onClick={() => goDay(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 px-2">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground leading-tight whitespace-nowrap">
                    {new Date(
                      Number(selectedDate.split("-")[0]),
                      Number(selectedDate.split("-")[1]) - 1,
                      Number(selectedDate.split("-")[2])
                    ).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  {isToday(selectedDate) && (
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Today</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => goDay(1)}
              disabled={selectedDate >= toLocalDateStr(new Date())}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Today button */}
          {!isToday(selectedDate) && (
            <button
              onClick={() => setSelectedDate(toLocalDateStr(new Date()))}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
            >
              Jump to Today
            </button>
          )}

          {/* Add button */}
          <div className="sm:ml-auto">
            <button
              onClick={() => { setEditEntry(null); setAddModalOpen(true); }}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Summary cards removed — stats are already in the table footer */}

        {/* ── Transactions Table ─────────────────────────────── */}
        <DataTable
          data={entries}
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
                <Receipt className="h-6 w-6 opacity-40" />
              </div>
              <p className="text-sm font-semibold mb-1">No transactions for this day</p>
              <p className="text-xs text-center max-w-xs">
                Add a manual transaction or upload a bank statement to see entries here.
              </p>
              <button
                onClick={() => { setEditEntry(null); setAddModalOpen(true); }}
                className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Transaction
              </button>
            </div>
          }
          footerSummarySlot={
            !loading && entries.length > 0 ? (
              <div className="px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
                {/* Label Group */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Daily Summary
                  </span>
                </div>

                {/* Stats Group */}
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-x-8 gap-y-4 w-full sm:w-auto">
                  <div className="flex flex-col items-end min-w-[100px]">
                    <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-tight">Income</span>
                    <span className="text-sm font-bold text-emerald-500 tabular-nums">
                      +{currencySymbol}{(daySummary?.total_income || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end min-w-[100px]">
                    <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-tight">Expenses</span>
                    <span className="text-sm font-bold text-destructive tabular-nums">
                      -{currencySymbol}{(daySummary?.total_expenses || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-4 sm:pt-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-border/60 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto mt-2 sm:mt-0">
                    <span className="text-[10px] uppercase text-foreground font-black tracking-tight sm:mb-1">Net</span>
                    <span className={cn(
                      "text-base sm:text-lg font-black tabular-nums tracking-tighter leading-none",
                      (daySummary?.balance || 0) >= 0 ? "text-emerald-500" : "text-destructive"
                    )}>
                      {(daySummary?.balance || 0) >= 0 ? "+" : ""}{currencySymbol}{Math.abs(daySummary?.balance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </>
  );
}
