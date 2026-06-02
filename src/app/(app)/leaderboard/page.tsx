import { requireSession } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getMilestoneBounds } from "@/app/actions/tasks";
import { PageHeader, Card } from "@/components/ui";
import Link from "next/link";

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
    .select("id, title, frequency, target_per_milestone, assignee_user_id")
    .eq("group_id", s.groupId)
    .is("archived_at", null)
    .is("created_by_user_id", null);

  const { data: comps } = await sb
    .from("task_completions")
    .select("user_id, task_id, completed_for_date, tasks!inner(group_id, created_by_user_id)")
    .gte("completed_for_date", startStr)
    .eq("tasks.group_id", s.groupId)
    .is("tasks.created_by_user_id", null);

  // (user, task) -> count this milestone
  const userTaskCount: Record<string, number> = {};
  // user -> total completions
  const userTotal: Record<string, number> = {};
  for (const c of comps ?? []) {
    const k = `${c.user_id}:${c.task_id}`;
    userTaskCount[k] = (userTaskCount[k] || 0) + 1;
    userTotal[c.user_id] = (userTotal[c.user_id] || 0) + 1;
  }

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="Group" subtitle={`Current milestone since ${milestoneStart.toLocaleDateString()}`} />

      <div className="flex gap-2 mb-5 p-1 bg-[var(--color-card)] rounded-lg">
        <Link
          href="/leaderboard"
          className={`flex-1 text-center py-2 rounded-md text-sm font-medium ${view === "people" ? "bg-[var(--color-background)]" : "text-[var(--color-foreground)]/60"}`}
        >
          By person
        </Link>
        <Link
          href="/leaderboard?view=tasks"
          className={`flex-1 text-center py-2 rounded-md text-sm font-medium ${view === "tasks" ? "bg-[var(--color-background)]" : "text-[var(--color-foreground)]/60"}`}
        >
          By task
        </Link>
      </div>

      {view === "people" ? (
        <PeopleView users={users ?? []} totals={userTotal} currentUserId={s.kind === "user" ? s.userId : null} />
      ) : (
        <TasksView tasks={tasks ?? []} users={users ?? []} counts={userTaskCount} currentUserId={s.kind === "user" ? s.userId : null} />
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
  currentUserId,
}: {
  tasks: { id: string; title: string; frequency: string; target_per_milestone: number; assignee_user_id: string | null }[];
  users: { id: string; username: string }[];
  counts: Record<string, number>;
  currentUserId: string | null;
}) {
  if (tasks.length === 0) {
    return <p className="text-sm text-[var(--color-foreground)]/60">No tasks yet.</p>;
  }
  return (
    <div className="space-y-3">
      {tasks.map((t) => {
        // who's eligible: everyone if assignee is null, else just the one user
        const eligible = t.assignee_user_id ? users.filter((u) => u.id === t.assignee_user_id) : users;
        const rows = eligible
          .map((u) => ({
            id: u.id,
            username: u.username,
            count: counts[`${u.id}:${t.id}`] ?? 0,
            met: (counts[`${u.id}:${t.id}`] ?? 0) >= t.target_per_milestone,
          }))
          .sort((a, b) => b.count - a.count);

        return (
          <Card key={t.id}>
            <div className="flex items-baseline gap-2 mb-2">
              <h3 className="font-semibold flex-1 min-w-0 truncate">{t.title}</h3>
              <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--color-border)]/60">
                {t.frequency}
              </span>
              {t.target_per_milestone > 1 && (
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
                    {r.count}/{t.target_per_milestone}
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
