"use client";

import React, { useState } from "react";
import { 
  LayoutDashboard, FileText, BarChart3, 
  Users, Settings, ChevronRight, Sparkles, X 
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: FileText, label: "Statements", href: "/statements" },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: Users, label: "Team", href: "/team" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 z-40 transition-opacity lg:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
      />

      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 lg:sticky lg:top-0 h-screen
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-20" : "lg:w-64 w-64"}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {/* Violet themed logo box */}
              <div className="bg-violet-600 p-1.5 rounded-lg shadow-lg shadow-violet-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className={`font-bold text-lg dark:text-white tracking-tight ${isCollapsed ? "lg:hidden" : "block"}`}>
                FinTrack
              </span>
            </div>
            <button onClick={() => setIsOpen(false)} className="lg:hidden p-1">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                    ${isActive 
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" 
                      : "text-slate-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400"
                    }`}
                >
                  <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-white" : "group-hover:text-violet-600 dark:group-hover:text-violet-400"}`} />
                  <span className={`text-sm font-semibold transition-all ${isCollapsed ? "lg:hidden" : "block"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Collapse Toggle (Desktop Only) */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 hidden lg:block">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex items-center justify-center p-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg text-slate-400 hover:text-violet-600 transition-colors"
            >
              <ChevronRight className={`w-5 h-5 transition-transform ${!isCollapsed && "rotate-180"}`} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}