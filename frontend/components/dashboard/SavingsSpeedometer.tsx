"use client";

import React from "react";
import { motion } from "framer-motion";
import { PiggyBank, TrendingUp, Info } from "lucide-react";

interface SavingsSpeedometerProps {
  income: number;
  expenses: number;
}

export default function SavingsSpeedometer({ income, expenses }: SavingsSpeedometerProps) {
  // Logic: (Income - Expenses) / Income * 100
  const savings = Math.max(0, income - expenses);
  const rate = income > 0 ? (savings / income) * 100 : 0;

  // Gauge Configuration
  const radius = 85;
  const circumference = radius * Math.PI; // Semicircle
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  // Dynamic Color Logic
  const getGaugeColor = () => {
    if (rate < 15) return "stroke-rose-500";
    if (rate < 30) return "stroke-amber-500";
    if (rate < 50) return "stroke-violet-500";
    return "stroke-emerald-500";
  };

  const getStatusLabel = () => {
    if (rate < 15) return { text: "Critical", color: "text-rose-500" };
    if (rate < 30) return { text: "Healthy", color: "text-amber-500" };
    if (rate < 50) return { text: "Elite", color: "text-violet-500" };
    return { text: "Max Performance", color: "text-emerald-500" };
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-xl relative overflow-hidden flex flex-col items-center justify-center group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-6">
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
           <PiggyBank className="w-5 h-5" />
        </div>
      </div>

      <div className="text-center mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Savings Efficiency</h3>
        <p className="text-sm font-bold text-slate-900 dark:text-white">Live Speedometer</p>
      </div>

      <div className="relative flex items-center justify-center">
        <svg width="220" height="130" viewBox="0 0 200 120" className="rotate-0">
          {/* Background Track */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinecap="round"
            className="text-slate-100 dark:text-slate-800"
          />
          {/* Progress Track */}
          <motion.path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            strokeWidth="16"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, ease: "circOut" }}
            style={{ strokeDasharray: circumference }}
            className={`${getGaugeColor()} drop-shadow-[0_0_12px_rgba(139,92,246,0.2)]`}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <motion.span 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white"
          >
            {Math.round(rate)}%
          </motion.span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${getStatusLabel().color}`}>
            {getStatusLabel().text}
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 grid grid-cols-2 gap-4 w-full pt-6 border-t border-slate-100 dark:border-slate-800">
        <div className="text-center border-r border-slate-100 dark:border-slate-800">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Surplus</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">₹{savings.toLocaleString()}</p>
        </div>
        <div className="text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</p>
            <p className="text-sm font-black text-violet-500">20%+</p>
        </div>
      </div>
    </div>
  );
}