"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Fingerprint } from "lucide-react";

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
        // Storing the user object for use in the dashboard
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
    <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-violet-500/5">
      {/* Brand Icon & Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600 mb-4 shadow-lg shadow-violet-500/30">
          <Fingerprint className="text-white w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter your credentials to access your secure vault.
        </p>
      </div>

      <div className="space-y-5 mt-8">
        {/* Identifier Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
            Account ID
          </label>
          <div className="relative group">
            <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
            <input
              placeholder="Email or Phone number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Password
            </label>
            <Link href="#" className="text-xs font-semibold text-violet-600 hover:text-violet-500 transition-colors">
              Forgot?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 active:scale-[0.98] transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verifying...
            </span>
          ) : (
            <>
              Sign in to Dashboard
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-tighter">
          <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 font-medium">New to the platform?</span>
        </div>
      </div>

      <div className="mt-6">
        <Link 
          href="/signup" 
          className="w-full flex justify-center py-3.5 px-4 border-2 border-violet-100 dark:border-violet-900/30 rounded-2xl font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
        >
          Create a secure account
        </Link>
      </div>
    </div>
  );
}