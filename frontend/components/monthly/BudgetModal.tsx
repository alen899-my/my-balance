"use client";
import React, { useState, useEffect } from "react";
import { X, Calculator, Plus, Trash2 } from "lucide-react";

export default function BudgetModal({ isOpen, onClose, onSave }: any) {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number>(0);

  const [showCalculator, setShowCalculator] = useState(false);
  const [calcRows, setCalcRows] = useState<{ label: string; value: string }[]>([
    { label: "Rate", value: "" },
    { label: "Qty", value: "" }
  ]);

  useEffect(() => {
    if (showCalculator) {
      const hasValid = calcRows.some(r => r.value && !isNaN(parseFloat(r.value)));
      if (!hasValid) {
        setAmount(0);
        return;
      }
      const total = calcRows.reduce((acc, row) => {
        const val = parseFloat(row.value);
        if (!row.value || isNaN(val)) return acc;
        return acc * val;
      }, 1);
      setAmount(total);
    }
  }, [calcRows, showCalculator]);

  if (!isOpen) return null;

  function addRow() { setCalcRows([...calcRows, { label: "", value: "" }]); }
  function removeRow(index: number) {
    if (calcRows.length <= 1) return;
    setCalcRows(calcRows.filter((_, i) => i !== index));
  }
  function updateRow(index: number, field: "label" | "value", newValue: string) {
    const newRows = [...calcRows];
    newRows[index] = { ...newRows[index], [field]: newValue };
    setCalcRows(newRows);
  }

  function handleSave() {
    const payload: any = {
      category,
      title,
      amount
    };
    if (showCalculator) {
      payload.calculation_rows = calcRows.map(r => ({
        label: r.label || "Factor",
        value: parseFloat(r.value) || 0
      }));
    }
    onSave(payload);
    setCategory(""); setTitle(""); setAmount(0);
    setCalcRows([{ label: "Rate", value: "" }, { label: "Qty", value: "" }]);
    setShowCalculator(false);
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

      {/* MODERN SCROLLBAR STYLING:
          Using 'scrollbar-thin' and custom colors.
          The overflow container is refined to hide the 'clunky' default bars.
      */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">

        {/* Fixed Header */}
        <div className="flex justify-between items-center p-6 md:p-8 pb-0 shrink-0">
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">Add Budget Item</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Survival Inventory</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 md:p-8 pt-6 space-y-5 overflow-y-auto flex-1 mr-1 mb-1 rounded-[2rem]
          [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-100 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-200 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-700 transition-all">

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2">Category</label>
            <input
              type="text" placeholder="e.g. Groceries"
              value={category}
              className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-1 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-bold"
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2">Description</label>
            <input
              type="text" placeholder="e.g. Weekly Eggs"
              value={title}
              className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-1 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2">Total Amount (₹)</label>
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-xl transition-all border ${showCalculator ? "bg-violet-600 text-white border-violet-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"}`}
              >
                {showCalculator ? "Calculator Active" : "Multiplier"}
              </button>
            </div>

            {!showCalculator ? (
              <input
                type="number" placeholder="0"
                value={amount || ""}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-1 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-2xl font-black transition-all"
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            ) : (
              <div className="space-y-3 p-5 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-200 dark:border-slate-800/50">
                {calcRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text" placeholder="Factor"
                      value={row.label}
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      onChange={(e) => updateRow(i, 'label', e.target.value)}
                    />
                    <span className="text-xs font-black text-slate-400">×</span>
                    <input
                      type="number" placeholder="0"
                      value={row.value}
                      className="w-24 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      onChange={(e) => updateRow(i, 'value', e.target.value)}
                    />
                    <button onClick={() => removeRow(i)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

              

                <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 mt-2">
                  <span className="text-[10px] font-black uppercase text-slate-500">Subtotal</span>
                  <span className="text-2xl font-black text-violet-600 dark:text-violet-400 leading-none">₹{amount.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            className="w-full py-5 bg-violet-600 hover:bg-violet-700 text-white rounded-[1.8rem] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-violet-500/25 active:scale-[0.98] mt-4"
          >
            <Plus className="w-5 h-5" /> Add Requirement
          </button>
        </div>
      </div>
    </div>
  );
}