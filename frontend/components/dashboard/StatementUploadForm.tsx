"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Upload, ShieldCheck, ChevronDown, FileText, 
  CheckCircle2, X, AlertCircle, Loader2, KeyRound, 
  Database, Zap, Lock, Search
} from "lucide-react";

export default function StatementUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [bank, setBank] = useState("HDFC");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [activeStep, setActiveStep] = useState(0);
  const [processData, setProcessData] = useState<{total: number, new: number, updated: number} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { label: "Uploading", icon: Upload },
    { label: "Security Check", icon: Lock },
    { label: "Parsing PDF", icon: Search },
    { label: "Finalizing", icon: Database }
  ];

  // Logic to change text steps based on progress
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
        setUploadProgress(Math.min(percent, 98));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        setUploadProgress(100);
        setTimeout(() => {
          setProcessData({ 
            total: data.total_processed, 
            new: data.new_transactions,
            updated: data.updated_transactions 
          });
          setIsLoading(false);
        }, 600);
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
    <div className="relative w-full max-w-md mx-auto">
      {/* --- ELITE PROCESSING MODAL --- */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center p-8 rounded-[2.5rem] animate-in fade-in zoom-in-95 duration-300 border border-blue-500/20">
          
          {/* Animated Ring */}
          <div className="relative w-32 h-32 mb-8">
            <svg className="w-full h-full -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100 dark:text-slate-800" />
              <circle
                cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent"
                strokeDasharray="364.4"
                strokeDashoffset={364.4 - (364.4 * uploadProgress) / 100}
                strokeLinecap="round"
                className="text-blue-600 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(37,99,235,0.5)]"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{uploadProgress}%</span>
              <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Ready</span>
            </div>
          </div>
          
          {/* Dynamic Step Indicator */}
          <div className="w-full space-y-4">
            <div className="flex justify-between px-2">
              {steps.map((step, i) => (
                <div key={i} className={`flex flex-col items-center transition-all duration-500 ${activeStep >= i ? 'text-blue-600' : 'text-slate-300 dark:text-slate-700'}`}>
                  <step.icon className={`w-5 h-5 ${activeStep === i ? 'animate-bounce' : ''}`} />
                  <div className={`h-1 w-1 rounded-full mt-2 ${activeStep >= i ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
                </div>
              ))}
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                {steps[activeStep].label}
              </h3>
              <p className="text-xs font-medium text-slate-500 italic mt-1">Please keep this window open...</p>
            </div>
          </div>
        </div>
      )}

      {/* --- SUCCESS "VICTORY" SCREEN --- */}
      {processData && (
        <div className="absolute inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8 rounded-[2.5rem] animate-in zoom-in-95 duration-500 border-2 border-emerald-500/20">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mb-6 rotate-12 shadow-xl shadow-emerald-500/40">
            <Zap className="w-10 h-10 fill-current" />
          </div>
          <h4 className="text-sm font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Sync Complete</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">{processData.total}</span>
            <span className="text-lg font-bold text-slate-400">Records</span>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full mt-8">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase">New Found</p>
              <p className="text-xl font-black text-emerald-500">+{processData.new}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase">Updates</p>
              <p className="text-xl font-black text-blue-500">{processData.updated}</p>
            </div>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full mt-8 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] transition-all active:scale-95"
          >
            Continue to Dashboard
          </button>
        </div>
      )}

      {/* --- THE MAIN FORM --- */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl transition-all duration-300">
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" /> Secure AI Parser
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Import Statement</h2>
        </div>

        <div className="space-y-6">
          {/* Bank Select */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Source Bank</label>
            <div className="relative group">
              <select 
                value={bank} onChange={(e) => setBank(e.target.value)}
                className="w-full appearance-none px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-blue-500/20 rounded-2xl text-sm font-bold outline-none transition-all cursor-pointer"
              >
                <option value="HDFC">HDFC Bank Limited</option>
                <option value="SBI">State Bank of India</option>
                <option value="ICICI">ICICI Bank</option>
                <option value="FEDERAL">Federal Bank</option>
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* File Dropzone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`group relative h-40 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden
              ${file ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-blue-500/40 hover:bg-slate-50/50'}`}
          >
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <div className="text-center animate-in zoom-in-90">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/40">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <p className="text-xs font-black truncate max-w-[220px] dark:text-white uppercase tracking-tighter">{file.name}</p>
                <p className="text-[10px] text-blue-500 font-bold mt-1 italic">Click to change</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Statement</p>
                <p className="text-[10px] text-slate-400 mt-1">PDF FORMAT ONLY</p>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">PDF Security Key</label>
            <div className="relative">
              <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password" placeholder="Enter password if protected" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-blue-500/20 rounded-2xl text-sm font-bold outline-none transition-all"
              />
            </div>
          </div>

          <button 
            onClick={handleUpload} disabled={!file || isLoading}
            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/40 transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3"
          >
            <Zap className="w-4 h-4 fill-current" /> Run Analysis
          </button>
        </div>
      </div>

      {/* Error Toast */}
      {status.type === 'error' && (
        <div className="mt-4 bg-red-500 text-white p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2 shadow-xl shadow-red-500/20">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-black uppercase tracking-tight flex-1">{status.message}</p>
          <button onClick={() => setStatus({type:'idle', message:''})}><X className="w-4 h-4"/></button>
        </div>
      )}
    </div>
  );
}