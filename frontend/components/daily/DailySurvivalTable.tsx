"use client";
import React from "react";
import { Eye, Trash2, ShoppingBag, Coffee, Car, Home, Receipt, Layers } from "lucide-react";

export default function DailySurvivalTable({ items, onView, onDelete }: any) {
  const getIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes("food") || c.includes("lunch") || c.includes("dinner")) return <Coffee className="w-4 h-4" />;
    if (c.includes("travel") || c.includes("uber") || c.includes("fuel")) return <Car className="w-4 h-4" />;
    if (c.includes("rent") || c.includes("home")) return <Home className="w-4 h-4" />;
    return <ShoppingBag className="w-4 h-4" />;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Table Header */}
          <thead className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Transaction Details
              </th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 text-right">
                Amount
              </th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 text-center">
                Management
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {items.length > 0 ? (
              items.map((item: any) => (
                <tr 
                  key={item._id} 
                  className="group hover:bg-slate-50/80 dark:hover:bg-violet-900/10 transition-all duration-200"
                >
                  {/* Category & Icon */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300 ${
                        item.type === 'income' 
                        ? 'bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-orange-100/50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                      }`}>
                        {getIcon(item.category)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-5 text-right">
                    <span className={`text-base font-black tabular-nums tracking-tighter ${
                      item.type === 'income' 
                      ? 'text-emerald-500' 
                      : 'text-slate-900 dark:text-white'
                    }`}>
                      {item.type === 'income' ? '+' : '-'} ₹{item.amount.toLocaleString()}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-5">
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => onView(item)} 
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-xl transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(item._id)}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              /* Empty State */
              <tr>
                <td colSpan={3} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                    <Receipt className="w-10 h-10 text-slate-400" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                      No Records Dispatched
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer Decoration */}
      <div className="bg-slate-50/50 dark:bg-slate-950/50 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
         <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>
    </div>
  );
}