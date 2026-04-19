"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, X, Edit3, Trash2, Eye,
  Bell, BellOff, Check, Repeat, Calendar,
  Zap, Tv, Utensils, Newspaper, Car, Wifi, Music,
  ShoppingBag, MoreHorizontal,
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

interface SubscriptionEntry {
  _id: string;
  name: string;
  amount: number;
  billing_day: number;
  category: string;
  is_active: boolean;
  notify: boolean;
  notify_days_before: number;
  note?: string;
  next_billing_date?: string;
  days_until_billing?: number;
  reminder_sent_today: boolean;
  last_notified_date?: string;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: "Streaming",  label: "Streaming"  },
  { value: "Music",      label: "Music"      },
  { value: "Food",       label: "Food & Grocery" },
  { value: "Newspaper",  label: "Newspaper"  },
  { value: "Utilities",  label: "Utilities"  },
  { value: "Transport",  label: "Transport"  },
  { value: "Internet",   label: "Internet"   },
  { value: "Software",   label: "Software"   },
  { value: "Shopping",   label: "Shopping"   },
  { value: "Other",      label: "Other"      },
];

const NOTIFY_DAYS_OPTIONS = [
  { value: "1", label: "1 day before"  },
  { value: "2", label: "2 days before" },
  { value: "3", label: "3 days before" },
  { value: "5", label: "5 days before" },
  { value: "7", label: "7 days before" },
];

const BILLING_DAYS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: `Day ${i + 1}`,
}));

const CategoryIcon = ({ category }: { category: string }) => {
  const cls = "w-3.5 h-3.5";
  switch (category) {
    case "Streaming":  return <Tv className={cls} />;
    case "Music":      return <Music className={cls} />;
    case "Food":       return <Utensils className={cls} />;
    case "Newspaper":  return <Newspaper className={cls} />;
    case "Utilities":  return <Zap className={cls} />;
    case "Transport":  return <Car className={cls} />;
    case "Internet":   return <Wifi className={cls} />;
    case "Shopping":   return <ShoppingBag className={cls} />;
    default:           return <MoreHorizontal className={cls} />;
  }
};

const getDueBadge = (days?: number) => {
  if (days === undefined || days === null) return null;
  if (days === 0) return { label: "Due today!", cls: "bg-destructive/10 text-destructive border-destructive/20" };
  if (days <= 3)  return { label: `${days}d left`, cls: "bg-rose-500/10 text-rose-500 border-rose-500/20" };
  if (days <= 7)  return { label: `${days}d left`, cls: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
  return { label: `${days}d left`, cls: "bg-muted text-muted-foreground border-border" };
};

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

function EntryModal({
  open, onClose, onSuccess, editEntry, currencySymbol,
}: {
  open: boolean; onClose: () => void; onSuccess: () => void;
  editEntry?: SubscriptionEntry | null; currencySymbol: string;
}) {
  const [name, setName]           = useState("");
  const [amount, setAmount]       = useState("");
  const [billingDay, setBillingDay] = useState("1");
  const [category, setCategory]   = useState("Other");
  const [isActive, setIsActive]   = useState(true);
  const [notify, setNotify]       = useState(false);
  const [notifyDays, setNotifyDays] = useState("3");
  const [note, setNote]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (editEntry) {
      setName(editEntry.name);
      setAmount(String(editEntry.amount));
      setBillingDay(String(editEntry.billing_day));
      setCategory(editEntry.category);
      setIsActive(editEntry.is_active);
      setNotify(editEntry.notify);
      setNotifyDays(String(editEntry.notify_days_before));
      setNote(editEntry.note || "");
    } else {
      setName(""); setAmount(""); setBillingDay("1"); setCategory("Other");
      setIsActive(true); setNotify(false); setNotifyDays("3"); setNote("");
    }
    setError(null);
  }, [editEntry, open]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Subscription name is required."); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount."); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: name.trim(),
        amount: amt,
        billing_day: parseInt(billingDay),
        category,
        is_active: isActive,
        notify,
        notify_days_before: parseInt(notifyDays),
        note: note.trim() || null,
      };

      const url = editEntry
        ? `${API_BASE_URL}/my-subscriptions/${editEntry._id}`
        : `${API_BASE_URL}/my-subscriptions/`;

      const res = await fetch(url, {
        method: editEntry ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Failed to save.");
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
    <Modal open={open} onClose={onClose} title={editEntry ? "Edit Subscription" : "Add Subscription"} size="md">
      <div className="flex flex-col gap-4 py-1">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <X className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        {/* Name */}
        <FormInput label="Subscription Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Netflix, Milk, Times" />

        {/* Amount */}
        <FormInput label={`Amount (${currencySymbol})`} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />

        {/* Category + Billing Day (2 columns) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
            <Select value={category} onChange={val => setCategory(val || "Other")} options={CATEGORY_OPTIONS} placeholder="Category" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Billing Day</label>
            <Select value={billingDay} onChange={val => setBillingDay(val || "1")} options={BILLING_DAYS} placeholder="Day" />
          </div>
        </div>

        {/* Active toggle */}
        <button
          type="button"
          onClick={() => setIsActive(v => !v)}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold",
            isActive
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-border text-muted-foreground hover:border-border/60"
          )}
        >
          <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
            isActive ? "border-emerald-500 bg-emerald-500 text-white" : "border-border")}>
            {isActive && <Check className="w-3 h-3" />}
          </div>
          {isActive ? "Active subscription" : "Inactive / paused"}
        </button>

        {/* Notify toggle */}
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-muted/20">
          <button
            type="button"
            onClick={() => setNotify(v => !v)}
            className={cn(
              "flex items-center gap-3 text-sm font-semibold transition-colors",
              notify ? "text-primary dark:text-primary" : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "w-9 h-5 rounded-full transition-all relative flex items-center px-0.5",
              notify ? "bg-primary" : "bg-border"
            )}>
              <div className={cn(
                "w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                notify ? "translate-x-4" : "translate-x-0"
              )} />
            </div>
            {notify ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            {notify ? "Email reminders enabled" : "Enable email reminders"}
          </button>

          {notify && (
            <div className="flex flex-col gap-1.5 pt-1 border-t border-border/40 mt-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notify me</label>
              <Select
                value={notifyDays}
                onChange={val => setNotifyDays(val || "3")}
                options={NOTIFY_DAYS_OPTIONS}
                placeholder="Select timing"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">
                A reminder email will be sent to your registered email address.
              </p>
            </div>
          )}
        </div>

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Note (Optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. Family plan — shared with 3 members"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
          />
        </div>
      </div>

      <ModalFooterActions className="mt-4">
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} loading={loading} leftIcon={!loading ? <Check className="h-4 w-4" /> : undefined}>
          {editEntry ? "Save Changes" : "Add Subscription"}
        </Button>
      </ModalFooterActions>
    </Modal>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────

function ViewModal({
  open, onClose, entry, currencySymbol,
}: {
  open: boolean; onClose: () => void; entry: SubscriptionEntry | null; currencySymbol: string;
}) {
  if (!entry) return null;
  const badge = getDueBadge(entry.days_until_billing);

  return (
    <Modal open={open} onClose={onClose} title="Subscription Details" size="sm">
      <div className="flex flex-col gap-4 py-2">
        {/* Hero */}
        <div className="flex flex-col items-center py-5 px-4 rounded-2xl border bg-emerald-500/8 border-emerald-500/20">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-2">
            <CategoryIcon category={entry.category} />
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-1">{entry.category}</span>
          <span className="text-4xl font-black tabular-nums text-emerald-500">
            {currencySymbol}{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          {badge && (
            <span className={cn("mt-2 px-3 py-1 rounded-full text-xs font-bold border", badge.cls)}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-0">
          {[
            { label: "Name",         value: entry.name },
            { label: "Billing Day",  value: `Day ${entry.billing_day} of every month` },
            { label: "Next Billing", value: entry.next_billing_date ? new Date(entry.next_billing_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—" },
            { label: "Status",       value: entry.is_active ? "Active" : "Inactive" },
            { label: "Reminders",    value: entry.notify ? `${entry.notify_days_before} day(s) before via email` : "Disabled" },
            ...(entry.note ? [{ label: "Note", value: entry.note }] : []),
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2.5 border-b border-border/50 last:border-0">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">{row.label}</span>
              <span className="text-sm font-medium text-foreground text-right">{row.value}</span>
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
  open, entry, onClose, onSuccess,
}: {
  open: boolean; entry: SubscriptionEntry | null; onClose: () => void; onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    if (!entry) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/my-subscriptions/${entry._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      onSuccess(); onClose();
    } finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Delete Subscription" size="sm">
      <div className="py-2">
        <p className="text-sm text-muted-foreground">
          Remove <strong className="text-foreground">{entry?.name}</strong>? This action cannot be undone.
        </p>
      </div>
      <ModalFooterActions>
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="destructive" onClick={handleDelete} loading={loading} leftIcon={<Trash2 className="h-4 w-4" />}>Delete</Button>
      </ModalFooterActions>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SubscriptionTracker() {
  const [entries, setEntries]         = useState<SubscriptionEntry[]>([]);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [activeFilter, setActiveFilter] = useState("all");
  const [addOpen, setAddOpen]         = useState(false);
  const [editEntry, setEditEntry]     = useState<SubscriptionEntry | null>(null);
  const [viewEntry, setViewEntry]     = useState<SubscriptionEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<SubscriptionEntry | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/my-subscriptions/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.items || []);
        setTotalMonthly(data.total_monthly || 0);
        setActiveCount(data.active_count || 0);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const pref = localStorage.getItem("preferred_currency");
    if (pref) setCurrencySymbol(getSymbolFromCurrency(pref) || "₹");
    fetchData();
  }, [fetchData]);

  const filterOptions = [
    { value: "all",      label: "All"      },
    { value: "active",   label: "Active"   },
    { value: "inactive", label: "Inactive" },
  ];

  const filteredEntries = entries.filter(e => {
    if (activeFilter === "active")   return e.is_active;
    if (activeFilter === "inactive") return !e.is_active;
    return true;
  });

  // ── Derived stats
  const upcomingThisWeek = entries.filter(e => e.is_active && (e.days_until_billing ?? 99) <= 7).length;
  const notifyCount      = entries.filter(e => e.notify).length;

  // ── Columns
  const columns: ColumnDef<SubscriptionEntry>[] = [
    {
      key: "sno", header: "#", align: "center", noTruncate: true,
      cell: (_: unknown, __: SubscriptionEntry, idx: number) => (
        <span className="text-muted-foreground/60 font-mono text-[11px]">{idx + 1}</span>
      ),
    },
    {
      key: "name", header: "Subscription", noTruncate: true,
      cell: (val: unknown, row: SubscriptionEntry) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
            <CategoryIcon category={row.category} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-foreground truncate max-w-[150px]">{String(val)}</span>
            <span className="text-[10px] text-muted-foreground font-medium">{row.category}</span>
          </div>
        </div>
      ),
    },
    {
      key: "amount", header: "Amount", align: "right", noTruncate: true,
      cell: (val: unknown) => (
        <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
          {currencySymbol}{Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "is_active", header: "Status", noTruncate: true,
      cell: (val: unknown) => {
        const active = val as boolean;
        return (
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border",
            active
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-muted/60 text-muted-foreground border-border"
          )}>
            {active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {active ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      key: "next_billing_date", header: "Next Billing", noTruncate: true,
      cell: (_: unknown, row: SubscriptionEntry) => {
        const badge = getDueBadge(row.days_until_billing);
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-foreground whitespace-nowrap">
              {row.next_billing_date
                ? new Date(row.next_billing_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : "—"}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">Day {row.billing_day} monthly</span>
            {badge && (
              <span className={cn("inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded border w-fit mt-0.5", badge.cls)}>
                {badge.label}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "reminder_sent_today", header: "Reminder", noTruncate: true,
      cell: (val: unknown, row: SubscriptionEntry) => {
        const sent = val as boolean;
        if (!row.notify) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border bg-muted/40 text-muted-foreground/50 border-border">
              <BellOff className="h-3 w-3" /> Off
            </span>
          );
        }
        if (sent) {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 w-fit">
                <Check className="h-3 w-3" /> Sent Today
              </span>
              {row.last_notified_date && (
                <span className="text-[10px] text-muted-foreground font-medium pl-0.5">
                  {new Date(row.last_notified_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border bg-amber-500/10 text-amber-500 border-amber-500/20">
            <Bell className="h-3 w-3" /> {row.notify_days_before}d window
          </span>
        );
      },
    },
    {
      key: "actions", header: "Actions", align: "right", noTruncate: true,
      cell: (_: unknown, row: SubscriptionEntry) => (
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
            { label: "Monthly Spend",     value: `${currencySymbol}${totalMonthly.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <Repeat />,  color: "emerald" },
            { label: "Active Plans",      value: String(activeCount),                                                                          icon: <Check />,   color: "primary"},
            { label: "Due This Week",     value: String(upcomingThisWeek),                                                                     icon: <Calendar />, color: "amber" },
            { label: "With Reminders",    value: String(notifyCount),                                                                          icon: <Bell />,    color: "sky"   },
          ].map((card, i) => {
            const colorMap: Record<string, string> = {
              primary: "text-primary bg-primary/10 border-primary/20",
              emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
              amber:   "text-amber-500 bg-amber-500/10 border-amber-500/20",
              sky:     "text-sky-500 bg-sky-500/10 border-sky-500/20",
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
                  {card.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-row flex-wrap items-center gap-3">
            <div className="relative w-40">
              <Select
                value={activeFilter}
                onChange={val => setActiveFilter(val || "all")}
                options={filterOptions}
                placeholder="Filter"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => { setEditEntry(null); setAddOpen(true); }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Subscription
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
                <Repeat className="h-6 w-6 opacity-40" />
              </div>
              <p className="text-sm font-semibold mb-1">No subscriptions yet</p>
              <p className="text-xs text-center max-w-xs">Track Netflix, milk, newspaper or any recurring expense and never miss a billing date.</p>
              <button
                onClick={() => { setEditEntry(null); setAddOpen(true); }}
                className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add First Subscription
              </button>
            </div>
          }
        />
      </div>
    </>
  );
}
