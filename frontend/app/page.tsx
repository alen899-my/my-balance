"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CashLoading } from '@/components/landing/CashLoading';
import { Button } from "@/components/ui/Button";

const Page = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const handleAnimationComplete = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (token) {
      router.push('/dashboard');
    } else {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-[#050505] selection:bg-emerald-500 selection:text-white">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .hero-heading {
          font-family: 'Outfit', sans-serif;
        }
      `}</style>

      <AnimatePresence mode="wait">
        {loading ? (
          <CashLoading key="splash" onComplete={handleAnimationComplete} />
        ) : (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative min-h-screen flex flex-col overflow-hidden"
          >
            {/* Hero Section */}
            <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-scanlines">
              {/* Background Layer */}
              <div className="absolute inset-0 z-0">
                <motion.div
                  initial={{ scale: 1.1, filter: "blur(10px)" }}
                  animate={{ scale: 1, filter: "blur(0px)" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="w-full h-full relative"
                >
                  <div
                    className="block lg:hidden w-full h-full bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/images/landing page/vertical-hero.jpg')" }}
                  />
                  <div
                    className="hidden lg:block w-full h-full bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/images/landing page/horizontal-hero.jpg')" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/50 to-[#050505]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70" />
                </motion.div>
              </div>

              {/* Floating decorative bills in background */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {[
                  { top: '12%', left: '-4%', rot: '-18deg', scale: '0.55', delay: '0s', opacity: '0.04' },
                  { top: '65%', right: '-5%', rot: '12deg', scale: '0.45', delay: '2s', opacity: '0.04' },
                  { top: '30%', right: '3%', rot: '-8deg', scale: '0.35', delay: '1s', opacity: '0.03' },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      top: s.top,
                      left: s.left,
                      right: s.right,
                      transform: `rotate(${s.rot}) scale(${s.scale})`,
                      opacity: s.opacity,
                      animation: `bill-float ${6 + i * 1.5}s ease-in-out infinite`,
                      animationDelay: s.delay,
                    }}
                  >
                    <div style={{ width: 340, height: 142, borderRadius: 8, background: 'linear-gradient(135deg, #1a4d35, #164030)', border: '1px solid rgba(180,220,180,0.3)' }} />
                  </div>
                ))}
              </div>

              {/* Content Layer */}
              <div className="relative z-10 container mx-auto px-6 text-center max-w-4xl flex flex-col items-center gap-8">

              

                {/* Main heading */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="space-y-3"
                >
                  <h1 className="hero-heading text-5xl md:text-7xl text-white leading-[0.95] tracking-tight">
                    {"Want To".split(" ").map((word, wi) => (
                      <motion.span
                        key={wi}
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.4 + wi * 0.12 }}
                        className="inline-block mr-[0.22em]"
                      >
                        {word}
                      </motion.span>
                    ))}
                    <br />
                    {"Track ".split("").map((char, ci) => (
                      <motion.span
                        key={ci}
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.75 + ci * 0.055 }}
                        className="inline-block text-emerald-400"
                        style={{ textShadow: '0 0 40px rgba(16,185,129,0.4)' }}
                      >
                        {char}
                      </motion.span>
                    ))}
                    {" "}
                    {"Your Balance".split("").map((char, ci) => (
                      <motion.span
                        key={ci}
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 1.35 + ci * 0.055 }}
                        className={cn(
                          "inline-block text-emerald-400",
                          char === " " ? "w-[0.25em]" : ""
                        )}
                        style={{ textShadow: char === " " ? 'none' : '0 0 40px rgba(16,185,129,0.3)' }}
                      >
                        {char === " " ? "\u00A0" : char}
                      </motion.span>
                    ))}
                  </h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.9, delay: 1.8 }}
                    className="hero-sub text-base md:text-lg text-white/45 max-w-md mx-auto leading-relaxed"
                  >
                    Every Bills Tracked. Every bill catalogued. Every decision informed.
                  </motion.p>
                </motion.div>

                {/* Ornament */}
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.7, delay: 2.0 }}
                  className="ornament w-64"
                >
                  <div className="ornament-line" />
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(16,185,129,0.4)' }}>✦ MY BALANCE ✦</span>
                  <div className="ornament-line" />
                </motion.div>

                {/* Standard CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 2.2 }}
                  className="flex flex-col items-center gap-6"
                >
                  <Link href="/login">
                    <Button 
                      variant="primary" 
                      size="lg"
                      className="h-16 w-64 rounded-full font-bold uppercase tracking-wider text-white shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all group"
                      rightIcon={
                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      }
                    >
                      Get Started
                    </Button>
                  </Link>

                  {/* Register link */}
                  <Link href="/signup" className="group flex items-center gap-2 transition-colors">
                    <span className="register-link text-white/30 group-hover:text-white/50 transition-colors">
                      New to MyBalance?{" "}
                      <span
                        className="text-emerald-500/70 group-hover:text-emerald-400 transition-colors"
                        style={{ textDecoration: 'underline', textDecorationColor: 'rgba(16,185,129,0.3)' }}
                      >
                        Register Now
                      </span>
                    </span>
                  </Link>
                </motion.div>

              

              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default Page;