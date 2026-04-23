"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PiggyBank,
  CreditCard,
  BarChart3,
  Settings,
  X,
  FileText,
  CalendarDays,
  ClipboardList,
  Wallet,
  HandCoins,
  Gem,
  Home,
  TrendingUp,
  Bell,
  Landmark,
  Building2,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Grouped nav list ─────────────────────────────────────────────────────────────
const NAV = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { 
    label: "Banking", 
    icon: Building2, 
    subItems: [
      { label: "Banks", href: "/banks", icon: Building2 },
      { label: "Statements", href: "/statements", icon: FileText },
      { label: "Wallet", href: "/wallet", icon: Wallet },

    ]
  },
  { 
    label: "Tracking", 
    icon: BarChart3, 
    subItems: [
      { label: "Daily Tracker", href: "/daily", icon: ClipboardList },
            { label: "Bill Calendar", href: "/bill-calendar", icon: CalendarDays },
      { label: "Income", href: "/income", icon: TrendingUp },
      { label: "Budget Planner", href: "/budget", icon: PiggyBank },
    ]
  },
  { 
    label: "Assets ", 
    icon: Gem, 
    subItems: [
      { label: "Metals", href: "/metals", icon: Gem },
      { label: "Properties", href: "/properties", icon: Home },
      { label: "Lend / Borrow", href: "/lend-borrow", icon: HandCoins },
    ]
  },
  { 
    label: "Loans", 
    icon: CalendarDays, 
    subItems: [

      { label: "Subscriptions", href: "/my-subscriptions", icon: Bell },
      { label: "EMI Tracker", href: "/emi", icon: Landmark },
    ]
  },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface AppSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AppSidebar({ collapsed, mobileOpen, onMobileClose }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-40 hidden lg:flex flex-col",
          "border-r border-sidebar-border",
          "transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarBackground />
        <SidebarContent collapsed={collapsed} pathname={pathname} />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-40 flex lg:hidden flex-col w-64",
          "border-r border-sidebar-border",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarBackground />
        <div className="relative z-10 flex items-center justify-between px-4 h-14 border-b border-white/10 shrink-0">
          <BrandMark />
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="relative z-10 flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {NAV.map((item) => {
            if ("subItems" in item) {
              return (
                <NavGroup
                  key={item.label}
                  group={item}
                  pathname={pathname}
                  collapsed={false}
                  onClick={onMobileClose}
                />
              );
            }
            return (
              <NavItem
                key={item.href}
                item={item as any}
                active={pathname === item.href}
                collapsed={false}
                onClick={onMobileClose}
              />
            );
          })}
        </nav>
      </aside>
    </>
  );
}

/* ── Sidebar background ── */

function SidebarBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/auth/login.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />
      <div className="absolute inset-0 bg-[oklch(0.200_0.055_158_/_0.78)] dark:bg-[oklch(0.110_0.030_160_/_0.88)]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 50%, transparent 40%, oklch(0.08 0.020 160 / 0.5) 100%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-24"
        style={{
          background:
            "linear-gradient(to bottom, transparent, oklch(0.130 0.030 160 / 0.7))",
        }}
      />
    </div>
  );
}

/* ── Inner content ── */

function SidebarContent({
  collapsed,
  pathname,
}: {
  collapsed: boolean;
  pathname: string;
}) {
  return (
    <div className="relative z-10 flex flex-col h-full w-full">
      {/* Logo row */}
      <div
        className={cn(
          "flex items-center h-14 shrink-0 border-b border-white/10 px-4",
          collapsed ? "justify-center" : "gap-2.5"
        )}
      >
        <LogoMark />
        {!collapsed && (
          <span className="text-base font-bold tracking-tight text-white truncate">
            MyBalance
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1.5 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {NAV.map((item) => {
          if ("subItems" in item) {
            return (
              <NavGroup
                key={item.label}
                group={item}
                pathname={pathname}
                collapsed={collapsed}
              />
            );
          }
          return (
            <NavItem
              key={item.href}
              item={item as any}
              active={pathname === item.href}
              collapsed={collapsed}
            />
          );
        })}
      </nav>

      {/* Bottom version tag */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-[10px] text-white/25 tracking-widest uppercase">
            v1.0.0
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Nav Group Accordion ── */

function NavGroup({
  group,
  pathname,
  collapsed,
  onClick,
}: {
  group: any;
  pathname: string;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const isChildActive = group.subItems.some((s: any) => pathname.startsWith(s.href) && s.href !== "/dashboard");
  const [open, setOpen] = useState(isChildActive);
  const Icon = group.icon;

  return (
    <div className="flex flex-col gap-0.5 w-full">
      <button
        onClick={() => setOpen(!open)}
        title={collapsed ? group.label : undefined}
        className={cn(
          "flex items-center rounded-lg transition-all duration-150 group relative cursor-pointer w-full outline-none",
          collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 h-10",
          isChildActive && !open && !collapsed
            ? ["bg-white/5 text-white"]
            : ["text-white/60 hover:text-white hover:bg-white/10"]
        )}
      >
        <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
        
        {!collapsed && (
          <>
            <span className="text-[13px] font-semibold truncate flex-1 text-left tracking-wide">
              {group.label}
            </span>
            <ChevronRight 
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200 text-white/40", 
                open && "rotate-90 text-white"
              )} 
            />
          </>
        )}

        {/* Active Child Indicator for Collapsed State */}
        {isChildActive && collapsed && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-[oklch(0.200_0.055_158)] shadow-sm" />
        )}
      </button>

      {/* Expanded Sub-items */}
      <div 
        className={cn(
          "relative flex flex-col overflow-hidden transition-all duration-300",
          open && !collapsed ? "mt-1 opacity-100 max-h-96" : "max-h-0 opacity-0"
        )}
      >
        {/* The tree guide wrapper */}
        <div className="relative flex flex-col gap-0.5 ml-[20px] pl-3 py-1 pb-1 border-l border-white/15">
          {group.subItems.map((item: any) => (
            <NavItem
              key={item.href}
              item={item}
              active={pathname === item.href}
              collapsed={collapsed}
              onClick={onClick}
              isSub
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Nav item ── */

function NavItem({
  item,
  active,
  collapsed,
  onClick,
  isSub,
}: {
  item: any;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
  isSub?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center rounded-lg transition-all duration-150 group relative w-full",
        collapsed 
          ? "justify-center h-10 w-10 mx-auto" 
          : cn("gap-3", isSub ? "px-3 py-1 h-8" : "px-3 h-10"),
        active
          ? ["bg-white/15 text-white", isSub ? "" : "ring-1 ring-inset ring-white/20"]
          : ["text-white/55 hover:text-white hover:bg-white/10"]
      )}
    >
      {/* Active Indicator Bar (Top Level) */}
      {active && !collapsed && !isSub && (
        <span className="absolute left-2 h-5 w-0.5 rounded-full bg-primary" />
      )}

      {/* Sub menu active indicator dot on the horizontal branch */}
      {active && !collapsed && isSub && (
        <span className="absolute left-[-2px] h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)] z-10" />
      )}

      {/* Tree Horizontal Branch Line */}
      {!collapsed && isSub && (
        <div className="absolute left-[-12px] top-1/2 w-3 border-t border-white/15 pointer-events-none" />
      )}

      {/* Item Icon (Only for top-level, hidden for sub-items) */}
      {!isSub && (
        <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
      )}

      {/* Label */}
      {!collapsed && (
        <span className={cn("font-medium truncate tracking-wide", isSub ? "text-[13px] opacity-80 group-hover:opacity-100 transition-opacity" : "text-sm ml-0")}>
          {item.label}
        </span>
      )}

      {/* Active dot for collapsed mode */}
      {active && collapsed && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-[oklch(0.200_0.055_158)] shadow-sm" />
      )}
    </Link>
  );
}

/* ── Brand ── */

function LogoMark() {
  return (
    <span
      className="h-8 w-8 flex items-center justify-center shrink-0 overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logos/wallet.png"
        alt="MyBalance"
        className="h-full w-full object-contain"
        draggable={false}
      />
    </span>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-sm font-bold tracking-tight text-white">MyBalance</span>
    </div>
  );
}