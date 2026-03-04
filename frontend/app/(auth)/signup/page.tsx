"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, Lock, ArrowRight } from "lucide-react";

export default function Signup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  function update(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSignup() {
    if (form.password !== form.confirm_password) {
      alert("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/login");
      } else {
        const err = await res.json();
        alert(Array.isArray(err.detail) ? err.detail[0].msg : err.detail || "Signup failed");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="gov-panel" style={{ width: "100%", maxWidth: "480px", padding: "40px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>

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
            Secure Registration
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Join thousands of users managing their assets safely.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Name Field */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
              Full Name
            </label>
            <div style={{ position: "relative" }}>
              <User style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--text-muted)" }} />
              <input
                name="name"
                placeholder="John Doe"
                onChange={update}
                className="gov-input"
                style={{ width: "100%", paddingLeft: "36px" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--text-muted)" }} />
                <input
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  onChange={update}
                  className="gov-input"
                  style={{ width: "100%", paddingLeft: "36px" }}
                />
              </div>
            </div>

            {/* Phone Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                Phone Number
              </label>
              <div style={{ position: "relative" }}>
                <Phone style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--text-muted)" }} />
                <input
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  onChange={update}
                  className="gov-input"
                  style={{ width: "100%", paddingLeft: "36px" }}
                />
              </div>
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--text-muted)" }} />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  onChange={update}
                  className="gov-input"
                  style={{ width: "100%", paddingLeft: "36px" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                Confirm
              </label>
              <div style={{ position: "relative" }}>
                <Lock style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--text-muted)" }} />
                <input
                  type="password"
                  name="confirm_password"
                  placeholder="••••••••"
                  onChange={update}
                  className="gov-input"
                  style={{ width: "100%", paddingLeft: "36px" }}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignup}
          disabled={isLoading}
          className="gov-btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "10px", marginTop: "8px" }}
        >
          {isLoading ? "Creating account..." : (
            <>
              Get Started
              <ArrowRight style={{ width: "16px", height: "16px" }} />
            </>
          )}
        </button>

        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-secondary)", marginTop: "8px" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}