import Link from "next/link";
import { requireAdmin, rotateAdminInviteAction, unlockAccountAction } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getMilestoneBounds,
  removeUserAction,
  rotateGroupCodeAction,
  adminResetMilestoneAction,
  setMilestoneStartAction,
  updateStartDayAction,
} from "@/app/actions/tasks";
import { Button, Input, Label, PageHeader, Card } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatRelative(iso: string | null): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const sb = createAdminClient();
  const { milestoneStart, group } = await getMilestoneBounds(admin.groupId);
  const startStr = milestoneStart.toISOString().slice(0, 10);

  const { data: users } = await sb
    .from("users")
    .select("id, username, last_seen_at")
    .eq("group_id", admin.groupId)
    .is("archived_at", null);

  // Locked accounts (users + admins) for the dashboard alert card.
  const [{ data: lockedUsers }, { data: lockedAdmins }] = await Promise.all([
    sb
      .from("users")
      .select("id, username, locked_at")
      .eq("group_id", admin.groupId)
      .not("locked_at", "is", null),
    sb
      .from("admins")
      .select("id, username, locked_at")
      .eq("group_id", admin.groupId)
      .not("locked_at", "is", null),
  ]);
  const lockedAccounts = [
    ...((lockedUsers ?? []).map((u) => ({ id: u.id, username: u.username, locked_at: u.locked_at as string, kind: "user" as const }))),
    ...((lockedAdmins ?? []).map((a) => ({ id: a.id, username: a.username, locked_at: a.locked_at as string, kind: "admin" as const }))),
  ].sort((a, b) => (a.locked_at < b.locked_at ? 1 : -1));

  const { data: tasks } = await sb
    .from("tasks")
    .select("id, title, frequency, assignee_user_id, target_per_milestone, total_target")
    .eq("group_id", admin.groupId)
    .is("archived_at", null)
    .is("created_by_user_id", null);

  // milestone completions (for normal tasks)
  const { data: comps } = await sb
    .from("task_completions")
    .select("user_id, task_id, completed_for_date, tasks!inner(group_id, created_by_user_id)")
    .gte("completed_for_date", startStr)
    .eq("tasks.group_id", admin.groupId)
    .is("tasks.created_by_user_id", null);

  // all-time completions (for long-term tasks)
  const longTermIds = (tasks ?? []).filter((t) => t.total_target).map((t) => t.id);
  const { data: allTimeComps } = longTermIds.length
    ? await sb
        .from("task_completions")
        .select("user_id, task_id")
        .in("task_id", longTermIds)
    : { data: [] as { user_id: string; task_id: string }[] };

  const userTaskCount: Record<string, number> = {};
  for (const c of comps ?? []) {
    const k = `${c.user_id}:${c.task_id}`;
    userTaskCount[k] = (userTaskCount[k] || 0) + 1;
  }
  const userTaskAllTime: Record<string, number> = {};
  for (const c of allTimeComps ?? []) {
    const k = `${c.user_id}:${c.task_id}`;
    userTaskAllTime[k] = (userTaskAllTime[k] || 0) + 1;
  }

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="Admin dashboard" subtitle={`Group ${group.code} · milestone since ${milestoneStart.toLocaleDateString()}`} />
      <Card className="mb-4">
        <div className="text-xs uppercase tracking-wide text-[var(--color-foreground)]/60">Group code (for members)</div>
        <div className="text-2xl font-mono font-bold mt-1">{group.code}</div>
        <p className="text-xs text-[var(--color-foreground)]/60 mt-1">Share with friends so they can join as members.</p>
        <form action={rotateGroupCodeAction} className="mt-3">
          <ConfirmButton
            message="Rotate the group code? Existing members must re-enter the new code next time they log in. Tasks and history are kept."
            className="text-xs text-red-500 underline"
          >
            Rotate code (invalidate old)
          </ConfirmButton>
        </form>
      </Card>

      <Card className="mb-4">
        <div className="text-xs uppercase tracking-wide text-[var(--color-foreground)]/60">Admin invite code</div>
        <div className="text-2xl font-mono font-bold mt-1">{group.admin_invite_code}</div>
        <p className="text-xs text-[var(--color-foreground)]/60 mt-1">
          Share <strong>only</strong> with people you want to make co-admins. They sign up at <code>/admin-join</code>.
        </p>
        <form action={rotateAdminInviteAction} className="mt-3">
          <button className="text-xs text-red-500 underline">Rotate code (invalidate old)</button>
        </form>
      </Card>

      <Card className="mb-4">
        <h2 className="font-semibold mb-2">Admin Settings</h2>
        <p className="text-xs text-[var(--color-foreground)]/60 mb-3">
          Manage admin credentials and generate password reset codes.
        </p>
        <Link
          href="/admin/settings"
          className="block w-full text-center bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-background)]"
        >
          Go to admin settings
        </Link>
      </Card>

      <Card className="mb-4">
        <h2 className="font-semibold mb-2">Feedback</h2>
        <p className="text-xs text-[var(--color-foreground)]/60 mb-3">
          View feedback and bug reports submitted by group members.
        </p>
        <Link
          href="/admin/feedback"
          className="block w-full text-center bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-background)]"
        >
          View feedback
        </Link>
      </Card>

      <Card className="mb-4">
        <h2 className="font-semibold mb-2">Milestone</h2>
        <p className="text-xs text-[var(--color-foreground)]/60 mb-3">
          Started {new Date(group.milestone_started_at).toLocaleDateString()}. Auto-rolls on {DAYS[group.default_start_day]}.
        </p>
        <form action={adminResetMilestoneAction}>
          <Button type="submit" variant="danger" className="w-full">Reset milestone now</Button>
        </form>

        <form action={setMilestoneStartAction} className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="milestoneStart">Milestone start date</Label>
            <Input
              id="milestoneStart"
              name="milestoneStart"
              type="date"
              defaultValue={new Date(group.milestone_started_at).toISOString().slice(0, 10)}
            />
          </div>
          <Button type="submit" variant="secondary">Save</Button>
        </form>

        <form action={updateStartDayAction} className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="startDay">Auto-rollover day</Label>
            <select id="startDay" name="startDay" defaultValue={group.default_start_day} className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <Button type="submit" variant="secondary">Save</Button>
        </form>
      </Card>

      {lockedAccounts.length > 0 && (
        <Card className="mb-4 border-red-500/40">
          <h2 className="font-semibold mb-2 text-red-600 dark:text-red-300">🔒 Locked accounts ({lockedAccounts.length})</h2>
          <p className="text-xs text-[var(--color-foreground)]/60 mb-3">
            These accounts hit the 10-failure threshold within 24 hours and were auto-locked. Unlock to allow login again.
          </p>
          <ul className="space-y-2">
            {lockedAccounts.map((acct) => (
              <li key={`${acct.kind}:${acct.id}`} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{acct.username}</span>
                    <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                      acct.kind === "admin"
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                        : "bg-slate-500/20 text-slate-700 dark:text-slate-300"
                    }`}>
                      {acct.kind}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--color-foreground)]/60">
                    Locked {new Date(acct.locked_at).toLocaleString()}
                  </div>
                </div>
                <form action={unlockAccountAction}>
                  <input type="hidden" name="kind" value={acct.kind} />
                  <input type="hidden" name="accountId" value={acct.id} />
                  <button className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background)] font-medium">
                    Unlock
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <h2 className="text-sm font-semibold mb-2 text-[var(--color-foreground)]/70">Members ({users?.length ?? 0})</h2>
      <div className="space-y-2 mb-6">
        {(users ?? []).map((u) => {
          const userTasks = (tasks ?? []).filter((t) => t.assignee_user_id === null || t.assignee_user_id === u.id);
          const total = userTasks.length;
          const done = userTasks.filter((t) => {
            if (t.total_target) return (userTaskAllTime[`${u.id}:${t.id}`] || 0) >= t.total_target;
            return (userTaskCount[`${u.id}:${t.id}`] || 0) >= t.target_per_milestone;
          }).length;
          return (
            <Card key={u.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{u.username}</div>
                <div className="text-[11px] text-[var(--color-foreground)]/50">
                  last seen {formatRelative(u.last_seen_at)}
                </div>
              </div>
              <span className="text-sm font-mono">{done}/{total}</span>
              <form action={removeUserAction}>
                <input type="hidden" name="userId" value={u.id} />
                <ConfirmButton
                  message={`Remove ${u.username} from the group? Their completions and personal task assignments are deleted.`}
                  className="text-xs text-red-500 underline"
                >
                  Remove
                </ConfirmButton>
              </form>
            </Card>
          );
        })}
        {(users ?? []).length === 0 && (
          <p className="text-sm text-[var(--color-foreground)]/60">No one has joined yet.</p>
        )}
      </div>
    </main>
  );
}
