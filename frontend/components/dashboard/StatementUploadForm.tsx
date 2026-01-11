"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, ShieldCheck, ChevronDown, FileText,
  X, AlertCircle, KeyRound,
  Database, Zap, Lock, Search, Clock, Loader2, Terminal, Cpu, CheckCircle2, Building2
} from "lucide-react";

// List of major Indian banks
const INDIAN_BANKS = [
  "HDFC Bank", "State Bank of India (SBI)", "ICICI Bank", "Axis Bank", "Federal Bank",
  "Kotak Mahindra Bank", "IndusInd Bank", "IDFC First Bank", "Punjab National Bank",
  "Canara Bank", "Bank of Baroda", "Union Bank of India", "Bank of India",
  "Indian Bank", "Central Bank of India", "Standard Chartered", "HSBC Bank",
  "Yes Bank", "South Indian Bank", "Karnataka Bank", "RBL Bank", "DBS Bank",
  "IDBI Bank", "UCO Bank", "Indian Overseas Bank", "Bandhan Bank", "CSB Bank"
].sort();

export default function StatementUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [bank, setBank] = useState("HDFC Bank");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [processData, setProcessData] = useState<{ total: number, new: number, updated: number } | null>(null);
  const [systemLog, setSystemLog] = useState("Awaiting handshake...");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter banks based on search
  const filteredBanks = useMemo(() => {
    return INDIAN_BANKS.filter((b) =>
      b.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Handle clicking outside of dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const steps = [
    { label: "Upload", icon: Upload },
    { label: "Security", icon: Lock },
    { label: "Parsing", icon: Search },
    { label: "Indexing", icon: Database }
  ];

  // System Log Simulator
  useEffect(() => {
    if (!isLoading) return;
    const logs = [
      "Establishing secure bridge...",
      "Initializing AI neural parser...",
      "Bypassing PDF encryption layers...",
      "Mapping transaction clusters...",
      "Auditing data integrity...",
      "Optimizing database shards...",
      "Synchronizing with ledger..."
    ];
    const interval = setInterval(() => {
      setSystemLog(logs[Math.floor(Math.random() * logs.length)]);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Progress logic
  useEffect(() => {
    if (uploadProgress < 30) setActiveStep(0);
    else if (uploadProgress < 60) setActiveStep(1);
    else if (uploadProgress < 90) setActiveStep(2);
    else setActiveStep(3);
  }, [uploadProgress]);

  const handleUpload = () => {
    if (!file) return;

    setIsLoading(true);
    setUploadProgress(0);
    setProcessData(null);
    setStatus({ type: 'idle', message: '' });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bank", bank);
    if (password) formData.append("password", password);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(Math.min(Math.round(percent * 0.25), 25));
      }
    });

    xhr.addEventListener("load", async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);

        if (data.jobId) {
          const jobId = data.jobId;
          const pollInterval = setInterval(async () => {
            try {
              const token = localStorage.getItem("token");
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/status/${jobId}`, {
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
              });

              if (res.status === 404) {
                clearInterval(pollInterval);
                setIsLoading(false);
                setStatus({ type: 'error', message: "Session expired. Please retry." });
                return;
              }

              const job = await res.json();

              if (job.status === 'processing') {
                if (job.total_pages > 0) {
                  const parsePercent = Math.round((job.processed_pages / job.total_pages) * 74);
                  setUploadProgress(25 + parsePercent);
                } else {
                  setUploadProgress(prev => Math.min(prev + 1, 98));
                }
              } else if (job.status === 'completed') {
                clearInterval(pollInterval);
                setUploadProgress(100);
                setTimeout(() => {
                    setIsLoading(false);
                    setProcessData({
                      total: job.processed_txns || 0,
                      new: job.processed_txns || 0,
                      updated: 0
                    });
                }, 800);
              } else if (job.status === 'failed') {
                clearInterval(pollInterval);
                setIsLoading(false);
                setStatus({ type: 'error', message: job.message || "Processing failed" });
              }
            } catch (e) { console.error("Polling error", e); }
          }, 1000);
          return;
        }
      } else {
        const errorData = JSON.parse(xhr.responseText);
        setStatus({ type: 'error', message: errorData.detail || "Upload failed" });
        setIsLoading(false);
      }
    });

    xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/upload`);
    const token = localStorage.getItem("token");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto p-4 perspective-1000">
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 rounded-[3rem] border border-violet-500/30 shadow-2xl"
          >
            <div className="relative w-48 h-48 mb-10">
              <svg className="w-full h-full -rotate-90">
                <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                <motion.circle
                  cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="8" fill="transparent"
                  strokeDasharray="502.4"
                  initial={{ strokeDashoffset: 502.4 }}
                  animate={{ strokeDashoffset: 502.4 - (502.4 * uploadProgress) / 100 }}
                  strokeLinecap="round"
                  className="text-violet-500 transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white tabular-nums">{uploadProgress}%</span>
              </div>
            </div>
            <div className="text-center">
               <Terminal className="w-4 h-4 text-violet-400 mx-auto mb-2" />
               <p className="text-[11px] font-mono text-slate-300">{systemLog}</p>
            </div>
          </motion.div>
        )}

        {processData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 z-50 bg-emerald-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-10 rounded-[3rem] border border-emerald-500/30 shadow-2xl"
          >
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-[0.5em] mb-4">Integrity Verified</h4>
            <div className="text-center mb-10 text-white">
                <span className="text-7xl font-black tracking-tighter">{processData.total}</span>
                <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Transactions Processed</p>
            </div>
            <button onClick={() => window.location.reload()} className="w-full py-5 bg-white text-emerald-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 hover:bg-emerald-50">
              Return to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-8 shadow-2xl">
        <div className="mb-10 flex justify-between items-start">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-widest mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Military Grade Security
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Sync Ledger</h2>
          </div>
          <Building2 className="w-8 h-8 text-slate-300" />
        </div>

        <div className="space-y-8">
          {/* SEARCHABLE BANK SELECTION */}
          <div className="group space-y-2 relative" ref={dropdownRef}>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Source Institution</label>
            <div className="relative cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <div className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl flex items-center justify-between transition-all group-hover:border-violet-500/20">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {bank || "Search for your bank..."}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 10 }} 
                    className="absolute top-[115%] left-0 w-full z-[100] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="Search or type custom..."
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/40"
                          value={searchTerm}
                          autoFocus
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setBank(e.target.value); 
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                      {filteredBanks.map((b) => (
                        <div key={b} onClick={(e) => { e.stopPropagation(); setBank(b); setSearchTerm(""); setIsDropdownOpen(false); }} className={`px-4 py-3 rounded-xl text-sm font-bold cursor-pointer ${bank === b ? 'bg-violet-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                          {b}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* File Input */}
          <motion.div
            whileHover={{ scale: 0.99 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative h-40 rounded-[2rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-6 ${file ? 'border-violet-500 bg-violet-50/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'}`}
          >
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <div className="text-center">
                <FileText className="w-12 h-12 text-violet-600 mx-auto mb-2" />
                <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[200px] uppercase tracking-tighter">{file.name}</p>
              </div>
            ) : (
              <div className="text-center text-slate-500 group-hover:text-violet-600">
                <Upload className="w-12 h-12 mx-auto mb-2 transition-transform group-hover:-translate-y-1" />
                <p className="text-xs font-black uppercase tracking-widest">Deploy PDF Statement</p>
              </div>
            )}
          </motion.div>

          {/* Password field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Unlock Key</label>
            <div className="relative group">
              <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-violet-500" />
              <input 
                type="password" 
                placeholder="Passcode (if encrypted)" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-violet-500/40 transition-all placeholder:text-slate-400" 
              />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={handleUpload} 
            disabled={!file || isLoading} 
            className="w-full py-6 bg-slate-900 dark:bg-violet-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl disabled:opacity-30"
          >
             <div className="flex items-center justify-center gap-3">
                <Zap className="w-4 h-4 fill-current text-amber-400" /> Initiate Neural Sync
             </div>
          </motion.button>
        </div>
      </div>

      {/* ERROR FEEDBACK */}
      <AnimatePresence>
        {status.type === 'error' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-4 rounded-2xl flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-rose-500" />
            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex-1">{status.message}</p>
            <button onClick={() => setStatus({ type: 'idle', message: '' })}><X className="w-4 h-4 text-slate-400" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}