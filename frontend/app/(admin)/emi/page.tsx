import React from "react";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";
import { EMITracker } from "@/components/dashboard/EMITracker";

export const metadata = {
  title: "EMI Tracker | Admin",
};

export default function EMIPage() {
  return (
    <AdminPageLayout
      title="EMI Tracker"
      description="Track all your loan EMIs — monthly payments, outstanding balance, interest breakdown & progress."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "EMI Tracker" },
      ]}
    >
      <EMITracker />
    </AdminPageLayout>
  );
}
