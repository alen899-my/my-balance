"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { useRouter } from "next/navigation";

type Transaction = {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  bank: string;
};

export default function TransactionsPage() {
  const [data, setData] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 100;
  const router = useRouter();

  async function fetchTransactions(p = page) {
    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/transactions?page=${p}&limit=${limit}`
      );

      if (res.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      const json = await res.json();
      setData(json.data);
      setTotalPages(json.totalPages);
    } catch (err) {
      console.error("Failed to load transactions", err);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-white min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          Transactions
        </h2>
        <span className="text-sm text-gray-500">
          Showing your transactions
        </span>
      </div>

      {/* Table Container */}
      <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative scrollbar-thin scrollbar-thumb-gray-300">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200 sticky top-0 z-10 shadow-sm">
              <tr>
                {/* Fixed width for Date */}
                <th className="px-6 py-4 whitespace-nowrap bg-gray-50 w-[150px]">Date</th>
                
                {/* Description takes remaining space */}
                <th className="px-6 py-4 min-w-[300px] bg-gray-50">Description</th>
                
                {/* Fixed widths for financial columns for neat alignment */}
                <th className="px-6 py-4 text-right bg-gray-50 w-[150px]">Debit</th>
                <th className="px-6 py-4 text-right bg-gray-50 w-[150px]">Credit</th>
                <th className="px-6 py-4 text-right bg-gray-50 w-[150px]">Balance</th>
                
                {/* Fixed width for Bank */}
                <th className="px-6 py-4 bg-gray-50 w-[120px]">Bank</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No transactions found
                  </td>
                </tr>
              )}

              {data
                .filter((txn) => txn.date && txn.description)
                .map((txn, idx) => (
                  <tr
                    key={`${txn.date}-${txn.balance}-${idx}`}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {txn.date}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {txn.description}
                    </td>
                    
                    {/* Tabular nums ensures numbers line up perfectly */}
                    <td className="px-6 py-4 text-right font-medium text-red-600 tabular-nums">
                      {txn.debit > 0 ? txn.debit.toFixed(2) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-green-600 tabular-nums">
                      {txn.credit > 0 ? txn.credit.toFixed(2) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700 tabular-nums font-medium">
                      {Number(txn.balance).toFixed(2)}
                    </td>
                    
                    <td className="px-6 py-4 text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {txn.bank}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
            page === 1
              ? "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          }`}
        >
          Previous
        </button>

        <span className="text-sm text-gray-600 font-medium">
          Page <span className="text-black">{page}</span> of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
            page === totalPages
              ? "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}