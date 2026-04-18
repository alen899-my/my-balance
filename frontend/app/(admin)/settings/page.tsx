"use client";

import React, { useEffect, useState } from "react";
import Select from "react-select";
import currencyCodes from "currency-codes";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Option {
  value: string;
  label: string;
}

const GLOBAL_TABS = [
  { id: "currency", label: "Currency" }
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("currency");
  
  // State for localization
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<Option | null>(null);
  
  const currencyOptions: Option[] = currencyCodes.data.map(c => ({
    value: c.code,
    label: `${c.code} - ${c.currency}`
  }));

  useEffect(() => {
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      
      const data = await res.json();
      const userCurrency = data.currency || "INR";
      const option = currencyOptions.find(o => o.value === userCurrency);
      if (option) setCurrency(option);
      
      localStorage.setItem("preferred_currency", userCurrency);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = async (val: Option) => {
    setCurrency(val);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ currency: val.value })
      });
      
      if (!res.ok) throw new Error("Failed to save settings");
      
      localStorage.setItem("preferred_currency", val.value);
    } catch (err) {
      console.error("Error saving setting", err);
    }
  };

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "var(--background)",
      borderColor: state.isFocused ? "var(--primary)" : "var(--border)",
      color: "var(--foreground)",
      minHeight: "36px",
      borderRadius: "0.4rem",
      boxShadow: "none",
      "&:hover": { borderColor: "var(--border)" }
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: "2px 8px",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "var(--foreground)",
      fontSize: "0.85rem",
      fontWeight: 400,
    }),
    input: (base: any) => ({
      ...base,
      color: "var(--foreground)",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "var(--popover)",
      border: "1px solid var(--border)",
      borderRadius: "0.4rem",
      boxShadow: "0 10px 25px -5px oklch(0 0 0 / 10%), 0 8px 10px -6px oklch(0 0 0 / 10%)",
      zIndex: 50,
      marginTop: "4px"
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected 
          ? "var(--primary)" 
          : state.isFocused 
              ? "var(--accent)" 
              : "transparent",
      color: state.isSelected ? "var(--primary-foreground)" : "var(--foreground)",
      cursor: "pointer",
      fontSize: "0.85rem",
      padding: "8px 12px",
      "&:active": { backgroundColor: "var(--primary)" }
    })
  };

  return (
    <AdminPageLayout
      title="Settings"
      description="Manage application preferences and global behavior."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Settings" }
      ]}
      loading={loading}
    >
      <div className="flex flex-col md:flex-row h-[calc(100vh-160px)] -m-6">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-60 shrink-0 border-r border-border/50 py-6 overflow-y-auto">
          <div className="px-4">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">Global</h4>
            <nav className="flex flex-col gap-0.5">
              {GLOBAL_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`text-left px-3 py-1.5 rounded-md text-[13.5px] transition-colors ${
                      isActive 
                        ? "bg-accent/60 text-foreground font-medium" 
                        : "text-muted-foreground hover:bg-accent/40"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            
            <div className="mt-8">
               <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">Workspaces</h4>
               <nav className="flex flex-col gap-0.5">
                  <button className="text-left px-3 py-1.5 rounded-md text-[13.5px] text-muted-foreground hover:bg-accent/40 truncate">
                    BankApplication
                  </button>
               </nav>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 w-full max-w-4xl p-6 md:px-10 md:py-8 overflow-y-auto">
          {activeTab === "currency" && (
            <div className="space-y-10 animate-in fade-in duration-300">
              
              {/* Regional Section */}
              <section>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Regional</h3>
                <div className="border border-border/60 rounded-lg bg-card/20 divide-y divide-border/60">
                  
                  {/* Setting: Default Currency */}
                  <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex-1 max-w-lg">
                      <h4 className="text-sm font-medium text-foreground mb-1">Default Currency</h4>
                      <p className="text-[13px] text-muted-foreground leading-relaxed">
                        Specifies the currency standard used to format amounts and balances dynamically over the main dashboard views.
                      </p>
                    </div>
                    <div className="w-[200px] shrink-0">
                      <Select
                        options={currencyOptions}
                        value={currency}
                        onChange={(val) => handleCurrencyChange(val as Option)}
                        styles={selectStyles}
                        className="w-full font-sans"
                        placeholder="Select..."
                        isSearchable
                      />
                    </div>
                  </div>

                </div>
              </section>
              
            </div>
          )}
        </main>

      </div>
    </AdminPageLayout>
  );
}
