"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CashLoading } from '@/components/landing/CashLoading';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { 
  ShieldCheck, PlayCircle, Lock, Zap, PieChart, 
  Shield, RefreshCcw, BarChart3, Bell 
} from "lucide-react";

export default function Page() {
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
    <main className="relative min-h-screen w-full bg-[#f8fcfb] selection:bg-emerald-500 selection:text-white font-sans overflow-x-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Outfit', sans-serif; }
      `}</style>

      <AnimatePresence mode="wait">
        {loading ? (
          <CashLoading key="splash" onComplete={handleAnimationComplete} />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col min-h-screen"
          >
            {/* Hero Wrapper with Background */}
            <div className="relative w-full">
              {/* Full Image Background (No Overlay) */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="block lg:hidden w-full h-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/landing%20page/vertical-hero.jpg')" }} />
                <div className="hidden lg:block w-full h-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/landing%20page/horizontal-hero.jpg')" }} />
                <div className="absolute inset-0 bg-black/40" /> {/* Very slight dark tint just to ensure white text is readable */}
              </div>

              <LandingNavbar />

              {/* Hero Section */}
              <section className="flex-1 flex flex-col items-center justify-center px-6 lg:px-12 max-w-[1400px] mx-auto w-full pt-20 pb-28 gap-16 relative z-10 lg:min-h-[calc(100vh-100px)]">
              
              {/* Centered Content */}
              <div className="w-full max-w-4xl flex flex-col items-center text-center relative z-20">
              

                <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-8 tracking-tight drop-shadow-md">
                  Track Your Balance,<br />
                  Take Control of <span className="text-emerald-400">Your Money.</span>
                </h1>

                <p className="text-lg lg:text-2xl text-white/90 mb-12 leading-relaxed max-w-2xl font-medium drop-shadow-sm">
                  Monitor all your accounts, track transactions, and get real-time insights to make smarter financial decisions.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-20 w-full sm:w-auto">
                  <Link href="/signup" className="w-full sm:w-auto text-center bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 active:scale-95 shadow-lg">
                    Get Started – It's Free
                  </Link>
                </div>

            
              </div>
            </section>
            </div>

       
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}