"use client";
import { useEffect, useState } from "react";
import { Zap, Loader2, CheckCircle2 } from "lucide-react";

export default function BackgroundSyncProgress() {
  const [isVisible, setIsVisible] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Listen for a custom event triggered by your UploadForm
  useEffect(() => {
    const handleSyncStart = () => {
      setIsVisible(true);
      setIsComplete(false);
      // Auto-hide after 2 minutes (typical for 700 pages) or manual refresh
      setTimeout(() => {
        setIsComplete(true);
        setTimeout(() => setIsVisible(false), 5000);
      }, 120000);
    };

    window.addEventListener("sync-started", handleSyncStart);
    return () => window.removeEventListener("sync-started", handleSyncStart);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="w-full mb-6 animate-in slide-in-from-top-4 duration-500">
      <div className={`relative overflow-hidden p-4 rounded-3xl border transition-all duration-500 ${isComplete
          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
          : "bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800"
        }`}>

        {/* Animated Background Pulse */}
        {!isComplete && (
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isComplete ? "bg-emerald-500" : "bg-violet-600"} text-white shadow-lg`}>
              {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {isComplete ? "Sync Finished" : "AI Processing Active"}
              </p>
              <h4 className="text-sm font-black text-slate-900 dark:text-white leading-none mt-1">
                {isComplete ? "Records Updated" : "Parsing Large Statement..."}
              </h4>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] font-bold text-violet-500 bg-violet-100 dark:bg-violet-900/50 px-2 py-1 rounded-lg">
              Page-by-Page Indexing
            </span>
          </div>
        </div>

        {/* The Progress Bar Line */}
        <div className="mt-4 h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-out rounded-full ${isComplete ? "w-full bg-emerald-500" : "w-1/2 bg-violet-600 animate-[pulse_2s_infinite]"
              }`}
          />
        </div>
      </div>
    </div>
  );
}