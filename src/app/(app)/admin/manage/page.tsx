import { requireAdmin } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import {
  createTaskAction,
  archiveTaskAction,
} from "@/app/actions/tasks";
import { Button, Input, Label, PageHeader, Card } from "@/components/ui";
import Link from "next/link";
import AdminCreateTaskForm from "./AdminCreateTaskForm";

export default async function AdminManagePage() {
  const admin = await requireAdmin();
  const sb = createAdminClient();

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
      <PageHeader title="Tasks" />

      <AdminCreateTaskForm users={users ?? []} />

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
              <div className="flex flex-col items-end gap-1">
                <Link href={`/admin/manage/${t.id}/edit`} className="text-xs text-[var(--color-accent)] underline">Edit</Link>
                <form action={archiveTaskAction}>
                  <input type="hidden" name="taskId" value={t.id} />
                  <button className="text-xs text-red-500 underline">Archive</button>
                </form>
              </div>
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
