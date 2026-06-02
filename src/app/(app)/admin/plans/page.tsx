import Link from "next/link";
import { requireAdmin } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";

export default async function AdminPlansPage() {
  const admin = await requireAdmin();
  const sb = createAdminClient();
  const { data: plans } = await sb
    .from("reading_plans")
    .select("id, name, schedule, status, units_per_day, unit_label, total_days, start_date, closed_at")
    .eq("group_id", admin.groupId)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="Reading plans" subtitle="Long-running shared tasks." />
      <Link
        href="/admin/plans/new"
        className="block w-full text-center bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-lg px-4 py-3 font-medium mb-4"
      >
        + New plan
      </Link>
      <div className="space-y-3">
        {(plans ?? []).length === 0 && (
          <p className="text-sm text-[var(--color-foreground)]/60">No plans yet.</p>
        )}
        {(plans ?? []).map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/plans/${p.id}`} className="font-semibold hover:underline">
                  {p.name}
                </Link>
                <div className="text-xs text-[var(--color-foreground)]/60 mt-0.5">
                  {p.schedule === "progressing"
                    ? `${p.total_days} days · ${p.units_per_day} ${p.unit_label}s/day`
                    : `Repeating · ${p.units_per_day} ${p.unit_label}s/day`}
                </div>
                <div className="text-[11px] text-[var(--color-foreground)]/50 mt-0.5">
                  Starts {p.start_date}
                </div>
              </div>
              <span
                className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                  p.status === "active"
                    ? "bg-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-[var(--color-border)]/60"
                }`}
              >
                {p.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
