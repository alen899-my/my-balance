"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, Lock, ArrowRight, ShieldCheck } from "lucide-react";

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
    <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-violet-500/5">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600 mb-4 shadow-lg shadow-violet-500/30">
          <ShieldCheck className="text-white w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Secure Registration
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Join thousands of users managing their assets safely.
        </p>
      </div>

      <div className="space-y-4 mt-8">
        {/* Name Field */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
          <div className="relative group">
            <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
            <input
              name="name"
              placeholder="John Doe"
              onChange={update}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
            <input
              name="email"
              type="email"
              placeholder="name@example.com"
              onChange={update}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Phone Field */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
          <div className="relative group">
            <Phone className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
            <input
              name="phone"
              placeholder="+1 (555) 000-0000"
              onChange={update}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                onChange={update}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-slate-900 dark:text-white text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Confirm</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
              <input
                type="password"
                name="confirm_password"
                placeholder="••••••••"
                onChange={update}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-slate-900 dark:text-white text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleSignup}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 active:scale-[0.98] transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating account...
          </span>
        ) : (
          <>
            Get Started
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-violet-600 dark:text-violet-400 hover:underline font-bold">
          Sign in
        </Link>
      </p>
    </div>
  );
}