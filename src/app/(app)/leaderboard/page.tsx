import { requireSession } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getMilestoneBounds } from "@/app/actions/tasks";
import { PageHeader, Card } from "@/components/ui";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { ProgressBar } from "@/components/charts/ProgressBar";

export const revalidate = 0;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const s = await requireSession();
  const sp = await searchParams;
  const view = sp.view === "tasks" ? "tasks" : "people";

  const sb = createAdminClient();
  const { milestoneStart, group } = await getMilestoneBounds(s.groupId);
  const timezone = group.timezone || "America/New_York";

  // Format milestone start in the group's timezone for comparison
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const startStr = fmt.format(milestoneStart);

  const { data: users } = await sb
    .from("users")
    .select("id, username")
    .eq("group_id", s.groupId)
    .is("archived_at", null);

  // only admin-created tasks count
  const { data: tasks } = await sb
    .from("tasks")
    .select("id, title, frequency, target_per_milestone, total_target, assignee_user_id")
    .eq("group_id", s.groupId)
    .is("archived_at", null)
    .is("created_by_user_id", null);

  const { data: comps } = await sb
    .from("task_completions")
    .select("user_id, task_id, completed_for_date, tasks!inner(group_id, created_by_user_id)")
    .gte("completed_for_date", startStr)
    .eq("tasks.group_id", s.groupId)
    .is("tasks.created_by_user_id", null);

  const longTermIds = (tasks ?? []).filter((t) => t.total_target).map((t) => t.id);
  const { data: allTimeComps } = longTermIds.length
    ? await sb
        .from("task_completions")
        .select("user_id, task_id")
        .in("task_id", longTermIds)
    : { data: [] as { user_id: string; task_id: string }[] };

  // Include reading plan completions in score
  const { data: readingComps } = await sb
    .from("reading_plan_daily_completion")
    .select("user_id, completed_for_date")
    .gte("completed_for_date", startStr);

  // Get reading plan allocations to calculate possible completions
  const { data: readingAllocs } = await sb
    .from("reading_plan_allocations")
    .select("user_id")
    .is("to_day", null);

  // Calculate days in milestone for reading plan minimum calculation
  const today = new Date();
  const milestoneStartDate = new Date(startStr + "T00:00:00Z");
  const daysInMilestone = Math.floor((today.getTime() - milestoneStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const userReadingAllocCount: Record<string, number> = {};
  for (const alloc of readingAllocs ?? []) {
    userReadingAllocCount[alloc.user_id] = (userReadingAllocCount[alloc.user_id] || 0) + 1;
  }

  const userTaskCount: Record<string, number> = {};
  const userTotal: Record<string, number> = {};
  const userMinimum: Record<string, number> = {}; // task targets + reading allocations × days

  // Initialize minimum with task targets
  for (const u of users ?? []) {
    userMinimum[u.id] = 0;
  }
  for (const t of tasks ?? []) {
    if (!t.total_target) {
      const assignee = t.assignee_user_id || "all";
      if (assignee === "all") {
        for (const u of users ?? []) {
          userMinimum[u.id] = (userMinimum[u.id] || 0) + t.target_per_milestone;
        }
      } else {
        userMinimum[assignee] = (userMinimum[assignee] || 0) + t.target_per_milestone;
      }
    }
  }

  // Add reading plan potential to minimum
  for (const userId of Object.keys(userReadingAllocCount)) {
    userMinimum[userId] = (userMinimum[userId] || 0) + userReadingAllocCount[userId] * daysInMilestone;
  }

  for (const c of comps ?? []) {
    const k = `${c.user_id}:${c.task_id}`;
    userTaskCount[k] = (userTaskCount[k] || 0) + 1;
    userTotal[c.user_id] = (userTotal[c.user_id] || 0) + 1;
  }

  // Add reading plan completions to total
  for (const c of readingComps ?? []) {
    userTotal[c.user_id] = (userTotal[c.user_id] || 0) + 1;
  }

  const userTaskAllTime: Record<string, number> = {};
  for (const c of allTimeComps ?? []) {
    userTaskAllTime[`${c.user_id}:${c.task_id}`] = (userTaskAllTime[`${c.user_id}:${c.task_id}`] || 0) + 1;
  }

  const locale = s.kind === "user" ? s.locale : "en";
  const tr = (k: Parameters<typeof t>[0], p?: Record<string, string | number>) => t(k, locale, p);
  return (
    <main className="max-w-md mx-auto w-full px-5 py-6 reveal">
      <PageHeader title={tr("groupTitle")} subtitle={tr("currentMilestoneSince", { date: milestoneStart.toLocaleDateString() })} />

      <div className="flex gap-1 mb-5 p-1 bg-[var(--surface)] rounded-xl">
        <Link
          href="/leaderboard"
          className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition ${view === "people" ? "bg-[var(--card)] text-[var(--foreground)] shadow-[var(--shadow-sm)]" : "text-[var(--foreground-mute)]"}`}
        >
          {tr("byPerson")}
        </Link>
        <Link
          href="/leaderboard?view=tasks"
          className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition ${view === "tasks" ? "bg-[var(--card)] text-[var(--foreground)] shadow-[var(--shadow-sm)]" : "text-[var(--foreground-mute)]"}`}
        >
          {tr("byTask")}
        </Link>
      </div>

      {view === "people" ? (
        <PeopleView
          users={users ?? []}
          totals={userTotal}
          minimums={userMinimum}
          tasks={tasks ?? []}
          counts={userTaskCount}
          allTime={userTaskAllTime}
          currentUserId={s.kind === "user" ? s.userId : null}
        />
      ) : (
        <TasksView tasks={tasks ?? []} users={users ?? []} counts={userTaskCount} allTime={userTaskAllTime} currentUserId={s.kind === "user" ? s.userId : null} />
      )}
    </main>
  );
}

function PeopleView({
  users,
  totals,
  minimums,
  tasks,
  counts,
  allTime,
  currentUserId,
}: {
  users: { id: string; username: string }[];
  totals: Record<string, number>;
  minimums: Record<string, number>;
  tasks: { id: string; assignee_user_id: string | null; target_per_milestone: number; total_target: number | null }[];
  counts: Record<string, number>;
  allTime: Record<string, number>;
  currentUserId: string | null;
}) {
  if (users.length === 0) {
    return <p className="text-sm text-[var(--color-foreground)]/60">No one in the group yet.</p>;
  }
  // For each user: show total completions / minimum required (includes tasks + reading plans)
  const rows = users
    .map((u) => {
      const done = totals[u.id] ?? 0;
      const max = minimums[u.id] ?? 0;
      return { id: u.id, username: u.username, count: done, done, max };
    })
    .sort((a, b) => (b.max > 0 ? b.done / b.max : 0) - (a.max > 0 ? a.done / a.max : 0));
  return (
    <ol className="space-y-2">
      {rows.map((r, i) => (
        <li
          key={r.id}
          className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 ${
            r.id === currentUserId ? "ring-2 ring-[var(--color-accent)]" : ""
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="w-6 text-center text-sm font-bold text-[var(--color-foreground)]/60">{i + 1}</span>
            <span className="flex-1 font-medium">{r.username}</span>
            <div className="text-right">
              <div className="text-xs text-[var(--color-foreground)]/60">Done / Min</div>
              <div className="text-sm font-mono font-bold">{r.done}/{r.max}</div>
            </div>
          </div>
          <ProgressBar value={r.done} max={Math.max(1, r.max)} className="mt-1" />
        </li>
      ))}
    </ol>
  );
}

function TasksView({
  tasks,
  users,
  counts,
  allTime,
  currentUserId,
}: {
  tasks: { id: string; title: string; frequency: string; target_per_milestone: number; total_target: number | null; assignee_user_id: string | null }[];
  users: { id: string; username: string }[];
  counts: Record<string, number>;
  allTime: Record<string, number>;
  currentUserId: string | null;
}) {
  if (tasks.length === 0) {
    return <p className="text-sm text-[var(--color-foreground)]/60">No tasks yet.</p>;
  }
  return (
    <div className="space-y-3">
      {tasks.map((t) => {
        const eligible = t.assignee_user_id ? users.filter((u) => u.id === t.assignee_user_id) : users;
        const isLongTerm = !!t.total_target;
        const target = isLongTerm ? t.total_target! : t.target_per_milestone;
        const source = isLongTerm ? allTime : counts;
        const rows = eligible
          .map((u) => {
            const c = source[`${u.id}:${t.id}`] ?? 0;
            return { id: u.id, username: u.username, count: c, met: c >= target };
          })
          .sort((a, b) => b.count - a.count);

        return (
          <Card key={t.id}>
            <div className="flex items-baseline gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold flex-1 min-w-0 truncate">{t.title}</h3>
              {isLongTerm ? (
                <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300">
                  long-term
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--color-border)]/60">
                  {t.frequency}
                </span>
              )}
              {!isLongTerm && t.target_per_milestone > 1 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-border)]/60">≥{t.target_per_milestone}</span>
              )}
            </div>
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id} className={r.id === currentUserId ? "font-semibold" : ""}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{r.username}</span>
                    <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${r.met ? "bg-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-[var(--color-border)]/60"}`}>
                      {r.count}/{target}
                    </span>
                  </div>
                  <ProgressBar value={Math.min(r.count, target)} max={target} className="mt-1" tone={r.met ? "success" : "accent"} />
                </li>
              ))}
              {rows.length === 0 && (
                <li className="text-xs text-[var(--color-foreground)]/60">No one assigned.</li>
              )}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
