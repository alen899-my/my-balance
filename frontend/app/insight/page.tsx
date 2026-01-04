"use client";

import { useEffect, useState, useMemo } from "react";
import { authFetch } from "@/lib/authFetch";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Line, ScatterChart, Scatter, ZAxis
} from "recharts";
import {
  TrendingUp, TrendingDown, Activity, Calendar, Wallet,
  ArrowUpRight, ArrowDownRight, Target, Clock, Zap,
  ShieldCheck, AlertTriangle, Layers, CalendarDays,
  Filter, Download, ChevronDown, CheckCircle, XCircle,
  CreditCard, Banknote, Search, MoreHorizontal
} from "lucide-react";
import { format, subMonths, isSameMonth, parse, differenceInDays } from "date-fns";

// --- TYPES ---
type Transaction = {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  bank: string;
};

type RecurringTxn = {
  name: string;
  amount: number;
  frequency: number;
  projectedDate: string;
};

type InsightStats = {
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  currentBalance: number;
  savingsRate: number;
  healthScore: number;
  burnRate: number;
  runwayDays: number;
  volatility: number;
  projectedBalance: number;
  largestExpense: { amount: number; desc: string; date: string };
  recurring: RecurringTxn[];
  weekdayData: { subject: string; A: number; fullMark: number }[];
  categoryData: { name: string; value: number }[];
  historyData: any[];
  scatterData: any[];
  topMerchants: { name: string; count: number; total: number }[];
};

// --- COLORS ---
const COLORS = {
  primary: "#2563EB",   // Blue 600
  success: "#10B981",   // Emerald 500
  danger: "#EF4444",    // Red 500
  warning: "#F59E0B",   // Amber 500
  violet: "#8B5CF6",    // Violet 500
  slate: "#64748B",     // Slate 500
  charts: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#14B8A6"]
};

// --- HELPER: STANDARD DEVIATION ---
const getStandardDeviation = (array: number[]) => {
  if (!array.length) return 0;
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
};

export default function UltimateInsightsPage() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBank, setFilterBank] = useState<string>("All");
  const [timeRange, setTimeRange] = useState<"ALL" | "3M" | "6M" | "1Y">("ALL");
  const router = useRouter();

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    async function loadData() {
      try {
        // Fetching maximum limit to perform client-side analytics
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions?limit=5000`);
        if (res.status === 401) {
          localStorage.removeItem("token");
          return router.push("/login");
        }
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  // --- 2. MASSIVE CALCULATION ENGINE ---
  const stats = useMemo<InsightStats | null>(() => {
    if (!data.length) return null;

    // A. FILTERING
    let filtered = data;
    if (filterBank !== "All") {
      filtered = filtered.filter(t => t.bank === filterBank);
    }
    // (Add Time Range Logic here if needed, skipping for brevity to focus on analysis)

    // B. AGGREGATES
    const totalIncome = filtered.reduce((acc, curr) => acc + curr.credit, 0);
    const totalExpense = filtered.reduce((acc, curr) => acc + curr.debit, 0);
    const netFlow = totalIncome - totalExpense;
    const currentBalance = filtered[0]?.balance || 0;
    
    // C. TIME SERIES & SCATTER
    const monthlyGroups: Record<string, any> = {};
    const scatterData: any[] = [];
    
    // D. CATEGORY & MERCHANT HEURISTICS
    const categories: Record<string, number> = { "Digital/UPI": 0, "Cash": 0, "Shopping": 0, "Transfers": 0, "Food": 0, "Travel": 0, "Utilities": 0, "Others": 0 };
    const merchants: Record<string, { count: number; total: number }> = {};
    
    // E. WEEKDAY PATTERNS
    const weekdaySpend = new Array(7).fill(0);
    const expenseValues: number[] = [];

    filtered.forEach((t) => {
      // Date Parsing
      const parts = t.date.split("/"); // DD/MM/YYYY
      if (parts.length !== 3) return;
      const dateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      const monthKey = `${parts[1]}/${parts[2]}`;

      // Monthly Grouping
      if (!monthlyGroups[monthKey]) monthlyGroups[monthKey] = { name: monthKey, income: 0, expense: 0, balance: t.balance, net: 0 };
      monthlyGroups[monthKey].income += t.credit;
      monthlyGroups[monthKey].expense += t.debit;
      monthlyGroups[monthKey].net += (t.credit - t.debit);

      // Scatter Data (Magnitude vs Time)
      if (t.debit > 0) scatterData.push({ x: dateObj.getTime(), y: t.debit, z: t.debit / 100 });

      // Merchant Logic
      if (t.debit > 0) {
        expenseValues.push(t.debit);
        weekdaySpend[dateObj.getDay()] += t.debit;

        // Simple Keyword Categorization
        const desc = t.description.toLowerCase();
        let cat = "Others";
        if (desc.includes("upi") || desc.includes("gpay")) cat = "Digital/UPI";
        else if (desc.includes("atm") || desc.includes("csh")) cat = "Cash";
        else if (desc.includes("amazon") || desc.includes("flipkart") || desc.includes("pos")) cat = "Shopping";
        else if (desc.includes("zomato") || desc.includes("swiggy") || desc.includes("rest")) cat = "Food";
        else if (desc.includes("uber") || desc.includes("ola") || desc.includes("fuel") || desc.includes("petrol")) cat = "Travel";
        else if (desc.includes("bill") || desc.includes("recharge") || desc.includes("jio")) cat = "Utilities";
        
        categories[cat] += t.debit;

        // Top Merchant Extraction
        const cleanName = t.description.split("/")[0].split("-")[0].trim().substring(0, 15);
        if (!merchants[cleanName]) merchants[cleanName] = { count: 0, total: 0 };
        merchants[cleanName].count += 1;
        merchants[cleanName].total += t.debit;
      }
    });

    // F. ADVANCED METRICS
    const historyData = Object.values(monthlyGroups).reverse();
    const volatility = getStandardDeviation(expenseValues);
    const burnRate = totalExpense / (historyData.length || 1); // Avg monthly burn
    const runwayDays = burnRate > 0 ? (currentBalance / (burnRate / 30)) : 999;
    
    // G. HEALTH SCORE (0-100)
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    let healthScore = 50; // Base
    if (savingsRate > 20) healthScore += 20;
    if (runwayDays > 90) healthScore += 20;
    if (volatility < 5000) healthScore += 10; // Stable spending
    if (netFlow < 0) healthScore -= 30;

    // H. RECURRING PAYMENT DETECTION (Naive)
    const recurring: RecurringTxn[] = Object.entries(merchants)
      .filter(([_, data]) => data.count >= 3) // At least 3 times
      .map(([name, data]) => ({
        name,
        amount: data.total / data.count,
        frequency: data.count,
        projectedDate: "Next Month"
      }))
      .slice(0, 5);

    // I. FORMATTING ARRAYS
    const weekdayChartData = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => ({ subject: d, A: weekdaySpend[i], fullMark: Math.max(...weekdaySpend) }));
    const categoryChartData = Object.entries(categories).filter(([_, v]) => v > 0).map(([n, v]) => ({ name: n, value: v }));
    const topMerchants = Object.entries(merchants).sort((a, b) => b[1].total - a[1].total).slice(0, 8).map(([n, v]) => ({ name: n, ...v }));

    // J. LARGEST EXPENSE
    const sortedExpenses = filtered.filter(t => t.debit > 0).sort((a, b) => b.debit - a.debit);
    const largestExpense = sortedExpenses[0] ? { amount: sortedExpenses[0].debit, desc: sortedExpenses[0].description, date: sortedExpenses[0].date } : { amount: 0, desc: "N/A", date: "-" };

    return {
      totalIncome, totalExpense, netFlow, currentBalance, savingsRate, healthScore, burnRate, runwayDays, volatility,
      projectedBalance: currentBalance + (netFlow / (historyData.length || 1)),
      largestExpense, recurring, weekdayData: weekdayChartData, categoryData: categoryChartData, historyData, scatterData, topMerchants
    };
  }, [data, filterBank]);

  // --- RENDER LOADING ---
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Activity className="animate-spin text-blue-600" size={40} />
        <p className="text-gray-500 font-medium">Crunching your financial data...</p>
      </div>
    </div>
  );

  // --- RENDER ERROR/EMPTY ---
  if (!stats) return <div className="p-10 text-center">No transaction data available to analyze.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* 1. TOP BAR */}
      <div className="bg-white border-b sticky top-0 z-20 px-6 py-4 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-blue-600" /> 
            Financial Command Center
          </h1>
          <p className="text-xs text-gray-400 mt-1">AI-Powered Insights • {data.length} Transactions Analyzed</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <select 
              className="pl-10 pr-4 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
            >
              <option value="All">All Banks</option>
              {[...new Set(data.map(t => t.bank))].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* 2. HEALTH SCORE HEADER */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white col-span-1 md:col-span-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck size={100} /></div>
            <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-2">Financial Health</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-bold">{Math.round(stats.healthScore)}</span>
              <span className="text-xl text-indigo-300 mb-1">/ 100</span>
            </div>
            <div className="w-full bg-indigo-900/50 h-2 rounded-full mt-2">
              <div className="bg-green-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${stats.healthScore}%` }}></div>
            </div>
            <p className="text-xs text-indigo-300 mt-4 flex items-center gap-1">
              {stats.healthScore > 70 ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
              {stats.healthScore > 70 ? "Excellent status. Keep it up!" : "Needs attention. High spending."}
            </p>
          </div>

          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Wealth" value={`₹${stats.currentBalance.toLocaleString()}`} icon={<Wallet/>} color="text-blue-600" bg="bg-white" />
            <StatCard title="Monthly Burn" value={`₹${stats.burnRate.toFixed(0)}`} icon={<Zap/>} color="text-orange-600" bg="bg-white" />
            <StatCard title="Runway" value={`${stats.runwayDays.toFixed(0)} Days`} sub="Survival time with 0 income" icon={<Clock/>} color="text-green-600" bg="bg-white" />
            <StatCard title="Net Flow" value={`₹${stats.netFlow.toLocaleString()}`} icon={<Activity/>} color={stats.netFlow > 0 ? "text-emerald-600" : "text-red-600"} bg="bg-white" />
            <StatCard title="Savings Rate" value={`${stats.savingsRate.toFixed(1)}%`} icon={<Target/>} color="text-violet-600" bg="bg-white" />
            <StatCard title="Volatility" value={`±${stats.volatility.toFixed(0)}`} sub="Spending fluctuation" icon={<Activity/>} color="text-slate-600" bg="bg-white" />
          </div>
        </div>

        {/* 3. MAIN CHARTS AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* A. CASH FLOW HISTORY (COMPOSED) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500"/> Income vs Expenses</h3>
              <div className="flex gap-2">
                <span className="flex items-center text-xs text-gray-500"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></div> Income</span>
                <span className="flex items-center text-xs text-gray-500"><div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div> Expense</span>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.historyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="income" fill={COLORS.success} radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expense" fill={COLORS.danger} radius={[4, 4, 0, 0]} barSize={20} />
                  <Line type="monotone" dataKey="balance" stroke={COLORS.primary} strokeWidth={3} dot={{r: 4}} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* B. CATEGORY PIE */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Layers size={18} className="text-violet-500"/> Spending Mix</h3>
            <div className="h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={80}
                    paddingAngle={5} dataKey="value"
                  >
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.charts[index % COLORS.charts.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-gray-400">Total Spent</span>
                <span className="text-lg font-bold text-gray-800">₹{stats.totalExpense.toLocaleString(undefined, { notation: "compact" })}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {stats.categoryData.slice(0, 4).map((c, i) => (
                <div key={c.name} className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS.charts[i] }}></div>
                  {c.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. SECONDARY METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* A. WEEKLY SPENDING RADAR */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CalendarDays size={18} className="text-orange-500"/> Day-wise Activity</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="70%" data={stats.weekdayData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar name="Spending" dataKey="A" stroke={COLORS.warning} fill={COLORS.warning} fillOpacity={0.5} />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-gray-400">Distribution of spending across the week</p>
          </div>

          {/* B. RECURRING PAYMENTS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard size={18} className="text-blue-500"/> Detected Subscriptions</h3>
             <div className="space-y-4">
               {stats.recurring.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No recurring payments detected.</p>}
               {stats.recurring.map((sub, i) => (
                 <div key={i} className="flex items-center justify-between border-b border-dashed border-gray-100 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">
                        {sub.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{sub.name}</p>
                        <p className="text-xs text-gray-400">Freq: {sub.frequency}x • Avg</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">₹{sub.amount.toFixed(0)}</p>
                      <p className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded inline-block">Active</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>

          {/* C. LARGEST EXPENSE ALERT */}
          <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl shadow-sm border border-red-100 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2"><AlertTriangle size={18}/> Highest Spend</h3>
              <p className="text-sm text-red-600/80 mb-6">
                Your single largest debit transaction in this period was detected.
              </p>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                <p className="text-xs text-gray-400 mb-1">Date: {stats.largestExpense.date}</p>
                <p className="text-lg font-bold text-gray-800 truncate">{stats.largestExpense.desc}</p>
                <p className="text-2xl font-extrabold text-red-600 mt-2">₹{stats.largestExpense.amount.toLocaleString()}</p>
              </div>
            </div>
            <button className="w-full mt-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg text-sm hover:bg-red-200 transition">
              View Details
            </button>
          </div>

        </div>

        {/* 5. TOP MERCHANTS TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
             <h3 className="font-bold text-gray-800 flex items-center gap-2"><Banknote size={18} className="text-emerald-600"/> Top Merchants</h3>
             <button className="text-sm text-blue-600 hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Rank</th>
                  <th className="px-6 py-3">Merchant Name</th>
                  <th className="px-6 py-3 text-right">Frequency</th>
                  <th className="px-6 py-3 text-right">Total Amount</th>
                  <th className="px-6 py-3 text-right">Avg / Txn</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.topMerchants.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-400">#{i + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-800">{m.name}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{m.count}</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-800">₹{m.total.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-600">₹{(m.total / m.count).toFixed(0)}</td>
                    <td className="px-6 py-3 text-center">
                      <button className="p-1 hover:bg-gray-200 rounded text-gray-400"><MoreHorizontal size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ title, value, sub, icon, color, bg }: any) {
  return (
    <div className={`${bg} p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:border-blue-200 transition-colors`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</span>
        <div className={`p-1.5 rounded-lg bg-gray-50 ${color}`}>{icon}</div>
      </div>
      <div>
        <h4 className={`text-xl font-bold ${color}`}>{value}</h4>
        {sub && <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>}
      </div>
    </div>
  );
}