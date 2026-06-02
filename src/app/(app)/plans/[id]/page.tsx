import { notFound } from "next/navigation";
import { requireSession } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { todayPlanDay, dayLabel, rangesActiveOnDay, formatRanges } from "@/lib/plans";
import AllocationGrid from "./AllocationGrid";
import AdminPlanControls from "./AdminPlanControls";

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requireSession();
  const sb = createAdminClient();

  const { data: plan } = await sb.from("reading_plans").select("*").eq("id", id).single();
  if (!plan || plan.group_id !== s.groupId) notFound();

  const { data: users } = await sb
    .from("users")
    .select("id, username")
    .eq("group_id", s.groupId)
    .is("archived_at", null);

  const { data: allocs } = await sb
    .from("reading_plan_allocations")
    .select("id, user_id, start_unit, end_unit, from_day, to_day")
    .eq("plan_id", plan.id)
    .order("start_unit");

  const planDay = Math.max(1, todayPlanDay(plan.start_date));
  const activeAllocs = (allocs ?? []).filter((a) => a.to_day === null || a.to_day >= planDay);

  // map: unit -> userId (active today)
  const unitOwner = new Map<number, string>();
  for (const a of activeAllocs) {
    for (let u = a.start_unit; u <= a.end_unit; u++) unitOwner.set(u, a.user_id);
  }
  const usernameMap = new Map((users ?? []).map((u) => [u.id, u.username]));

  // current user's effective ranges today
  const meRanges = s.kind === "user"
    ? rangesActiveOnDay(activeAllocs.filter((a) => a.user_id === s.userId), planDay)
    : [];

  const todayLabel =
    plan.schedule === "progressing" && plan.day_label_template && plan.start_at !== null
      ? dayLabel(plan.day_label_template, plan.start_at, planDay)
      : null;

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title={plan.name} subtitle={
        plan.status === "closed"
          ? "Closed"
          : plan.schedule === "progressing"
            ? `Day ${planDay} of ${plan.total_days} · ${todayLabel}`
            : "Repeating daily"
      } />

      {s.kind === "user" && meRanges.length > 0 && (
        <Card className="mb-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-foreground)]/60">Your {plan.unit_label}s today</div>
          <div className="text-lg font-semibold mt-1">{formatRanges(meRanges)}</div>
        </Card>
      )}

      <AllocationGrid
        planId={plan.id}
        unitsPerDay={plan.units_per_day}
        blockSize={plan.block_size}
        unitOwner={Object.fromEntries(unitOwner)}
        usernameMap={Object.fromEntries(usernameMap)}
        currentUserId={s.kind === "user" ? s.userId : null}
        isAdmin={s.kind === "admin"}
        users={users ?? []}
        activeAllocs={activeAllocs}
        planStatus={plan.status}
      />

      {s.kind === "admin" && (
        <AdminPlanControls planId={plan.id} planName={plan.name} status={plan.status} />
      )}
    </main>
  );
}
