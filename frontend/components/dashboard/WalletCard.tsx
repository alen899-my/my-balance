import React from 'react';
import { Wallet, ChevronRight } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WalletCard({ balance, currencySymbol, loading }: { balance: number, currencySymbol: string, loading: boolean }) {
  return (
    <div className="relative w-full max-w-[340px] perspective-[1200px] group cursor-pointer border-transparent">
       {/* Main Wallet Base Container (Rich Cognac Leather) */}
       <div className="w-full h-56 bg-[#92400e] dark:bg-[#78350f] rounded-none relative border border-amber-600/30 overflow-hidden transition-all duration-500 group-hover:-translate-y-1">
           
           {/* Leather Texture & Noise Overlay */}
           <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/leather.png')] pointer-events-none" />
           <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

           {/* Inner pocket line */}
           <div className="absolute top-1/4 left-5 right-5 h-[2px] bg-amber-950/80 shadow-[0_1px_0_rgba(255,255,255,0.1)] pointer-events-none" />

           {/* Cards emerging from pocket */}
           <div className="absolute top-6 right-8 w-16 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg shadow-md border border-slate-500/30 transform group-hover:-translate-y-6 transition-transform duration-500 origin-bottom skew-x-2 rotate-6 z-0 flex flex-col justify-end p-1">
              <div className="h-2 w-full bg-slate-950/40 rounded-sm mb-1" /> 
           </div>
           
           <div className="absolute top-8 right-12 w-16 h-20 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg shadow-md border border-emerald-400/30 transform group-hover:-translate-y-8 group-hover:-translate-x-2 transition-transform duration-500 origin-bottom -skew-x-2 -rotate-3 z-0 flex flex-col justify-end p-1">
               <div className="h-2 w-full bg-emerald-950/40 rounded-sm mb-1" />
           </div>

           {/* Flap covering the bottom 70% */}
           <div className="absolute bottom-0 left-0 right-0 h-[70%] bg-gradient-to-b from-amber-700 to-amber-900 dark:from-amber-800 dark:to-amber-950 rounded-none shadow-[0_-5px_15px_rgba(0,0,0,0.25)] border-t border-amber-500/30 z-10 p-6 flex flex-col justify-end">
              
              {/* Inner stitch */}
              <div className="absolute inset-[6px] border border-dashed border-amber-300/20 rounded-[20px] pointer-events-none" />

              {/* Wallet content */}
              <div className="relative z-20 flex flex-col gap-1">
                 <div className="flex items-center gap-1.5 mb-1 text-amber-200">
                    <Wallet className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] opacity-80">My Purse</span>
                 </div>
                 
                 {loading ? (
                   <div className="h-9 flex items-center">
                     <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
                   </div>
                 ) : (
                   <span className="text-4xl font-black text-white tabular-nums tracking-tighter drop-shadow-lg">
                      {currencySymbol}{balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                   </span>
                 )}
                 
                 <div className="mt-2 flex items-center justify-between text-amber-200">
                    <span className="text-xs font-medium opacity-80 hover:opacity-100 transition-opacity">Available Balance</span>
                    <ChevronRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                 </div>
              </div>

               {/* Center Button Fastener (Gold snap button) */}
               <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 w-14 h-7 bg-amber-800 dark:bg-amber-900 rounded-b-xl shadow-inner border-b border-r border-l border-amber-600/30 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5),0_1px_2px_rgba(0,0,0,0.8)] border border-yellow-600/50" />
               </div>
           </div>
       </div>
    </div>
  );
}
