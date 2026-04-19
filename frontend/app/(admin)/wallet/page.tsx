"use client";

import { WalletTracker } from "@/components/dashboard/WalletTracker";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";

export default function WalletPage() {
  return (
    <AdminPageLayout
      title="Pocket Wallet"
      description="Keep track of your physical cash. Set your initial balance, record on-the-go spends, and attach receipts to keep every penny accounted for."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Pocket Wallet" },
      ]}
    >
      <WalletTracker />
    </AdminPageLayout>
  );
}
