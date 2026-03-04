"use client";

import React from "react";
import {
  LayoutDashboard, FileText, BarChart3,
  CalendarDays, X, Building2, RefreshCw, Target
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", section: "Overview" },
  { icon: FileText, label: "Statements", href: "/statements", section: "Management" },
  { icon: CalendarDays, label: "Calendar", href: "/calendar", section: "Management" },
  { icon: RefreshCw, label: "Subscriptions", href: "/subscriptions", section: "Management" },
  { icon: Target, label: "Savings Goals", href: "/goals", section: "Management" },
  { icon: CalendarDays, label: "Daily", href: "/daily", section: "Management" },
  { icon: BarChart3, label: "Monthly", href: "/monthly", section: "Management" },
];

const sections = ["Overview", "Management"] as const;

export default function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Full-screen overlay — all screen sizes when open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 49,
          }}
        />
      )}

      {/* Sidebar — always fixed, always toggleable on every screen size */}
      <aside
        style={{
          position: "fixed",
          insetBlock: 0,
          left: 0,
          width: "240px",
          height: "100vh",
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-sidebar)",
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* ── Logo Band ── */}
        <div
          style={{
            height: "60px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 16px",
            borderBottom: "1px solid var(--border-sidebar)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div>
              <p style={{
                color: "#ededed",
                fontWeight: 800,
                fontSize: "18px",
                lineHeight: 1.2,
                letterSpacing: "-0.04em",
                fontFamily: "var(--font-geist-sans), sans-serif",
                background: "linear-gradient(to right, #cfd8dc, #ffffff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                my<span style={{ color: "#6366f1", WebkitTextFillColor: "initial" }}>balance</span>
              </p>
              <p style={{ color: "#444", fontSize: "9px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Finance System
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{ color: "#555", padding: "4px", borderRadius: "4px", background: "none", border: "none", cursor: "pointer", display: "flex" }}
          >
            <X style={{ width: "16px", height: "16px" }} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          {sections.map((section) => {
            const items = navItems.filter((i) => i.section === section);
            return (
              <div key={section} style={{ marginBottom: "8px" }}>
                <p style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#333", padding: "8px 16px 4px" }}>
                  {section}
                </p>
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      style={{
                        position: "relative",
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "8px 16px", margin: "1px 8px", borderRadius: "6px",
                        background: isActive ? "#6366f120" : "transparent",
                        border: `1px solid ${isActive ? "#6366f130" : "transparent"}`,
                        transition: "background 0.1s",
                        textDecoration: "none",
                      }}
                      className={!isActive ? "sidebar-link-hover" : ""}
                    >
                      {isActive && (
                        <span style={{
                          position: "absolute", left: "-8px", top: "6px", bottom: "6px",
                          width: "2px", background: "#6366f1", borderRadius: "0 2px 2px 0",
                        }} />
                      )}
                      <item.icon style={{ width: "16px", height: "16px", flexShrink: 0, color: isActive ? "#818cf8" : "#444" }} />
                      <span style={{ fontSize: "13px", fontWeight: isActive ? 500 : 400, color: isActive ? "#ededed" : "#666", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div style={{ borderTop: "1px solid var(--border-sidebar)", padding: "12px 16px", flexShrink: 0 }}>
          <p style={{ fontSize: "10px", color: "#333", fontWeight: 500 }}>mybalance</p>
        </div>
      </aside>

      <style>{`
        .sidebar-link-hover:hover { background: #1a1a1a !important; border-color: #2e2e2e !important; }
      `}</style>
    </>
  );
}