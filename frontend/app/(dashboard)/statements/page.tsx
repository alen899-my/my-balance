"use client";

import { useState } from "react";
import { Plus, X, FileText, ListFilter } from "lucide-react";
import StatementUploadForm from "@/components/dashboard/StatementUploadForm";
import TransactionTable from "@/components/dashboard/TransactionTable";
import DeleteAllDataButton from "@/components/dashboard/DeleteAllDataButton";
import TransactionFilters from "@/components/dashboard/TransactionFilters";
import BackgroundSyncProgress from "@/components/dashboard/BackgroundSyncProgress";
import DateRangeFilter from "@/components/ui/DateRangeFilter";

export default function StatementsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    sort: "desc"
  });

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto p-4 md:p-0">

      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Document Vault</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            Statements
          </h1>
        </div>

        {/* Action Controls - Grid for mobile, Flex for desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-3 w-full xl:w-auto">
          
          <div className="sm:col-span-2 lg:col-span-1 w-full lg:w-auto">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 sm:flex-none p-3 rounded-2xl border transition-all flex items-center justify-center gap-2 ${
                showFilters
                  ? "bg-violet-100 border-violet-200 text-violet-600 dark:bg-violet-900/30 dark:border-violet-800"
                  : "bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 hover:border-violet-300"
              }`}
            >
              <ListFilter className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase sm:hidden">Filters</span>
            </button>

            <div className="flex-1 sm:flex-none">
                <DeleteAllDataButton />
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-violet-500/25 transition-all active:scale-95 group w-full lg:w-auto"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>Add Statement</span>
          </button>
        </div>
      </div>

      <BackgroundSyncProgress />

      {/* --- COLLAPSIBLE FILTERS --- */}
      {showFilters && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-300">
          <TransactionFilters filters={filters} setFilters={setFilters} />
        </div>
      )}

      {/* --- TABLE CONTENT --- */}
      <div className="bg-white dark:bg-slate-900/50 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-2 sm:p-6 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="overflow-x-auto">
            <TransactionTable filters={filters} startDate={startDate} endDate={endDate} />
        </div>
      </div>

      {/* --- UPLOAD MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-500" 
            onClick={() => setIsModalOpen(false)} 
          />
          <div className="relative w-full max-w-lg animate-in zoom-in-95 duration-300">
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="flex items-center gap-2 text-white/50 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 px-4 py-2 rounded-full"
              >
                Dismiss <X className="w-4 h-4" />
              </button>
            </div>
            <StatementUploadForm />
          </div>
        </div>
      )}
    </div>
  );
}