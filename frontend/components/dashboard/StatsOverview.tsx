"use client";

import { useEffect, useState, useMemo } from "react";
import { authFetch } from "@/lib/authFetch";
import { TrendingDown, Wallet, Trophy, Zap, Target, Repeat } from "lucide-react";

interface StatsOverviewProps {
  startDate?: Date;
  endDate?: Date;
  selectedBank?: string; // 1. Added Prop
}

export default function StatsOverview({ startDate, endDate, selectedBank }: StatsOverviewProps) {
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true); // Reset loading state when bank changes
      try {
        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate.toISOString());
        if (endDate) params.append("end_date", endDate.toISOString());
        
        // 2. Pass Bank to the API
        if (selectedBank && selectedBank !== "All Banks") {
          params.append("bank", selectedBank);
        }

        const [resData, resInsights] = await Promise.all([
          // Passing params to transactions as well ensures the "Records in View" count is accurate
          authFetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions?limit=1&${params.toString()}`),
          authFetch(`${process.env.NEXT_PUBLIC_API_URL}/insights?${params.toString()}`)
        ]);

        const jsonD = await resData.json();
        const jsonI = await resInsights.json();
        
        setData(jsonD.data || []);
        setSummary(jsonI);
      } catch (err) {
        console.error("Stats Error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
    // 3. Added selectedBank to dependency array
  }, [startDate, endDate, selectedBank]); 

  const cards = useMemo(() => {
    const s = summary?.summary;
    const leaderboard = summary?.leaderboard || [];
    
    // Find the first payee with actual spending for the "Top Payee" card
    const topPayee = leaderboard[0];

    return [
      {
        label: "Balance",
        value: `₹${(s?.balance || 0).toLocaleString()}`,
        icon: Wallet, color: "text-blue-600"
      },
      {
        label: "Expense",
        value: `₹${(s?.expense || 0).toLocaleString()}`,
        icon: TrendingDown, color: "text-red-500"
      },
      {
        label: "Top Payee",
        value: topPayee?.name || "No Data",
        icon: Trophy, color: "text-amber-500"
      },
      {
        label: "Daily Avg",
        value: `₹${(s?.daily_avg || 0).toLocaleString()}`,
        icon: Zap, color: "text-purple-500"
      },
      {
        label: "Savings",
        value: `${s?.savings_rate || 0}%`,
        icon: Target, color: "text-emerald-500"
      },
      {
        label: "Txns",
        value: s?.total_transactions || 0,
        icon: Repeat, color: "text-slate-500"
      },
    ];
  }, [data, summary]);

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-24 bg-white dark:bg-slate-900 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800" />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{card.label}</p>
          <h3 className="text-lg font-black text-slate-900 dark:text-white truncate" title={card.value.toString()}>
            {card.value}
          </h3>
        </div>
      ))}
    </div>
  );
}