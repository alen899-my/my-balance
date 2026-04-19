"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, MoreHorizontal, Edit3, Trash2, Eye, Image as ImageIcon, MapPin, Building, Home, UploadCloud, X, Camera, ArrowUpRight, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal, ModalFooterActions } from "@/components/common/Modal";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/Forminput";
import { Select } from "@/components/ui/Select";
import getSymbolFromCurrency from "currency-symbol-map";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface PropertyEntry {
  _id: string;
  type: string;
  title: string;
  cent_area?: number;
  purchase_price: number;
  current_value?: number;
  purchase_date: string;
  image_url?: string;
  note?: string;
}

// --- Constants ---

const ASSET_TYPES = [
  { label: "Land / Plot", value: "Land", realEstate: true },
  { label: "Building / House", value: "Building", realEstate: true },
  { label: "Electronics / Gadgets", value: "Electronics", realEstate: false },
  { label: "Vehicle", value: "Vehicle", realEstate: false },
  { label: "Other", value: "Others", realEstate: false },
];

const REAL_ESTATE_TYPES = ASSET_TYPES.filter(t => t.realEstate).map(t => t.value);

// ─── Entry Modal ─────────────────────────────────────────────────────────────

function PropertyEntryModal({
  open,
  onClose,
  onSuccess,
  editEntry,
  currencySymbol,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editEntry?: PropertyEntry | null;
  currencySymbol: string;
}) {
  const [type, setType] = useState("Land");
  const [customType, setCustomType] = useState("");
  const [title, setTitle] = useState("");
  const [centArea, setCentArea] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editEntry) {
      const knownType = ASSET_TYPES.find(t => t.value === editEntry.type);
      if (knownType) {
        setType(editEntry.type);
        setCustomType("");
      } else {
        setType("Others");
        setCustomType(editEntry.type);
      }

      setTitle(editEntry.title);
      setCentArea(editEntry.cent_area ? String(editEntry.cent_area) : "");
      setPurchasePrice(String(editEntry.purchase_price));
      setCurrentValue(editEntry.current_value ? String(editEntry.current_value) : "");
      setPurchaseDate(editEntry.purchase_date ? editEntry.purchase_date.split("T")[0] : "");
      setNote(editEntry.note || "");
      setPreviewUrl(editEntry.image_url || null);
    } else {
      setType("Land");
      setCustomType("");
      setTitle("");
      setCentArea("");
      setPurchasePrice("");
      setCurrentValue("");
      setPurchaseDate(new Date().toISOString().split("T")[0]);
      setNote("");
      setPreviewUrl(null);
    }
    setImageFile(null);
    setError(null);
  }, [editEntry, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!purchasePrice) { setError("Purchase price is required."); return; }

    setLoading(true);
    let finalImageUrl = previewUrl; // Use existing URL by default

    try {
      // 1. Upload image if new file is selected
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload image");
        }
        const blobData = await uploadRes.json();
        finalImageUrl = blobData.url;
      }

      // 2. Save Data
      const token = localStorage.getItem("token");
      const finalType = type === "Others" ? customType.trim() : type;

      if (type === "Others" && !customType.trim()) {
        throw new Error("Please specify the custom type.");
      }

      const payload = {
        type: finalType,
        title: title.trim(),
        cent_area: REAL_ESTATE_TYPES.includes(type) && centArea ? parseFloat(centArea) : null,
        purchase_price: parseFloat(purchasePrice),
        current_value: currentValue ? parseFloat(currentValue) : null,
        purchase_date: new Date(purchaseDate).toISOString(),
        note: note.trim() || null,
        image_url: finalImageUrl,
      };

      const url = editEntry
        ? `${API_BASE_URL}/properties/${editEntry._id}`
        : `${API_BASE_URL}/properties/`;

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
    <Modal open={open} onClose={onClose} title={editEntry ? "Edit Property" : "Add Property"} size="md">
      <div className="flex flex-col gap-4 py-1">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <X className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Image Upload Area */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Property Image</label>
          <div
            className={cn(
              "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all duration-300",
              previewUrl ? "border-primary/50 bg-muted/20" : "border-border hover:bg-muted/40"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <>
                {/* Background blur for vertical images */}
                <img src={previewUrl} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl opacity-20 scale-110" />
                <img src={previewUrl} alt="Preview" className="relative z-10 max-w-full max-h-full object-contain" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-20">
                  <span className="text-white text-xs font-semibold flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Change Image
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Click to upload image</span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
        </div>

        {/* Basic Details */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Asset Category</label>
              <Select
                value={type}
                onChange={setType}
                options={ASSET_TYPES}
                placeholder="Select category"
              />
            </div>
            <FormInput label="Title/Name" value={title} onChange={e => setTitle(e.target.value)} placeholder={REAL_ESTATE_TYPES.includes(type) ? "e.g. Munnar Plot" : "e.g. MacBook Pro"} />
          </div>

          {type === "Others" && (
            <FormInput
              label="Specify Other Type"
              value={customType}
              onChange={e => setCustomType(e.target.value)}
              placeholder="e.g. Furniture, Gold, Art"
              autoFocus
            />
          )}
        </div>

        {/* Financials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput label={`Purchase Cost (${currencySymbol})`} type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="0.00" />
          <FormInput label={`Current Value (${currencySymbol}) (Est.)`} type="number" value={currentValue} onChange={e => setCurrentValue(e.target.value)} placeholder="0.00" hint="Optional" />
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REAL_ESTATE_TYPES.includes(type) && (
            <FormInput label="Area Size (in Cents/Sq.Ft)" type="number" value={centArea} onChange={e => setCentArea(e.target.value)} placeholder="e.g. 10.5" hint="Optional" />
          )}
          <FormInput label="Purchase Date" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
        </div>

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location / Note</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. Near highway, includes compound wall"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
          />
        </div>
      </div>

      <ModalFooterActions className="mt-4 pt-4 border-t border-border/40">
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} loading={loading}>
          {editEntry ? "Save Changes" : "Add Property"}
        </Button>
      </ModalFooterActions>
    </Modal>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────

function PropertyViewModal({
  open,
  onClose,
  entry,
  currencySymbol,
}: {
  open: boolean;
  onClose: () => void;
  entry: PropertyEntry | null;
  currencySymbol: string;
}) {
  if (!entry) return null;
  const appreciation = (entry.current_value || entry.purchase_price) - entry.purchase_price;

  return (
    <Modal open={open} onClose={onClose} title="Property Details" size="sm">
      <div className="flex flex-col gap-4 py-2">
        {entry.image_url ? (
          <div className="w-full min-h-[280px] max-h-[450px] border border-border/50 rounded-2xl overflow-hidden bg-muted/20 flex items-center justify-center relative shadow-inner">
            {/* Background blurred element for atmospheric look with vertical images */}
            <div className="absolute inset-0 overflow-hidden">
               <img src={entry.image_url} alt="" className="w-full h-full object-cover blur-2xl opacity-20 scale-110" aria-hidden="true" />
            </div>
            <img src={entry.image_url} alt={entry.title} className="relative z-10 max-w-full max-h-[450px] object-contain shadow-2xl" />
          </div>
        ) : (
          <div className="w-full h-32 border border-dashed rounded-2xl bg-muted/30 flex items-center justify-center text-muted-foreground/40">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}

        <div className="flex flex-col bg-card border rounded-xl overflow-hidden mt-1">
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">{entry.type}</p>
              <h3 className="text-lg font-black">{entry.title}</h3>
            </div>
            {entry.cent_area && (
              <span className="text-sm font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                {entry.cent_area} Area
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 divide-x border-b">
            <div className="p-4 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Purchase Cost</span>
              <span className="text-lg font-black tabular-nums">{currencySymbol}{entry.purchase_price.toLocaleString()}</span>
            </div>
            <div className="p-4 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Est. Value</span>
              {entry.current_value ? (
                <span className="text-lg text-primary font-black tabular-nums">{currencySymbol}{entry.current_value.toLocaleString()}</span>
              ) : (
                <span className="text-sm text-muted-foreground italic">Not set</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-1">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">Purchase Date:</span>
            <span className="font-semibold">{new Date(entry.purchase_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">Unrealized Gain:</span>
            <span className={cn("font-semibold", appreciation >= 0 ? "text-emerald-500" : "text-destructive")}>
              {appreciation >= 0 ? "+" : ""}{currencySymbol}{appreciation.toLocaleString()}
            </span>
          </div>
          {entry.note && (
            <div className="flex flex-col gap-1 mt-2 p-3 bg-muted/40 rounded-lg text-sm border text-foreground">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Note / Location</span>
              {entry.note}
            </div>
          )}
        </div>
      </div>
      <ModalFooterActions className="mt-2">
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </ModalFooterActions>
    </Modal>
  );
}

// ─── Card Action Menu ─────────────────────────────────────────────────────────

function CardActionMenu({
  onView,
  onEdit,
  onDelete
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute top-10 right-0 w-36 bg-background border border-border/80 rounded-xl shadow-xl z-50 p-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <button
            onClick={() => { setOpen(false); onView(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-lg transition-colors w-full text-left"
          >
            <Eye className="w-4 h-4 text-primary" /> View Details
          </button>
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-lg transition-colors w-full text-left"
          >
            <Edit3 className="w-4 h-4 text-primary" /> Edit
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors w-full text-left"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      )}
    </div>
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
  entry: PropertyEntry | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!entry) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/properties/${entry._id}`, {
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
    <Modal open={open} onClose={onClose} title="Delete Property" size="sm">
      <div className="py-2">
        <p className="text-sm text-muted-foreground">
          Remove <strong className="text-foreground">{entry?.title}</strong>? This action cannot be undone.
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

export function PropertiesTracker() {
  const [entries, setEntries] = useState<PropertyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [activeTab, setActiveTab] = useState<string>("All");

  const [addOpen, setAddOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<PropertyEntry | null>(null);
  const [editEntry, setEditEntry] = useState<PropertyEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<PropertyEntry | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/properties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.items || []);
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

  // Calculate stats
  const totalCost = entries.reduce((acc, curr) => acc + curr.purchase_price, 0);
  const estValue = entries.reduce((acc, curr) => acc + (curr.current_value || curr.purchase_price), 0);
  const appreciation = estValue - totalCost;

  const filteredEntries = entries.filter(e => activeTab === "All" || e.type === activeTab);

  const existingTypes = Array.from(new Set(entries.map(e => e.type)));
  const typeOptions = [
    { value: "All", label: "All Types" },
    ...existingTypes.map(t => ({ value: t, label: t }))
  ];

  const getIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("land") || t.includes("plot")) return <MapPin className="w-5 h-5 text-amber-500" />;
    if (t.includes("building") || t.includes("house") || t.includes("villa") || t.includes("home")) return <Building className="w-5 h-5 text-indigo-500" />;
    if (t.includes("electronics") || t.includes("laptop") || t.includes("gadget") || t.includes("smartphone")) return <Calculator className="w-5 h-5 text-sky-500" />;
    if (t.includes("vehicle") || t.includes("car") || t.includes("bike")) return <ArrowUpRight className="w-5 h-5 text-emerald-500" />;
    return <ImageIcon className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <>
      <PropertyEntryModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditEntry(null); }}
        onSuccess={fetchData}
        editEntry={editEntry}
        currencySymbol={currencySymbol}
      />
      <PropertyViewModal open={!!viewEntry} onClose={() => setViewEntry(null)} entry={viewEntry} currencySymbol={currencySymbol} />
      <DeleteModal open={!!deleteEntry} entry={deleteEntry} onClose={() => setDeleteEntry(null)} onSuccess={fetchData} />

      <div className="flex flex-col gap-6">
        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Invested", value: totalCost, icon: <MapPin />, color: "neutral" },
            { label: "Est. Current Value", value: estValue, icon: <Building />, color: "sky" },
            { label: "Unrealized Gain", value: appreciation, icon: <ArrowUpRight />, color: appreciation >= 0 ? "emerald" : "destructive" },
          ].map((card, i) => {
            const colorMap: Record<string, string> = {
              neutral: "text-foreground bg-muted/30 border-border shadow-sm",
              sky: "text-sky-500 bg-sky-500/10 border-sky-500/20 shadow-sm",
              emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-sm",
              destructive: "text-destructive bg-destructive/10 border-destructive/20 shadow-sm",
            };
            const cls = colorMap[card.color];
            return (
              <div key={i} className="flex flex-col p-5 rounded-2xl bg-card border border-border transition-all hover:border-primary/20 hover:shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground leading-tight">{card.label}</span>
                  <div className={cn("w-8 h-8 flex items-center justify-center rounded-xl border flex-shrink-0", cls)}>
                    {React.cloneElement(card.icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
                  </div>
                </div>
                <span className={cn("text-3xl font-black tabular-nums tracking-tight", cls.split(" ")[0])}>
                  {card.value >= 0 && card.label === "Unrealized Gain" ? "+" : ""}{currencySymbol}{Math.abs(card.value).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>

                {/* Subtle background glow based on color */}
                <div className={cn("absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-20", cls.split("bg-")[1]?.split("/")[0] ? `bg-${cls.split("bg-")[1]?.split("/")[0]}` : "bg-primary")} />
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-row items-center gap-3">
            <div className="w-48 z-20 relative">
              <Select
                value={activeTab}
                onChange={(val) => setActiveTab(val || "All")}
                options={typeOptions}
                placeholder="Filter by Type"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={() => setAddOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Property
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <span className="text-muted-foreground animate-pulse text-sm font-medium">Loading properties...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/20 border border-dashed rounded-3xl">
            <Building className="w-12 h-12 opacity-30 mb-4" />
            <p className="text-sm font-semibold text-foreground">No properties found</p>
            <p className="text-xs max-w-sm text-center mt-1">Add your real estate assets here to track their value over time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEntries.map(prop => (
              <div key={prop._id} className="group flex flex-col bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-border/80 transition-all relative overflow-hidden">

                {/* Image hero */}
                <div className="h-44 relative bg-muted/20 flex items-center justify-center overflow-hidden">
                  {prop.image_url ? (
                    <>
                      <img src={prop.image_url} alt="" className="absolute inset-0 w-full h-full object-cover blur-lg opacity-30 transition-transform duration-700 ease-in-out group-hover:scale-110" />
                      <img src={prop.image_url} alt={prop.title} className="relative z-10 max-w-full max-h-full object-contain transition-transform duration-700 ease-in-out group-hover:scale-105" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 to-muted opacity-80">
                      {getIcon(prop.type)}
                      <span className="text-[10px] uppercase tracking-widest font-bold mt-2 text-muted-foreground">No Image</span>
                    </div>
                  )}

                  {/* Glassmorphism gradient overlay at top for action menu visibility */}
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

                  {/* Actions inside absolute positioning */}
                  <div className="absolute top-3 right-3 z-10">
                    <CardActionMenu
                      onView={() => setViewEntry(prop)}
                      onEdit={() => { setEditEntry(prop); setAddOpen(true); }}
                      onDelete={() => setDeleteEntry(prop)}
                    />
                  </div>

                  {/* Floating Type Badge */}
                  <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 bg-background/95 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-wider text-foreground border border-border/50 shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
                    {React.cloneElement(getIcon(prop.type) as React.ReactElement<{ className?: string }>, { className: "w-3 h-3 text-primary" })}
                    {prop.type}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-extrabold text-lg text-foreground truncate flex-1 leading-tight">{prop.title}</h3>
                  </div>

                  {/* Pricing block in a soft container */}
                  <div className="flex items-center justify-between mt-1 bg-muted/30 p-3 rounded-xl border border-border/40">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Purchase Cost</span>
                      <span className="text-sm font-black tabular-nums">{currencySymbol}{prop.purchase_price.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                    </div>
                    {prop.current_value && (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-primary uppercase font-bold tracking-wider mb-0.5">Est. Value</span>
                        <span className="text-sm text-primary font-black tabular-nums">{currencySymbol}{prop.current_value.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                      </div>
                    )}
                  </div>

                  {/* Subtle info pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    {prop.cent_area && (
                      <span className="inline-flex text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border/80 bg-background px-2 py-1 rounded-md">
                        {prop.cent_area} Area
                      </span>
                    )}
                    <span className="inline-flex text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border/80 bg-background px-2 py-1 rounded-md">
                      Bought {new Date(prop.purchase_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {prop.note && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {prop.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
