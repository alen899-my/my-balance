"use client";

import React, { useState } from "react";
import { UploadCloud, Check, X, Loader2, FileText, Lock } from "lucide-react";
import { Modal, ModalFooterActions } from "@/components/common/Modal";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/Forminput";
import { PasswordInput } from "@/components/ui/Passwordinput";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface StatementUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const BANKS = [
  "Select a bank", "Federal Bank", "HDFC Bank", "ICICI Bank", "SBI", 
  "Axis Bank", "Kotak Mahindra", "Canara Bank", "Bank of Baroda", "Union Bank", "Other..."
];

export function StatementUploadModal({ open, onClose, onSuccess }: StatementUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [bank, setBank] = useState<string>("Select a bank");
  const [customBank, setCustomBank] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<string | null>(null);

  const handleReset = () => {
    setFile(null);
    setBank("Select a bank");
    setCustomBank("");
    setPassword("");
    setError(null);
    setSuccessMsg(null);
    setJobId(null);
    setPollStatus(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type !== "application/pdf") {
        setError("Please upload a valid PDF file.");
        setFile(null);
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const checkStatus = async (jobId: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/upload/status/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "completed") {
          setPollStatus(`Success! Processed ${data.processed_txns} transactions.`);
          setUploading(false);
          setSuccessMsg("Statement uploaded and processed successfully.");
          setTimeout(() => {
            if (onSuccess) onSuccess();
            handleClose();
          }, 2000);
          return;
        } else if (data.status === "failed") {
          setPollStatus(null);
          setError(data.message || "Processing failed.");
          setUploading(false);
          return;
        } else {
          setPollStatus(`Processing... (${data.processed_pages}/${data.total_pages} pages)`);
          setTimeout(() => checkStatus(jobId, token), 2000);
        }
      } else {
        setPollStatus(null);
        setError("Failed to check status.");
        setUploading(false);
      }
    } catch (e: any) {
      setError("Status check error.");
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a statement PDF file.");
      return;
    }
    const finalBank = bank === "Other..." ? customBank.trim() : bank;
    if (!finalBank || finalBank === "Select a bank") {
      setError("Please specify the bank name.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);
    setPollStatus("Uploading file...");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bank", finalBank);
      if (password) {
        formData.append("password", password);
      }

      const res = await fetch(`${API_BASE_URL}/upload/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to upload statement.");
      }

      if (data.jobId) {
        setJobId(data.jobId);
        setPollStatus("Upload complete. Processing...");
        checkStatus(data.jobId, token || "");
      } else {
        // Fallback if no job id logic exists
        setUploading(false);
        setSuccessMsg("Statement uploaded successfully.");
        setTimeout(() => {
          if (onSuccess) onSuccess();
          handleClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during upload.");
      setUploading(false);
      setPollStatus(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upload Statement"
      size="md"
      footer={
        <ModalFooterActions align="right">
          <Button variant="ghost" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            loading={uploading}
            disabled={!file || !bank || bank === "Select a bank" || (bank === "Other..." && !customBank.trim()) || uploading}
            leftIcon={!uploading ? <UploadCloud className="h-4 w-4" /> : undefined}
          >
            {uploading ? (pollStatus || "Processing...") : "Upload Statement"}
          </Button>
        </ModalFooterActions>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg border-l-4 border-destructive bg-destructive/8">
            <span className="text-destructive mt-0.5 shrink-0">⚠</span>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg border-l-4 border-emerald-500 bg-emerald-500/10">
            <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">{successMsg}</p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-foreground">Bank Name</label>
          <select
            value={bank}
            onChange={(e) => {
               setBank(e.target.value);
               if (e.target.value !== "Other...") setCustomBank("");
            }}
            disabled={uploading}
            className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {BANKS.map((b) => (
              <option key={b} value={b} disabled={b === "Select a bank"}>{b}</option>
            ))}
          </select>

          {bank === "Other..." && (
             <div className="mt-1 animate-in fade-in slide-in-from-top-1">
                 <FormInput 
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    placeholder="Enter your bank's full name"
                    disabled={uploading}
                 />
             </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-[13px] font-semibold text-foreground">Statement PDF</label>
          <div
            className={cn(
              "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-colors bg-muted/30",
              file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50",
              uploading && "opacity-60 pointer-events-none"
            )}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? (
              <div className="flex flex-col items-center gap-2 w-full px-4">
                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-foreground text-center truncate w-full" title={file.name}>
                  {file.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <UploadCloud className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-medium text-foreground text-center">
                  Click to drop your statement
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  PDF format only. Max 10MB.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-2">
          <PasswordInput
            label="Statement Password (If encrypted)"
            placeholder="Leave blank if not protected"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={uploading}
            leftIcon={<Lock className="h-4 w-4" />}
          />
        </div>
      </div>
    </Modal>
  );
}
