"use client";

import React, { useEffect, useState } from "react";
import { Search, Bell, Menu, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authFetch";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const [userName, setUserName] = useState("User");

  // Load user data on mount with API fallback
  useEffect(() => {
    async function fetchUser() {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.name) {
            setUserName(user.name);
            return; // Found in local storage, we're good
          }
        } catch (e) { console.error("Parse error", e); }
      }

      // Fallback: Fetch from API
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`);
        if (res.ok) {
          const user = await res.json();
          setUserName(user.name);
          // Update local storage so next time it's faster
          localStorage.setItem("user", JSON.stringify(user));
        }
      } catch (e) {
        console.error("Failed to load user profile", e);
      }
    }
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <header className="h-16 sticky top-0 z-30 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6">
      <div className="h-full flex items-center justify-between gap-4">

        {/* Left: Mobile Menu & Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg lg:hidden transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          </button>

          <div className="relative max-w-xs w-full hidden md:block group">

          </div>
        </div>

        {/* Right: User Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <button className="p-2 text-slate-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl relative group transition-colors">
            <Bell className="w-5 h-5 group-hover:text-violet-600 dark:group-hover:text-violet-400" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

          {/* Profile Section */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none">
                {userName}
              </p>
              <p className="text-[10px] text-violet-500 font-bold mt-1 uppercase tracking-tighter">Premium Account</p>
            </div>

            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
              <User className="w-5 h-5" />
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all group"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}