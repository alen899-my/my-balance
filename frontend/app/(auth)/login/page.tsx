"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    if (!identifier || !password) {
      alert("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        alert(data.detail || "Invalid credentials");
      }
    } catch (error) {
      console.error(error);
      alert("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="gov-panel" style={{ width: "100%", maxWidth: "420px", padding: "40px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Brand Logo & Header */}
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <p style={{
            color: "var(--text-primary)",
            fontWeight: 800,
            fontSize: "28px",
            lineHeight: 1.2,
            letterSpacing: "-0.04em",
            fontFamily: "var(--font-geist-sans), sans-serif",
            background: "linear-gradient(to right, #cfd8dc, #ffffff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "16px"
          }}>
            my<span style={{ color: "var(--brand)", WebkitTextFillColor: "initial" }}>balance</span>
          </p>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px", letterSpacing: "-0.02em" }}>
            Welcome back
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Enter your credentials to access your secure vault.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Identifier Field */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
              Account ID
            </label>
            <div style={{ position: "relative" }}>
              <Mail style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--text-muted)" }} />
              <input
                placeholder="Email or Phone number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="gov-input"
                style={{ width: "100%", paddingLeft: "36px" }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                Password
              </label>
              <Link href="#" style={{ fontSize: "12px", color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}>
                Forgot?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <Lock style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--text-muted)" }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="gov-input"
                style={{ width: "100%", paddingLeft: "36px" }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="gov-btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "10px", marginTop: "8px" }}
        >
          {isLoading ? "Verifying..." : (
            <>
              Sign in to Dashboard
              <ArrowRight style={{ width: "16px", height: "16px" }} />
            </>
          )}
        </button>

        <div style={{ position: "relative", textAlign: "center", margin: "16px 0" }}>
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "var(--border-default)" }}></div>
          <span style={{ position: "relative", background: "var(--bg-surface)", padding: "0 12px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
            New to the platform?
          </span>
        </div>

        <Link
          href="/signup"
          className="gov-btn-secondary"
          style={{ width: "100%", justifyContent: "center", padding: "10px", textDecoration: "none" }}
        >
          Create a secure account
        </Link>
      </div>
    </div>
  );
}