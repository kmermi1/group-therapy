import { requireUser } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { userResetHistoryAction } from "@/app/actions/tasks";
import { t } from "@/lib/i18n";
import { CalendarHeatmap } from "@/components/charts/CalendarHeatmap";
import HistoryDayRow from "./HistoryDayRow";
import { todayInGroupTz, daysBetween } from "@/lib/plans";
import { getMilestoneBounds } from "@/app/actions/tasks";

function isoNDaysAgo(n: number): string {
  const today = todayInGroupTz();
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export default async function HistoryPage() {
  const user = await requireUser();
  const sb = createAdminClient();
  const tr = (k: Parameters<typeof t>[0]) => t(k, user.locale);

  const today = todayInGroupTz();
  const { milestoneStart } = await getMilestoneBounds(user.groupId);
  const milestoneStartIso = milestoneStart.toISOString().slice(0, 10);
  const windowStart = milestoneStartIso;
  // how many past days between milestone start and today (exclusive of today)
  const pastDayCount = Math.max(0, daysBetween(milestoneStartIso, today));

  const { data: reset } = await sb
    .from("user_history_resets")
    .select("reset_at")
    .eq("user_id", user.userId)
    .maybeSingle();
  const cutoff = reset?.reset_at ? new Date(reset.reset_at).toISOString().slice(0, 10) : null;

  // All eligible (non-archived or archived-later) tasks for this user.
  const { data: tasks } = await sb
    .from("tasks")
    .select("id, title, frequency, assignee_user_id, created_by_user_id, created_at, archived_at")
    .eq("group_id", user.groupId)
    .or(`assignee_user_id.is.null,assignee_user_id.eq.${user.userId}`);

  const myTasks = (tasks ?? []).filter(
    (t) => t.created_by_user_id === null || t.created_by_user_id === user.userId
  );

  // All my completions in the visible window (for heatmap + per-day check).
  const startBoundForHeatmap = isoNDaysAgo(12 * 7); // 12 weeks for the heatmap
  const heatmapStart = cutoff && cutoff > startBoundForHeatmap ? cutoff : startBoundForHeatmap;
  const { data: heatmapComps } = await sb
    .from("task_completions")
    .select("completed_for_date")
    .eq("user_id", user.userId)
    .gte("completed_for_date", heatmapStart);

  const dayCounts: Record<string, number> = {};
  for (const c of heatmapComps ?? []) {
    dayCounts[c.completed_for_date] = (dayCounts[c.completed_for_date] || 0) + 1;
  }

  // Completions inside the editable window (last 14 days, excluding today).
  const editableStart = cutoff && cutoff > windowStart ? cutoff : windowStart;
  const { data: comps } = await sb
    .from("task_completions")
    .select("task_id, completed_for_date")
    .eq("user_id", user.userId)
    .gte("completed_for_date", editableStart)
    .lt("completed_for_date", today);
  const compSet = new Set((comps ?? []).map((c) => `${c.task_id}:${c.completed_for_date}`));

  // Build the day list (newest first) from milestone start through yesterday.
  type DayItem = { task: typeof myTasks[number]; done: boolean };
  const days: { date: string; items: DayItem[] }[] = [];
  for (let i = 1; i <= pastDayCount; i++) {
    const date = isoNDaysAgo(i);
    if (date < windowStart) break;
    if (cutoff && date < cutoff) break;
    // Any currently-active task is backfillable. We intentionally don't
    // restrict by created_at — the admin sets the task up once, members
    // log that they did it on whatever day. Archived tasks still respect
    // their archive date.
    const items: DayItem[] = myTasks
      .filter((t) => {
        if (t.archived_at) {
          const archived = t.archived_at.slice(0, 10);
          if (archived <= date) return false;
        }
        return true;
      })
      .map((task) => ({ task, done: compSet.has(`${task.id}:${date}`) }));
    if (items.length > 0) days.push({ date, items });
  }

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

      {days.length === 0 ? (
        <p className="text-sm text-[var(--color-foreground)]/60">
          No tasks to backfill yet — once an admin assigns tasks or you add personal ones, you&apos;ll be able to check off past days here.
        </p>
      ) : (
        <>
          <p className="text-xs text-[var(--color-foreground)]/60 mb-3">
            Tap to retroactively check off days from this milestone (since {milestoneStartIso}).
          </p>
          <div className="space-y-3">
            {days.map(({ date, items }) => (
              <Card key={date}>
                <div className="text-xs uppercase tracking-wide text-[var(--color-foreground)]/60 mb-2">{date}</div>
                <ul className="space-y-2">
                  {items.map(({ task, done }) => (
                    <HistoryDayRow
                      key={task.id}
                      taskId={task.id}
                      title={task.title}
                      frequency={task.frequency}
                      forDate={date}
                      done={done}
                    />
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
