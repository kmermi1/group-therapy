import { requireUser } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { userResetHistoryAction } from "@/app/actions/tasks";
import { t } from "@/lib/i18n";
import { CalendarHeatmap } from "@/components/charts/CalendarHeatmap";

export default async function HistoryPage() {
  const user = await requireUser();
  const sb = createAdminClient();

  const { data: reset } = await sb
    .from("user_history_resets")
    .select("reset_at")
    .eq("user_id", user.userId)
    .maybeSingle();
  const cutoff = reset?.reset_at ? new Date(reset.reset_at).toISOString().slice(0, 10) : null;

  let query = sb
    .from("task_completions")
    .select("completed_for_date, completed_at, task_id, tasks!inner(title, frequency, group_id)")
    .eq("user_id", user.userId)
    .order("completed_for_date", { ascending: false })
    .limit(200);
  if (cutoff) query = query.gte("completed_for_date", cutoff);

  const { data: rows } = await query;

  const byDate: Record<string, { title: string; freq: string }[]> = {};
  const dayCounts: Record<string, number> = {};
  for (const r of (rows ?? []) as { completed_for_date: string; tasks: { title: string; frequency: string } | { title: string; frequency: string }[] }[]) {
    const task = Array.isArray(r.tasks) ? r.tasks[0] : r.tasks;
    if (!task) continue;
    (byDate[r.completed_for_date] ||= []).push({ title: task.title, freq: task.frequency });
    dayCounts[r.completed_for_date] = (dayCounts[r.completed_for_date] || 0) + 1;
  }

  const tr = (k: Parameters<typeof t>[0]) => t(k, user.locale);
  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title={tr("historyTitle")} subtitle={tr("historySubtitle")} />
      <form action={userResetHistoryAction} className="mb-4">
        <button className="text-xs text-red-500 underline">{tr("resetMyHistory")}</button>
      </form>

      {Object.keys(dayCounts).length > 0 && (
        <Card className="mb-4 overflow-x-auto">
          <div className="text-xs text-[var(--color-foreground)]/60 mb-2">Last 12 weeks</div>
          <CalendarHeatmap counts={dayCounts} weeks={12} />
        </Card>
      )}

      {Object.keys(byDate).length === 0 ? (
        <p className="text-sm text-[var(--color-foreground)]/60">{tr("noCompletions")}</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(byDate).map(([date, items]) => (
            <Card key={date}>
              <div className="text-xs uppercase tracking-wide text-[var(--color-foreground)]/60 mb-1">{date}</div>
              <ul className="space-y-1">
                {items.map((it, i) => (
                  <li key={i} className="text-sm flex items-center justify-between">
                    <span>{it.title}</span>
                    <span className="text-[10px] uppercase text-[var(--color-foreground)]/50">{it.freq}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
