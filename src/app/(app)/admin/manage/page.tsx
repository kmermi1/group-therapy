import { requireAdmin } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import {
  createTaskAction,
  archiveTaskAction,
  adminResetMilestoneAction,
  updateStartDayAction,
  setMilestoneStartAction,
} from "@/app/actions/tasks";
import { Button, Input, Label, PageHeader, Card } from "@/components/ui";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AdminManagePage() {
  const admin = await requireAdmin();
  const sb = createAdminClient();

  const { data: group } = await sb.from("groups").select("*").eq("id", admin.groupId).single();
  const { data: users } = await sb
    .from("users")
    .select("id, username")
    .eq("group_id", admin.groupId)
    .is("archived_at", null);
  const { data: tasks } = await sb
    .from("tasks")
    .select("*")
    .eq("group_id", admin.groupId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="Manage" />

      <Card className="mb-4">
        <h2 className="font-semibold mb-2">Milestone</h2>
        <p className="text-xs text-[var(--color-foreground)]/60 mb-3">
          Started {new Date(group!.milestone_started_at).toLocaleDateString()}. Auto-rolls on {DAYS[group!.default_start_day]}.
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
              defaultValue={new Date(group!.milestone_started_at).toISOString().slice(0, 10)}
            />
          </div>
          <Button type="submit" variant="secondary">Save</Button>
        </form>

        <form action={updateStartDayAction} className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="startDay">Auto-rollover day</Label>
            <select id="startDay" name="startDay" defaultValue={group!.default_start_day} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <Button type="submit" variant="secondary">Save</Button>
        </form>
      </Card>

      <Card className="mb-4">
        <h2 className="font-semibold mb-3">Add task</h2>
        <form action={createTaskAction} className="space-y-3">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required maxLength={100} />
          </div>
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <textarea id="description" name="description" rows={2}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <select id="frequency" name="frequency" defaultValue="daily" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <Label htmlFor="target">Minimum per milestone</Label>
              <Input id="target" name="target" type="number" min={1} max={50} defaultValue={1} />
            </div>
          </div>
          <div>
            <Label htmlFor="assigneeUserId">Assign to</Label>
            <select id="assigneeUserId" name="assigneeUserId" defaultValue="all" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm">
              <option value="all">Everyone</option>
              {(users ?? []).map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="totalTarget">Long-term goal (optional)</Label>
            <Input id="totalTarget" name="totalTarget" type="number" min={1} placeholder="e.g. 604" />
            <p className="text-[11px] text-[var(--color-foreground)]/60 mt-1">
              Total completions across <em>all</em> milestones. Use for goals like &ldquo;read 604 pages of Quran&rdquo; that span many weeks. Leave blank for a normal weekly task.
            </p>
          </div>
          <div>
            <Label htmlFor="image">Image (optional)</Label>
            <input id="image" name="image" type="file" accept="image/*" className="text-sm w-full" />
          </div>
          <Button type="submit" className="w-full">Create task</Button>
        </form>
      </Card>

      <h2 className="text-sm font-semibold mb-2 text-[var(--color-foreground)]/70">Active tasks ({tasks?.length ?? 0})</h2>
      <div className="space-y-2">
        {(tasks ?? []).map((t) => {
          const assignee = t.assignee_user_id
            ? users?.find((u) => u.id === t.assignee_user_id)?.username || "?"
            : "Everyone";
          return (
            <Card key={t.id} className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{t.title}</div>
                <div className="text-xs text-[var(--color-foreground)]/60">
                  {t.frequency} · {assignee}{t.target_per_milestone > 1 ? ` · ≥${t.target_per_milestone}/milestone` : ""}
                </div>
              </div>
              <form action={archiveTaskAction}>
                <input type="hidden" name="taskId" value={t.id} />
                <button className="text-xs text-red-500 underline">Archive</button>
              </form>
            </Card>
          );
        })}
        {(tasks ?? []).length === 0 && (
          <p className="text-sm text-[var(--color-foreground)]/60">No tasks yet.</p>
        )}
      </div>
    </main>
  );
}
