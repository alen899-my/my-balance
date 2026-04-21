import React from 'react';
import { Wallet, ChevronRight, Loader2 } from 'lucide-react';

export function WalletCard({ balance, currencySymbol, loading }: { balance: number; currencySymbol: string; loading: boolean }) {
  return (
    <div className="relative w-full h-full group cursor-pointer min-h-[130px]">
      {/* Main wallet body — same min-height as StatCard */}
      <div className="w-full h-full min-h-[130px] bg-[#92400e] dark:bg-[#78350f] border border-amber-600/30 overflow-hidden transition-all duration-500 group-hover:-translate-y-0.5 relative">

        {/* Leather texture */}
        <div className="absolute inset-0 opacity-[0.2] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/leather.png')] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

        {/* Pocket divider line */}
        <div className="absolute top-[28%] left-4 right-4 h-[1.5px] bg-amber-950/80 shadow-[0_1px_0_rgba(255,255,255,0.08)] pointer-events-none" />

        {/* Decorative mini cards — only on wider screens */}
        <div className="hidden sm:block absolute top-3 right-5 w-10 h-12 bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-500/30 group-hover:-translate-y-3 transition-transform duration-500 rotate-6 z-0" />
        <div className="hidden sm:block absolute top-4 right-9  w-10 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-400/30 group-hover:-translate-y-5 group-hover:-translate-x-1 transition-transform duration-500 -rotate-3 z-0" />

        {/* Wallet flap — covers lower 65% */}
        <div className="absolute bottom-0 left-0 right-0 h-[65%] bg-gradient-to-b from-amber-700 to-amber-900 dark:from-amber-800 dark:to-amber-950 border-t border-amber-500/30 z-10 px-3 pb-3 pt-4 flex flex-col justify-end">

          {/* Stitch border */}
          <div className="absolute inset-[4px] border border-dashed border-amber-300/20 pointer-events-none" />

          {/* Content */}
          <div className="relative z-20 flex flex-col gap-0.5">
            {/* Label */}
            <div className="flex items-center gap-1 text-amber-200 mb-0.5">
              <Wallet className="w-2.5 h-2.5 shrink-0" />
              <span className="text-[8px] font-black uppercase tracking-[0.15em] opacity-80">My Purse</span>
            </div>

            {/* Balance */}
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
            ) : (
              <span className="text-lg sm:text-xl font-black text-white tabular-nums tracking-tighter drop-shadow leading-tight break-all">
                {currencySymbol}{balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-amber-200 mt-0.5">
              <span className="text-[9px] font-medium opacity-75">Available Balance</span>
              <ChevronRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </div>

          {/* Gold snap button */}
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-9 h-5 bg-amber-800 dark:bg-amber-900 rounded-b-xl border-b border-r border-l border-amber-600/30 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-yellow-600/50" />
          </div>
        </div>
      </div>
    </div>
  );
}

