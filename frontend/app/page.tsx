"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CashLoading } from '@/components/landing/CashLoading';

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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=IM+Fell+English+SC&family=Cinzel:wght@400;700;900&display=swap');

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes bill-float {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }

        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.15), 0 0 60px rgba(16,185,129,0.05); }
          50% { box-shadow: 0 0 40px rgba(16,185,129,0.25), 0 0 100px rgba(16,185,129,0.1); }
        }

        @keyframes serial-flicker {
          0%, 96%, 100% { opacity: 1; }
          97% { opacity: 0.6; }
          98% { opacity: 1; }
          99% { opacity: 0.7; }
        }

        @keyframes engraving-reveal {
          from { opacity: 0; filter: blur(8px); }
          to { opacity: 1; filter: blur(0); }
        }

        @keyframes micro-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }

        @keyframes star-fade {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }

        .font-cinzel { font-family: 'Cinzel', serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-fell { font-family: 'IM Fell English SC', serif; }

        /* Dollar Bill Button */
        .dollar-bill-btn {
          position: relative;
          width: 340px;
          height: 142px;
          border-radius: 8px;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.2s ease, filter 0.2s ease;
          animation: bill-float 6s ease-in-out infinite, glow-pulse 4s ease-in-out infinite;
          border: none;
          padding: 0;
          background: transparent;
        }

        .dollar-bill-btn:hover {
          transform: scale(1.04) rotate(0deg) !important;
          animation: glow-pulse 1s ease-in-out infinite;
          filter: brightness(1.08);
        }

        .dollar-bill-btn:active {
          transform: scale(0.97) !important;
        }

        /* Bill background - green linen texture */
        .bill-bg {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(135deg, #1a4d35 0%, #1e5c3e 20%, #174530 40%, #1e5c3e 60%, #1a4d35 80%, #164030 100%);
          border-radius: 7px;
        }

        /* Fine crosshatch texture overlay */
        .bill-texture {
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px);
          border-radius: 7px;
        }

        /* Subtle noise grain */
        .bill-grain {
          position: absolute;
          inset: 0;
          opacity: 0.08;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 128px 128px;
        }

        /* Fine engraved border */
        .bill-border-outer {
          position: absolute;
          inset: 5px;
          border: 1.5px solid rgba(180,220,180,0.5);
          border-radius: 5px;
          pointer-events: none;
        }

        .bill-border-inner {
          position: absolute;
          inset: 9px;
          border: 0.75px solid rgba(160,200,160,0.25);
          border-radius: 3px;
          pointer-events: none;
        }

        /* Corner rosette decorations */
        .bill-corner {
          position: absolute;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bill-corner-tl { top: 12px; left: 12px; }
        .bill-corner-tr { top: 12px; right: 12px; }
        .bill-corner-bl { bottom: 12px; left: 12px; }
        .bill-corner-br { bottom: 12px; right: 12px; }

        .bill-corner-circle {
          width: 22px;
          height: 22px;
          border: 1px solid rgba(180,220,180,0.55);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle, rgba(180,220,180,0.08) 0%, transparent 70%);
        }

        .bill-corner-text {
          font-family: 'Cinzel', serif;
          font-size: 7px;
          font-weight: 700;
          color: rgba(180,220,180,0.7);
          line-height: 1;
        }

        /* Left oval seal area */
        .bill-seal-left {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 58px;
          height: 58px;
        }

        .bill-seal-circle {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: 1.5px solid rgba(160,210,160,0.5);
          background: radial-gradient(circle at 40% 35%, rgba(40,120,70,0.6) 0%, rgba(20,70,40,0.8) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .bill-seal-inner {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 1px solid rgba(160,210,160,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 1px;
        }

        .bill-seal-dollar {
          font-family: 'Cinzel', serif;
          font-size: 22px;
          font-weight: 900;
          color: rgba(200,235,200,0.9);
          line-height: 1;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }

        /* Main center content */
        .bill-center {
          position: absolute;
          left: 84px;
          right: 84px;
          top: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .bill-federal-text {
          font-family: 'Cinzel', serif;
          font-size: 6.5px;
          font-weight: 400;
          letter-spacing: 0.15em;
          color: rgba(180,220,180,0.6);
          text-transform: uppercase;
        }

        .bill-main-title {
          font-family: 'Cinzel', serif;
          font-size: 19px;
          font-weight: 900;
          color: rgba(210,245,210,0.95);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-shadow: 0 1px 4px rgba(0,0,0,0.6);
          line-height: 1;
        }

        .bill-subtitle {
          font-family: 'IM Fell English SC', serif;
          font-size: 8px;
          color: rgba(180,220,180,0.55);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .bill-divider {
          width: 80%;
          height: 0.5px;
          background: linear-gradient(90deg, transparent, rgba(180,220,180,0.4), transparent);
          margin: 1px 0;
        }

        .bill-serial {
          font-family: 'Courier New', monospace;
          font-size: 7px;
          font-weight: 700;
          color: rgba(160,210,160,0.65);
          letter-spacing: 0.12em;
          animation: serial-flicker 8s ease-in-out infinite;
        }

        /* Right portrait area */
        .bill-seal-right {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 58px;
          height: 58px;
        }

        /* Treasury seal look */
        .bill-treasury {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: 1.5px solid rgba(160,210,160,0.45);
          background: radial-gradient(circle at 60% 35%, rgba(40,120,70,0.5) 0%, rgba(20,70,40,0.8) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .bill-treasury-inner {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 0.75px solid rgba(160,210,160,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bill-treasury-key {
          font-size: 18px;
          filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
        }

        /* Green shimmer sweep */
        .bill-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(180,255,200,0.07) 50%, transparent 70%);
          transform: translateX(-100%);
          animation: shimmer 4s ease-in-out infinite;
          pointer-events: none;
        }

        /* Intaglio ink depth effect on edges */
        .bill-vignette {
          position: absolute;
          inset: 0;
          border-radius: 7px;
          background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%);
          pointer-events: none;
        }

        /* Micro fine line pattern along top/bottom */
        .bill-guilloche-top,
        .bill-guilloche-bottom {
          position: absolute;
          left: 14px;
          right: 14px;
          height: 8px;
          overflow: hidden;
        }

        .bill-guilloche-top { top: 14px; }
        .bill-guilloche-bottom { bottom: 14px; }

        .bill-guilloche-top::before,
        .bill-guilloche-bottom::before {
          content: '';
          display: block;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            90deg,
            rgba(180,220,180,0.15) 0px,
            rgba(180,220,180,0.3) 1px,
            transparent 1px,
            transparent 3px
          );
        }

        /* Feature strip (security strip) */
        .bill-security-strip {
          position: absolute;
          left: 50%;
          top: 14px;
          bottom: 14px;
          width: 1.5px;
          background: linear-gradient(180deg, transparent, rgba(100,200,150,0.15) 20%, rgba(100,200,150,0.15) 80%, transparent);
          transform: translateX(-50%);
        }

        /* Hover glow overlay */
        .dollar-bill-btn::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 9px;
          background: transparent;
          transition: box-shadow 0.3s ease;
          pointer-events: none;
        }

        .dollar-bill-btn:hover::after {
          box-shadow: 0 0 0 1.5px rgba(16,185,129,0.4), 0 8px 40px rgba(16,185,129,0.25), 0 20px 80px rgba(16,185,129,0.1);
        }

        /* Stars decorative */
        .bill-stars {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .bill-star {
          font-size: 5px;
          color: rgba(180,220,180,0.45);
        }

        /* Feature bar accent at very bottom */
        .bill-bottom-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, rgba(16,185,129,0.3) 30%, rgba(16,185,129,0.5) 50%, rgba(16,185,129,0.3) 70%, transparent);
          border-radius: 0 0 7px 7px;
        }

        /* Stats / features strip */
        .feature-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 100px;
          border: 1px solid rgba(16,185,129,0.15);
          background: rgba(16,185,129,0.05);
          backdrop-filter: blur(8px);
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          font-family: 'Cinzel', serif;
          letter-spacing: 0.05em;
        }

        .feature-pill-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px rgba(16,185,129,0.8);
        }

        /* Headings */
        .hero-heading {
          font-family: 'Cinzel', serif;
          font-weight: 900;
        }

        .hero-sub {
          font-family: 'Playfair Display', serif;
          font-style: italic;
        }

        /* Watermark lines behind heading */
        @keyframes line-drift {
          0% { transform: translateX(0) skewX(-12deg); }
          100% { transform: translateX(60px) skewX(-12deg); }
        }

        .bg-scanlines {
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 40px,
            rgba(16,185,129,0.015) 40px,
            rgba(16,185,129,0.015) 41px
          );
        }

        /* Register link */
        .register-link {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .bottom-note {
          font-family: 'IM Fell English SC', serif;
          font-size: 10px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        /* Fine ornamental divider */
        .ornament {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(16,185,129,0.3);
          font-size: 10px;
        }

        .ornament-line {
          flex: 1;
          height: 0.5px;
          background: linear-gradient(90deg, transparent, rgba(16,185,129,0.25), transparent);
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

                {/* Dollar Bill Sign In Button */}
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.9, delay: 2.2, type: "spring", stiffness: 120 }}
                  className="flex flex-col items-center gap-5"
                >
                  <Link href="/login">
                    <button className="dollar-bill-btn" aria-label="Sign In">

                      {/* Base green background */}
                      <div className="bill-bg" />

                      {/* Texture layers */}
                      <div className="bill-texture" />
                      <div className="bill-grain" />

                      {/* Guilloche lines */}
                      <div className="bill-guilloche-top" />
                      <div className="bill-guilloche-bottom" />

                      {/* Security strip */}
                      <div className="bill-security-strip" />

                      {/* Outer border frame */}
                      <div className="bill-border-outer" />
                      <div className="bill-border-inner" />

                      {/* Corner numerals */}
                      <div className="bill-corner bill-corner-tl">
                        <div className="bill-corner-circle">
                          <span className="bill-corner-text">1</span>
                        </div>
                      </div>
                      <div className="bill-corner bill-corner-tr">
                        <div className="bill-corner-circle">
                          <span className="bill-corner-text">1</span>
                        </div>
                      </div>
                      <div className="bill-corner bill-corner-bl">
                        <div className="bill-corner-circle">
                          <span className="bill-corner-text">1</span>
                        </div>
                      </div>
                      <div className="bill-corner bill-corner-br">
                        <div className="bill-corner-circle">
                          <span className="bill-corner-text">1</span>
                        </div>
                      </div>

                      {/* Left seal — Dollar sign */}
                      <div className="bill-seal-left">
                        <div className="bill-seal-circle">
                          <div className="bill-seal-inner">
                            <div className="bill-seal-dollar">$</div>
                          </div>
                        </div>
                      </div>

                      {/* Center content */}
                      <div className="bill-center">
                        <span className="bill-federal-text">Federal Reserve Note</span>
                        <div className="bill-divider" />
                        <span className="bill-main-title">Sign In</span>
                        <div className="bill-divider" />
                        <span className="bill-subtitle">MyBalance · Est. 2024</span>
                        <div className="bill-stars">
                          {['★','★','★','★','★'].map((s, i) => (
                            <span key={i} className="bill-star" style={{ animationDelay: `${i * 0.4}s`, animation: `star-fade ${2 + i * 0.3}s ease-in-out infinite` }}>{s}</span>
                          ))}
                        </div>
                        <span className="bill-serial">MB24 · A00000001B</span>
                      </div>

                      {/* Right seal — Treasury key */}
                      <div className="bill-seal-right">
                        <div className="bill-treasury">
                          <div className="bill-treasury-inner">
                            <span className="bill-treasury-key">🗝️</span>
                          </div>
                        </div>
                      </div>

                      {/* Shimmer effect */}
                      <div className="bill-shimmer" />

                      {/* Edge vignette for depth */}
                      <div className="bill-vignette" />

                      {/* Bottom accent bar */}
                      <div className="bill-bottom-bar" />
                    </button>
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