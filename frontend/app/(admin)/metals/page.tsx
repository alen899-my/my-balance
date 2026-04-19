"use client";

import { MetalsTracker } from "@/components/dashboard/MetalsTracker";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";

export default function MetalsPage() {
  return (
    <AdminPageLayout
      title="Metals Portfolio"
      description="Track your precious metal holdings — gold, silver, platinum and palladium — with live spot prices and real-time P&L."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Metals Portfolio" },
      ]}
    >
      <MetalsTracker />
    </AdminPageLayout>
  );
}
