"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, Bell, ChevronDown, User, Pencil, LogOut, Eye, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { ProfileModal } from "./ProfileModal";

interface AppHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onMobileMenuClick: () => void;
}

export function AppHeader({
  sidebarOpen,
  onToggleSidebar,
  onMobileMenuClick,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 h-14 bg-background border-b border-border flex items-center px-4 gap-3">
      {/* Desktop sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="hidden lg:flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? (
          <PanelLeftClose className="h-4 w-4" />
        ) : (
          <PanelLeftOpen className="h-4 w-4" />
        )}
      </button>

      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuClick}
        className="flex lg:hidden items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Page breadcrumb / title */}
      <div className="flex-1 min-w-0">
        <Breadcrumb />
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <NotificationButton />
        <UserDropdown />
      </div>
    </header>
  );
}

/* ── Theme toggle ── */

function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-8 w-8" />;

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}

/* ── Breadcrumb ── */

function Breadcrumb() {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground hidden sm:block">Dashboard</span>
      <span className="text-muted-foreground/40 hidden sm:block">/</span>
      <span className="font-semibold text-foreground">Overview</span>
    </div>
  );
}

/* ── Notification button ── */

function NotificationButton() {
  return (
    <button className="relative h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
      <Bell className="h-4 w-4" />
    </button>
  );
}

function UserDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; initials: string; profile_picture?: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const loadUser = () => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser({
          name: parsed.name || "User",
          email: parsed.email || "",
          initials: parsed.name ? parsed.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : "UN",
          profile_picture: parsed.profile_picture
        });
      } catch (err) {
        console.error("Failed to parse user data", err);
      }
    }
  };

  useEffect(() => {
    loadUser();
    
    // Listen for profile updates from the modal
    window.addEventListener("user-updated", loadUser);
    return () => window.removeEventListener("user-updated", loadUser);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <ProfileModal open={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 h-9 transition-colors",
          "text-foreground hover:bg-muted",
          open && "bg-muted"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Avatar initials={user?.initials || "??"} src={user?.profile_picture} />
        <div className="hidden sm:flex flex-col items-start leading-none">
          <span className="text-[13px] font-semibold tracking-tight">{user?.name || "Loading..."}</span>
          <span className="text-[10px] text-muted-foreground">{user?.email}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 hidden sm:block",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={cn(
            "absolute right-0 top-[calc(100%+6px)] w-64 z-50",
            "bg-popover border border-border rounded-xl overflow-hidden",
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
        >
          {/* Profile header */}
          <div className="px-4 py-3.5 border-b border-border bg-muted/40">
            <div className="flex items-center gap-3">
              <Avatar initials={user?.initials || "??"} src={user?.profile_picture} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight text-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            <DropdownItem
              icon={<User className="h-3.5 w-3.5" />}
              label="Account Settings"
              description="Manage your profile and security"
              onClick={() => {
                setOpen(false);
                setIsProfileOpen(true);
              }}
            />
          </div>

          {/* Divider + sign out */}
          <div className="border-t border-border py-1.5">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left group hover:bg-destructive/8 transition-colors"
            >
              <span className="flex items-center justify-center h-7 w-7 rounded-md bg-destructive/10 text-destructive group-hover:bg-destructive/15 transition-colors shrink-0">
                <LogOut className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-destructive">Sign out</p>
                <p className="text-[10px] text-muted-foreground">End your session</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Dropdown item ── */

function DropdownItem({
  icon,
  label,
  description,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  href?: string;
  onClick: () => void;
}) {
  const content = (
    <>
      <span className="flex items-center justify-center h-7 w-7 rounded-md bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
    </>
  );

  const className = "flex w-full items-center gap-3 px-4 py-2.5 group hover:bg-muted transition-colors text-left";

  if (href) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

/* ── Avatar ── */

function Avatar({
  initials,
  src,
  size = "sm",
}: {
  initials: string;
  src?: string;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={cn(
        "rounded-lg bg-primary flex items-center justify-center shrink-0 font-bold text-primary-foreground select-none overflow-hidden",
        size === "sm" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-sm"
      )}
    >
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt={initials} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}