import { requireUser } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/milestone";
import { getMilestoneBounds } from "@/app/actions/tasks";
import { PageHeader } from "@/components/ui";
import TaskRow from "./TaskRow";
import AddPersonalTask from "./AddPersonalTask";

const BUCKET = "task-images";

export default async function TodayPage() {
  const user = await requireUser();
  const sb = createAdminClient();
  const today = todayDateString();
  const { milestoneStart } = await getMilestoneBounds(user.groupId);

  const { data: tasks } = await sb
    .from("tasks")
    .select("*")
    .eq("group_id", user.groupId)
    .is("archived_at", null)
    .or(`assignee_user_id.is.null,assignee_user_id.eq.${user.userId}`)
    .order("created_at", { ascending: false });

  const ids = (tasks ?? []).map((t) => t.id);
  const milestoneStartStr = milestoneStart.toISOString().slice(0, 10);
  const { data: completions } = ids.length
    ? await sb
        .from("task_completions")
        .select("task_id, completed_for_date")
        .eq("user_id", user.userId)
        .in("task_id", ids)
        .gte("completed_for_date", milestoneStartStr)
    : { data: [] as { task_id: string; completed_for_date: string }[] };

  // count completions per task this milestone + track which tasks are done "today"
  const milestoneCounts: Record<string, number> = {};
  const doneTodaySet = new Set<string>();
  for (const c of completions ?? []) {
    milestoneCounts[c.task_id] = (milestoneCounts[c.task_id] || 0) + 1;
    if (c.completed_for_date === today) doneTodaySet.add(c.task_id);
  }

  const signed: Record<string, string> = {};
  for (const t of tasks ?? []) {
    if (t.image_path) {
      const { data } = await sb.storage.from(BUCKET).createSignedUrl(t.image_path, 60 * 60);
      if (data) signed[t.id] = data.signedUrl;
    }
  }

  // group + sort: assigned-to-you, group tasks, personal
  const categorize = (t: typeof tasks extends (infer U)[] | null ? U : never) => {
    if (t.created_by_user_id === user.userId) return "personal";
    if (t.assignee_user_id === user.userId) return "for-you";
    return "group";
  };

  const sections: Record<string, typeof tasks> = {
    "for-you": [],
    group: [],
    personal: [],
  };
  for (const t of tasks ?? []) sections[categorize(t)]!.push(t);

  const labels: Record<string, { title: string; badgeText: string; badgeClass: string }> = {
    "for-you": { title: "Assigned to you", badgeText: "For you", badgeClass: "bg-amber-500/20 text-amber-700 dark:text-amber-300" },
    group: { title: "Group tasks", badgeText: "Group", badgeClass: "bg-sky-500/20 text-sky-700 dark:text-sky-300" },
    personal: { title: "Your own tasks", badgeText: "Personal", badgeClass: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" },
  };

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="Today" subtitle={`Logged in as ${user.username}`} />

      {(tasks ?? []).length === 0 ? (
        <p className="text-sm text-[var(--color-foreground)]/60 mb-6">No tasks yet. Add a personal one below, or hang tight for the admin.</p>
      ) : (
        <div className="space-y-6 mb-6">
          {(["for-you", "group", "personal"] as const).map((key) => {
            const items = sections[key];
            if (!items || items.length === 0) return null;
            const label = labels[key];
            return (
              <section key={key}>
                <h2 className="text-xs uppercase tracking-wide text-[var(--color-foreground)]/60 mb-2">{label.title}</h2>
                <ul className="space-y-3">
                  {items.map((t) => {
                    const count = milestoneCounts[t.id] || 0;
                    const doneToday = doneTodaySet.has(t.id);
                    return (
                      <TaskRow
                        key={t.id}
                        task={t}
                        doneToday={doneToday}
                        count={count}
                        target={t.target_per_milestone}
                        forDate={today}
                        imageUrl={signed[t.id]}
                        badgeText={label.badgeText}
                        badgeClass={label.badgeClass}
                        canDelete={key === "personal"}
                      />
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <AddPersonalTask />
    </main>
  );
}
