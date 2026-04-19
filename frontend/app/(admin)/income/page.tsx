import React from "react";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";
import { IncomeTracker } from "@/components/dashboard/IncomeTracker";

export const metadata = {
  title: "Income | Admin",
};

export default function IncomePage() {
  return (
    <AdminPageLayout
      title="Income"
      description="Track all your income sources, amounts, and schedules."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Income" },
      ]}
    >
      <IncomeTracker />
    </AdminPageLayout>
  );
}
