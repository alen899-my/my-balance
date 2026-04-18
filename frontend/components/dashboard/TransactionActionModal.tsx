"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalFooterActions } from "@/components/common/Modal";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/Forminput";
import { Check, Trash2, Edit3, Eye, Calendar, IndianRupee, Building } from "lucide-react";

export interface Transaction {
  _id: string;
  date: string;
  description: string;
  payee: string;
  amount: number;
  type: string;
  bank: string;
  balance?: number;
}

interface TransactionActionModalProps {
  open: boolean;
  mode: "view" | "edit" | "delete" | null;
  transaction: Transaction | null;
  currencySymbol: string;
  onClose: () => void;
  onSuccess: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export function TransactionActionModal({ open, mode, transaction, currencySymbol, onClose, onSuccess }: TransactionActionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [description, setDescription] = useState("");
  const [payee, setPayee] = useState("");
  const [bank, setBank] = useState("");

  useEffect(() => {
    if (transaction && mode === "edit") {
      setDescription(transaction.description || "");
      setPayee(transaction.payee || "");
      setBank(transaction.bank || "");
    }
    setError(null);
  }, [transaction, mode, open]);

  if (!open || !transaction || !mode) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/transactions/${transaction._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete transaction.");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      const payload = {
        description,
        payee,
        bank
      };

      const res = await fetch(`${API_BASE_URL}/transactions/${transaction._id}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to update transaction.");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "view") {
    return (
      <Modal open={open} onClose={onClose} title="Transaction Details" size="sm">
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col items-center justify-center py-4 px-2 border border-border rounded-xl bg-card shadow-sm">
             <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Amount</span>
             <span className={`text-3xl font-bold ${transaction.amount < 0 ? "text-destructive" : "text-emerald-500"}`}>
               {transaction.amount < 0 ? "-" : "+"}{currencySymbol}{Math.abs(transaction.amount).toFixed(2)}
             </span>
             <span className="text-xs font-medium text-muted-foreground mt-2 px-2 py-1 bg-muted/50 rounded-full">
               {transaction.type}
             </span>
          </div>

          <div className="flex flex-col gap-3 mt-2">
             <DetailRow icon={<Calendar />} label="Date" value={transaction.date} />
             <DetailRow icon={<Building />} label="Bank" value={transaction.bank} />
             <DetailRow icon={<IndianRupee />} label="Payee" value={transaction.payee} />
             
             <div className="flex flex-col gap-1 py-1.5 px-1">
               <span className="text-[11px] text-muted-foreground uppercase font-semibold">Description</span>
               <span className="text-sm font-medium text-foreground">{transaction.description || "—"}</span>
             </div>
             
             {transaction.balance != null && (
               <DetailRow icon={<span>{currencySymbol}</span>} label="Balance" value={`${currencySymbol}${transaction.balance.toFixed(2)}`} />
             )}
          </div>
        </div>
        <ModalFooterActions className="mt-4">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </ModalFooterActions>
      </Modal>
    );
  }

  if (mode === "delete") {
    return (
      <Modal open={open} onClose={onClose} title="Delete Transaction" size="sm">
        <div className="py-2">
          {error && <p className="text-sm text-destructive mb-3">{error}</p>}
          <p className="text-sm text-muted-foreground mb-4">
            Are you sure you want to delete this transaction from <strong>{transaction.payee}</strong> for <strong>{currencySymbol}{Math.abs(transaction.amount).toFixed(2)}</strong>? This action cannot be undone.
          </p>
        </div>
        <ModalFooterActions>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} loading={loading} leftIcon={<Trash2 className="w-4 h-4" />}>
            Delete
          </Button>
        </ModalFooterActions>
      </Modal>
    );
  }

  // Edit Mode
  return (
    <Modal open={open} onClose={onClose} title="Edit Transaction" size="md">
      <div className="flex flex-col gap-4 py-2">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <FormInput 
          label="Payee" 
          value={payee} 
          onChange={(e) => setPayee(e.target.value)} 
          placeholder="e.g. Amazon" 
        />
        <FormInput 
          label="Description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Transaction description" 
        />
        <FormInput 
          label="Bank" 
          value={bank} 
          onChange={(e) => setBank(e.target.value)} 
          placeholder="e.g. Federal Bank" 
        />
      </div>
      <ModalFooterActions className="mt-4">
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="primary" onClick={handleEdit} loading={loading} leftIcon={<Check className="w-4 h-4" />}>
          Save Changes
        </Button>
      </ModalFooterActions>
    </Modal>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
         {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
      </div>
      <div className="flex flex-col">
         <span className="text-[11px] text-muted-foreground uppercase font-semibold leading-none mb-1">{label}</span>
         <span className="text-sm font-medium text-foreground leading-none">{value || "—"}</span>
      </div>
    </div>
  );
}
