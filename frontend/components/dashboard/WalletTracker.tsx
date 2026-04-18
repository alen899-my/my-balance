"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Minus, Settings2, Eye, Edit3, Trash2, Wallet, Camera, Check, X, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTable, ColumnDef } from "@/components/common/Datatable";
import { Modal, ModalFooterActions } from "@/components/common/Modal";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/Forminput";
import { Select } from "@/components/ui/Select";
import getSymbolFromCurrency from "currency-symbol-map";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// --- Types ---
interface WalletItem {
  _id: string;
  description: string;
  amount: number;
  type: "add" | "spend" | "set_balance";
  category: string;
  receipt_url?: string;
  transaction_date: string;
}

interface WalletSummary {
  balance: number;
  total_added: number;
  total_spent: number;
}

// --- Sub-components ---

function WalletActionModal({
  open,
  onClose,
  onSuccess,
  editItem,
  defaultType,
  currencySymbol
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem?: WalletItem | null;
  defaultType: "add" | "spend" | "set_balance";
  currencySymbol: string;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"add" | "spend" | "set_balance">(defaultType);
  const [category, setCategory] = useState("Cash");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editItem) {
      setDescription(editItem.description);
      setAmount(String(editItem.amount));
      setType(editItem.type);
      setCategory(editItem.category);
      setReceiptUrl(editItem.receipt_url || "");
    } else {
      setDescription("");
      setAmount("");
      setType(defaultType);
      setCategory(defaultType === "add" ? "Deposit" : "Food & Dining");
      setReceiptUrl("");
      setReceiptFile(null);
    }
  }, [editItem, open, defaultType]);

  const handleFileSelect = (file: File) => {
    if (!file) return;
    setReceiptFile(file);
    setError(null);
  };

  const handleSave = async () => {
    if (!description.trim() && type !== "set_balance") { 
      setError("Description is required"); 
      return; 
    }
    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount) || finalAmount < 0) { 
      setError("Valid amount is required"); 
      return; 
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let finalReceiptUrl = receiptUrl;

      // Ensure we upload the physical file if selected
      if (receiptFile) {
        const formData = new FormData();
        formData.append("file", receiptFile);
        const resUpload = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        if (!resUpload.ok) throw new Error("Failed to upload receipt file");
        const dataUpload = await resUpload.json();
        finalReceiptUrl = dataUpload.url;
      }

      const payload = {
        description: type === "set_balance" ? "Set Initial Balance" : description.trim(),
        amount: finalAmount,
        type,
        category: type === "set_balance" ? "Adjustment" : category,
        receipt_url: finalReceiptUrl || null
      };

      const url = editItem 
        ? `${API_BASE_URL}/wallet/${editItem._id}` 
        : `${API_BASE_URL}/wallet/`;
      
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
        throw new Error(d.detail || "Failed to save wallet entry");
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  let title = "Add Money to Wallet";
  if (type === "spend") title = "Record Wallet Spend";
  else if (type === "set_balance") title = "Set Exact Wallet Balance";
  if (editItem) title = "Edit Wallet Record";

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <div className="flex flex-col gap-4 py-1">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <X className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        <FormInput 
          label={`Amount (${currencySymbol})`} 
          type="number" 
          placeholder="0.00"
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
          autoFocus
        />

        {type !== "set_balance" && (
          <>
            <FormInput 
              label={type === "add" ? "Source / Description" : "Where did you spend?"} 
              placeholder={type === "add" ? "e.g. ATM Withdrawal" : "e.g. Coffee Shop"} 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
            />
            
            <FormInput 
              label="Category" 
              placeholder={type === "add" ? "e.g. Allowance, Cash" : "e.g. Food, Transport, Misc"} 
              value={category} 
              onChange={e => setCategory(e.target.value)} 
            />

            {(type === "spend" || type === "add") && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Receipt (Optional)</label>
                {(receiptFile || receiptUrl) ? (
                  <div className="flex items-center justify-between p-3 border border-emerald-500/30 bg-emerald-500/10 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-sm font-bold truncate max-w-[200px]">
                        {receiptFile ? receiptFile.name : (receiptUrl ? "Receipt Attached" : "")}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setReceiptFile(null); setReceiptUrl(""); }} className="text-destructive hover:bg-destructive/10 h-8">Remove</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors relative cursor-pointer group">
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    />
                    <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors pointer-events-none">
                      <Camera className="w-8 h-8 opacity-50" />
                      <span className="text-sm font-medium">Click to snap receipt</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <ModalFooterActions className="mt-6">
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} loading={loading} leftIcon={!loading && <Check className="h-4 w-4" />}>
          {editItem ? "Save Changes" : "Confirm"}
        </Button>
      </ModalFooterActions>
    </Modal>
  );
}

function ViewWalletItemModal({ 
  open, 
  onClose, 
  item, 
  currencySymbol 
}: { 
  open: boolean; 
  onClose: () => void; 
  item: WalletItem | null; 
  currencySymbol: string;
}) {
  if (!item) return null;
  const isAdd = item.type === "add";
  const isSet = item.type === "set_balance";

  return (
    <Modal open={open} onClose={onClose} title="Activity Details" size="sm">
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col items-center justify-center py-4 bg-muted/20 border border-border rounded-none">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{isSet ? "Adjustment" : (isAdd ? "Added" : "Spent")}</span>
          <span className={cn(
            "text-3xl font-black tabular-nums tracking-tighter",
            isSet ? "text-primary" : (isAdd ? "text-emerald-500" : "text-destructive")
          )}>
            {isSet ? "" : (isAdd ? "+" : "-")}{currencySymbol}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Description</span>
            <span className="text-sm font-semibold text-foreground">{item.description}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Category</span>
            <span className="text-sm font-semibold text-foreground">{item.category}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Date</span>
            <span className="text-sm font-semibold text-foreground">{new Date(item.transaction_date).toLocaleString()}</span>
          </div>
          
          {item.receipt_url && (
            <div className="flex flex-col mt-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Attached Receipt</span>
              <div className="rounded-xl overflow-hidden border border-border bg-muted/10 relative max-h-[300px]">
                 <img src={item.receipt_url} alt="Receipt" className="w-full h-auto object-contain bg-white/5" />
                 <a href={item.receipt_url} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-background/80 backdrop-blur border border-border px-2 py-1 rounded-md font-bold uppercase hover:bg-background transition-colors">
                   <Eye className="w-3 h-3" /> Full View
                 </a>
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


// --- Main Component ---

export function WalletTracker() {
  const [items, setItems] = useState<WalletItem[]>([]);
  const [summary, setSummary] = useState<WalletSummary>({ balance: 0, total_added: 0, total_spent: 0 });
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"add" | "spend" | "set_balance">("spend");
  const [editItem, setEditItem] = useState<WalletItem | null>(null);
  const [viewItem, setViewItem] = useState<WalletItem | null>(null);

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [listRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/wallet/transactions`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/wallet/summary`, {
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
  }, []);

  useEffect(() => {
    const pref = localStorage.getItem("preferred_currency");
    if (pref) setCurrencySymbol(getSymbolFromCurrency(pref) || "₹");
    fetchWalletData();
  }, [fetchWalletData]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this wallet record?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/wallet/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchWalletData();
    } catch (e) { console.error(e); }
  };

  const columns: ColumnDef<WalletItem>[] = [
    {
      key: "transaction_date",
      header: "Date / Time",
      cell: (val) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(String(val)).toLocaleDateString()}
        </span>
      )
    },
    {
      key: "description",
      header: "Description",
      cell: (val, row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-foreground">{String(val)}</span>
          <span className="text-[10px] uppercase font-bold text-muted-foreground">{row.category}</span>
        </div>
      )
    },

    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (val, row) => {
        const isSet = row.type === "set_balance";
        const isAdd = row.type === "add";
        return (
          <span className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight border tabular-nums whitespace-nowrap",
            isSet ? "bg-primary/10 text-primary border-primary/20" :
            isAdd 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
              : "bg-destructive/10 text-destructive border-destructive/20"
          )}>
            {isSet ? "" : (isAdd ? "+" : "-")}{currencySymbol}{Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      noTruncate: true,
      cell: (_: unknown, row: WalletItem) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewItem(row)}
            className="w-7 h-7 flex items-center justify-center rounded-none text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setEditItem(row); setActionType(row.type); setModalOpen(true); }}
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
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Added</span>
              <div className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-500 rounded-none border border-emerald-500/20">
                <Plus className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-black tabular-nums text-emerald-500 dark:text-emerald-400 relative z-10 tracking-tight">{currencySymbol}{(summary?.total_added || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex flex-col p-5 rounded-none bg-card border border-border shadow-sm relative overflow-hidden group hover:border-destructive/30 transition-colors">
            <div className="flex items-center justify-between mb-3 z-10 w-full">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Spent</span>
              <div className="w-8 h-8 flex items-center justify-center bg-destructive/10 text-destructive rounded-none border border-destructive/20">
                <Minus className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-black tabular-nums text-destructive relative z-10 tracking-tight">{currencySymbol}{(summary?.total_spent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex flex-col p-5 rounded-none bg-card border border-border shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-3 z-10 w-full">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Wallet Balance</span>
              <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-none border border-primary/20">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <span className={cn("text-2xl font-black tabular-nums relative z-10 tracking-tight", (summary?.balance || 0) >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-destructive")}>{(summary?.balance || 0) < 0 ? "-" : ""}{currencySymbol}{Math.abs(summary?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* ── Navigator & Actions ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
         

          <div className="sm:ml-auto flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => { 
                const existingSetItem = items.find(i => i.type === "set_balance");
                setEditItem(existingSetItem || null); 
                setActionType("set_balance"); 
                setModalOpen(true); 
              }}
              leftIcon={<Settings2 className="h-4 w-4" />}
            >
              Edit Wallet Balance
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setEditItem(null); setActionType("add"); setModalOpen(true); }}
              className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Money
            </Button>
            <Button
              variant="primary"
              onClick={() => { setEditItem(null); setActionType("spend"); setModalOpen(true); }}
              className="bg-destructive hover:bg-destructive/90 text-white"
              leftIcon={<Minus className="h-4 w-4" />}
            >
              Spend
            </Button>
          </div>
        </div>

        <DataTable 
          data={items.filter(i => i.type !== "set_balance")} 
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
                <Wallet className="h-6 w-6 opacity-40" />
              </div>
              <p className="text-sm font-semibold mb-1">No wallet activity found</p>
              <p className="text-xs text-center max-w-xs">
                Try adding some cash or adjusting your initial balance to get started!
              </p>
            </div>
          }
        />
      </div>

      <WalletActionModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={() => fetchWalletData()} 
        editItem={editItem}
        defaultType={actionType}
        currencySymbol={currencySymbol}
      />

      <ViewWalletItemModal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        item={viewItem}
        currencySymbol={currencySymbol}
      />
    </>
  );
}
