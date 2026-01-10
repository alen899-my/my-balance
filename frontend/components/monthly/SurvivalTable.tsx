"use client";

import React from "react";
import { 
  Eye, Edit3, Trash2, CheckCircle2, Circle, 
  MoreHorizontal, Calculator, ListTodo
} from "lucide-react";

interface SurvivalTableProps {
  items: any[];
  onToggle: (id: string) => void;
  onView: (item: any) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

export default function SurvivalTable({ items, onToggle, onView, onEdit, onDelete }: SurvivalTableProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
      
      {/* --- INTEGRATED DARK HEADER --- */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 blur-[50px] rounded-full -mr-16 -mt-16" />
        
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-600/20 rounded-xl border border-violet-500/30">
              <ListTodo className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-[0.15em] text-[9px] text-violet-400 leading-none mb-1">Inventory of Needs</h3>
              <p className="text-[11px] font-bold text-slate-400 leading-none">Monthly survival requirements</p>
            </div>
          </div>
          
          <div className="px-3 py-1.5 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-violet-600/20">
            {items.length} Items Listed
          </div>
        </div>
      </div>

      {/* --- TABLE BODY --- */}
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            {/* THEME FIX: Matching violet tint background for headers */}
            <tr className="bg-violet-600/[0.04] dark:bg-violet-400/[0.02] border-b border-slate-100 dark:border-slate-800">
              <th className="p-5 text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-[0.2em] w-20 text-center">Done</th>
              <th className="p-5 text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-[0.2em]">Category Details</th>
              <th className="p-5 text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-[0.2em]">Cost Calculation</th>
              <th className="p-5 text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-[0.2em] text-right">Total Net</th>
              <th className="p-5 text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-[0.2em] text-center">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => (
              <tr key={item._id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-200">
                <td className="p-5 text-center">
                  <button 
                    onClick={() => onToggle(item._id)}
                    className={`transition-all duration-300 transform active:scale-75 ${
                      item.is_completed ? 'text-emerald-500' : 'text-slate-200 dark:text-slate-800 hover:text-violet-500'
                    }`}
                  >
                    {item.is_completed ? <CheckCircle2 className="w-6 h-6 fill-emerald-500/10" /> : <Circle className="w-6 h-6" />}
                  </button>
                </td>
                <td className="p-5">
                  <div className="flex flex-col">
                    <span className={`font-black text-sm tracking-tight ${item.is_completed ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                      {item.category}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Recurring Need</span>
                  </div>
                </td>
                <td className="p-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-full">
                    <Calculator className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">
                      ₹{item.amount_per_unit.toLocaleString()} × {item.units}
                    </span>
                  </div>
                </td>
                <td className="p-5 text-right">
                  <span className={`text-base font-black tracking-tighter ${item.is_completed ? 'text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                    ₹{(item.total_amount || 0).toLocaleString()}
                  </span>
                </td>
                <td className="p-5">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2">
                    <button onClick={() => onView(item)} className="p-2 text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(item._id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}