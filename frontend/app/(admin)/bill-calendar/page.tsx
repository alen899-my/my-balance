"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import getSymbolFromCurrency from "currency-symbol-map";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";
import { BillCalendar } from "@/components/dashboard/BillCalendar";
import { CalendarDays } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function BillCalendarPageContent() {
  const router = useRouter();
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    const pref = localStorage.getItem("preferred_currency");
    if (pref) {
      setCurrencySymbol(getSymbolFromCurrency(pref) || "₹");
    } else if (token) {
      fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          const cur = d.currency || "INR";
          localStorage.setItem("preferred_currency", cur);
          setCurrencySymbol(getSymbolFromCurrency(cur) || "₹");
        })
        .catch(() => {});
    }
  }, [router]);

  return (
    <AdminPageLayout
      title="Bill Calendar"
      description="Daily spend overview — click any date to inspect spend details."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Bill Calendar" },
      ]}
    >
      <BillCalendar currencySymbol={currencySymbol} />
    </AdminPageLayout>
  );
}

export default function BillCalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-200px)] items-center justify-center text-muted-foreground gap-2">
          <CalendarDays className="h-5 w-5 animate-pulse" />
          Loading calendar…
        </div>
      }
    >
      <BillCalendarPageContent />
    </Suspense>
  );
}
