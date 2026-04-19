"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Plus, Download, FileText, Eye, Edit3, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";
import { DataTable, ColumnDef, RowAction } from "@/components/common/Datatable";
import { StatementUploadModal } from "@/components/dashboard/StatementUploadModal";
import { TransactionActionModal } from "@/components/dashboard/TransactionActionModal";
import { Modal, ModalFooterActions } from "@/components/common/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import getSymbolFromCurrency from "currency-symbol-map";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Transaction {
  _id: string;
  date: string;
  description: string;
  payee: string;
  amount: number;
  type: string;
  bank: string;
  balance?: number;
}

function StatementsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [actionModalState, setActionModalState] = useState<{
    open: boolean;
    mode: "view" | "edit" | "delete" | null;
    transaction: Transaction | null;
  }>({ open: false, mode: null, transaction: null });

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [summary, setSummary] = useState({ total_debit: 0, total_credit: 0 });
  
  // Datatable state
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [pageSize, setPageSize] = useState(Number(searchParams.get("limit")) || 10);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [bankFilter, setBankFilter] = useState(searchParams.get("bank") || "");
  const [startDate, setStartDate] = useState(searchParams.get("start_date") || "");
  const [endDate, setEndDate] = useState(searchParams.get("end_date") || "");
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [dynamicBanks, setDynamicBanks] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all");
  const [amountFilter, setAmountFilter] = useState(searchParams.get("amount") || "");

  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 10) params.set("limit", String(pageSize));
    if (search) params.set("search", search);
    if (bankFilter && bankFilter !== "All Banks") params.set("bank", bankFilter);
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
    if (amountFilter) params.set("amount", amountFilter);

    const q = params.toString();
    const newUrl = `${pathname}${q ? `?${q}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  }, [page, pageSize, search, bankFilter, startDate, endDate, typeFilter, pathname]);

  useEffect(() => {
    const handler = setTimeout(() => {
      updateURL();
    }, 300);
    return () => clearTimeout(handler);
  }, [updateURL]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Prepare query params
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(pageSize));
      if (search) params.append("search", search);
      if (bankFilter && bankFilter !== "All Banks") params.append("bank", bankFilter);
      if (typeFilter && typeFilter !== "all") params.append("type", typeFilter);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (amountFilter) params.append("amount", amountFilter);
      params.append("sort", "desc");

      const res = await fetch(`${API_BASE_URL}/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await res.json();
      
      const mapped = data.data.map((t: any) => ({
        _id: String(t._id || t.id || ""),
        date: t.date,
        description: t.description || "",
        payee: t.payee || "Unknown",
        amount: t.debit > 0 ? -t.debit : t.credit,
        type: t.debit > 0 ? "Debit" : "Credit",
        bank: t.bank || "Unknown",
        balance: t.balance,
      }));

      setTransactions(mapped);
      setTotalCount(data.total);
      if (data.summary) setSummary(data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, bankFilter, startDate, endDate, typeFilter, amountFilter]);

  useEffect(() => {
    // Attempt local storage sync
    const pref = localStorage.getItem("preferred_currency");
    if (pref) {
       setCurrencySymbol(getSymbolFromCurrency(pref) || "₹");
    } else {
       // Fetch securely fallback
       const token = localStorage.getItem("token");
       if (token) {
           fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` }})
             .then(res => res.json())
             .then(data => {
                const cur = data.currency || "INR";
                localStorage.setItem("preferred_currency", cur);
                setCurrencySymbol(getSymbolFromCurrency(cur) || "₹");
             }).catch(() => {});
       }
    }
    
    // Fetch unique banks
    const token = localStorage.getItem("token");
    if (token) {
        fetch(`${API_BASE_URL}/transactions/unique-banks`, { headers: { Authorization: `Bearer ${token}` }})
          .then(res => res.json())
          .then(data => {
              if (Array.isArray(data)) setDynamicBanks(data);
          })
          .catch(() => {});
    }

    const fetchHandler = setTimeout(() => {
      fetchTransactions();
    }, 400);

    return () => clearTimeout(fetchHandler);
  }, [fetchTransactions]);

  const handleUploadSuccess = () => {
    setPage(1); // Reset to first page
    fetchTransactions();
    
    // Refresh bank list
    const token = localStorage.getItem("token");
    if (token) {
        fetch(`${API_BASE_URL}/transactions/unique-banks`, { headers: { Authorization: `Bearer ${token}` }})
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setDynamicBanks(data); })
          .catch(() => {});
    }
  };

  const handleClearAll = async () => {
    try {
      setClearLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/transactions/clear`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to clear transactions");
      
      setShowClearConfirm(false);
      setPage(1);
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Error clearing transactions");
    } finally {
      setClearLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (bankFilter && bankFilter !== "All Banks") params.append("bank", bankFilter);
      if (typeFilter && typeFilter !== "all") params.append("type", typeFilter);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (amountFilter) params.append("amount", amountFilter);

      const res = await fetch(`${API_BASE_URL}/transactions/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Error exporting CSV");
    } finally {
      setExportLoading(false);
    }
  };

  const columns: ColumnDef<Transaction>[] = [
    { 
      key: "sno", 
      header: "S.No", 
      align: "center",
      noTruncate: true,
      cell: (_: unknown, __: Transaction, index: number) => (
        <span className="text-muted-foreground/50 font-mono text-[11px]">
          {(page - 1) * pageSize + index + 1}
        </span>
      )
    },
    { key: "date", header: "Date" },
    { 
      key: "bank", 
      header: "Bank", 
      cell: (val: unknown) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
          {String(val)}
        </span>
      )
    },
    { 
      key: "description", 
      header: "Description", 
      noTruncate: true,
      cell: (val: unknown) => (
        <div className="flex flex-col gap-0.5 whitespace-nowrap">
          <span className="text-[13px] font-medium text-foreground">
            {String(val)}
          </span>
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-tighter opacity-80">
            {String(val)}
          </span>
        </div>
      )
    },
  
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (val: unknown) => {
        const num = val as number;
        const isCredit = num >= 0;
        return (
          <div className="flex items-center justify-end">
            <span className={cn(
              "px-2 py-1 rounded-md text-xs font-bold tracking-tight border",
              isCredit 
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/15" 
                : "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
            )}>
              {isCredit ? "+" : "-"}{currencySymbol}{Math.abs(num).toFixed(2)}
            </span>
          </div>
        );
      }
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      cell: (val: unknown) => val != null ? `${currencySymbol}${Number(val).toFixed(2)}` : "—"
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      noTruncate: true,
      cell: (_, row: Transaction) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setActionModalState({ open: true, mode: "view", transaction: row })}
            className="w-7 h-7 flex items-center justify-center rounded-md text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActionModalState({ open: true, mode: "edit", transaction: row })}
            className="w-7 h-7 flex items-center justify-center rounded-md text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActionModalState({ open: true, mode: "delete", transaction: row })}
            className="w-7 h-7 flex items-center justify-center rounded-md text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <TransactionActionModal
        open={actionModalState.open}
        mode={actionModalState.mode}
        transaction={actionModalState.transaction}
        currencySymbol={currencySymbol}
        onClose={() => setActionModalState(prev => ({ ...prev, open: false }))}
        onSuccess={fetchTransactions}
      />
      <StatementUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Delete All Confirmation Modal */}
      <Modal open={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Wipe All Transactions">
        <div className="py-4">
           <p className="text-sm text-foreground/80 mb-2">Are you sure you want to completely erase <strong>ALL</strong> extracted transactions from this workspace?</p>
           <p className="text-sm text-destructive font-semibold">This action is permanent and cannot be undone.</p>
        </div>
        <ModalFooterActions>
           <Button variant="secondary" onClick={() => setShowClearConfirm(false)} disabled={clearLoading}>Cancel</Button>
           <Button variant="destructive" onClick={handleClearAll} loading={clearLoading}>Yes, Erase All</Button>
        </ModalFooterActions>
      </Modal>

      <AdminPageLayout
        title="Statements & Transactions"
        description="View your extracted transactions and upload new bank statements."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Statements" }
        ]}
        actions={[
          {
            label: "Export CSV",
            icon: <Download className="h-4 w-4" />,
            onClick: handleExportCSV,
            variant: "secondary",
            loading: exportLoading
          },
          {
            label: "Delete All",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: () => setShowClearConfirm(true),
            variant: "destructive"
          },
          {
            label: "Add Statement",
            icon: <Plus className="h-4 w-4" />,
            onClick: () => setUploadModalOpen(true),
            variant: "primary"
          }
        ]}
        filters={[
          {
            key: "bank",
            label: "Filter by Bank",
            type: "select",
            value: bankFilter,
            onChange: (v: string) => { setBankFilter(v); setPage(1); setLoading(true); },
            options: dynamicBanks.map(b => ({ label: b, value: b })),
            placeholder: dynamicBanks.length === 0 ? "Upload to filter..." : "All Banks"
          },
          {
            key: "startDate",
            label: "From Date",
            type: "date",
            value: startDate,
            onChange: (v: string) => { setStartDate(v); setPage(1); setLoading(true); }
          },
          {
            key: "endDate",
            label: "To Date",
            type: "date",
            value: endDate,
            onChange: (v: string) => { setEndDate(v); setPage(1); setLoading(true); }
          },
          {
            key: "type",
            label: "Transaction Type",
            type: "select",
            value: typeFilter,
            onChange: (v: string) => { setTypeFilter(v); setPage(1); setLoading(true); },
            options: [
              { label: "All Transactions", value: "all" },
              { label: "Credit (+)", value: "credit" },
              { label: "Debit (-)", value: "debit" }
            ],
            placeholder: "All Transactions"
          },
          {
            key: "amount",
            label: "Filter by Amount",
            type: "input",
            placeholder: "Enter exact amount...",
            value: amountFilter,
            onChange: (v: string) => { setAmountFilter(v); setPage(1); setLoading(true); }
          }
        ]}
        filterCount={[bankFilter, typeFilter !== "all" ? typeFilter : "", startDate, endDate, search, amountFilter].filter(Boolean).length}
        onClearFilters={() => { setBankFilter(""); setTypeFilter("all"); setStartDate(""); setEndDate(""); setSearch(""); setAmountFilter(""); setPage(1); }}
        searchValue={search}
        onSearchChange={(val: string) => { setSearch(val); setPage(1); setLoading(true); }}
        searchPlaceholder="Search descriptions/payees..."
      >
        <div className="w-full">
          <DataTable
            data={transactions}
            columns={columns}
            rowKey="_id"
            loading={loading}
            striped
            compact
            
            // Server-side Pagination & Search controls (disables internal handling)
            externalPagination
            totalCount={totalCount}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            
            externalSearch
            searchable={false} // Hidden inside Datatable because it's handled by AdminPageLayout
            hideToolbar
            
            footerSummarySlot={
              !loading && transactions.length > 0 && (
                <div className="px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
                  {/* Label Group */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Filtered Summary
                    </span>
                  </div>
                  
                  {/* Stats Group */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-x-8 gap-y-4 w-full sm:w-auto">
                    <div className="flex flex-col items-end min-w-[100px]">
                      <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-tight">Total Credits</span>
                      <span className="text-sm font-bold text-emerald-500 tabular-nums">
                        +{currencySymbol}{summary.total_credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-end min-w-[100px]">
                      <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-tight">Total Debits</span>
                      <span className="text-sm font-bold text-destructive tabular-nums">
                        -{currencySymbol}{summary.total_debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="pt-4 sm:pt-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-border/60 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto mt-2 sm:mt-0">
                      <span className="text-[10px] uppercase text-foreground font-black tracking-tight sm:mb-1">Net Cashflow</span>
                      <span className={cn(
                        "text-base sm:text-lg font-black tabular-nums tracking-tighter leading-none",
                        (summary.total_credit - summary.total_debit) >= 0 ? "text-emerald-500" : "text-destructive"
                      )}>
                        {(summary.total_credit - summary.total_debit) >= 0 ? "+" : "-"}{currencySymbol}{Math.abs(summary.total_credit - summary.total_debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }
            
            emptyState={
               <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
                  <FileText className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">No transactions found</p>
                  <p className="text-xs max-w-sm text-center mt-1">Upload a bank statement using the Add Statement button to extract and view transactions.</p>
               </div>
           }
         />
       </div>
      </AdminPageLayout>
    </>
  );
}

export default function StatementsPage() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-200px)] items-center justify-center text-muted-foreground">Loading...</div>}>
      <StatementsPageContent />
    </Suspense>
  );
}
