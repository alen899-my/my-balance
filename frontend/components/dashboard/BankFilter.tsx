"use client";

import React from "react";
import { Landmark, Check } from "lucide-react";

interface BankFilterProps {
    selectedBank: string;
    onBankChange: (bank: string) => void;
    availableBanks: string[];
}

export default function BankFilter({ selectedBank, onBankChange, availableBanks }: BankFilterProps) {
    const banks = ["All Banks", ...availableBanks];

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {banks.map((bank, i) => {
                const isActive = selectedBank === bank;
                return (
                    <button
                        key={`${bank}-${i}`}
                        onClick={() => onBankChange(bank)}
                        style={{
                            display: "inline-flex", alignItems: "center", gap: "6px",
                            padding: "6px 14px",
                            fontSize: "12px", fontWeight: 600,
                            border: `1px solid ${isActive ? "var(--brand)" : "var(--border-default)"}`,
                            borderRadius: "4px",
                            background: isActive ? "var(--brand)" : "var(--bg-surface)",
                            color: isActive ? "var(--bg-surface)" : "var(--text-secondary)",
                            cursor: "pointer",
                            transition: "all 0.12s",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {isActive
                            ? <Check style={{ width: "12px", height: "12px" }} />
                            : <Landmark style={{ width: "12px", height: "12px", opacity: 0.5 }} />}
                        {bank}
                    </button>
                );
            })}
        </div>
    );
}