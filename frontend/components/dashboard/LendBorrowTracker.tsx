"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Phone, User, Check, X, Edit3, Trash2, Eye,
  HandCoins, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock
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

interface LendBorrowEntry {
  _id: string;
  name: string;
  phone?: string;
  amount: number;
  direction: "lent" | "borrowed";
  date: string;
  note?: string;
  is_settled: boolean;
  settled_date?: string;
  completion_date?: string;
  created_at: string;
}

interface Summary {
  total_lent: number;
  total_borrowed: number;
  pending_lent: number;
  pending_borrowed: number;
  net: number;
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

function EntryModal({
  open,
  onClose,
  onSuccess,
  editEntry,
  currencySymbol,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editEntry?: LendBorrowEntry | null;
  currencySymbol: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"lent" | "borrowed">("lent");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [completionDate, setCompletionDate] = useState("");
  const [note, setNote] = useState("");
  const [isSettled, setIsSettled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editEntry) {
      setName(editEntry.name);
      setPhone(editEntry.phone || "");
      setAmount(String(editEntry.amount));
      setDirection(editEntry.direction);
      setDate(editEntry.date.split("T")[0]);
      setCompletionDate(editEntry.completion_date ? editEntry.completion_date.split("T")[0] : "");
      setNote(editEntry.note || "");
      setIsSettled(editEntry.is_settled);
    } else {
      setName(""); setPhone(""); setAmount(""); setDirection("lent");
      setDate(new Date().toISOString().split("T")[0]);
      setCompletionDate("");
      setNote(""); setIsSettled(false);
    }
    setError(null);
  }, [editEntry, open]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required."); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount."); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: name.trim(),
        phone: phone.trim() || null,
        amount: amt,
        direction,
        date: new Date(date).toISOString(),
        note: note.trim() || null,
        is_settled: isSettled,
        completion_date: isSettled && completionDate ? new Date(completionDate).toISOString() : null,
      };

      const url = editEntry
        ? `${API_BASE_URL}/lend-borrow/${editEntry._id}`
        : `${API_BASE_URL}/lend-borrow/`;

      const res = await fetch(url, {
        method: editEntry ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Failed to save entry.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!editEntry;
  const lentColor = direction === "lent"
    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
    : "border-border bg-transparent text-muted-foreground hover:border-border/80";
  const borrowedColor = direction === "borrowed"
    ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400"
    : "border-border bg-transparent text-muted-foreground hover:border-border/80";

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Entry" : "Add Lend / Borrow"} size="md">
      <div className="flex flex-col gap-4 py-1">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <X className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        {/* Direction toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setDirection("lent")}
              className={cn("flex items-center justify-center gap-2 h-10 rounded-xl border-2 text-sm font-bold transition-all", lentColor)}>
              <ArrowUpRight className="h-4 w-4" /> I Lent Money
            </button>
            <button type="button" onClick={() => setDirection("borrowed")}
              className={cn("flex items-center justify-center gap-2 h-10 rounded-xl border-2 text-sm font-bold transition-all", borrowedColor)}>
              <ArrowDownRight className="h-4 w-4" /> I Borrowed
            </button>
          </div>
        </div>

        {/* Name + Phone */}
        <div className="grid grid-cols-2 gap-3">
          <FormInput label="Person's Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ravi Sharma" />
          <FormInput label="Phone (Optional)" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" type="tel" />
        </div>

        {/* Amount + Date */}
        <div className="grid grid-cols-2 gap-3">
          <FormInput label={`Amount (${currencySymbol})`} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          <FormInput
            label="Transaction Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {/* Settled toggle */}
        <button
          type="button"
          onClick={() => {
            const next = !isSettled;
            setIsSettled(next);
            if (next && !completionDate) {
              setCompletionDate(new Date().toISOString().split("T")[0]);
            }
          }}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold",
            isSettled
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-border text-muted-foreground hover:border-border/60"
          )}
        >
          <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
            isSettled ? "border-emerald-500 bg-emerald-500 text-white" : "border-border")}>
            {isSettled && <Check className="w-3 h-3" />}
          </div>
          {isSettled ? "Marked as settled / returned" : "Mark as settled (paid back)"}
        </button>

        {isSettled && (
          <FormInput
            label="Completed Date"
            type="date"
            value={completionDate}
            onChange={e => setCompletionDate(e.target.value)}
            hint="The exact date when the money was given back or settled."
          />
        )}

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Note (Optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. For dinner at Spice Garden"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
          />
        </div>
      </div>

      <ModalFooterActions className="mt-4">
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={loading}
          leftIcon={!loading ? <Check className="h-4 w-4" /> : undefined}
        >
          {isEdit ? "Save Changes" : "Add Entry"}
        </Button>
      </ModalFooterActions>
    </Modal>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────

function ViewModal({
  open,
  onClose,
  entry,
  currencySymbol,
}: {
  open: boolean;
  onClose: () => void;
  entry: LendBorrowEntry | null;
  currencySymbol: string;
}) {
  if (!entry) return null;
  const isLent = entry.direction === "lent";

  return (
    <Modal open={open} onClose={onClose} title="Entry Details" size="sm">
      <div className="flex flex-col gap-4 py-2">
        {/* Amount hero */}
        <div className={cn(
          "flex flex-col items-center py-5 px-4 rounded-2xl border",
          isLent
            ? "bg-amber-500/8 border-amber-500/20"
            : "bg-sky-500/8 border-sky-500/20"
        )}>
          <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-1">
            {isLent ? "You Lent" : "You Borrowed"}
          </span>
          <span className={cn("text-4xl font-black tabular-nums", isLent ? "text-amber-500" : "text-sky-500")}>
            {currencySymbol}{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className={cn(
            "mt-2 px-3 py-1 rounded-full text-xs font-bold",
            entry.is_settled
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          )}>
            {entry.is_settled ? "✓ Settled" : "⏳ Pending"}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-0">
          {[
            { label: "Person", value: entry.name, icon: <User /> },
            { label: "Phone", value: entry.phone || "—", icon: <Phone /> },
            { label: "Given Date", value: new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), icon: <ArrowUpRight /> },
            ...(entry.completion_date ? [{ label: "Completed On", value: new Date(entry.completion_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), icon: <CheckCircle2 /> }] : []),
            ...(entry.note ? [{ label: "Note", value: entry.note, icon: <HandCoins /> }] : []),
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                {React.cloneElement(row.icon as React.ReactElement<{ className?: string }>, { className: "w-3.5 h-3.5" })}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-0.5">{row.label}</span>
                <span className="text-sm font-medium text-foreground truncate">{row.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ModalFooterActions className="mt-4">
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </ModalFooterActions>
    </Modal>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({
  open,
  entry,
  onClose,
  onSuccess,
}: {
  open: boolean;
  entry: LendBorrowEntry | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!entry) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/lend-borrow/${entry._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete Entry" size="sm">
      <div className="py-2">
        <p className="text-sm text-muted-foreground">
          Delete entry for <strong className="text-foreground">{entry?.name}</strong>? This action cannot be undone.
        </p>
      </div>
      <ModalFooterActions>
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="destructive" onClick={handleDelete} loading={loading} leftIcon={<Trash2 className="h-4 w-4" />}>
          Delete
        </Button>
      </ModalFooterActions>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LendBorrowTracker() {
  const [entries, setEntries] = useState<LendBorrowEntry[]>([]);
  const [summary, setSummary] = useState<Summary>({ total_lent: 0, total_borrowed: 0, pending_lent: 0, pending_borrowed: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [activeTab, setActiveTab] = useState<"all" | "lent" | "borrowed">("all");
  const [activeStatus, setActiveStatus] = useState<"all" | "pending" | "settled">("all");

  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<LendBorrowEntry | null>(null);
  const [viewEntry, setViewEntry] = useState<LendBorrowEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<LendBorrowEntry | null>(null);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [listRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/lend-borrow/list`, { headers }),
        fetch(`${API_BASE_URL}/lend-borrow/summary`, { headers }),
      ]);
      if (listRes.ok) setEntries((await listRes.json()).items);
      if (summaryRes.ok) setSummary(await summaryRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const pref = localStorage.getItem("preferred_currency");
    if (pref) setCurrencySymbol(getSymbolFromCurrency(pref) || "₹");
    fetchData();
  }, [fetchData]);

  const handleQuickSettle = async (entry: LendBorrowEntry) => {
    setSettlingId(entry._id);
    try {
      const token = localStorage.getItem("token");
      const newState = !entry.is_settled;
      await fetch(`${API_BASE_URL}/lend-borrow/${entry._id}/settle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          is_settled: newState,
          settled_date: newState ? new Date().toISOString() : null,
          completion_date: newState ? new Date().toISOString() : null
        }),
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSettlingId(null);
    }
  };

  // Filter logic
  const filteredEntries = entries.filter(e => {
    // Type filter
    const matchesType = activeTab === "all" || e.direction === activeTab;
    // Status filter
    const matchesStatus = activeStatus === "all" ||
      (activeStatus === "pending" && !e.is_settled) ||
      (activeStatus === "settled" && e.is_settled);

    return matchesType && matchesStatus;
  });

  // ── Columns ──────────────────────────────────────────────────────────────────

  const columns: ColumnDef<LendBorrowEntry>[] = [
    {
      key: "sno", header: "#", align: "center", noTruncate: true,
      cell: (_: unknown, __: LendBorrowEntry, idx: number) => (
        <span className="text-muted-foreground/60 font-mono text-[11px]">{idx + 1}</span>
      ),
    },
    {
      key: "name", header: "Person", noTruncate: true,
      cell: (val: unknown, row: LendBorrowEntry) => (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate max-w-[180px]">{String(val)}</span>
          {row.phone && (
            <span className="text-[10px] text-muted-foreground/70 font-medium flex items-center gap-1">
              <Phone className="h-2.5 w-2.5" /> {row.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "direction", header: "Type", noTruncate: true,
      cell: (val: unknown) => {
        const isLent = val === "lent";
        return (
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold border",
            isLent
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
          )}>
            {isLent ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {isLent ? "Lent" : "Borrowed"}
          </span>
        );
      },
    },
    {
      key: "amount", header: "Amount", align: "right", noTruncate: true,
      cell: (val: unknown, row: LendBorrowEntry) => {
        const isLent = row.direction === "lent";
        return (
          <span className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight border tabular-nums",
            isLent
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
          )}>
            {currencySymbol}{Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      key: "date", header: "Date Info", noTruncate: true,
      cell: (_: unknown, row: LendBorrowEntry) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap text-right sm:text-left">
            Given: {new Date(row.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
          {row.completion_date && (
            <span className="text-[10px] uppercase font-bold text-emerald-500 whitespace-nowrap text-right sm:text-left">
              Back: {new Date(row.completion_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "is_settled", header: "Status", noTruncate: true,
      cell: (val: unknown, row: LendBorrowEntry) => {
        const settled = val as boolean;
        const isLoading = settlingId === row._id;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); handleQuickSettle(row); }}
            disabled={isLoading}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer hover:opacity-80 disabled:opacity-50",
              settled
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-muted/60 text-muted-foreground border-border"
            )}
          >
            {settled
              ? <><CheckCircle2 className="h-3 w-3" /> Settled</>
              : <><Clock className="h-3 w-3" /> Pending</>
            }
          </button>
        );
      },
    },
    {
      key: "actions", header: "Actions", align: "right", noTruncate: true,
      cell: (_: unknown, row: LendBorrowEntry) => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewEntry(row)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors" title="View">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setEditEntry(row); setAddOpen(true); }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors" title="Edit">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteEntry(row)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const tabs: { key: "all" | "lent" | "borrowed"; label: string }[] = [
    { key: "all", label: "All Types" },
    { key: "lent", label: "I Lent" },
    { key: "borrowed", label: "I Borrowed" },
  ];

  const statusFilters: { key: "all" | "pending" | "settled"; label: string }[] = [
    { key: "all", label: "All Status" },
    { key: "pending", label: "Pending" },
    { key: "settled", label: "Settled" },
  ];

  return (
    <>
      {/* Modals */}
      <EntryModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditEntry(null); }}
        onSuccess={fetchData}
        editEntry={editEntry}
        currencySymbol={currencySymbol}
      />
      <ViewModal open={!!viewEntry} onClose={() => setViewEntry(null)} entry={viewEntry} currencySymbol={currencySymbol} />
      <DeleteModal open={!!deleteEntry} entry={deleteEntry} onClose={() => setDeleteEntry(null)} onSuccess={fetchData} />

      <div className="flex flex-col gap-6">

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "You Lent", value: summary.total_lent, icon: <ArrowUpRight />, color: "amber" },
            { label: "You Borrowed", value: summary.total_borrowed, icon: <ArrowDownRight />, color: "sky" },
            { label: "Pending to Receive", value: summary.pending_lent, icon: <Clock />, color: "amber" },
            { label: "Pending to Pay", value: summary.pending_borrowed, icon: <Clock />, color: "rose" },
          ].map((card, i) => {
            const colorMap: Record<string, string> = {
              amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
              sky: "text-sky-500 bg-sky-500/10 border-sky-500/20",
              rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
              emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
            };
            const cls = colorMap[card.color];
            return (
              <div key={i} className="flex flex-col p-4 rounded-xl bg-card border border-border shadow-sm hover:border-primary/20 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-tight">{card.label}</span>
                  <div className={cn("w-7 h-7 flex items-center justify-center rounded-lg border", cls)}>
                    {React.cloneElement(card.icon as React.ReactElement<{ className?: string }>, { className: "w-3.5 h-3.5" })}
                  </div>
                </div>
                <span className={cn("text-xl font-black tabular-nums tracking-tight", cls.split(" ")[0])}>
                  {currencySymbol}{card.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-50">
          <div className="flex flex-row flex-wrap items-center gap-3 relative z-50">
            {/* Type Dropdown */}
            <div className="relative w-44">
              <Select
                value={activeTab}
                onChange={(val) => setActiveTab((val || "all") as "all" | "lent" | "borrowed")}
                options={tabs.map(t => ({
                  value: t.key,
                  label: `${t.label} (${entries.filter(e => {
                    const matchesType = t.key === "all" || e.direction === t.key;
                    const matchesStatus = activeStatus === "all" ||
                      (activeStatus === "pending" && !e.is_settled) ||
                      (activeStatus === "settled" && e.is_settled);
                    return matchesType && matchesStatus;
                  }).length})`
                }))}
                placeholder="Types"
              />
            </div>

            {/* Separator for desktop */}
            <div className="hidden sm:block h-6 w-px bg-border/60 mx-1" />

            {/* Status Dropdown */}
            <div className="relative w-40">
              <Select
                value={activeStatus}
                onChange={(val) => setActiveStatus((val || "all") as "all" | "pending" | "settled")}
                options={statusFilters.map(f => ({ value: f.key, label: f.label }))}
                placeholder="Status"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 lg:mt-0">
            <Button
              variant="primary"
              onClick={() => { setEditEntry(null); setAddOpen(true); }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Entry
            </Button>
          </div>
        </div>

        {/* ── Table ── */}
        <DataTable
          data={filteredEntries}
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
                <HandCoins className="h-6 w-6 opacity-40" />
              </div>
              <p className="text-sm font-semibold mb-1">No entries found</p>
              <p className="text-xs text-center max-w-xs">Track money you lend to friends or borrow from others.</p>
              <button
                onClick={() => { setEditEntry(null); setAddOpen(true); }}
                className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add First Entry
              </button>
            </div>
          }
        />
      </div>
    </>
  );
}
