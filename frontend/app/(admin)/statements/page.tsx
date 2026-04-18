"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Download, FileText, Eye, Edit3, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";
import { DataTable, ColumnDef, RowAction } from "@/components/common/Datatable";
import { StatementUploadModal } from "@/components/dashboard/StatementUploadModal";
import { TransactionActionModal } from "@/components/dashboard/TransactionActionModal";
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

export default function StatementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [actionModalState, setActionModalState] = useState<{
    open: boolean;
    mode: "view" | "edit" | "delete" | null;
    transaction: Transaction | null;
  }>({ open: false, mode: null, transaction: null });
  
  // Datatable state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("₹");

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
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      params.append("sort", "desc");

      const res = await fetch(`${API_BASE_URL}/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await res.json();
      
      const mapped = data.data.map((t: any) => ({
        _id: t._id,
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, bankFilter, startDate, endDate, router]);

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
    fetchTransactions();
  }, [fetchTransactions]);

  const handleUploadSuccess = () => {
    setPage(1); // Reset to first page
    fetchTransactions();
  };

  const columns: ColumnDef<Transaction>[] = [
    { key: "date", header: "Date", width: "120px" },
    { 
      key: "bank", 
      header: "Bank", 
      width: "140px",
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
      cell: (val: unknown) => <span className="text-muted-foreground text-xs">{String(val)}</span>
    },
    { 
      key: "payee", 
      header: "Payee", 
      width: "160px",
      cell: (val: unknown) => <span className="font-semibold text-foreground tracking-tight">{String(val)}</span>
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
      width: "120px",
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
            onClick: () => { /* Export logic placeholder */ },
            variant: "secondary"
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
            onChange: (v: string) => { setBankFilter(v); setPage(1); },
            options: [
              { label: "Federal Bank", value: "Federal Bank" },
              { label: "HDFC Bank", value: "HDFC Bank" },
              { label: "ICICI Bank", value: "ICICI Bank" },
              { label: "SBI", value: "SBI" }
            ],
            placeholder: "All Banks"
          },
          {
            key: "startDate",
            label: "From Date",
            type: "date",
            value: startDate,
            onChange: (v: string) => { setStartDate(v); setPage(1); }
          },
          {
            key: "endDate",
            label: "To Date",
            type: "date",
            value: endDate,
            onChange: (v: string) => { setEndDate(v); setPage(1); }
          }
        ]}
        onClearFilters={() => { setBankFilter(""); setStartDate(""); setEndDate(""); setPage(1); }}
        searchValue={search}
        onSearchChange={(val: string) => { setSearch(val); setPage(1); }}
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
