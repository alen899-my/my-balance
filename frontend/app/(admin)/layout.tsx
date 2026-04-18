"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AppSidebar
        collapsed={!sidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          sidebarOpen ? "lg:ml-60" : "lg:ml-16"
        )}
      >
        <AppHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 px-5 py-6 md:px-8 md:py-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}