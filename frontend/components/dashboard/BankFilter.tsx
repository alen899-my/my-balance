"use client";

import React from "react";
import { motion } from "framer-motion";
import { Landmark, Check, Filter } from "lucide-react";

interface BankFilterProps {
    selectedBank: string;
    onBankChange: (bank: string) => void;
    availableBanks: string[]; 
}

export default function BankFilter({ selectedBank, onBankChange, availableBanks }: BankFilterProps) {
    // Standardize "All Banks" as the reset option
    const banks = ["All Banks", ...availableBanks];

    return (
        <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
            {/* Optional: Add a small filter icon at the start */}
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 shrink-0">
                <Filter className="w-4 h-4" />
            </div>

            {banks.map((bank, index) => {
                const isActive = selectedBank === bank;
                return (
                    <motion.button
                        // Use index + name for a unique key
                        key={`${bank}-${index}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onBankChange(bank)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 transition-all whitespace-nowrap text-[10px] font-black uppercase tracking-widest ${
                            isActive
                                ? "bg-violet-600 border-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                                : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-violet-500/30 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                        {isActive ? (
                            <Check className="w-3.5 h-3.5" />
                        ) : (
                            <Landmark className="w-3.5 h-3.5 opacity-40" />
                        )}
                        {bank}
                    </motion.button>
                );
            })}
        </div>
    );
}