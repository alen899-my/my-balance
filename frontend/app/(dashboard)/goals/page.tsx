"use client";

import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/authFetch";
import { Target, PlusCircle, ArrowUpCircle, TrendingUp, PiggyBank, CalendarDays, Trash2 } from "lucide-react";

export default function GoalsPage() {
    const [data, setData] = useState<any>({ goals: [], metrics: {} });
    const [loading, setLoading] = useState(true);

    // Modals
    const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
    const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
    const [deleteGoalData, setDeleteGoalData] = useState<{ id: string, name: string } | null>(null);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

    // Form State
    const [goalName, setGoalName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [initialAmount, setInitialAmount] = useState("");
    const [fundAmount, setFundAmount] = useState("");

    const fetchGoals = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/goals`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    const handleCreateGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!goalName || !targetAmount) return;

        try {
            await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/goals`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: goalName,
                    target_amount: parseFloat(targetAmount),
                    current_amount: parseFloat(initialAmount || "0")
                })
            });
            setIsAddGoalOpen(false);
            setGoalName(""); setTargetAmount(""); setInitialAmount("");
            fetchGoals();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddFunds = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGoalId || !fundAmount) return;

        try {
            await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/goals/${selectedGoalId}/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: parseFloat(fundAmount) })
            });
            setIsAddFundsOpen(false);
            setFundAmount(""); setSelectedGoalId(null);
            fetchGoals();
        } catch (err) {
            console.error(err);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteGoalData) return;
        try {
            await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/goals/${deleteGoalData.id}`, {
                method: "DELETE"
            });
            setDeleteGoalData(null);
            fetchGoals();
        } catch (err) {
            console.error(err);
        }
    };

    // SVG Circular Progress Ring Component
    const RadialProgress = ({ percentage, eta, months }: { percentage: number, eta: string, months: number | null }) => {
        const radius = 60;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        // Color gradient based on completion
        const isComplete = percentage >= 100;
        const strokeColor = isComplete ? "var(--success)" : "var(--brand)";

        return (
            <div style={{ position: "relative", width: "150px", height: "150px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="150" height="150" style={{ transform: "rotate(-90deg)" }}>
                    {/* Background Track */}
                    <circle
                        cx="75" cy="75" r={radius}
                        stroke="var(--border-default)"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    {/* Progress Indicator */}
                    <circle
                        cx="75" cy="75" r={radius}
                        stroke={strokeColor}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                    />
                </svg>

                {/* Inner Text */}
                <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    <span style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-primary)", lineHeight: 1 }}>
                        {percentage}%
                    </span>
                    {isComplete ? (
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--success)", textTransform: "uppercase", marginTop: "4px" }}>
                            Achieved
                        </span>
                    ) : (
                        <>
                            {eta ? (
                                <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <span style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>ETA</span>
                                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--brand)" }}>{eta}</span>
                                </div>
                            ) : (
                                <span style={{ fontSize: "9px", color: "var(--danger)", marginTop: "4px", maxWidth: "60px", lineHeight: 1.2 }}>
                                    Increase savings
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="page-enter" style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "40px" }}>

            {/* ── HEADER ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid var(--border-default)", paddingBottom: "16px" }}>
                <div>
                    <p className="section-label" style={{ marginBottom: "4px" }}>mybalance Wealth</p>
                    <h1 style={{ margin: 0 }}>Savings Vaults</h1>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                        Track and forecast your financial targets.
                    </p>
                </div>
                <button
                    onClick={() => setIsAddGoalOpen(true)}
                    className="gov-btn-primary"
                >
                    <PlusCircle style={{ width: "14px", height: "14px" }} />
                    New Vault
                </button>
            </div>

            {loading ? (
                <div className="gov-panel skeleton" style={{ height: "400px" }} />
            ) : (
                <>
                    {/* ── DASHBOARD METRICS ── */}
                    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: "16px" }}>

                        <div className="gov-kpi-card">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                <div style={{ background: "var(--success-bg)", padding: "6px", borderRadius: "6px" }}>
                                    <PiggyBank style={{ width: "14px", height: "14px", color: "var(--success)" }} />
                                </div>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Total Vault Balance</span>
                            </div>
                            <div style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                                ₹{Number(data.metrics?.total_saved || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                                out of ₹{Number(data.metrics?.total_target || 0).toLocaleString()} across all targets
                            </div>
                        </div>

                        <div className="gov-kpi-card">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                <div style={{ background: "var(--brand-light)", padding: "6px", borderRadius: "6px" }}>
                                    <TrendingUp style={{ width: "14px", height: "14px", color: "var(--brand)" }} />
                                </div>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Trailing 30-Day Savings Rate</span>
                            </div>
                            <div style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em", color: data.metrics?.current_monthly_savings > 0 ? "var(--text-primary)" : "var(--danger)" }}>
                                ₹{Number(data.metrics?.current_monthly_savings || 0).toLocaleString()}
                                <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "4px", fontWeight: 500 }}>/mo</span>
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                                Powers your intelligent ETA forecasts.
                            </div>
                        </div>

                    </section>

                    {/* ── VAULTS GRID ── */}
                    <section>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                            <Target style={{ width: "16px", height: "16px", color: "var(--text-primary)" }} />
                            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Active Goals</h2>
                        </div>

                        {data.goals.length === 0 ? (
                            <div className="gov-panel" style={{ padding: "40px", textAlign: "center", borderStyle: "dashed", borderColor: "var(--border-light)" }}>
                                <Target style={{ width: "32px", height: "32px", color: "var(--text-muted)", margin: "0 auto 12px" }} />
                                <h3 style={{ margin: "0 0 4px", fontSize: "14px" }}>No active vaults</h3>
                                <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--text-secondary)" }}>Create a savings vault to track your progress towards a goal.</p>
                                <button onClick={() => setIsAddGoalOpen(true)} className="gov-btn-secondary">Create your first target</button>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "20px" }}>
                                {data.goals.map((g: any) => (
                                    <div key={g.id} className="gov-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", position: "relative" }}>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => setDeleteGoalData({ id: g.id, name: g.name })}
                                            style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                            title="Delete Vault"
                                        >
                                            <Trash2 style={{ width: "16px", height: "16px" }} />
                                        </button>

                                        {/* Vault Header */}
                                        <div style={{ width: "100%", textAlign: "center", padding: "0 20px" }}>
                                            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700 }}>{g.name}</h3>
                                            <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                                                <span style={{ color: "var(--text-primary)" }}>₹{g.current_amount.toLocaleString()}</span> / ₹{g.target_amount.toLocaleString()}
                                            </div>
                                        </div>

                                        {/* Circular Radial Watch UI */}
                                        <RadialProgress percentage={g.percentage} eta={g.eta_date} months={g.months_to_go} />

                                        {/* Deposit Button */}
                                        <button
                                            onClick={() => { setSelectedGoalId(g.id); setIsAddFundsOpen(true); }}
                                            className="gov-btn-secondary"
                                            style={{ width: "100%", justifyContent: "center" }}
                                            disabled={g.percentage >= 100}
                                        >
                                            <ArrowUpCircle style={{ width: "14px", height: "14px" }} />
                                            {g.percentage >= 100 ? "Goal Met" : "Deposit Funds"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            {/* ── MODALS ── */}
            {isAddGoalOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="gov-panel" style={{ width: "100%", maxWidth: "400px", padding: "24px" }}>
                        <h2 style={{ margin: "0 0 16px", fontSize: "18px" }}>Create New Vault</h2>
                        <form onSubmit={handleCreateGoal} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>What are you saving for?</label>
                                <input required value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="e.g. Emergency Fund" className="gov-input" style={{ width: "100%" }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", gap: "12px" }}>
                                <div>
                                    <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Target Amount (₹)</label>
                                    <input required type="number" min="1" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="100000" className="gov-input" style={{ width: "100%" }} />
                                </div>
                                <div>
                                    <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Starting Balance</label>
                                    <input type="number" min="0" value={initialAmount} onChange={e => setInitialAmount(e.target.value)} placeholder="0" className="gov-input" style={{ width: "100%" }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                                <button type="button" onClick={() => setIsAddGoalOpen(false)} className="gov-btn-secondary">Cancel</button>
                                <button type="submit" className="gov-btn-primary">Create Vault</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAddFundsOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="gov-panel" style={{ width: "100%", maxWidth: "320px", padding: "24px" }}>
                        <h2 style={{ margin: "0 0 16px", fontSize: "18px" }}>Deposit Funds</h2>
                        <form onSubmit={handleAddFunds} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Amount to add (₹)</label>
                                <input required type="number" autoFocus min="1" value={fundAmount} onChange={e => setFundAmount(e.target.value)} placeholder="5000" className="gov-input" style={{ width: "100%" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                                <button type="button" onClick={() => setIsAddFundsOpen(false)} className="gov-btn-secondary">Cancel</button>
                                <button type="submit" className="gov-btn-primary">Confirm Deposit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteGoalData && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="gov-panel" style={{ width: "100%", maxWidth: "320px", padding: "24px" }}>
                        <h2 style={{ margin: "0 0 12px", fontSize: "18px", color: "var(--danger)" }}>Delete Vault</h2>
                        <p style={{ margin: "0 0 20px", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                            Are you sure you want to delete the <strong>{deleteGoalData.name}</strong> vault?
                            This action cannot be undone.
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                            <button type="button" onClick={() => setDeleteGoalData(null)} className="gov-btn-secondary">Cancel</button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                style={{ background: "var(--danger)", color: "white", padding: "8px 16px", borderRadius: "6px", fontWeight: 600, border: "none", cursor: "pointer" }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
