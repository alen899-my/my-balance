"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import StatementUploadForm from "@/components/dashboard/StatementUploadForm";
import TransactionTable from "@/components/dashboard/TransactionTable";
import DeleteAllDataButton from "@/components/dashboard/DeleteAllDataButton"; // Import here

export default function StatementsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statements</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Analyze your financial documents and history.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* SEPARATE DELETE COMPONENT */}
          <DeleteAllDataButton />

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-blue-500/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Statement
          </button>
        </div>
      </div>

      {/* --- TABLE CONTENT --- */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <TransactionTable />
      </div>

      {/* --- UPLOAD MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setIsModalOpen(false)} 
          />
          <div className="relative w-full max-w-lg animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute -top-12 right-0 flex items-center gap-2 text-white/70 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
              Close <X className="w-5 h-5" />
            </button>
            <StatementUploadForm />
          </div>
        </div>
      )}
    </div>
  );
}