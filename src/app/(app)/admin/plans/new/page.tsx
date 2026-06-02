import { PageHeader } from "@/components/ui";
import { todayInGroupTz } from "@/lib/plans";
import NewPlanForm from "./NewPlanForm";

export default function NewPlanPage() {
  const today = todayInGroupTz();
  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="New reading plan" />
      <NewPlanForm today={today} />
    </main>
  );
}
