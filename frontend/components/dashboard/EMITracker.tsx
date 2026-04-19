"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, X, Edit3, Trash2, Eye, Check,
  TrendingDown, CreditCard, Calendar, DollarSign,
  Building2, Percent, Clock, ChevronRight, Bell, BellOff,
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

interface EMIEntry {
  _id: string;
  name: string;
  category: string;
  bank_name?: string;
  note?: string;
  is_active: boolean;
  start_date: string;
  completion_date?: string;

  // Loan inputs
  principal: number;
  annual_interest_rate: number;
  tenure_months: number;

  // Reminder / notification
  payment_day: number;
  custom_monthly_amount?: number | null;  // user-set override; null = use formula
  notify: boolean;
  notify_days_before: number;
  reminder_sent_today: boolean;
  last_notified_date?: string | null;

  // Computed
  monthly_emi: number;
  total_payable: number;
  total_interest: number;

  // Progress
  months_completed: number;
  months_remaining: number;
  amount_paid: number;
  outstanding_balance: number;
  remaining_principal: number;
  progress_pct: number;

  // Current month split
  current_month_interest: number;
  current_month_principal: number;

  // Payment schedule
  next_payment_date?: string | null;
  days_until_payment?: number | null;

  // Legacy (kept for compatibility)
  next_due_date?: string;
  created_at: string;
}


// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: "Home Loan",       label: "Home Loan"       },
  { value: "Car Loan",        label: "Car Loan"        },
  { value: "Personal Loan",   label: "Personal Loan"   },
  { value: "Education Loan",  label: "Education Loan"  },
  { value: "Business Loan",   label: "Business Loan"   },
  { value: "Gold Loan",       label: "Gold Loan"       },
  { value: "Two Wheeler",     label: "Two Wheeler"     },
  { value: "Other",           label: "Other"           },
];

const NOTIFY_DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7].map((d) => ({
  value: String(d),
  label: `${d} day${d > 1 ? "s" : ""} before`,
}));

const fmt = (n: number, sym: string) =>
  `${sym}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

function EntryModal({
  open, onClose, onSuccess, editEntry, currencySymbol,
}: {
  open: boolean; onClose: () => void; onSuccess: () => void;
  editEntry?: EMIEntry | null; currencySymbol: string;
}) {
  const [name, setName]                     = useState("");
  const [category, setCategory]             = useState("Personal Loan");
  const [bankName, setBankName]             = useState("");
  const [principal, setPrincipal]           = useState("");
  const [rate, setRate]                     = useState("");
  const [startDate, setStartDate]           = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate]               = useState("");
  const [isActive, setIsActive]             = useState(true);
  const [note, setNote]                     = useState("");
  const [paymentDay, setPaymentDay]                 = useState("1");
  const [customAmount, setCustomAmount]             = useState("");
  const [notify, setNotify]                         = useState(false);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState("3");
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  // Helper: calculate tenure from dates
  const calculateMonths = useCallback((startStr: string, endStr: string) => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end   = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months += end.getMonth() - start.getMonth();
    return Math.max(0, months);
  }, []);

  const tenureMonths = calculateMonths(startDate, endDate);

  // Live EMI preview — custom amount takes priority
  const previewEMI = (() => {
    if (customAmount && parseFloat(customAmount) > 0) return parseFloat(customAmount);
    const p = parseFloat(principal);
    const r = parseFloat(rate);
    const n = tenureMonths;
    if (!p || !r || !n || n <= 0) return null;
    const mr = r / 12 / 100;
    return Math.round(p * mr * Math.pow(1 + mr, n) / (Math.pow(1 + mr, n) - 1) * 100) / 100;
  })();

  useEffect(() => {
    if (editEntry) {
      setName(editEntry.name);
      setCategory(editEntry.category);
      setBankName(editEntry.bank_name || "");
      setPrincipal(String(editEntry.principal));
      setRate(String(editEntry.annual_interest_rate));
      setStartDate(editEntry.start_date);
      const start = new Date(editEntry.start_date);
      const end   = new Date(start.setMonth(start.getMonth() + editEntry.tenure_months));
      setEndDate(end.toISOString().split("T")[0]);
      setIsActive(editEntry.is_active);
      setNote(editEntry.note || "");
      setPaymentDay(String(editEntry.payment_day ?? 1));
      setCustomAmount(editEntry.custom_monthly_amount ? String(editEntry.custom_monthly_amount) : "");
      setNotify(editEntry.notify ?? false);
      setNotifyDaysBefore(String(editEntry.notify_days_before ?? 3));
    } else {
      setName(""); setCategory("Personal Loan"); setBankName("");
      setPrincipal(""); setRate("");
      const now = new Date();
      setStartDate(now.toISOString().split("T")[0]);
      const nextYear = new Date(now.setFullYear(now.getFullYear() + 1));
      setEndDate(nextYear.toISOString().split("T")[0]);
      setIsActive(true); setNote("");
      setPaymentDay("1"); setCustomAmount(""); setNotify(false); setNotifyDaysBefore("3");
    }
    setError(null);
  }, [editEntry, open]);

  const handleSubmit = async () => {
    if (!name.trim())                          { setError("EMI name is required.");          return; }
    if (!principal || parseFloat(principal) <= 0) { setError("Enter a valid loan amount."); return; }
    if (!rate || parseFloat(rate) < 0)         { setError("Enter a valid interest rate.");  return; }
    if (tenureMonths <= 0)                     { setError("End date must be after Start date."); return; }
    const day = parseInt(paymentDay);
    if (!day || day < 1 || day > 28)           { setError("Payment day must be between 1 and 28."); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name:                 name.trim(),
        category,
        bank_name:            bankName.trim() || null,
        principal:            parseFloat(principal),
        annual_interest_rate: parseFloat(rate),
        tenure_months:        tenureMonths,
        start_date:           startDate,
        payment_day:          day,
        custom_monthly_amount: customAmount && parseFloat(customAmount) > 0 ? parseFloat(customAmount) : null,
        notify,
        notify_days_before:   parseInt(notifyDaysBefore),
        is_active:            isActive,
        note:                 note.trim() || null,
      };

      const url = editEntry
        ? `${API_BASE_URL}/emi/${editEntry._id}`
        : `${API_BASE_URL}/emi/`;

      const res = await fetch(url, {
        method: editEntry ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Failed to save."); }
      onSuccess(); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={editEntry ? "Edit EMI" : "Add EMI Loan"} size="lg">
      <div className="flex flex-col gap-4 py-1">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <X className="h-3.5 w-3.5 shrink-0" />{error}
          </div>
        )}

        {/* ── Row 1: Name + Loan Type ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormInput label="Loan / EMI Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. HDFC Home Loan" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Loan Type</label>
            <Select value={category} onChange={v => setCategory(v || "Personal Loan")} options={CATEGORY_OPTIONS} placeholder="Category" />
          </div>
        </div>

        {/* ── Row 2: Bank + Principal ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormInput label="Bank / Lender" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC, SBI" />
          <FormInput label={`Loan Amount (${currencySymbol})`} type="number" value={principal} onChange={e => setPrincipal(e.target.value)} placeholder="e.g. 500000" />
        </div>

        {/* ── Row 3: Interest Rate + Custom Monthly Amount ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormInput label="Annual Interest Rate (%)" type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. 8.5" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Custom Monthly Amount <span className="font-normal normal-case">(optional override)</span>
            </label>
            <input
              type="number"
              min={0}
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              placeholder={`Leave blank to use calculated EMI`}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <span className="text-[10px] text-muted-foreground">Set your actual bank deduction if it differs from the formula</span>
          </div>
        </div>

        {/* ── Row 4: Payment Day ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Payment Day of Month
            </label>
            <input
              type="number"
              min={1}
              max={28}
              value={paymentDay}
              onChange={e => setPaymentDay(e.target.value)}
              placeholder="1 – 28"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <span className="text-[10px] text-muted-foreground">EMI deducted on this day each month (max 28)</span>
          </div>
          <div />
        </div>

        {/* ── Row 4: Start Date + End Date ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">First EMI Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Loan End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* ── Tenure Display ── */}
        {tenureMonths > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground">
              Calculated Tenure:{" "}
              {Math.floor(tenureMonths / 12) > 0 ? `${Math.floor(tenureMonths / 12)} yr(s) ` : ""}
              {tenureMonths % 12 > 0 ? `${tenureMonths % 12} mo` : ""} ({tenureMonths} total months)
            </span>
          </div>
        )}

        {/* ── Live EMI Preview ── */}
        {previewEMI && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {customAmount && parseFloat(customAmount) > 0 ? "Monthly EMI (Custom)" : "Monthly EMI (Calculated)"}
              </span>
              <span className="text-xl font-black text-primary tabular-nums">
                {currencySymbol}{previewEMI.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Payable</span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {currencySymbol}{(previewEMI * tenureMonths).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}

        {/* ── Row 5: Notify Toggle + Days Before ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Notify toggle */}
          <button
            type="button"
            onClick={() => setNotify(v => !v)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold text-left",
              notify
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0",
              notify ? "border-primary bg-primary text-white" : "border-border"
            )}>
              {notify && <Check className="w-3 h-3" />}
            </div>
            <div className="flex flex-col">
              <span>{notify ? "Reminders enabled" : "Reminders disabled"}</span>
              <span className="text-[10px] font-normal text-muted-foreground mt-0.5">
                {notify ? "You'll receive an email before payment" : "Enable to get email alerts"}
              </span>
            </div>
            {notify ? <Bell className="w-4 h-4 ml-auto shrink-0" /> : <BellOff className="w-4 h-4 ml-auto shrink-0 opacity-40" />}
          </button>

          {/* Days before select */}
          <div className={cn("flex flex-col gap-1.5 transition-opacity", !notify && "opacity-40 pointer-events-none")}>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Notify Days Before
            </label>
            <Select
              value={notifyDaysBefore}
              onChange={v => setNotifyDaysBefore(v || "3")}
              options={NOTIFY_DAYS_OPTIONS}
              placeholder="Select days"
            />
            <span className="text-[10px] text-muted-foreground">Email reminder X days before payment day</span>
          </div>
        </div>

        {/* ── Row 6: Active Toggle + Note ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Active toggle */}
          <button
            type="button"
            onClick={() => setIsActive(v => !v)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold",
              isActive
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-border text-muted-foreground"
            )}
          >
            <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center",
              isActive ? "border-emerald-500 bg-emerald-500 text-white" : "border-border")}>
              {isActive && <Check className="w-3 h-3" />}
            </div>
            {isActive ? "Active loan" : "Closed / paid off"}
          </button>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Note (Optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Linked to account ending 4321"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
            />
          </div>
        </div>
      </div>

      <ModalFooterActions className="mt-4">
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} loading={loading} leftIcon={!loading ? <Check className="h-4 w-4" /> : undefined}>
          {editEntry ? "Save Changes" : "Add EMI"}
        </Button>
      </ModalFooterActions>
    </Modal>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────

function ViewModal({
  open, onClose, entry, currencySymbol,
}: {
  open: boolean; onClose: () => void; entry: EMIEntry | null; currencySymbol: string;
}) {
  if (!entry) return null;
  const pct = entry.progress_pct;

  return (
    <Modal open={open} onClose={onClose} title="EMI Details" size="md">
      <div className="flex flex-col gap-4 py-1">

        {/* Header card */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{entry.category}</p>
              <h3 className="text-lg font-black text-foreground">{entry.name}</h3>
              {entry.bank_name && <p className="text-xs text-muted-foreground font-medium">{entry.bank_name}</p>}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-bold border",
                entry.is_active
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-muted/60 text-muted-foreground border-border"
              )}>
                {entry.is_active ? "Active" : "Closed"}
              </span>
              {entry.notify && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  <Bell className="w-2.5 h-2.5" /> Reminders on
                </span>
              )}
            </div>
          </div>

          {/* Monthly EMI hero */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                {entry.custom_monthly_amount ? "Monthly EMI (Custom)" : "Monthly EMI"}
              </p>
              <p className="text-3xl font-black text-primary tabular-nums">{fmt(entry.monthly_emi, currencySymbol)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Next Payment</p>
              <p className="text-sm font-bold text-foreground">
                {entry.next_payment_date
                  ? new Date(entry.next_payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                  : "—"}
              </p>
              {entry.days_until_payment != null && (
                <p className={cn("text-[10px] font-bold",
                  entry.days_until_payment <= 3 ? "text-destructive" :
                  entry.days_until_payment <= 7 ? "text-amber-500" : "text-muted-foreground"
                )}>
                  {entry.days_until_payment === 0 ? "Due today" : `${entry.days_until_payment}d left`}
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">
                {entry.months_completed} of {entry.tenure_months} months paid
              </span>
              <span className="text-[11px] font-black text-primary">{pct}%</span>
            </div>
            <ProgressBar pct={pct} />
          </div>
        </div>

        {/* Financial breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Loan Amount",   value: fmt(entry.principal,          currencySymbol), color: "text-foreground"   },
            { label: "Total Payable", value: fmt(entry.total_payable,      currencySymbol), color: "text-foreground"   },
            { label: "Total Interest",value: fmt(entry.total_interest,     currencySymbol), color: "text-amber-500"    },
            { label: "Amount Paid",   value: fmt(entry.amount_paid,        currencySymbol), color: "text-emerald-500"  },
            { label: "Outstanding",   value: fmt(entry.outstanding_balance,currencySymbol), color: "text-destructive"  },
            { label: "Interest Rate", value: `${entry.annual_interest_rate}% p.a.`,         color: "text-foreground"   },
          ].map((item, i) => (
            <div key={i} className="flex flex-col gap-0.5 p-3 rounded-xl border border-border bg-muted/20">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</span>
              <span className={cn("text-sm font-black tabular-nums", item.color)}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Notification settings */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl border",
          entry.notify
            ? "border-primary/20 bg-primary/5"
            : "border-border bg-muted/20"
        )}>
          {entry.notify
            ? <Bell className="w-4 h-4 text-primary shrink-0" />
            : <BellOff className="w-4 h-4 text-muted-foreground shrink-0" />}
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">
              {entry.notify
                ? `Reminder: ${entry.notify_days_before} day${entry.notify_days_before > 1 ? "s" : ""} before payment`
                : "Reminders disabled"}
            </span>
            {entry.reminder_sent_today && (
              <span className="text-[10px] text-primary font-semibold">✓ Reminder sent today</span>
            )}
          </div>
          <div className="ml-auto text-right">
            <p className="text-[9px] font-bold uppercase text-muted-foreground">Payment Day</p>
            <p className="text-sm font-black text-foreground">{entry.payment_day}</p>
          </div>
        </div>

        {/* Current month split */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">This Month&apos;s EMI Breakdown</span>
          </div>
          <div className="flex divide-x divide-border">
            <div className="flex-1 flex flex-col items-center py-3 gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Principal</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {fmt(entry.current_month_principal, currencySymbol)}
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center py-3 gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Interest</span>
              <span className="text-base font-black text-amber-500 tabular-nums">
                {fmt(entry.current_month_interest, currencySymbol)}
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center py-3 gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Total EMI</span>
              <span className="text-base font-black text-primary tabular-nums">
                {fmt(entry.monthly_emi, currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Loan timeline */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-xl px-4 py-3">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>Started <strong className="text-foreground">{new Date(entry.start_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</strong></span>
          <ChevronRight className="h-3 w-3" />
          <span>Ends <strong className="text-foreground">{entry.completion_date ? new Date(entry.completion_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}</strong></span>
          <span className="ml-auto font-bold text-muted-foreground">{entry.months_remaining}mo left</span>
        </div>

        {entry.note && (
          <p className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3 italic">{entry.note}</p>
        )}
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
  open: boolean; entry: EMIEntry | null; onClose: () => void; onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    if (!entry) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/emi/${entry._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      onSuccess(); onClose();
    } finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Delete EMI" size="sm">
      <div className="py-2">
        <p className="text-sm text-muted-foreground">
          Remove loan <strong className="text-foreground">{entry?.name}</strong>? All data will be permanently deleted.
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

export function EMITracker() {
  const [entries, setEntries]                   = useState<EMIEntry[]>([]);
  const [monthlyBurden, setMonthlyBurden]       = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [activeCount, setActiveCount]           = useState(0);
  const [loading, setLoading]                   = useState(true);
  const [currencySymbol, setCurrencySymbol]     = useState("₹");
  const [filterStatus, setFilterStatus]         = useState("all");

  const [addOpen, setAddOpen]         = useState(false);
  const [editEntry, setEditEntry]     = useState<EMIEntry | null>(null);
  const [viewEntry, setViewEntry]     = useState<EMIEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<EMIEntry | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_BASE_URL}/emi/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.items || []);
        setMonthlyBurden(data.total_monthly_burden || 0);
        setTotalOutstanding(data.total_outstanding || 0);
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
    { value: "all",    label: "All Loans" },
    { value: "active", label: "Active"    },
    { value: "closed", label: "Closed"    },
  ];

  const filtered = entries.filter(e => {
    if (filterStatus === "active") return e.is_active;
    if (filterStatus === "closed") return !e.is_active;
    return true;
  });

  const totalInterestBurden = entries.reduce((s, e) => s + (e.is_active ? e.total_interest : 0), 0);

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns: ColumnDef<EMIEntry>[] = [
    {
      key: "sno", header: "#", align: "center", noTruncate: true,
      cell: (_: unknown, __: EMIEntry, idx: number) => (
        <span className="text-muted-foreground/60 font-mono text-[11px]">{idx + 1}</span>
      ),
    },
    {
      key: "name", header: "Loan", noTruncate: true,
      cell: (val: unknown, row: EMIEntry) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-foreground truncate max-w-[160px]">{String(val)}</span>
            <span className="text-[10px] text-muted-foreground font-medium">
              {row.category}{row.bank_name ? ` · ${row.bank_name}` : ""}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "monthly_emi", header: "Monthly EMI", noTruncate: true,
      cell: (val: unknown) => (
        <span className="text-sm font-black text-primary tabular-nums">
          {fmt(Number(val), currencySymbol)}
        </span>
      ),
    },
    {
      key: "outstanding_balance", header: "Outstanding", noTruncate: true,
      cell: (val: unknown) => (
        <span className="text-sm font-bold text-destructive tabular-nums">
          {fmt(Number(val), currencySymbol)}
        </span>
      ),
    },
    {
      key: "progress_pct", header: "Progress", noTruncate: true,
      cell: (val: unknown, row: EMIEntry) => (
        <div className="flex flex-col gap-1 min-w-[90px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{row.months_completed}/{row.tenure_months} mo</span>
            <span className="text-[10px] font-bold text-primary">{Number(val)}%</span>
          </div>
          <ProgressBar pct={Number(val)} />
        </div>
      ),
    },
    {
      // ── Replacing "Next Due" with "Next Payment" using next_payment_date + days_until_payment
      key: "next_payment_date", header: "Next Payment", noTruncate: true,
      cell: (val: unknown, row: EMIEntry) => {
        if (!val || !row.is_active)
          return <span className="text-muted-foreground text-xs">—</span>;
        const d    = new Date(String(val));
        const diff = row.days_until_payment ?? null;
        const urgency =
          diff === null ? "text-muted-foreground" :
          diff <= 3     ? "text-destructive" :
          diff <= 7     ? "text-amber-500"   : "text-muted-foreground";
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-foreground whitespace-nowrap">
              {d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
            <span className={cn("text-[10px] font-bold", urgency)}>
              {diff === null ? "" : diff <= 0 ? "Due today" : `${diff}d left`}
            </span>
          </div>
        );
      },
    },
    {
      // ── Reminder column: shows "Sent Today" badge or days-window info
      key: "reminder_sent_today", header: "Reminder", noTruncate: true,
      cell: (val: unknown, row: EMIEntry) => {
        if (!row.notify) {
          return (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <BellOff className="w-3 h-3" /> Off
            </span>
          );
        }
        if (val as boolean) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
              <Bell className="w-2.5 h-2.5" /> Sent Today
            </span>
          );
        }
        // show days-window info when notify is on but not sent today
        const df = row.days_until_payment;
        const inWindow = df != null && df <= row.notify_days_before && df > 0;
        return (
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-semibold",
            inWindow ? "text-amber-500" : "text-muted-foreground"
          )}>
            <Bell className="w-3 h-3" />
            {inWindow ? `In ${df}d window` : `${row.notify_days_before}d before`}
          </span>
        );
      },
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
            {active ? "Active" : "Closed"}
          </span>
        );
      },
    },
    {
      key: "actions", header: "Actions", align: "right", noTruncate: true,
      cell: (_: unknown, row: EMIEntry) => (
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
            { label: "Monthly Burden",    value: fmt(monthlyBurden,       currencySymbol), icon: <DollarSign />,   color: "primary"     },
            { label: "Total Outstanding", value: fmt(totalOutstanding,    currencySymbol), icon: <TrendingDown />, color: "destructive" },
            { label: "Active Loans",      value: String(activeCount),                      icon: <CreditCard />,   color: "emerald"     },
            { label: "Total Interest",    value: fmt(totalInterestBurden, currencySymbol), icon: <Percent />,      color: "amber"       },
          ].map((card, i) => {
            const colorMap: Record<string, string> = {
              primary:     "text-primary bg-primary/10 border-primary/20",
              destructive: "text-destructive bg-destructive/10 border-destructive/20",
              emerald:     "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
              amber:       "text-amber-500 bg-amber-500/10 border-amber-500/20",
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
                <span className={cn("text-xl font-black tabular-nums tracking-tight truncate", cls.split(" ")[0])}>
                  {card.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-44">
            <Select value={filterStatus} onChange={v => setFilterStatus(v || "all")} options={filterOptions} placeholder="Filter" />
          </div>
          <Button
            variant="primary"
            onClick={() => { setEditEntry(null); setAddOpen(true); }}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add EMI Loan
          </Button>
        </div>

        {/* ── Table ── */}
        <DataTable
          data={filtered}
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
                <CreditCard className="h-6 w-6 opacity-40" />
              </div>
              <p className="text-sm font-semibold mb-1">No EMI loans tracked yet</p>
              <p className="text-xs text-center max-w-xs">Add your home loan, car loan, or any EMI to track monthly payments, outstanding balance, and progress.</p>
              <button
                onClick={() => { setEditEntry(null); setAddOpen(true); }}
                className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add First Loan
              </button>
            </div>
          }
        />
      </div>
    </>
  );
}
