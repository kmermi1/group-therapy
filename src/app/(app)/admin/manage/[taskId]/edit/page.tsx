import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { editTaskAction } from "@/app/actions/tasks";
import { Button, Input, Label, PageHeader, Card } from "@/components/ui";

export default async function EditTaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const admin = await requireAdmin();
  const sb = createAdminClient();
  const { data: task } = await sb.from("tasks").select("*").eq("id", taskId).single();
  if (!task || task.group_id !== admin.groupId) notFound();

  const { data: users } = await sb
    .from("users")
    .select("id, username")
    .eq("group_id", admin.groupId)
    .is("archived_at", null);

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="Edit task" />
      <form action={editTaskAction} className="space-y-4">
        <input type="hidden" name="taskId" value={task.id} />

        <Card className="space-y-3">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required maxLength={100} defaultValue={task.title} />
          </div>
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={task.description ?? ""}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <select
                id="frequency"
                name="frequency"
                defaultValue={task.frequency}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm"
              >
                <option value="once">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <Label htmlFor="target">Minimum per milestone</Label>
              <Input id="target" name="target" type="number" min={1} max={50} defaultValue={task.target_per_milestone} />
            </div>
          </div>
          <div>
            <Label htmlFor="assigneeUserId">Assign to</Label>
            <select
              id="assigneeUserId"
              name="assigneeUserId"
              defaultValue={task.assignee_user_id ?? "all"}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm"
            >
              <option value="all">Everyone</option>
              {(users ?? []).map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="totalTarget">Long-term goal (optional)</Label>
            <Input
              id="totalTarget"
              name="totalTarget"
              type="number"
              min={1}
              defaultValue={task.total_target ?? ""}
              placeholder="leave blank for normal weekly task"
            />
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold mb-2">Image</h2>
          {task.image_path ? (
            <p className="text-xs text-[var(--color-foreground)]/60 mb-2">
              Current: <code className="break-all">{task.image_path}</code>
            </p>
          ) : (
            <p className="text-xs text-[var(--color-foreground)]/60 mb-2">No image attached.</p>
          )}
          <Label htmlFor="image">Replace image (optional)</Label>
          <input id="image" name="image" type="file" accept="image/*" className="text-sm w-full" />
          {task.image_path && (
            <label className="flex items-center gap-2 mt-2 text-sm">
              <input type="checkbox" name="removeImage" />
              Remove existing image
            </label>
          )}
        </Card>

        <Button type="submit" className="w-full">Save changes</Button>
        <Link href="/admin/manage" className="block text-center text-sm text-[var(--color-foreground)]/60">Cancel</Link>
      </form>
    </main>
  );
}
