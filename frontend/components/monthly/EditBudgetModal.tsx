"use client";
import React, { useState, useEffect } from "react";
import { X, Calculator, Save, Loader2 } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

export default function EditBudgetModal({ isOpen, onClose, item, onSave }: any) {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [units, setUnits] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setCategory(item.category);
      setAmount(item.amount_per_unit);
      setUnits(item.units);
    }
  }, [item]);

  async function handleUpdate() {
  setLoading(true);
  try {
    await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/${item._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" }, // Ensure headers are set
      body: JSON.stringify({ 
        category, 
        amount_per_unit: amount, // Match backend schema
        units: units 
      }),
    });
    onSave(); // This refreshes the list in MonthlyPage
    onClose();
  } catch (err) { 
    console.error("Update error:", err); 
  } finally { 
    setLoading(false); 
  }
}

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Modify Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Category Name</label>
            <input 
              type="text" value={category}
              className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent mt-1 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-bold"
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Amount</label>
              <input 
                type="number" value={amount}
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent mt-1 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-bold"
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Frequency</label>
              <input 
                type="number" value={units}
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent mt-1 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-bold"
                onChange={(e) => setUnits(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="p-4 bg-violet-50 dark:bg-violet-900/10 rounded-2xl flex justify-between items-center">
             <div className="flex items-center gap-2 text-violet-600">
               <Calculator className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase">Adjusted Total</span>
             </div>
             <span className="text-xl font-black text-violet-600">₹{(amount * units).toLocaleString()}</span>
          </div>

          <button 
            onClick={handleUpdate}
            disabled={loading}
            className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-violet-500/25"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}