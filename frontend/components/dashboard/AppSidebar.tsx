"use client";

import React from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Flat nav list ─────────────────────────────────────────────────────────────
const NAV = [
  { label: "Overview",      href: "/dashboard",                  icon: LayoutDashboard },
  { label: "Statements",    href: "/statements",                  icon: FileText        },
  { label: "Bill Calendar", href: "/bill-calendar",              icon: CalendarDays    },
  { label: "Daily Tracker", href: "/daily",                       icon: ClipboardList   },
  { label: "Budget Planner", href: "/budget",                     icon: PiggyBank       },
  { label: "Wallet",         href: "/wallet",                      icon: Wallet          },
  { label: "Lend / Borrow",  href: "/lend-borrow",                  icon: HandCoins       },
  { label: "Metals",         href: "/metals",                       icon: Gem             },
  { label: "Properties",     href: "/properties",                   icon: Home            },
  { label: "Income",          href: "/income",                        icon: TrendingUp      },
  { label: "Subscriptions",   href: "/my-subscriptions",              icon: Bell            },
  { label: "Savings",       href: "/dashboard/savings",           icon: PiggyBank       },
  { label: "Cards",         href: "/dashboard/cards",             icon: CreditCard      },
  { label: "Analytics",     href: "/dashboard/analytics",         icon: BarChart3       },
  { label: "Settings",      href: "/settings",                    icon: Settings        },
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
          "transition-all duration-300 ease-in-out overflow-hidden",
          collapsed ? "w-16" : "w-60"
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
        <nav className="relative z-10 flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={pathname === item.href}
              collapsed={false}
              onClick={onMobileClose}
            />
          ))}
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
    <div className="relative z-10 flex flex-col h-full">
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
            Vaultly
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname === item.href}
            collapsed={collapsed}
          />
        ))}
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

/* ── Nav item ── */

function NavItem({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: (typeof NAV)[0];
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center rounded-lg transition-all duration-150 group relative",
        collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 h-10",
        active
          ? ["bg-white/15 text-white", "ring-1 ring-inset ring-white/20"]
          : ["text-white/55 hover:text-white hover:bg-white/10"]
      )}
    >
      {/* Active indicator bar */}
      {active && !collapsed && (
        <span className="absolute left-2 h-5 w-0.5 rounded-full bg-primary" />
      )}

      <Icon className="h-4 w-4 shrink-0" />

      {!collapsed && (
        <span className="text-sm font-medium truncate">{item.label}</span>
      )}

      {/* Active dot for collapsed mode */}
      {active && collapsed && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
      )}
    </Link>
  );
}

/* ── Brand ── */

function LogoMark() {
  return (
    <span className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        className="h-3.5 w-3.5 text-primary-foreground"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    </span>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <LogoMark />
      <span className="text-sm font-bold tracking-tight text-white">Vaultly</span>
    </div>
  );
}