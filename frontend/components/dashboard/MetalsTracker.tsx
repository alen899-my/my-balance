"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Edit3, Trash2, Eye, TrendingUp, TrendingDown,
  Gem, RefreshCw, AlertCircle, Check, X, Camera, Loader2, UploadCloud, Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTable, ColumnDef } from "@/components/common/Datatable";
import { Modal, ModalFooterActions } from "@/components/common/Modal";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/Forminput";
import getSymbolFromCurrency from "currency-symbol-map";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Cache is now handled by Next.js API route (/api/metals/live-prices)

// ─── Types ────────────────────────────────────────────────────────────────────

type WeightUnit = "g" | "kg" | "pavan";

interface MetalAsset {
  _id: string;
  metal_type: "XAU" | "XAG" | "XPT" | "XPD";
  metal_name: string;
  item_name: string;
  quantity: number;       // always stored in grams
  purchase_price: number; // TOTAL purchase cost (not per gram)
  purchase_date: string;
  note?: string;
  image_url?: string;
  created_at: string;
}

interface LivePrice {
  price_per_gram: number;
  price_per_oz: number;
  currency: string;
  name: string;
  ch: number;
  chp: number;
  timestamp?: number;
  error?: string;
}

type LivePrices = Record<string, LivePrice>;

// ─── Weight unit helpers ──────────────────────────────────────────────────────
// 1 pavan (Kerala/Malayalam gold measurement) = 8 grams
const PAVAN_IN_GRAMS = 8;

function toGrams(value: number, unit: WeightUnit): number {
  if (unit === "kg") return value * 1000;
  if (unit === "pavan") return value * PAVAN_IN_GRAMS;
  return value; // g
}

function fromGrams(grams: number, unit: WeightUnit): number {
  if (unit === "kg") return grams / 1000;
  if (unit === "pavan") return grams / PAVAN_IN_GRAMS;
  return grams;
}

const UNIT_LABELS: Record<WeightUnit, string> = {
  g: "Grams (g)",
  kg: "Kilograms (kg)",
  pavan: "Pavan (8g, Kerala)",
};

// ─── Metal Config ──────────────────────────────────────────────────────────────

const METAL_OPTIONS = [
  { value: "XAU", label: "Gold", fullLabel: "Gold (XAU)" },
  { value: "XAG", label: "Silver", fullLabel: "Silver (XAG)" },
  { value: "XPT", label: "Platinum", fullLabel: "Platinum (XPT)" },
  { value: "XPD", label: "Palladium", fullLabel: "Palladium (XPD)" },
];

const METAL_COLORS: Record<string, { badge: string; card: string; text: string; icon: string }> = {
  XAU: {
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    card: "border-amber-500/20 from-amber-500/10",
    text: "text-amber-500",
    icon: "text-amber-500",
  },
  XAG: {
    badge: "bg-slate-400/10 text-slate-500 dark:text-slate-300 border-slate-400/20",
    card: "border-slate-400/20 from-slate-400/10",
    text: "text-slate-400",
    icon: "text-slate-400",
  },
  XPT: {
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    card: "border-sky-500/20 from-sky-500/10",
    text: "text-sky-500",
    icon: "text-sky-500",
  },
  XPD: {
    badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    card: "border-purple-500/20 from-purple-500/10",
    text: "text-purple-500",
    icon: "text-purple-500",
  },
};

// ─── Metal icon SVGs (lucide-style) ───────────────────────────────────────────
function MetalIcon({ type, className }: { type: string; className?: string }) {
  const col = METAL_COLORS[type]?.icon || "text-muted-foreground";
  // Custom mineral/bar SVG per metal
  if (type === "XAU") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cn(col, className)}>
      <polygon points="12 2 22 8 22 16 12 22 2 16 2 8" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="8" x2="22" y2="8" />
      <line x1="2" y1="16" x2="22" y2="16" />
    </svg>
  );
  if (type === "XAG") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cn(col, className)}>
      <rect x="3" y="8" width="18" height="8" rx="2" />
      <line x1="7" y1="8" x2="7" y2="16" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="17" y1="8" x2="17" y2="16" />
      <path d="M3 12h18" />
    </svg>
  );
  if (type === "XPT") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cn(col, className)}>
      <path d="M12 2 L22 7 L22 17 L12 22 L2 17 L2 7 Z" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
  // XPD
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cn(col, className)}>
      <path d="M12 3 L20 7.5 V16.5 L12 21 L4 16.5 V7.5 Z" />
      <path d="M12 3 V21 M4 7.5 L20 7.5 M4 16.5 L20 16.5" />
    </svg>
  );
}

// ─── Inline receipt-style image uploader ──────────────────────────────────────
function MetalImageUploader({
  currentUrl,
  onFile,
  onRemove,
  previewFile,
}: {
  currentUrl?: string;
  onFile: (f: File) => void;
  onRemove: () => void;
  previewFile: File | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = previewFile ? URL.createObjectURL(previewFile) : currentUrl;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Photo (Optional)</label>

      {preview ? (
        <div className="flex items-center justify-between p-3 border border-emerald-500/30 bg-emerald-500/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-emerald-500/30 shrink-0">
              <img src={preview} alt="Metal" className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[180px]">
              {previewFile ? previewFile.name : "Photo attached"}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:bg-destructive/10 h-7 shrink-0">Remove</Button>
        </div>
      ) : (
        <div
          className="flex items-center justify-center p-5 border-2 border-dashed border-border rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors relative cursor-pointer group"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors pointer-events-none">
            <Camera className="w-7 h-7 opacity-50" />
            <span className="text-xs font-semibold">Click to attach a photo</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Live Price Ticker ────────────────────────────────────────────────────────

function LivePriceTicker({ prices, currencySymbol, loadingPrices, onRefresh, lastUpdated }: {
  prices: LivePrices;
  currencySymbol: string;
  loadingPrices: boolean;
  onRefresh: () => void;
  lastUpdated: number | null;
}) {
  const timeAgo = lastUpdated
    ? Math.round((Date.now() - lastUpdated) / 1000) < 60
      ? "just now"
      : `${Math.floor((Date.now() - lastUpdated) / 60000)}m ago`
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", loadingPrices ? "bg-amber-400 animate-pulse" : "bg-emerald-500 animate-pulse")} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Live Spot Prices · per gram {timeAgo && <span className="opacity-60 font-normal normal-case">· updated {timeAgo}</span>}
          </span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loadingPrices}
          className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/40 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-3", loadingPrices && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {METAL_OPTIONS.map(m => {
          const p = prices[m.value];
          const col = METAL_COLORS[m.value];
          const hasError = !p || p.error;
          const isUp = p && !p.error && p.chp >= 0;

          return (
            <div
              key={m.value}
              className="group flex flex-col justify-center p-2.5 px-3 rounded-lg border bg-card hover:bg-muted/30 shadow-sm hover:border-primary/30 transition-all gap-1 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={cn("flex items-center justify-center w-5 h-5 rounded-[5px] border shrink-0", col.badge)}>
                    <MetalIcon type={m.value} className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none">{m.label}</span>
                </div>
                {!hasError && !loadingPrices && p && (
                  <span className={cn(
                    "flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded leading-none border", 
                    isUp ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10" 
                         : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/10"
                  )}>
                    {isUp ? "+" : ""}{p.chp.toFixed(2)}%
                  </span>
                )}
              </div>

              {loadingPrices && !p ? (
                <div className="h-4 bg-muted/60 rounded animate-pulse w-20 mt-1" />
              ) : hasError ? (
                <div className="flex items-center gap-1.5 text-destructive/70 mt-0.5">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-[11px] font-semibold">Unavailable</span>
                </div>
              ) : (
                <div className="flex items-end gap-1 mt-0.5">
                  <span className="text-sm font-black tabular-nums text-foreground leading-none">
                    {currencySymbol}{p.price_per_gram.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-medium text-muted-foreground leading-[1.2]">/g</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

function AssetModal({
  open, onClose, onSuccess, editAsset, currencySymbol, livePrices,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editAsset: MetalAsset | null;
  currencySymbol: string;
  livePrices: LivePrices;
}) {
  const [metalType, setMetalType] = useState<"XAU" | "XAG" | "XPT" | "XPD">("XAU");
  const [itemName, setItemName] = useState("");
  const [weightDisplay, setWeightDisplay] = useState("");   // what user types
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("g");
  const [totalCost, setTotalCost] = useState("");           // TOTAL price paid (currency)
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editAsset) {
      setMetalType(editAsset.metal_type);
      setItemName(editAsset.item_name);
      // Convert stored grams back to display unit
      setWeightUnit("g");
      setWeightDisplay(String(editAsset.quantity));
      setTotalCost(String(editAsset.purchase_price));
      setPurchaseDate(editAsset.purchase_date.split("T")[0]);
      setNote(editAsset.note || "");
      setExistingImageUrl(editAsset.image_url || "");
      setImageFile(null);
    } else {
      setMetalType("XAU");
      setItemName("");
      setWeightDisplay("");
      setWeightUnit("g");
      setTotalCost("");
      setPurchaseDate(new Date().toISOString().split("T")[0]);
      setNote("");
      setExistingImageUrl("");
      setImageFile(null);
    }
    setError(null);
  }, [editAsset, open]);

  // Computed weight in grams
  const weightGrams = toGrams(parseFloat(weightDisplay) || 0, weightUnit);
  const totalCostNum = parseFloat(totalCost) || 0;
  const pricePerGram = weightGrams > 0 && totalCostNum > 0 ? totalCostNum / weightGrams : 0;

  // Live value for comparison
  const lp = livePrices[metalType];
  const liveValue = lp && !lp.error && weightGrams > 0 ? lp.price_per_gram * weightGrams : null;

  const handleSubmit = async () => {
    if (!itemName.trim()) { setError("Item name is required."); return; }
    if (!weightDisplay || isNaN(parseFloat(weightDisplay)) || parseFloat(weightDisplay) <= 0) {
      setError("Enter a valid weight."); return;
    }
    if (!totalCost || isNaN(parseFloat(totalCost)) || parseFloat(totalCost) <= 0) {
      setError("Enter the total purchase cost."); return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let finalImageUrl = existingImageUrl;

      // Upload image if a new one selected
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error("Failed to upload image.");
        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.url;
      }

      const payload = {
        metal_type: metalType,
        item_name: itemName.trim(),
        quantity: weightGrams,            // always stored in grams
        purchase_price: totalCostNum,     // TOTAL cost
        purchase_date: new Date(purchaseDate).toISOString(),
        note: note.trim() || null,
        image_url: finalImageUrl || null,
      };

      const url = editAsset
        ? `${API_BASE_URL}/metals/${editAsset._id}`
        : `${API_BASE_URL}/metals/`;

      const res = await fetch(url, {
        method: editAsset ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Failed to save asset.");
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
    <Modal open={open} onClose={onClose} title={editAsset ? "Edit Metal Asset" : "Add Metal Asset"} size="md">
      <div className="flex flex-col gap-4 py-1">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <X className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        {/* Metal type selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Metal Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {METAL_OPTIONS.map(m => {
              const col = METAL_COLORS[m.value];
              const isActive = metalType === m.value;
              const mlp = livePrices[m.value];
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMetalType(m.value as typeof metalType)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border-2 text-xs font-bold transition-all",
                    isActive
                      ? `${col.badge} border-current`
                      : "border-border text-muted-foreground hover:border-border/70 bg-muted/20"
                  )}
                >
                  <MetalIcon type={m.value} className="w-5 h-5" />
                  <span>{m.label}</span>
                  {mlp && !mlp.error && (
                    <span className="text-[9px] font-medium opacity-60 text-center leading-tight">
                      {currencySymbol}{mlp.price_per_gram.toFixed(1)}/g
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Item name */}
        <FormInput label="Item Name / Description" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Gold Ring, Silver Bar, Platinum Coin..." />

        {/* Weight + Unit */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Weight</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <FormInput
                label=""
                type="number"
                value={weightDisplay}
                onChange={e => setWeightDisplay(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-1 items-center bg-muted/40 border border-border rounded-xl p-1 shrink-0">
              {(["g", "kg", "pavan"] as WeightUnit[]).map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setWeightUnit(u)}
                  className={cn(
                    "px-2.5 h-8 rounded-lg text-[11px] font-bold uppercase transition-all whitespace-nowrap",
                    weightUnit === u
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          {weightGrams > 0 && weightUnit !== "g" && (
            <span className="text-[10px] text-muted-foreground font-medium pl-1">
              = {weightGrams.toFixed(4)} grams
            </span>
          )}
        </div>

        {/* Total purchase cost */}
        <FormInput
          label={`Total Purchase Cost (${currencySymbol})`}
          type="number"
          value={totalCost}
          onChange={e => setTotalCost(e.target.value)}
          placeholder="Total amount you paid"
          hint={pricePerGram > 0 ? `≈ ${currencySymbol}${pricePerGram.toFixed(2)} per gram` : undefined}
        />

        {/* Live value comparison */}
        {liveValue !== null && totalCostNum > 0 && (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/20 border border-border/40 text-xs">
            <span className="text-muted-foreground font-semibold">Live Market Value</span>
            <div className="flex items-center gap-2">
              <span className="font-black tabular-nums text-foreground">
                {currencySymbol}{liveValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className={cn(
                "font-bold px-1.5 py-0.5 rounded-md",
                liveValue >= totalCostNum ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"
              )}>
                {liveValue >= totalCostNum ? "+" : ""}{(((liveValue - totalCostNum) / totalCostNum) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Purchase Date */}
        <FormInput
          label="Purchase Date"
          type="date"
          value={purchaseDate}
          onChange={e => setPurchaseDate(e.target.value)}
        />

        {/* Image upload */}
        <MetalImageUploader
          currentUrl={existingImageUrl}
          previewFile={imageFile}
          onFile={setImageFile}
          onRemove={() => { setImageFile(null); setExistingImageUrl(""); }}
        />

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Note (Optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. Gift from mom, anniversary ring..."
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
          {editAsset ? "Save Changes" : "Add Asset"}
        </Button>
      </ModalFooterActions>
    </Modal>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────

function ViewModal({ open, onClose, asset, currencySymbol, livePrices }: {
  open: boolean;
  onClose: () => void;
  asset: MetalAsset | null;
  currencySymbol: string;
  livePrices: LivePrices;
}) {
  if (!asset) return null;
  const col = METAL_COLORS[asset.metal_type];
  const lp = livePrices[asset.metal_type];
  const currentValue = lp && !lp.error ? lp.price_per_gram * asset.quantity : null;
  const purchaseCost = asset.purchase_price; // stored as total
  const gain = currentValue !== null ? currentValue - purchaseCost : null;
  const gainPct = gain !== null && purchaseCost > 0 ? (gain / purchaseCost) * 100 : null;

  return (
    <Modal open={open} onClose={onClose} title="Asset Details" size="sm">
      <div className="flex flex-col gap-4 py-2">
        {/* Hero */}
        <div className={cn("rounded-2xl border p-5 flex flex-col items-center bg-gradient-to-br to-transparent", col.card)}>
          <MetalIcon type={asset.metal_type} className="w-8 h-8 mb-2" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{asset.metal_name}</span>
          <span className="text-sm font-semibold text-muted-foreground mb-2">{asset.item_name}</span>
          <span className={cn("text-3xl font-black tabular-nums tracking-tight", col.text)}>
            {currencySymbol}{purchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-muted-foreground mt-1 font-medium">Total Purchase Cost</span>
          {currentValue !== null && (
            <div className="mt-3 flex items-center gap-3 w-full justify-center flex-wrap">
              <span className="text-sm font-bold text-foreground tabular-nums">
                Now: {currencySymbol}{currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {gain !== null && (
                <span className={cn("text-sm font-black tabular-nums px-2 py-0.5 rounded-lg", gain >= 0 ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500")}>
                  {gain >= 0 ? "+" : ""}{currencySymbol}{Math.abs(gain).toFixed(2)} ({gainPct?.toFixed(1)}%)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Photo */}
        {asset.image_url && (
          <div className="rounded-2xl overflow-hidden border border-border max-h-[220px] relative">
            <img src={asset.image_url} alt={asset.item_name} className="w-full h-full object-contain bg-muted/20" />
            <a href={asset.image_url} target="_blank" rel="noopener noreferrer"
              className="absolute top-2 right-2 flex items-center gap-1.5 text-[10px] bg-background/80 backdrop-blur border border-border px-2.5 py-1.5 rounded-xl font-bold uppercase hover:bg-background transition-colors">
              <Eye className="w-3.5 h-3.5" /> Full View
            </a>
          </div>
        )}

        {/* Details */}
        <div className="flex flex-col gap-0">
          {[
            { label: "Weight", value: `${asset.quantity}g (${(asset.quantity / PAVAN_IN_GRAMS).toFixed(2)} Pavan / ${(asset.quantity / 1000).toFixed(4)} kg)` },
            { label: "Buy Price/g", value: `${currencySymbol}${(purchaseCost / asset.quantity).toFixed(4)}/g` },
            { label: "Live Price/g", value: lp && !lp.error ? `${currencySymbol}${lp.price_per_gram.toFixed(4)}/g` : "—" },
            { label: "Bought On", value: new Date(asset.purchase_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
            ...(asset.note ? [{ label: "Note", value: asset.note }] : []),
          ].map((row, i) => (
            <div key={i} className="flex items-start justify-between py-2.5 border-b border-border/50 last:border-0 gap-4">
              <span className="text-[10px] text-muted-foreground uppercase font-bold shrink-0">{row.label}</span>
              <span className="text-sm font-semibold text-foreground text-right">{row.value}</span>
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

function DeleteModal({ open, asset, onClose, onSuccess }: {
  open: boolean; asset: MetalAsset | null; onClose: () => void; onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    if (!asset) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/metals/${asset._id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      onSuccess(); onClose();
    } finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Delete Asset" size="sm">
      <div className="py-2">
        <p className="text-sm text-muted-foreground">Delete <strong className="text-foreground">{asset?.item_name}</strong>? This action cannot be undone.</p>
      </div>
      <ModalFooterActions>
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="destructive" onClick={handleDelete} loading={loading} leftIcon={<Trash2 className="h-4 w-4" />}>Delete</Button>
      </ModalFooterActions>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MetalsTracker() {
  const [assets, setAssets] = useState<MetalAsset[]>([]);
  const [livePrices, setLivePrices] = useState<LivePrices>({});
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [activeFilter, setActiveFilter] = useState<"all" | "XAU" | "XAG" | "XPT" | "XPD">("all");

  const [addOpen, setAddOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<MetalAsset | null>(null);
  const [viewAsset, setViewAsset] = useState<MetalAsset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<MetalAsset | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoadingAssets(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/metals/portfolio`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAssets((await res.json()).items);
    } catch (err) { console.error(err); }
    finally { setLoadingAssets(false); }
  }, []);

  const fetchPrices = useCallback(async (currency: string, force = false) => {
    setLoadingPrices(true);
    try {
      const token = localStorage.getItem("token");
      // Use the Next.js API route which caches the response for 5 minutes
      // If force is true, we could theoretically bust the cache, but Next.js Data Cache needs revalidateTags/revalidatePath
      // so for now we'll just hit it normally. The route handler takes care of the 300s TTL.
      const url = new URL("/api/metals/live-prices", window.location.origin);
      url.searchParams.set("currency", currency);
      if (force) url.searchParams.set("t", Date.now().toString()); // Cache busting for the browser

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLivePrices(data);
        setLastUpdated(Date.now());
      }
    } catch (err) { console.error(err); }
    finally { setLoadingPrices(false); }
  }, []);

  useEffect(() => {
    const pref = localStorage.getItem("preferred_currency") || "USD";
    const sym = getSymbolFromCurrency(pref) || "$";
    setCurrencyCode(pref);
    setCurrencySymbol(sym);
    fetchAssets();
    fetchPrices(pref);
  }, [fetchAssets, fetchPrices]);

  const filtered = assets.filter(a => activeFilter === "all" || a.metal_type === activeFilter);

  // Portfolio totals
  const totalCost = assets.reduce((s, a) => s + a.purchase_price, 0);
  const totalCurrentValue = assets.reduce((s, a) => {
    const lp = livePrices[a.metal_type];
    return lp && !lp.error ? s + lp.price_per_gram * a.quantity : s + a.purchase_price;
  }, 0);
  const totalGain = totalCurrentValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const totalWeightG = assets.reduce((s, a) => s + a.quantity, 0);

  // ── Columns ──────────────────────────────────────────────────────────────────

  const columns: ColumnDef<MetalAsset>[] = [
    {
      key: "sno", header: "#", align: "center", noTruncate: true,
      cell: (_: unknown, __: MetalAsset, idx: number) => (
        <span className="text-muted-foreground/60 font-mono text-[11px]">{idx + 1}</span>
      ),
    },
    {
      key: "metal_type", header: "Metal / Item", noTruncate: true,
      cell: (val: unknown, row: MetalAsset) => {
        const col = METAL_COLORS[String(val)];
        const opt = METAL_OPTIONS.find(m => m.value === val);
        return (
          <div className="flex items-center gap-2.5">
            {row.image_url ? (
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-border shrink-0">
                <img src={row.image_url} alt={row.item_name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border shrink-0", col.badge)}>
                <MetalIcon type={String(val)} className="w-4 h-4" />
              </div>
            )}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className={cn("text-[11px] font-black", col.text)}>{opt?.label}</span>
              <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">{row.item_name}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "quantity", header: "Weight", align: "center", noTruncate: true,
      cell: (val: unknown) => {
        const g = Number(val);
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs font-bold tabular-nums">{g.toFixed(2)}<span className="text-muted-foreground text-[10px] ml-0.5">g</span></span>
            <span className="text-[9px] text-muted-foreground font-medium">{(g / PAVAN_IN_GRAMS).toFixed(2)} pavan</span>
          </div>
        );
      },
    },
    {
      key: "purchase_price", header: "Total Cost", align: "right", noTruncate: true,
      cell: (val: unknown, row: MetalAsset) => {
        const col = METAL_COLORS[row.metal_type];
        const perGram = row.quantity > 0 ? Number(val) / row.quantity : 0;
        return (
          <div className="flex flex-col items-end gap-0.5">
            <span className={cn("px-2 py-1 rounded-lg text-xs font-bold border tabular-nums", col.badge)}>
              {currencySymbol}{Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-muted-foreground font-medium">{currencySymbol}{perGram.toFixed(2)}/g</span>
          </div>
        );
      },
    },
    {
      key: "metal_type", header: "P&L", align: "right", noTruncate: true,
      cell: (_: unknown, row: MetalAsset) => {
        const lp = livePrices[row.metal_type];
        if (!lp || lp.error) return <span className="text-muted-foreground text-xs">—</span>;
        const currentVal = lp.price_per_gram * row.quantity;
        const cost = row.purchase_price;
        const gain = currentVal - cost;
        const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
        return (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs font-bold tabular-nums text-foreground">
              {currencySymbol}{currentVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className={cn("text-[10px] font-black", gain >= 0 ? "text-emerald-500" : "text-rose-500")}>
              {gain >= 0 ? "+" : ""}{currencySymbol}{Math.abs(gain).toFixed(2)} ({gainPct.toFixed(1)}%)
            </span>
          </div>
        );
      },
    },
    {
      key: "purchase_date", header: "Bought", noTruncate: true,
      cell: (val: unknown) => (
        <span className="text-[10px] text-muted-foreground font-semibold whitespace-nowrap">
          {new Date(String(val)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
        </span>
      ),
    },
    {
      key: "actions", header: "Actions", align: "right", noTruncate: true,
      cell: (_: unknown, row: MetalAsset) => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewAsset(row)} className="w-7 h-7 flex items-center justify-center rounded-md text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setEditAsset(row); setAddOpen(true); }} className="w-7 h-7 flex items-center justify-center rounded-md text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteAsset(row)} className="w-7 h-7 flex items-center justify-center rounded-md text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const filterTabs = [
    { key: "all" as const, label: "All Metals" },
    ...METAL_OPTIONS.map(m => ({ key: m.value as typeof activeFilter, label: m.label })),
  ];

  return (
    <>
      {/* Modals */}
      <AssetModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditAsset(null); }}
        onSuccess={fetchAssets}
        editAsset={editAsset}
        currencySymbol={currencySymbol}
        livePrices={livePrices}
      />
      <ViewModal open={!!viewAsset} onClose={() => setViewAsset(null)} asset={viewAsset} currencySymbol={currencySymbol} livePrices={livePrices} />
      <DeleteModal open={!!deleteAsset} asset={deleteAsset} onClose={() => setDeleteAsset(null)} onSuccess={fetchAssets} />

      <div className="flex flex-col gap-6">

        {/* ── Live Price Ticker ── */}
        <LivePriceTicker
          prices={livePrices}
          currencySymbol={currencySymbol}
          loadingPrices={loadingPrices}
          onRefresh={() => fetchPrices(currencyCode, true)}
          lastUpdated={lastUpdated}
        />

        {/* ── Portfolio Summary Cards ── */}
        {assets.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Invested", value: currencySymbol + totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 }), sub: null, color: "text-primary" },
              { label: "Current Value", value: currencySymbol + totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2 }), sub: null, color: totalGain >= 0 ? "text-emerald-500" : "text-rose-500" },
              {
                label: "Total P&L",
                value: (totalGain >= 0 ? "+" : "") + currencySymbol + Math.abs(totalGain).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                sub: (totalGain >= 0 ? "+" : "") + totalGainPct.toFixed(2) + "%",
                color: totalGain >= 0 ? "text-emerald-500" : "text-rose-500",
              },
              {
                label: "Total Weight",
                value: totalWeightG.toFixed(2) + "g",
                sub: (totalWeightG / PAVAN_IN_GRAMS).toFixed(2) + " pavan · " + assets.length + " item" + (assets.length !== 1 ? "s" : ""),
                color: "text-amber-500",
              },
            ].map((card, i) => (
              <div key={i} className="flex flex-col p-4 rounded-xl bg-card border border-border shadow-sm hover:border-primary/20 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-tight mb-2">{card.label}</span>
                <span className={cn("text-xl font-black tabular-nums tracking-tight", card.color)}>{card.value}</span>
                {card.sub && <span className={cn("text-[10px] font-bold mt-0.5", card.color)}>{card.sub}</span>}
              </div>
            ))}
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center bg-muted/40 rounded-xl p-1 gap-1 overflow-x-auto">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shrink-0",
                  activeFilter === tab.key
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.key !== "all" && <MetalIcon type={tab.key} className="w-3.5 h-3.5" />}
                {tab.label}
                <span className={cn(
                  "text-[10px] font-bold inline-flex items-center justify-center rounded-full min-w-[16px] h-4 px-1",
                  activeFilter === tab.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {tab.key === "all" ? assets.length : assets.filter(a => a.metal_type === tab.key).length}
                </span>
              </button>
            ))}
          </div>

          <Button variant="primary" onClick={() => { setEditAsset(null); setAddOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>
            Add Asset
          </Button>
        </div>

        {/* ── Table ── */}
        <DataTable
          data={filtered}
          columns={columns}
          rowKey="_id"
          loading={loadingAssets}
          striped
          compact
          searchable={false}
          hideToolbar
          emptyState={
            <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
              <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                <Gem className="h-6 w-6 opacity-40" />
              </div>
              <p className="text-sm font-semibold mb-1">No metal assets yet</p>
              <p className="text-xs text-center max-w-xs">Track your gold, silver, platinum & palladium holdings with live spot pricing.</p>
              <button
                onClick={() => { setEditAsset(null); setAddOpen(true); }}
                className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add First Asset
              </button>
            </div>
          }
        />
      </div>
    </>
  );
}
