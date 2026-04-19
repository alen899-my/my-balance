"use client";

import { LendBorrowTracker } from "@/components/dashboard/LendBorrowTracker";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";

export default function LendBorrowPage() {
  return (
    <AdminPageLayout
      title="Lend / Borrow"
      description="Track money you've lent to others and money you've borrowed. Mark entries as settled when the amount is returned."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Lend / Borrow" },
      ]}
    >
      <LendBorrowTracker />
    </AdminPageLayout>
  );
}
