"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload, ShieldCheck, ChevronDown, FileText,
  X, AlertCircle, KeyRound,
  Database, Zap, Lock, Search, Clock, Loader2
} from "lucide-react";

export default function StatementUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [bank, setBank] = useState("HDFC");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [processData, setProcessData] = useState<{ total: number, new: number, updated: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { label: "Uploading", icon: Upload },
    { label: "Security", icon: Lock },
    { label: "Parsing", icon: Search },
    { label: "Indexing", icon: Database }
  ];

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
        // Map 0-100% of upload to 0-25% of the total UI progress
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
                // Map page processing to 25%-99% of UI progress
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
                }, 500);
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
    <div className="relative w-full max-w-md mx-auto p-4">
      {/* --- PROGRESS MODAL --- */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center p-8 rounded-[2.5rem] animate-in fade-in zoom-in-95 duration-300 border border-violet-500/20 shadow-2xl">
          <div className="relative w-32 h-32 mb-8">
            <svg className="w-full h-full -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100 dark:text-slate-800" />
              <circle
                cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent"
                strokeDasharray="364.4"
                strokeDashoffset={364.4 - (364.4 * uploadProgress) / 100}
                strokeLinecap="round"
                className="text-violet-600 transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{uploadProgress}%</span>
              <span className="text-[10px] font-bold text-violet-500 mt-1 uppercase tracking-tighter">Syncing</span>
            </div>
          </div>

          <div className="w-full space-y-6">
            <div className="flex justify-between px-4">
              {steps.map((step, i) => (
                <div key={i} className={`flex flex-col items-center transition-all duration-500 ${activeStep >= i ? 'text-violet-600' : 'text-slate-300 dark:text-slate-700'}`}>
                  <step.icon className={`w-5 h-5 ${activeStep === i ? 'animate-bounce' : ''}`} />
                  <div className={`h-1.5 w-1.5 rounded-full mt-2 ${activeStep >= i ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
                </div>
              ))}
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white">{steps[activeStep].label}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Please keep this window open...</p>
            </div>
          </div>
        </div>
      )}

      {/* --- SUCCESS SCREEN --- */}
      {processData && (
        <div className="absolute inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8 rounded-[2.5rem] animate-in zoom-in-95 duration-500 border-2 border-emerald-500/20 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/40">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-2">Sync Successful</h4>
          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{processData.total}</span>
            <span className="text-sm font-bold text-slate-400">Lines</span>
          </div>
          <button onClick={() => window.location.reload()} className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-violet-700 transition-all active:scale-95">
            Done
          </button>
        </div>
      )}

      {/* --- THE MAIN FORM --- */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-2xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-widest mb-4">
            <ShieldCheck className="w-3 h-3" /> Secure Sync
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Import Statement</h2>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Select Bank</label>
            <div className="relative">
              <select
                value={bank} onChange={(e) => setBank(e.target.value)}
                className="w-full appearance-none px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-violet-500/20 rounded-2xl text-sm font-bold outline-none transition-all cursor-pointer text-slate-900 dark:text-white"
              >
                <option value="HDFC">HDFC Bank</option>
                <option value="SBI">State Bank of India</option>
                <option value="ICICI">ICICI Bank</option>
                <option value="FEDERAL">Federal Bank</option>
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`group relative h-36 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer 
              ${file ? 'border-violet-500 bg-violet-50/20 dark:bg-violet-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-violet-500/40'}`}
          >
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <div className="text-center">
                <FileText className="w-8 h-8 text-violet-600 mx-auto mb-2" />
                <p className="text-[11px] font-black text-slate-900 dark:text-white truncate max-w-[200px] uppercase">{file.name}</p>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-violet-600 mx-auto mb-2 transition-all" />
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Select PDF</p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">PDF Password</label>
            <div className="relative">
              <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password" placeholder="Leave blank if none" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-violet-500/20 rounded-2xl text-sm font-bold outline-none transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            onClick={handleUpload} disabled={!file || isLoading}
            className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-violet-500/30 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" /> Initialize Sync
          </button>
        </div>
      </div>

      {status.type === 'error' && (
        <div className="mt-4 bg-rose-600 text-white p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-tight flex-1">{status.message}</p>
          <button onClick={() => setStatus({ type: 'idle', message: '' })}><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}