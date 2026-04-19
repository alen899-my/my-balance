"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, X, Edit3, Trash2, Eye,
  TrendingUp, Repeat, Clock, DollarSign, Calendar, StickyNote, Check,
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

interface IncomeEntry {
  _id: string;
  source: string;
  amount: number;
  frequency: string;
  received_date: string;
  note?: string;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS = [
  { value: "one-time", label: "One-time" },
  { value: "weekly",   label: "Weekly"   },
  { value: "monthly",  label: "Monthly"  },
  { value: "yearly",   label: "Yearly"   },
];

const SOURCE_SUGGESTIONS = [
  "Salary", "Freelance", "Rental Income", "Business", "Investment Returns",
  "Dividends", "Pension", "Part-time Job", "Bonus", "Side Hustle", "Gift", "Other",
];

const FREQ_COLOR: Record<string, string> = {
  "one-time": "bg-slate-500/10 text-slate-500 border-slate-500/20",
  weekly:     "bg-sky-500/10 text-sky-500 border-sky-500/20",
  monthly:    "bg-violet-500/10 text-violet-500 border-violet-500/20",
  yearly:     "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

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
  editEntry?: IncomeEntry | null;
  currencySymbol: string;
}) {
  const [source, setSource]       = useState("");
  const [amount, setAmount]       = useState("");
  const [frequency, setFrequency] = useState("one-time");
  const [date, setDate]           = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (editEntry) {
      setSource(editEntry.source);
      setAmount(String(editEntry.amount));
      setFrequency(editEntry.frequency);
      setDate(editEntry.received_date.split("T")[0]);
      setNote(editEntry.note || "");
    } else {
      setSource(""); setAmount(""); setFrequency("one-time");
      setDate(new Date().toISOString().split("T")[0]);
      setNote("");
    }
    setError(null);
  }, [editEntry, open]);

  const handleSubmit = async () => {
    if (!source.trim()) { setError("Source is required."); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount."); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        source: source.trim(),
        amount: amt,
        frequency,
        received_date: new Date(date).toISOString(),
        note: note.trim() || null,
      };

      const url = editEntry
        ? `${API_BASE_URL}/income/${editEntry._id}`
        : `${API_BASE_URL}/income/`;

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

  return (
    <Modal open={open} onClose={onClose} title={editEntry ? "Edit Income" : "Add Income"} size="md">
      <div className="flex flex-col gap-4 py-1">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <X className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        {/* Source */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Income Source</label>
          <input
            type="text"
            value={source}
            onChange={e => setSource(e.target.value)}
            placeholder="e.g. Salary, Freelance, Rental"
            list="source-suggestions"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors"
          />
          <datalist id="source-suggestions">
            {SOURCE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>

        {/* Amount + Frequency */}
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label={`Amount (${currencySymbol})`}
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Frequency</label>
            <Select
              value={frequency}
              onChange={val => setFrequency(val || "one-time")}
              options={FREQUENCY_OPTIONS}
              placeholder="Select frequency"
            />
          </div>
        </div>

        {/* Date */}
        <FormInput
          label="Received Date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Note (Optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. Q1 bonus from employer"
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
          {editEntry ? "Save Changes" : "Add Income"}
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
  entry: IncomeEntry | null;
  currencySymbol: string;
}) {
  if (!entry) return null;

  const freqCls = FREQ_COLOR[entry.frequency] || FREQ_COLOR["one-time"];

  return (
    <Modal open={open} onClose={onClose} title="Income Details" size="sm">
      <div className="flex flex-col gap-4 py-2">

        {/* Amount hero */}
        <div className="flex flex-col items-center py-5 px-4 rounded-2xl border bg-emerald-500/8 border-emerald-500/20">
          <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-1">Income Received</span>
          <span className="text-4xl font-black tabular-nums text-emerald-500">
            {currencySymbol}{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className={cn("mt-2 px-3 py-1 rounded-full text-xs font-bold border", freqCls)}>
            {FREQUENCY_OPTIONS.find(f => f.value === entry.frequency)?.label || entry.frequency}
          </span>
        </div>

        {/* Details rows */}
        <div className="flex flex-col gap-0">
          {[
            { label: "Source",        value: entry.source,  icon: <TrendingUp /> },
            { label: "Received Date", value: new Date(entry.received_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), icon: <Calendar /> },
            ...(entry.note ? [{ label: "Note", value: entry.note, icon: <StickyNote /> }] : []),
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
  entry: IncomeEntry | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!entry) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/income/${entry._id}`, {
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
    <Modal open={open} onClose={onClose} title="Delete Income Entry" size="sm">
      <div className="py-2">
        <p className="text-sm text-muted-foreground">
          Remove income from <strong className="text-foreground">{entry?.source}</strong>? This action cannot be undone.
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

export function IncomeTracker() {
  const [entries, setEntries]           = useState<IncomeEntry[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [activeFreq, setActiveFreq]     = useState("all");

  const [addOpen, setAddOpen]           = useState(false);
  const [editEntry, setEditEntry]       = useState<IncomeEntry | null>(null);
  const [viewEntry, setViewEntry]       = useState<IncomeEntry | null>(null);
  const [deleteEntry, setDeleteEntry]   = useState<IncomeEntry | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/income/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.items || []);
        setTotal(data.total || 0);
      }
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

  // ── Filters ────────────────────────────────────────────────────────────────

  const filterOptions = [
    { value: "all", label: "All Types" },
    ...FREQUENCY_OPTIONS,
  ];

  const filteredEntries = entries.filter(
    e => activeFreq === "all" || e.frequency === activeFreq
  );

  // ── Summary stats ──────────────────────────────────────────────────────────

  const monthlyTotal  = entries.filter(e => e.frequency === "monthly").reduce((s, e) => s + e.amount, 0);
  const oneTimeTotal  = entries.filter(e => e.frequency === "one-time").reduce((s, e) => s + e.amount, 0);
  const recurringTotal = entries.filter(e => e.frequency !== "one-time").reduce((s, e) => s + e.amount, 0);

  // ── Table columns ──────────────────────────────────────────────────────────

  const columns: ColumnDef<IncomeEntry>[] = [
    {
      key: "sno", header: "#", align: "center", noTruncate: true,
      cell: (_: unknown, __: IncomeEntry, idx: number) => (
        <span className="text-muted-foreground/60 font-mono text-[11px]">{idx + 1}</span>
      ),
    },
    {
      key: "source", header: "Source", noTruncate: true,
      cell: (val: unknown) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <span className="text-sm font-semibold text-foreground truncate max-w-[180px]">{String(val)}</span>
        </div>
      ),
    },
    {
      key: "frequency", header: "Frequency", noTruncate: true,
      cell: (val: unknown) => {
        const v = String(val);
        const cls = FREQ_COLOR[v] || FREQ_COLOR["one-time"];
        const label = FREQUENCY_OPTIONS.find(f => f.value === v)?.label || v;
        return (
          <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold border", cls)}>
            <Repeat className="h-3 w-3" /> {label}
          </span>
        );
      },
    },
    {
      key: "amount", header: "Amount", align: "right", noTruncate: true,
      cell: (val: unknown) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight border tabular-nums bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          {currencySymbol}{Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "received_date", header: "Received Date", noTruncate: true,
      cell: (val: unknown) => (
        <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
          {new Date(String(val)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "note", header: "Note", noTruncate: true,
      cell: (val: unknown) =>
        val ? (
          <span className="text-xs text-muted-foreground truncate max-w-[180px] block">{String(val)}</span>
        ) : (
          <span className="text-xs text-muted-foreground/40 italic">—</span>
        ),
    },
    {
      key: "actions", header: "Actions", align: "right", noTruncate: true,
      cell: (_: unknown, row: IncomeEntry) => (
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
            { label: "Total Income",      value: total,         icon: <DollarSign />,  color: "emerald" },
            { label: "Recurring (all)",   value: recurringTotal, icon: <Repeat />,      color: "violet"  },
            { label: "Monthly Income",    value: monthlyTotal,  icon: <Clock />,       color: "sky"     },
            { label: "One-time Receipts", value: oneTimeTotal,  icon: <TrendingUp />,  color: "amber"   },
          ].map((card, i) => {
            const colorMap: Record<string, string> = {
              emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
              violet:  "text-violet-500 bg-violet-500/10 border-violet-500/20",
              sky:     "text-sky-500 bg-sky-500/10 border-sky-500/20",
              amber:   "text-amber-500 bg-amber-500/10 border-amber-500/20",
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-row flex-wrap items-center gap-3">
            <div className="relative w-44">
              <Select
                value={activeFreq}
                onChange={val => setActiveFreq(val || "all")}
                options={filterOptions}
                placeholder="Filter by Frequency"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => { setEditEntry(null); setAddOpen(true); }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Income
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
                <TrendingUp className="h-6 w-6 opacity-40" />
              </div>
              <p className="text-sm font-semibold mb-1">No income entries yet</p>
              <p className="text-xs text-center max-w-xs">Track all your income sources — salary, freelance, rental and more.</p>
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
