"use client";

import React from "react";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";
import { DailyTracker } from "@/components/dashboard/DailyTracker";

export default function DailyPage() {
  return (
    <AdminPageLayout
      title="Daily Tracker"
      description="Log and review day-wise transactions. Add manual bills, upload receipts, or browse bank-synced entries."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Daily Tracker" },
      ]}
    >
      <DailyTracker />
    </AdminPageLayout>
  );
}
