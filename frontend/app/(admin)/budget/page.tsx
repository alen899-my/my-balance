import { AdminPageLayout } from "@/components/layout/Adminpagelayout";
import { BudgetPlanner } from "@/components/dashboard/BudgetPlanner";

export const metadata = {
  title: "Budget Planner | Vaultly",
  description: "Plan and track your monthly budget with detailed line-item calculations.",
};

export default function BudgetPlannerPage() {
  return (
    <AdminPageLayout
      title="Budget Planner"
      description="Strategize your monthly spending and savings goals."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Budget Planner" },
      ]}
    >
      <BudgetPlanner />
    </AdminPageLayout>
  );
}
