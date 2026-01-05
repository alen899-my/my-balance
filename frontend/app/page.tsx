"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Small delay to prevent flickering on fast connections
    const timeout = setTimeout(() => {
      if (token) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="relative flex flex-col items-center">
        {/* Violet Pulsing Logo */}
        <div className="w-20 h-20 bg-violet-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-violet-500/40 animate-pulse">
          <ShieldCheck className="w-10 h-10 text-white" />
        </div>

        {/* Loading Spinner */}
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
            Secure Session Gateway
          </span>
        </div>
        
        {/* Modern Progress Bar decoration */}
        <div className="w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-violet-600 w-1/3 animate-[loading_1.5s_infinite_ease-in-out]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}