import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import AdminEditTaskForm from "./AdminEditTaskForm";

export default async function EditTaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const admin = await requireAdmin();
  const sb = createAdminClient();
  const { data: task } = await sb.from("tasks").select("*").eq("id", taskId).single();
  if (!task || task.group_id !== admin.groupId || task.created_by_user_id) notFound();

  const { data: users } = await sb
    .from("users")
    .select("id, username")
    .eq("group_id", admin.groupId)
    .is("archived_at", null);

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="Edit task" />
      <AdminEditTaskForm task={task} users={users ?? []} />
      <Link href="/admin/manage" className="block text-center text-sm text-[var(--color-foreground)]/60 mt-4">Cancel</Link>
    </main>
  );
}
