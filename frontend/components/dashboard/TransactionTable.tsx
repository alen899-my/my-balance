"use client";

import { useEffect, useState, useCallback } from "react";
import { authFetch } from "@/lib/authFetch";
import { ChevronLeft, ChevronRight, Banknote, Calendar, ArrowUpRight, ArrowDownLeft } from "lucide-react";

type Transaction = {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  bank: string;
};

interface TransactionTableProps {
  filters: { search: string; type: string; sort: string; };
  startDate?: Date;
  endDate?: Date;
  selectedBank?: string;
}

export default function TransactionTable({ filters, startDate, endDate, selectedBank }: TransactionTableProps) {
  const [data, setData] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const limit = 50;

  const fetchTransactions = useCallback(async (p = page) => {
    setIsLoading(true);
    try {
      const qp = new URLSearchParams({
        page: p.toString(), limit: limit.toString(),
        search: filters?.search || "", type: filters?.type || "all", sort: filters?.sort || "desc",
      });
      if (selectedBank && selectedBank !== "All Banks") qp.append("bank", selectedBank);
      if (startDate) qp.append("start_date", startDate.toISOString());
      if (endDate) qp.append("end_date", endDate.toISOString());
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions?${qp.toString()}`);
      const json = await res.json();
      setData(json.data || []);
      setTotalPages(json.totalPages || 1);
    } catch (err) { console.error("Failed to load transactions", err); }
    finally { setIsLoading(false); }
  }, [page, filters, limit, startDate, endDate, selectedBank]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { setPage(1); }, [filters, selectedBank]);

  return (
    <div>
      {/* Table */}
      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "520px" }}>
        <table className="gov-table" style={{ minWidth: "700px" }}>
          <thead>
            <tr>
              <th style={{ width: "48px" }}>Type</th>
              <th>Transaction Details</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th style={{ textAlign: "right" }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={4}>
                    <div className="skeleton" style={{ height: "16px", width: "100%" }} />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "48px 14px", textAlign: "center" }}>
                  <Banknote style={{ width: "28px", height: "28px", color: "var(--text-muted)", margin: "0 auto 8px" }} />
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>No matching records</p>
                </td>
              </tr>
            ) : (
              data.map((txn, idx) => (
                <tr key={idx}>
                  <td>
                    <div
                      style={{
                        width: "30px", height: "30px", borderRadius: "6px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: txn.credit > 0 ? "var(--success-bg)" : "var(--danger-bg)",
                      }}
                    >
                      {txn.credit > 0
                        ? <ArrowDownLeft style={{ width: "14px", height: "14px", color: "var(--success)" }} />
                        : <ArrowUpRight style={{ width: "14px", height: "14px", color: "var(--danger)" }} />}
                    </div>
                  </td>
                  <td>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                      {txn.description}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
                        <Calendar style={{ width: "10px", height: "10px" }} /> {txn.date}
                      </span>
                      <span className="badge-neutral" style={{ fontSize: "10px" }}>{txn.bank}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: txn.credit > 0 ? "var(--success)" : "var(--danger)" }}>
                      {txn.credit > 0 ? `+₹${txn.credit.toLocaleString()}` : `-₹${txn.debit.toLocaleString()}`}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    ₹{txn.balance.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 14px", borderTop: "1px solid var(--border-default)",
          background: "#161616",
        }}
      >
        <button
          disabled={page === 1 || isLoading}
          onClick={() => setPage(p => p - 1)}
          className="gov-btn-secondary"
          style={{ padding: "6px 14px", fontSize: "12px", opacity: (page === 1 || isLoading) ? 0.4 : 1 }}
        >
          <ChevronLeft style={{ width: "14px", height: "14px" }} /> Previous
        </button>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
          Page <strong style={{ color: "var(--brand)" }}>{page}</strong> of {totalPages}
        </span>
        <button
          disabled={page === totalPages || isLoading}
          onClick={() => setPage(p => p + 1)}
          className="gov-btn-secondary"
          style={{ padding: "6px 14px", fontSize: "12px", opacity: (page === totalPages || isLoading) ? 0.4 : 1 }}
        >
          Next <ChevronRight style={{ width: "14px", height: "14px" }} />
        </button>
      </div>
    </div>
  );
}