import { requireUser } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/milestone";
import { getMilestoneBounds } from "@/app/actions/tasks";
import { PageHeader } from "@/components/ui";
import TaskRow from "./TaskRow";
import AddPersonalTask from "./AddPersonalTask";
import PlanCard from "./PlanCard";
import { todayPlanDay, dayLabel, rangesActiveOnDay, formatRanges, isWithinSchedule, extraOwedOnDay, planDayForDate } from "@/lib/plans";
import { t } from "@/lib/i18n";

function SectionHeader({ icon, title, desc, count }: { icon: string; title: string; desc: string; count: number }) {
  return (
    <header className="mb-3">
      <div className="flex items-baseline gap-2">
        <span className="text-base">{icon}</span>
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="text-xs font-mono text-[var(--color-foreground)]/50">{count}</span>
      </div>
      <p className="text-xs text-[var(--color-foreground)]/60 ml-7">{desc}</p>
    </header>
  );
}

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
  // Pull ALL completions for these tasks (need all-time counts for long-term goals)
  const { data: completions } = ids.length
    ? await sb
        .from("task_completions")
        .select("task_id, completed_for_date")
        .eq("user_id", user.userId)
        .in("task_id", ids)
    : { data: [] as { task_id: string; completed_for_date: string }[] };

  const milestoneCounts: Record<string, number> = {};
  const totalCounts: Record<string, number> = {};
  const doneTodaySet = new Set<string>();
  for (const c of completions ?? []) {
    totalCounts[c.task_id] = (totalCounts[c.task_id] || 0) + 1;
    if (c.completed_for_date >= milestoneStartStr) {
      milestoneCounts[c.task_id] = (milestoneCounts[c.task_id] || 0) + 1;
    }
    if (c.completed_for_date === today) doneTodaySet.add(c.task_id);
  }

  const signed: Record<string, string> = {};
  for (const t of tasks ?? []) {
    if (t.image_path) {
      const { data } = await sb.storage.from(BUCKET).createSignedUrl(t.image_path, 60 * 60);
      if (data) signed[t.id] = data.signedUrl;
    }
  }

  const locale = user.locale;
  const tr = (k: Parameters<typeof t>[0], p?: Record<string, string | number>) => t(k, locale, p);

  type TaskT = NonNullable<typeof tasks>[number];
  const categorize = (task: TaskT) => {
    if (task.total_target) return "long-term";
    if (task.created_by_user_id === user.userId) return "personal";
    if (task.assignee_user_id === user.userId) return "for-you";
    return "group";
  };

  const sections: Record<string, TaskT[]> = {
    "long-term": [],
    "for-you": [],
    group: [],
    personal: [],
  };
  for (const task of tasks ?? []) sections[categorize(task)]!.push(task);

  const labels: Record<string, { title: string; desc: string; icon: string; badgeText: string; badgeClass: string }> = {
    "long-term": { title: tr("sectionLongTerm"), desc: tr("sectionLongTermDesc"), icon: "🎯", badgeText: tr("badgeLongTerm"), badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-300" },
    "for-you": { title: tr("sectionAssignedToYou"), desc: tr("sectionAssignedToYouDesc"), icon: "📌", badgeText: tr("badgeForYou"), badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
    group: { title: tr("sectionGroupTasks"), desc: tr("sectionGroupTasksDesc"), icon: "🌍", badgeText: tr("badgeGroup"), badgeClass: "bg-[var(--accent-soft)] text-[var(--accent)]" },
    personal: { title: tr("sectionPersonal"), desc: tr("sectionPersonalDesc"), icon: "🪴", badgeText: tr("badgePersonal"), badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  };

  // ---- Reading plans ----
  const { data: plans } = await sb
    .from("reading_plans")
    .select("*")
    .eq("group_id", user.groupId)
    .eq("status", "active");

  const planCards = [];
  for (const plan of plans ?? []) {
    const pd = Math.max(1, todayPlanDay(plan.start_date));
    if (!isWithinSchedule(pd, plan.total_days)) continue;

    const { data: myAllocs } = await sb
      .from("reading_plan_allocations")
      .select("id, start_unit, end_unit, from_day, to_day, extra_id")
      .eq("plan_id", plan.id)
      .eq("user_id", user.userId);

    const { data: myComps } = await sb
      .from("reading_plan_daily_completion")
      .select("completed_for_date")
      .eq("user_id", user.userId)
      .in("allocation_id", (myAllocs ?? []).map(a => a.id));

    const completedSet = new Set((myComps ?? []).map((c) => planDayForDate(plan.start_date, c.completed_for_date)));

    const todayAllocs = rangesActiveOnDay(myAllocs ?? [], pd);
    const todayRangeAllocs = todayAllocs.filter((a) => !a.extra_id && a.start_unit != null && a.end_unit != null);
    const todayExtraNames = extraOwedOnDay(plan.schedule, plan.total_days, pd)
      ? todayAllocs
          .filter((a) => a.extra_id)
          .map((a) => {
            const ex = (a as { reading_plan_extras?: { name: string } | { name: string }[] }).reading_plan_extras;
            const e = Array.isArray(ex) ? ex[0] : ex;
            return e?.name;
          })
          .filter((n): n is string => !!n)
      : [];
    const todayRanges = todayRangeAllocs.length > 0 || todayExtraNames.length > 0
      ? [
          todayRangeAllocs.length > 0
            ? formatRanges(todayRangeAllocs as { start_unit: number; end_unit: number }[])
            : null,
          ...todayExtraNames,
        ].filter(Boolean).join(", ")
      : null;
    const doneToday = completedSet.has(pd);
    const todayLabelStr =
      plan.schedule === "progressing" && plan.day_label_template && plan.start_at !== null
        ? dayLabel(plan.day_label_template, plan.start_at, pd)
        : null;

    // outstanding = past days where user had any active allocation and no completion
    const outstanding: { planDay: number; label: string | null; ranges: string; done: boolean }[] = [];
    for (let d = 1; d < pd; d++) {
      const dayAllocs = rangesActiveOnDay(myAllocs ?? [], d);
      if (dayAllocs.length === 0) continue;
      const rangeAllocs = dayAllocs.filter((a) => !a.extra_id && a.start_unit != null && a.end_unit != null);
      const extraNames = extraOwedOnDay(plan.schedule, plan.total_days, d)
        ? dayAllocs
            .filter((a) => a.extra_id)
            .map((a) => {
              const ex = (a as { reading_plan_extras?: { name: string } | { name: string }[] }).reading_plan_extras;
              const e = Array.isArray(ex) ? ex[0] : ex;
              return e?.name;
            })
            .filter((n): n is string => !!n)
        : [];
      if (rangeAllocs.length === 0 && extraNames.length === 0) continue;
      if (completedSet.has(d)) continue;
      outstanding.push({
        planDay: d,
        label: plan.schedule === "progressing" && plan.day_label_template && plan.start_at !== null
          ? dayLabel(plan.day_label_template, plan.start_at, d)
          : null,
        ranges: [
          rangeAllocs.length > 0 ? formatRanges(rangeAllocs as { start_unit: number; end_unit: number }[]) : null,
          ...extraNames,
        ].filter(Boolean).join(", "),
        done: false,
      });
    }

    planCards.push({
      planId: plan.id,
      planName: plan.name,
      schedule: plan.schedule,
      unitLabel: plan.unit_label,
      todayPlanDay: pd,
      totalDays: plan.total_days,
      todayLabel: todayLabelStr,
      todayRanges,
      doneToday,
      outstandingDays: outstanding,
    });
  }

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6 reveal">
      <PageHeader title={tr("todayTitle")} subtitle={tr("todaySubtitleLoggedInAs", { name: user.username })} />

      {planCards.length > 0 && (
        <section className="mb-7">
          <SectionHeader icon="📖" title={tr("sectionReadingPlans")} desc={tr("sectionReadingPlansDesc")} count={planCards.length} />
          <ul className="space-y-3">
            {planCards.map((p) => <PlanCard key={p.planId} {...p} locale={locale} />)}
          </ul>
        </section>
      )}

      {(tasks ?? []).length === 0 && planCards.length === 0 && (
        <p className="text-sm text-[var(--color-foreground)]/60 mb-6">{tr("noTasksYet")}</p>
      )}

      {(["long-term", "for-you", "group", "personal"] as const).map((key) => {
        const items = sections[key];
        const isPersonal = key === "personal";
        if ((!items || items.length === 0) && !isPersonal) return null;
        const label = labels[key];
        return (
          <section key={key} className="mb-7">
            <SectionHeader icon={label.icon} title={label.title} desc={label.desc} count={(items ?? []).length} />
            {items && items.length > 0 ? (
              <ul className="space-y-3">
                {items.map((t) => {
                  const isLongTerm = !!t.total_target;
                  const count = isLongTerm ? (totalCounts[t.id] || 0) : (milestoneCounts[t.id] || 0);
                  const target = isLongTerm ? t.total_target! : t.target_per_milestone;
                  const doneToday = doneTodaySet.has(t.id);
                  return (
                    <TaskRow
                      key={t.id}
                      task={t}
                      doneToday={doneToday}
                      count={count}
                      target={target}
                      isLongTerm={isLongTerm}
                      forDate={today}
                      imageUrl={signed[t.id]}
                      badgeText={label.badgeText}
                      badgeClass={label.badgeClass}
                      canDelete={key === "personal"}
                      locale={locale}
                    />
                  );
                })}
              </ul>
            ) : null}
            {isPersonal && (
              <div className={items && items.length > 0 ? "mt-3" : ""}>
                <AddPersonalTask locale={locale} />
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
