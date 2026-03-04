"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Upload, ShieldCheck, ChevronDown, FileText,
  X, AlertCircle, KeyRound, Database, Loader2,
  CheckCircle2, Building2, Search
} from "lucide-react";

const INDIAN_BANKS = [
  "HDFC Bank", "State Bank of India (SBI)", "ICICI Bank", "Axis Bank", "Federal Bank",
  "Kotak Mahindra Bank", "IndusInd Bank", "IDFC First Bank", "Punjab National Bank",
  "Canara Bank", "Bank of Baroda", "Union Bank of India", "Bank of India",
  "Indian Bank", "Central Bank of India", "Standard Chartered", "HSBC Bank",
  "Yes Bank", "South Indian Bank", "Karnataka Bank", "RBL Bank", "DBS Bank",
  "IDBI Bank", "UCO Bank", "Indian Overseas Bank", "Bandhan Bank", "CSB Bank",
].sort();

export default function StatementUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [bank, setBank] = useState("HDFC Bank");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({ type: "idle", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processData, setProcessData] = useState<{ total: number } | null>(null);
  const [systemLog, setSystemLog] = useState("Awaiting upload...");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredBanks = useMemo(() =>
    INDIAN_BANKS.filter(b => b.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    const logs = [
      "Establishing secure bridge...", "Initializing parser...",
      "Bypassing PDF encryption layers...", "Mapping transaction clusters...",
      "Auditing data integrity...", "Synchronizing data...",
    ];
    const interval = setInterval(() => setSystemLog(logs[Math.floor(Math.random() * logs.length)]), 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleUpload = () => {
    if (!file) return;
    setIsLoading(true);
    setUploadProgress(0);
    setProcessData(null);
    setStatus({ type: "idle", message: "" });

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
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (res.status === 404) {
                clearInterval(pollInterval); setIsLoading(false);
                setStatus({ type: "error", message: "Session expired. Please retry." });
                return;
              }
              const job = await res.json();
              if (job.status === "processing") {
                if (job.total_pages > 0) setUploadProgress(25 + Math.round((job.processed_pages / job.total_pages) * 74));
                else setUploadProgress(prev => Math.min(prev + 1, 98));
              } else if (job.status === "completed") {
                clearInterval(pollInterval); setUploadProgress(100);
                setTimeout(() => { setIsLoading(false); setProcessData({ total: job.processed_txns || 0 }); }, 800);
              } else if (job.status === "failed") {
                clearInterval(pollInterval); setIsLoading(false);
                setStatus({ type: "error", message: job.message || "Processing failed" });
              }
            } catch (e) { console.error("Polling error", e); }
          }, 1000);
        }
      } else {
        const err = JSON.parse(xhr.responseText);
        setStatus({ type: "error", message: err.detail || "Upload failed" });
        setIsLoading(false);
      }
    });

    xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/upload`);
    const token = localStorage.getItem("token");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  };

  /* ── Processing overlay ── */
  if (isLoading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: "20px" }}>
      <div style={{ position: "relative", width: "120px", height: "120px" }}>
        <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="60" cy="60" r="52" stroke="#e4e7ec" strokeWidth="6" fill="none" />
          <circle
            cx="60" cy="60" r="52"
            stroke="var(--brand)" strokeWidth="6" fill="none"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - uploadProgress / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--brand)" }}>{uploadProgress}%</span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <Loader2 style={{ width: "16px", height: "16px", color: "var(--brand)", animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
        <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>{systemLog}</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  /* ── Success overlay ── */
  if (processData) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: "16px", textAlign: "center" }}>
      <div style={{ width: "56px", height: "56px", background: "var(--success-bg)", border: "1px solid #abefc6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CheckCircle2 style={{ width: "28px", height: "28px", color: "var(--success)" }} />
      </div>
      <div>
        <p className="section-label" style={{ marginBottom: "4px" }}>Statement Processed</p>
        <p style={{ fontSize: "40px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{processData.total}</p>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Transactions indexed successfully</p>
      </div>
      <button onClick={() => window.location.reload()} className="gov-btn-primary" style={{ marginTop: "8px" }}>
        Return to Dashboard
      </button>
    </div>
  );

  /* ── Main form ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", background: "var(--success-bg)", border: "1px solid #abefc6", borderRadius: "12px", marginBottom: "6px" }}>
            <ShieldCheck style={{ width: "11px", height: "11px", color: "var(--success)" }} />
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Bank-Grade Security</span>
          </div>
          <h2 style={{ margin: 0, fontSize: "18px" }}>Sync Statement</h2>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>Upload your bank statement PDF to import transactions</p>
        </div>
        <Building2 style={{ width: "22px", height: "22px", color: "var(--text-muted)", flexShrink: 0 }} />
      </div>

      {/* Bank Selector */}
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
          Source Bank
        </label>
        <div
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "9px 12px", border: "1px solid var(--border-default)", borderRadius: "6px",
            background: "var(--bg-surface)", cursor: "pointer", fontSize: "13px", fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          <span>{bank || "Select bank..."}</span>
          <ChevronDown style={{ width: "14px", height: "14px", color: "var(--text-muted)", transform: isDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        </div>

        {isDropdownOpen && (
          <div
            style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, width: "100%",
              zIndex: 100, background: "var(--bg-surface)", border: "1px solid var(--border-default)",
              borderRadius: "6px", boxShadow: "var(--shadow-dropdown)", overflow: "hidden",
            }}
          >
            <div style={{ padding: "8px", borderBottom: "1px solid var(--border-light)", position: "relative" }}>
              <Search style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", width: "13px", height: "13px", color: "var(--text-muted)" }} />
              <input
                type="text" placeholder="Search bank..." value={searchTerm} autoFocus
                onChange={e => { setSearchTerm(e.target.value); setBank(e.target.value); }}
                onClick={e => e.stopPropagation()}
                className="gov-input" style={{ paddingLeft: "30px", height: "34px" }}
              />
            </div>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {filteredBanks.map(b => (
                <div
                  key={b}
                  onClick={e => { e.stopPropagation(); setBank(b); setSearchTerm(""); setIsDropdownOpen(false); }}
                  style={{
                    padding: "9px 12px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                    background: bank === b ? "var(--brand-light)" : "transparent",
                    color: bank === b ? "var(--brand)" : "var(--text-primary)",
                    borderBottom: "1px solid var(--border-light)",
                    transition: "background 0.08s",
                  }}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* File Drop Zone */}
      <div>
        <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
          Statement File (PDF)
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `1.5px dashed ${file ? "var(--brand)" : "var(--border-default)"}`,
            borderRadius: "6px", padding: "28px 16px",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: file ? "var(--brand-light)" : "#161616",
            cursor: "pointer", gap: "8px", transition: "all 0.12s",
          }}
        >
          <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] || null)} />
          {file ? (
            <>
              <FileText style={{ width: "28px", height: "28px", color: "var(--brand)" }} />
              <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand)", textAlign: "center", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {file.name}
              </p>
            </>
          ) : (
            <>
              <Upload style={{ width: "28px", height: "28px", color: "var(--text-muted)" }} />
              <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Click to upload PDF statement</p>
            </>
          )}
        </div>
      </div>

      {/* Password */}
      <div>
        <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
          PDF Password (if encrypted)
        </label>
        <div style={{ position: "relative" }}>
          <KeyRound style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-muted)" }} />
          <input
            type="password" placeholder="Passcode (leave blank if not needed)"
            value={password} onChange={e => setPassword(e.target.value)}
            className="gov-input" style={{ paddingLeft: "32px" }}
          />
        </div>
      </div>

      {/* Error */}
      {status.type === "error" && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--danger-bg)", border: "1px solid #fda29b", borderRadius: "6px" }}>
          <AlertCircle style={{ width: "14px", height: "14px", color: "var(--danger)", flexShrink: 0 }} />
          <p style={{ fontSize: "12px", color: "var(--danger)", flex: 1, fontWeight: 500 }}>{status.message}</p>
          <button onClick={() => setStatus({ type: "idle", message: "" })} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "var(--danger)" }}>
            <X style={{ width: "14px", height: "14px" }} />
          </button>
        </div>
      )}

      {/* Submit */}
      <button onClick={handleUpload} disabled={!file || isLoading} className="gov-btn-primary" style={{ justifyContent: "center", padding: "12px", opacity: !file ? 0.4 : 1 }}>
        <Database style={{ width: "14px", height: "14px" }} />
        Initiate Statement Import
      </button>
    </div>
  );
}