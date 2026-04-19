"use client";

import React from "react";
import { BankAccounts } from "@/components/dashboard/BankAccounts";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";

export default function BanksPage() {
  return (
    <AdminPageLayout
      title="Accounts & Banks"
      description="Overview of your active bank accounts and wallet balances based on statement uploads."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Banks" },
      ]}
    >
      <BankAccounts />
    </AdminPageLayout>
  );
}
