"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck } from "lucide-react";

export default function RootPage() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  // 0: loading/coins falling (1.8s)
  // 1: locked / verified (0.7s)
  // 2: exiting / redirecting

  useEffect(() => {
    const token = localStorage.getItem("token");

    const t1 = setTimeout(() => setPhase(1), 1800);
    const t2 = setTimeout(() => {
      setPhase(2);
      router.replace(token ? "/dashboard" : "/login");
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [router]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col items-center justify-center p-6 z-[9999] overflow-hidden">

      {/* Dynamic Background Glow */}
      <motion.div
        animate={{
          opacity: phase === 1 ? 0.8 : 0.3,
          scale: phase === 1 ? 1.2 : 1,
          backgroundColor: phase === 1 ? "rgba(34, 197, 94, 0.15)" : "rgba(78, 92, 235, 0.15)"
        }}
        transition={{ duration: 0.8 }}
        className="absolute w-[400px] h-[400px] rounded-full blur-[80px] pointer-events-none"
      />

      <div className="relative flex flex-col items-center justify-center h-64 w-64 z-10">

        {/* Phase 0: Falling Coins Animation */}
        <AnimatePresence>
          {phase === 0 && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -150, opacity: 0, scale: 0.5, rotateY: 0 }}
                  animate={{
                    y: [-120, 20],
                    opacity: [0, 1, 0],
                    scale: [0.6, 1.2, 0.5],
                    rotateY: [0, 360 * (i % 2 === 0 ? 1 : -1)]
                  }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeIn"
                  }}
                  className="absolute z-10 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                  style={{
                    left: `calc(50% + ${Math.sin(i * 1.5) * 30}px)`,
                    marginLeft: "-16px"
                  }}
                >
                  {/* Custom Coin SVG for extra detail */}
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="url(#coin_gradient)" stroke="#b45309" strokeWidth="1">
                    <defs>
                      <linearGradient id="coin_gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fcd34d" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                    </defs>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="7" fill="transparent" stroke="#fef3c7" strokeWidth="0.5" strokeDasharray="2 1" />
                    <text x="12" y="16" fontSize="11" fontWeight="900" textAnchor="middle" fill="#78350f" style={{ fontFamily: "sans-serif" }}>₹</text>
                  </svg>
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* The Wallet / Vault Container */}
        <motion.div
          animate={
            phase === 0
              ? { y: [0, 4, 0], scale: [1, 1.02, 1] }
              : phase === 1
                ? { scale: [1, 1.15, 1], rotate: [0, -4, 4, 0] }
                : { scale: 0.8, opacity: 0, y: 50 }
          }
          transition={
            phase === 0
              ? { repeat: Infinity, duration: 0.45, ease: "linear" }
              : phase === 1
                ? { duration: 0.5, type: "spring", stiffness: 300 }
                : { duration: 0.4 }
          }
          className="relative z-20 mt-16"
        >
          {/* Main Wallet Shape */}
          <div
            className="w-28 h-20 rounded-2xl flex items-center justify-center relative shadow-2xl transition-all duration-500 overflow-hidden"
            style={{
              background: phase === 0 ? "linear-gradient(135deg, #4e5ceb, #242a7a)" : "linear-gradient(135deg, #10b981, #047857)",
              border: `2px solid ${phase === 0 ? "#7a88ff" : "#34d399"}`,
              boxShadow: phase === 0 ? "0 10px 40px rgba(78,92,235,0.4)" : "0 10px 40px rgba(16,185,129,0.5)"
            }}
          >
            {/* Wallet Flap Lines */}
            <div className="absolute top-0 w-full h-1/2 bg-white/10 rounded-b-xl border-b border-white/20" />

            {/* Icon Inside Wallet */}
            <motion.div animate={{ opacity: phase === 1 ? 0 : 1 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
                <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
                <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path>
              </svg>
            </motion.div>

            {/* Checkmark replacing wallet when secured */}
            <AnimatePresence>
              {phase >= 1 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, rotate: -90 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <ShieldCheck size={40} className="text-white" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* The Lock Badge that snaps on */}
            <AnimatePresence>
              {phase >= 1 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, y: -40, rotate: 45 }}
                  animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.1 }}
                  className="absolute -right-3 -top-3 bg-white rounded-full p-1.5 shadow-lg border border-slate-200"
                >
                  <Lock size={14} className="text-emerald-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: phase === 2 ? 0 : 1,
            y: phase === 2 ? 20 : 0
          }}
          className="mt-12 flex flex-col items-center justify-center w-full"
        >
          <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {phase === 0 ? "Loading..." : "Loading..."}
          </span>
        </motion.div>

      </div>
    </div>
  );
}