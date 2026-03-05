"use client";

import React, { useEffect, useState } from "react";
import { Bell, Menu, LogOut, ChevronDown, User2, Settings } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import ProfileSettingsModal from "./ProfileSettingsModal";

const routeLabels: Record<string, string> = {
  "/dashboard": "Executive Summary",
  "/statements": "Statements & Transactions",
  "/calendar": "Monthly Wealth Calendar",
  "/daily": "Daily Tracking",
  "/monthly": "Monthly Budget Planner",
  "/subscriptions": "Subscriptions & Bills",
  "/goals": "Savings Goals & Vaults",
};

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.name) setUserName(user.name);
          if (user.email) setUserEmail(user.email);
          if (user.phone) setUserPhone(user.phone);
          if (user.profile_picture) setUserAvatar(user.profile_picture);
        } catch (e) { console.error("Parse error", e); }
      }
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`);
        if (res.ok) {
          const user = await res.json();
          setUserName(user.name);
          setUserEmail(user.email || "");
          setUserPhone(user.phone || "");
          setUserAvatar(user.profile_picture || null);
          localStorage.setItem("user", JSON.stringify(user));
        }
      } catch (e) { console.error("Failed to load user profile", e); }
    }
    fetchUser();
  }, []);

  const handleProfileSaved = (newName: string, newEmail: string, newPhone: string, newAvatar: string | null) => {
    setUserName(newName);
    setUserEmail(newEmail);
    setUserPhone(newPhone);
    setUserAvatar(newAvatar);

    // Update local storage so it persists between reloads
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        user.name = newName;
        user.email = newEmail;
        user.phone = newPhone;
        user.profile_picture = newAvatar;
        localStorage.setItem("user", JSON.stringify(user));
      } catch (e) { }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const currentLabel = routeLabels[pathname] ?? "Dashboard";

  return (
    <header
      style={{
        height: "60px",
        background: "var(--bg-header)",
        borderBottom: "1px solid var(--border-default)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        position: "sticky",
        top: 0,
        zIndex: 30,
        flexShrink: 0,
        gap: "12px",
      }}
    >
      {/* ── Left: hamburger + Breadcrumb ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        {/* Hamburger — always visible, toggles sidebar */}
        <button
          onClick={onMenuClick}
          style={{
            padding: "6px",
            borderRadius: "6px",
            border: "1px solid var(--border-default)",
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <Menu style={{ width: "18px", height: "18px" }} />
        </button>

        {/* Page breadcrumb */}
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: "10px", fontWeight: 500,
              textTransform: "uppercase", letterSpacing: "0.1em",
              color: "var(--text-muted)", lineHeight: 1,
            }}
          >
            Finance System
          </p>
          <h1
            style={{
              fontSize: "14px", fontWeight: 600,
              color: "var(--text-primary)", lineHeight: 1.3,
              marginTop: "2px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}
          >
            {currentLabel}
          </h1>
        </div>
      </div>

      {/* ── Right: Actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>

        {/* Notification Bell */}
        <button
          style={{
            position: "relative",
            padding: "7px",
            borderRadius: "6px",
            border: "1px solid var(--border-default)",
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
          title="Notifications"
        >
          <Bell style={{ width: "16px", height: "16px" }} />
          <span
            style={{
              position: "absolute", top: "7px", right: "7px",
              width: "6px", height: "6px",
              background: "var(--danger)",
              borderRadius: "50%",
              border: "1.5px solid var(--bg-header)",
            }}
          />
        </button>

        {/* Divider */}
        <div style={{ width: "1px", height: "24px", background: "var(--border-default)" }} />

        {/* User Profile Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 10px 5px 5px",
              borderRadius: "6px",
              border: "1px solid var(--border-default)",
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
              cursor: "pointer",
              transition: "background 0.12s",
            }}
            className="header-user-btn"
          >
            <div
              style={{
                width: "28px", height: "28px",
                borderRadius: "50%",
                background: "var(--brand-light)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden"
              }}
            >
              {userAvatar ? (
                <img src={userAvatar} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <User2 style={{ width: "14px", height: "14px", color: "var(--brand)" }} />
              )}
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                {userName}
              </p>
              <p style={{ fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.2 }}>
                Account
              </p>
            </div>
            <ChevronDown
              style={{
                width: "13px", height: "13px",
                color: "var(--text-muted)",
                transform: showUserMenu ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 49 }}
                onClick={() => setShowUserMenu(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  background: "#111",
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-dropdown)",
                  minWidth: "180px",
                  zIndex: 50,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border-light)",
                  }}
                >
                  <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                    {userName}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Account Holder</p>
                </div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setIsProfileModalOpen(true);
                  }}
                  style={{
                    width: "100%",
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "10px 14px",
                    background: "transparent", border: "none", borderBottom: "1px solid var(--border-light)",
                    cursor: "pointer",
                    fontSize: "13px", fontWeight: 500,
                    color: "var(--text-primary)",
                    transition: "background 0.1s",
                    textAlign: "left",
                  }}
                  className="dropdown-item-hover"
                >
                  <Settings style={{ width: "14px", height: "14px", color: "var(--text-muted)" }} />
                  Profile Settings
                </button>

                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "10px 14px",
                    background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", border: "none",
                    cursor: "pointer",
                    fontSize: "13px", fontWeight: 500,
                    color: "var(--danger)",
                    transition: "background 0.1s",
                    textAlign: "left",
                  }}
                  className="logout-btn-hover"
                >
                  <LogOut style={{ width: "14px", height: "14px" }} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialName={userName}
        initialEmail={userEmail}
        initialPhone={userPhone}
        initialAvatar={userAvatar}
        onSaved={handleProfileSaved}
      />

      <style>{`
        .header-user-btn:hover { background: #1a1a1a !important; }
        .dropdown-item-hover:hover { background: var(--bg-surface) !important; }
        .logout-btn-hover:hover { background: var(--danger-bg) !important; }
      `}</style>
    </header>
  );
}