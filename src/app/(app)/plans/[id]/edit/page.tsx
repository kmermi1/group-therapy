import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { editPlanAction } from "@/app/actions/plans";
import { Button, Input, Label, PageHeader, Card } from "@/components/ui";

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  const sb = createAdminClient();
  const { data: plan } = await sb.from("reading_plans").select("*").eq("id", id).single();
  if (!plan || plan.group_id !== admin.groupId) notFound();

  const startDate = String(plan.start_date).slice(0, 10);

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="Edit plan" />
      <form action={editPlanAction} className="space-y-4">
        <input type="hidden" name="planId" value={plan.id} />

        <Card className="space-y-3">
          <div>
            <Label htmlFor="name">Plan name</Label>
            <Input id="name" name="name" required maxLength={80} defaultValue={plan.name} />
          </div>
          <div>
            <Label htmlFor="startDate">Start date (NY local)</Label>
            <Input id="startDate" name="startDate" type="date" defaultValue={startDate} />
          </div>
        </Card>

        {plan.schedule === "progressing" && (
          <Card className="space-y-3">
            <h2 className="font-semibold">Day labels</h2>
            <div>
              <Label htmlFor="dayLabelTemplate">Day label template</Label>
              <Input
                id="dayLabelTemplate"
                name="dayLabelTemplate"
                defaultValue={plan.day_label_template ?? "Day {n}"}
              />
              <p className="text-[11px] text-[var(--color-foreground)]/60 mt-1">
                Use <code>{"{n}"}</code> as the number placeholder.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="startAt">Start at</Label>
                <Input id="startAt" name="startAt" type="number" defaultValue={plan.start_at ?? 1} />
              </div>
              <div>
                <Label htmlFor="totalDays">Total days</Label>
                <Input id="totalDays" name="totalDays" type="number" min={1} defaultValue={plan.total_days ?? 30} />
              </div>
            </div>
          </Card>
        )}

        <p className="text-[11px] text-[var(--color-foreground)]/60">
          Note: <em>units per day</em> and <em>block size</em> cannot be edited once a plan is created — members may have
          claimed ranges that depend on them. To change those, clone this plan instead.
        </p>

        <Button type="submit" className="w-full">Save changes</Button>
        <Link href={`/plans/${plan.id}`} className="block text-center text-sm text-[var(--color-foreground)]/60">Cancel</Link>
      </form>
    </main>
  );
}
