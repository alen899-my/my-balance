import React from "react";
import { AdminPageLayout } from "@/components/layout/Adminpagelayout";
import { PropertiesTracker } from "@/components/dashboard/PropertiesTracker";

export const metadata = {
  title: "Properties | Admin",
};

export default function PropertiesPage() {
  return (
    <AdminPageLayout
      title="Properties"
      description="Track the value of your assets and properties."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Properties" },
      ]}
    >
      <PropertiesTracker />
    </AdminPageLayout>
  );
}
