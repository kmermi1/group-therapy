import { requireSession } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getMilestoneBounds } from "@/app/actions/tasks";
import { PageHeader, Card } from "@/components/ui";
import Link from "next/link";
import { t } from "@/lib/i18n";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const s = await requireSession();
  const sp = await searchParams;
  const view = sp.view === "tasks" ? "tasks" : "people";

  const sb = createAdminClient();
  const { milestoneStart } = await getMilestoneBounds(s.groupId);
  const startStr = milestoneStart.toISOString().slice(0, 10);

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

  const userTaskCount: Record<string, number> = {};
  const userTotal: Record<string, number> = {};
  for (const c of comps ?? []) {
    const k = `${c.user_id}:${c.task_id}`;
    userTaskCount[k] = (userTaskCount[k] || 0) + 1;
    userTotal[c.user_id] = (userTotal[c.user_id] || 0) + 1;
  }
  const userTaskAllTime: Record<string, number> = {};
  for (const c of allTimeComps ?? []) {
    userTaskAllTime[`${c.user_id}:${c.task_id}`] = (userTaskAllTime[`${c.user_id}:${c.task_id}`] || 0) + 1;
  }

  const locale = s.kind === "user" ? s.locale : "en";
  const tr = (k: Parameters<typeof t>[0], p?: Record<string, string | number>) => t(k, locale, p);
  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title={tr("groupTitle")} subtitle={tr("currentMilestoneSince", { date: milestoneStart.toLocaleDateString() })} />

      <div className="flex gap-2 mb-5 p-1 bg-[var(--color-card)] rounded-lg">
        <Link
          href="/leaderboard"
          className={`flex-1 text-center py-2 rounded-md text-sm font-medium ${view === "people" ? "bg-[var(--color-background)]" : "text-[var(--color-foreground)]/60"}`}
        >
          {tr("byPerson")}
        </Link>
        <Link
          href="/leaderboard?view=tasks"
          className={`flex-1 text-center py-2 rounded-md text-sm font-medium ${view === "tasks" ? "bg-[var(--color-background)]" : "text-[var(--color-foreground)]/60"}`}
        >
          {tr("byTask")}
        </Link>
      </div>

      {view === "people" ? (
        <PeopleView users={users ?? []} totals={userTotal} currentUserId={s.kind === "user" ? s.userId : null} />
      ) : (
        <TasksView tasks={tasks ?? []} users={users ?? []} counts={userTaskCount} allTime={userTaskAllTime} currentUserId={s.kind === "user" ? s.userId : null} />
      )}
    </main>
  );
}

function PeopleView({
  users,
  totals,
  currentUserId,
}: {
  users: { id: string; username: string }[];
  totals: Record<string, number>;
  currentUserId: string | null;
}) {
  if (users.length === 0) {
    return <p className="text-sm text-[var(--color-foreground)]/60">No one in the group yet.</p>;
  }
  const rows = users
    .map((u) => ({ id: u.id, username: u.username, count: totals[u.id] ?? 0 }))
    .sort((a, b) => b.count - a.count);
  return (
    <ol className="space-y-2">
      {rows.map((r, i) => (
        <li
          key={r.id}
          className={`flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 ${
            r.id === currentUserId ? "ring-2 ring-[var(--color-accent)]" : ""
          }`}
        >
          <span className="w-6 text-center text-sm font-bold text-[var(--color-foreground)]/60">{i + 1}</span>
          <span className="flex-1 font-medium">{r.username}</span>
          <span className="text-sm font-mono">{r.count}</span>
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
            <ul className="space-y-1">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className={`flex items-center gap-2 text-sm ${r.id === currentUserId ? "font-semibold" : ""}`}
                >
                  <span className="flex-1 truncate">{r.username}</span>
                  <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${r.met ? "bg-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-[var(--color-border)]/60"}`}>
                    {r.count}/{target}
                  </span>
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
