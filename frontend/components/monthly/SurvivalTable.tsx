"use client";

import React from "react";
import {
  Eye, Edit3, Trash2, CheckCircle2, Circle,
  ListTodo
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
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden flex flex-col">

      {/* --- HEADER SECTION --- */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 relative overflow-hidden shrink-0">
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

      {/* --- SCROLLABLE TABLE CONTAINER --- */}
      <div className="overflow-x-auto overflow-y-auto h-[500px] 
        [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-violet-500 transition-all">

        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm">
              <th className="p-5 text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-[0.2em] w-20 text-center">Done</th>
              <th className="p-5 text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-[0.2em]">Category Details</th>
              <th className="p-5 text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-[0.2em] text-right">Amount</th>
              <th className="p-5 text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-[0.2em] text-center">Manage</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item._id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-200">
                  <td className="p-5 text-center">
                    <button
                      onClick={() => onToggle(item._id)}
                      className={`transition-all duration-300 transform active:scale-75 ${
                        item.is_completed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700 hover:text-violet-500'
                      }`}
                    >
                      {item.is_completed ? (
                        <CheckCircle2 className="w-6 h-6 fill-emerald-500/10" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className={`font-black text-sm tracking-tight ${
                        item.is_completed ? 'text-slate-400 line-through opacity-60' : 'text-slate-900 dark:text-white'
                      }`}>
                        {item.category}
                      </span>
                      {item.title && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          {item.title}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <span className={`text-base font-black tracking-tighter tabular-nums ${
                      item.is_completed ? 'text-slate-300 dark:text-slate-600' : 'text-slate-900 dark:text-white'
                    }`}>
                      ₹{(item.amount || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* View Button - Always Violet */}
                      <button 
                        onClick={() => onView(item)} 
                        className="p-2 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 rounded-xl transition-all shadow-sm border border-violet-100/50 dark:border-violet-500/20"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {/* Edit Button - Always Blue */}
                      <button 
                        onClick={() => onEdit(item)} 
                        className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-all shadow-sm border border-blue-100/50 dark:border-blue-500/20"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      {/* Delete Button - Always Rose */}
                      <button 
                        onClick={() => onDelete(item._id)} 
                        className="p-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl transition-all shadow-sm border border-rose-100/50 dark:border-rose-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                      <ListTodo className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory is Empty</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- FOOTER DECORATION --- */}
      <div className="p-3 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 text-center shrink-0">
        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
      </div>
    </div>
  );
}