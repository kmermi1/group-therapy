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
  const isRepeating = plan.schedule === "repeating";

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6 reveal">
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

        {isRepeating && (
          <Card className="space-y-3">
            <h2 className="font-semibold">Units</h2>
            <div>
              <Label htmlFor="unitLabel">Unit name</Label>
              <Input id="unitLabel" name="unitLabel" defaultValue={plan.unit_label} placeholder="page, bab, verse…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="unitsPerDay">Units per day</Label>
                <Input id="unitsPerDay" name="unitsPerDay" type="number" min={1} defaultValue={plan.units_per_day} />
              </div>
              <div>
                <Label htmlFor="blockSize">Block size</Label>
                <Input id="blockSize" name="blockSize" type="number" min={1} defaultValue={plan.block_size} />
              </div>
            </div>
            <p className="text-[11px] text-[var(--foreground-mute)]">
              Lowering units per day will release allocations that fall outside the new range — those members will need to re-claim.
            </p>
          </Card>
        )}

        {plan.schedule === "progressing" && (
          <>
            <Card className="space-y-3">
              <h2 className="font-semibold">Day labels</h2>
              <div>
                <Label htmlFor="dayLabelTemplate">Day label template</Label>
                <Input
                  id="dayLabelTemplate"
                  name="dayLabelTemplate"
                  defaultValue={plan.day_label_template ?? "Day {n}"}
                />
                <p className="text-[11px] text-[var(--foreground-mute)] mt-1">
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
            <p className="text-[11px] text-[var(--foreground-mute)]">
              For progressing plans, <em>units per day</em> and <em>block size</em> are locked once members have allocations. To change those, clone the plan instead.
            </p>
          </>
        )}

        <Button type="submit" className="w-full">Save changes</Button>
        <Link href={`/plans/${plan.id}`} className="block text-center text-sm text-[var(--foreground-mute)]">Cancel</Link>
      </form>
    </main>
  );
}
