import React from "react";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";
import { SubscriptionTracker } from "@/components/dashboard/SubscriptionTracker";

export const metadata = {
  title: "Subscriptions | Admin",
};

export default function SubscriptionsPage() {
  return (
    <AdminPageLayout
      title="Subscriptions"
      description="Track recurring subscriptions, set billing days & get email reminders before charges."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Subscriptions" },
      ]}
    >
      <SubscriptionTracker />
    </AdminPageLayout>
  );
}
