"use client";

import React from "react";
import { Search, Bell, Menu, User } from "lucide-react";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="h-16 sticky top-0 z-30 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6">
      <div className="h-full flex items-center justify-between gap-4">
        
        {/* Left: Mobile Menu & Search */}
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={onMenuClick}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
          >
            <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          </button>
          
          <div className="relative max-w-xs w-full hidden md:block group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
            <input 
              type="text" 
              placeholder="Quick search..." 
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
        </div>

        {/* Right: User Actions */}
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>
          
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>
          
          <button className="flex items-center gap-3 p-1 pl-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 transition-all">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none">Admin</p>
              <p className="text-[10px] text-emerald-500 font-medium mt-1">Active</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <User className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}