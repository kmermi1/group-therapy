import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import EditPlanForm from "./EditPlanForm";

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  const sb = createAdminClient();
  const { data: plan } = await sb.from("reading_plans").select("*").eq("id", id).single();
  if (!plan || plan.group_id !== admin.groupId) notFound();

  const { data: extras } = await sb
    .from("reading_plan_extras")
    .select("name")
    .eq("plan_id", plan.id)
    .order("position");
  const extrasText = (extras ?? []).map((e) => e.name).join("\n");

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6 reveal">
      <PageHeader title="Edit plan" />
      <EditPlanForm planId={plan.id} plan={plan} extrasText={extrasText} />
    </main>
  );
}
