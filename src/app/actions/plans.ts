"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin, requireUser } from "./auth";
import { todayInGroupTz, todayPlanDay } from "@/lib/plans";

type ScheduleType = "progressing" | "repeating";

export async function createPlanAction(formData: FormData) {
  const admin = await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const unitLabel = String(formData.get("unitLabel") || "page").trim() || "page";
  const unitsPerDay = Math.max(1, Number(formData.get("unitsPerDay") || 0));
  const blockSize = Math.max(1, Number(formData.get("blockSize") || 1));
  const schedule = String(formData.get("schedule") || "progressing") as ScheduleType;
  const startDate = String(formData.get("startDate") || "").trim() || todayInGroupTz();

  let dayLabelTemplate: string | null = null;
  let startAt: number | null = null;
  let totalDays: number | null = null;

  if (schedule === "progressing") {
    dayLabelTemplate = String(formData.get("dayLabelTemplate") || "Day {n}").trim() || "Day {n}";
    startAt = Math.max(0, Number(formData.get("startAt") || 1));
    totalDays = Math.max(1, Number(formData.get("totalDays") || 1));
  }

  if (!name || !unitLabel || !unitsPerDay) throw new Error("Name, unit label, and units/day required.");
  if (unitsPerDay % blockSize !== 0) throw new Error("Units per day must be a multiple of block size.");

  const sb = createAdminClient();
  const { data: plan, error } = await sb
    .from("reading_plans")
    .insert({
      group_id: admin.groupId,
      name,
      unit_label: unitLabel,
      units_per_day: unitsPerDay,
      block_size: blockSize,
      schedule,
      day_label_template: dayLabelTemplate,
      start_at: startAt,
      total_days: totalDays,
      start_date: startDate,
    })
    .select()
    .single();
  if (error || !plan) throw new Error(error?.message || "Failed to create plan");

  revalidatePath("/admin/plans");
  revalidatePath("/today");
  redirect(`/plans/${plan.id}`);
}

export async function clonePlanAction(formData: FormData) {
  const admin = await requireAdmin();
  const planId = String(formData.get("planId") || "");
  const newName = String(formData.get("newName") || "").trim();
  const newStartDate = String(formData.get("newStartDate") || "").trim() || todayInGroupTz();
  const copyAllocations = formData.get("copyAllocations") === "on";

  if (!planId || !newName) throw new Error("Plan and new name required.");

  const sb = createAdminClient();
  const { data: src } = await sb
    .from("reading_plans")
    .select("*")
    .eq("id", planId)
    .eq("group_id", admin.groupId)
    .single();
  if (!src) throw new Error("Plan not found.");

  const { data: copy, error } = await sb
    .from("reading_plans")
    .insert({
      group_id: admin.groupId,
      name: newName,
      unit_label: src.unit_label,
      units_per_day: src.units_per_day,
      block_size: src.block_size,
      schedule: src.schedule,
      day_label_template: src.day_label_template,
      start_at: src.start_at,
      total_days: src.total_days,
      start_date: newStartDate,
    })
    .select()
    .single();
  if (error || !copy) throw new Error(error?.message || "Clone failed");

  if (copyAllocations) {
    const { data: oldAllocs } = await sb
      .from("reading_plan_allocations")
      .select("user_id, start_unit, end_unit, to_day")
      .eq("plan_id", planId)
      .is("to_day", null);
    if (oldAllocs && oldAllocs.length > 0) {
      await sb.from("reading_plan_allocations").insert(
        oldAllocs.map((a) => ({
          plan_id: copy.id,
          user_id: a.user_id,
          start_unit: a.start_unit,
          end_unit: a.end_unit,
          from_day: 1,
          to_day: null,
        }))
      );
    }
  }

  revalidatePath("/admin/plans");
  revalidatePath("/today");
  redirect(`/plans/${copy.id}`);
}

export async function editPlanAction(formData: FormData) {
  const admin = await requireAdmin();
  const planId = String(formData.get("planId") || "");
  const name = String(formData.get("name") || "").trim();
  const startDate = String(formData.get("startDate") || "").trim();
  const dayLabelTemplate = String(formData.get("dayLabelTemplate") || "").trim() || null;
  const startAtRaw = String(formData.get("startAt") || "").trim();
  const totalDaysRaw = String(formData.get("totalDays") || "").trim();
  const startAt = startAtRaw === "" ? null : Number(startAtRaw);
  const totalDays = totalDaysRaw === "" ? null : Math.max(1, Number(totalDaysRaw));

  if (!planId || !name || !startDate) throw new Error("Name and start date required.");

  const sb = createAdminClient();
  const { data: plan } = await sb
    .from("reading_plans")
    .select("id, group_id, schedule")
    .eq("id", planId)
    .single();
  if (!plan || plan.group_id !== admin.groupId) throw new Error("Plan not found.");

  const update: Record<string, unknown> = {
    name,
    start_date: startDate,
  };
  if (plan.schedule === "progressing") {
    update.day_label_template = dayLabelTemplate;
    update.start_at = startAt;
    update.total_days = totalDays;
  }
  const { error } = await sb.from("reading_plans").update(update).eq("id", planId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/plans");
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/today");
  redirect(`/plans/${planId}`);
}

export async function closePlanAction(formData: FormData) {
  const admin = await requireAdmin();
  const planId = String(formData.get("planId") || "");
  const sb = createAdminClient();
  await sb
    .from("reading_plans")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", planId)
    .eq("group_id", admin.groupId);
  revalidatePath("/admin/plans");
  revalidatePath("/today");
}

/**
 * Claim a contiguous range. Caller is a user. Conflicts with other
 * users' ACTIVE allocations or with the unit bounds will throw.
 */
export async function claimRangeAction(formData: FormData) {
  const user = await requireUser();
  const planId = String(formData.get("planId") || "");
  const start = Number(formData.get("startUnit") || 0);
  const end = Number(formData.get("endUnit") || 0);

  if (!planId || start < 1 || end < start) throw new Error("Invalid range.");

  const sb = createAdminClient();
  const { data: plan } = await sb
    .from("reading_plans")
    .select("id, group_id, units_per_day, block_size, status, start_date")
    .eq("id", planId)
    .single();
  if (!plan || plan.group_id !== user.groupId) throw new Error("Plan not found.");
  if (plan.status !== "active") throw new Error("Plan is closed.");
  if (end > plan.units_per_day) throw new Error(`Max unit is ${plan.units_per_day}.`);
  if (((start - 1) % plan.block_size) !== 0 || (end % plan.block_size) !== 0) {
    throw new Error(`Range must align to blocks of ${plan.block_size}.`);
  }

  // make sure nothing in this range is already taken by an active alloc
  const { data: existing } = await sb
    .from("reading_plan_allocations")
    .select("start_unit, end_unit, user_id")
    .eq("plan_id", planId)
    .is("to_day", null);
  for (const r of existing ?? []) {
    if (!(end < r.start_unit || start > r.end_unit)) {
      throw new Error(`Conflicts with units ${r.start_unit}–${r.end_unit}.`);
    }
  }

  const planDay = Math.max(1, todayPlanDay(plan.start_date));
  const { error } = await sb.from("reading_plan_allocations").insert({
    plan_id: planId,
    user_id: user.userId,
    start_unit: start,
    end_unit: end,
    from_day: planDay,
    to_day: null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/plans/${planId}`);
  revalidatePath("/today");
}

/**
 * Release one of your active allocation rows (cap to_day = today - 1
 * so you don't owe pages from today onward).
 */
export async function releaseRangeAction(formData: FormData) {
  const user = await requireUser();
  const allocId = String(formData.get("allocId") || "");
  const sb = createAdminClient();

  const { data: alloc } = await sb
    .from("reading_plan_allocations")
    .select("id, user_id, from_day, plan_id, reading_plans!inner(start_date, group_id)")
    .eq("id", allocId)
    .single();
  if (!alloc || alloc.user_id !== user.userId) throw new Error("Not your allocation.");

  const plan = Array.isArray(alloc.reading_plans) ? alloc.reading_plans[0] : alloc.reading_plans;
  const planDay = Math.max(1, todayPlanDay(plan.start_date));
  const toDay = Math.max(alloc.from_day - 1, planDay - 1);

  if (toDay < alloc.from_day) {
    // claimed today and releasing today — just delete the row entirely
    await sb.from("reading_plan_allocations").delete().eq("id", allocId);
  } else {
    await sb.from("reading_plan_allocations").update({ to_day: toDay }).eq("id", allocId);
  }
  revalidatePath(`/plans/${alloc.plan_id}`);
  revalidatePath("/today");
}

/**
 * Admin reassigns a range (cap existing active alloc for the conflicting
 * range or user, then insert new alloc for target_user_id).
 */
export async function adminAssignRangeAction(formData: FormData) {
  const admin = await requireAdmin();
  const planId = String(formData.get("planId") || "");
  const start = Number(formData.get("startUnit") || 0);
  const end = Number(formData.get("endUnit") || 0);
  const targetUserId = String(formData.get("targetUserId") || "");
  if (!planId || !targetUserId || start < 1 || end < start) throw new Error("Invalid input.");

  const sb = createAdminClient();
  const { data: plan } = await sb
    .from("reading_plans")
    .select("id, group_id, units_per_day, block_size, start_date")
    .eq("id", planId)
    .single();
  if (!plan || plan.group_id !== admin.groupId) throw new Error("Plan not found.");
  if (end > plan.units_per_day) throw new Error(`Max unit is ${plan.units_per_day}.`);

  const planDay = Math.max(1, todayPlanDay(plan.start_date));
  // cap any active allocations that overlap this range
  const { data: existing } = await sb
    .from("reading_plan_allocations")
    .select("*")
    .eq("plan_id", planId)
    .is("to_day", null);
  for (const r of existing ?? []) {
    if (!(end < r.start_unit || start > r.end_unit)) {
      const toDay = planDay - 1;
      if (toDay < r.from_day) {
        await sb.from("reading_plan_allocations").delete().eq("id", r.id);
      } else {
        await sb.from("reading_plan_allocations").update({ to_day: toDay }).eq("id", r.id);
      }
    }
  }

  await sb.from("reading_plan_allocations").insert({
    plan_id: planId,
    user_id: targetUserId,
    start_unit: start,
    end_unit: end,
    from_day: planDay,
    to_day: null,
  });
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/today");
}

export async function togglePlanDayDoneAction(formData: FormData) {
  const user = await requireUser();
  const planId = String(formData.get("planId") || "");
  const planDay = Number(formData.get("planDay") || 0);
  if (!planId || planDay < 1) throw new Error("Invalid plan day.");

  const sb = createAdminClient();
  const { data: plan } = await sb
    .from("reading_plans")
    .select("id, group_id, status")
    .eq("id", planId)
    .single();
  if (!plan || plan.group_id !== user.groupId) throw new Error("Plan not found.");

  const { data: existing } = await sb
    .from("reading_plan_completions")
    .select("id")
    .eq("plan_id", planId)
    .eq("user_id", user.userId)
    .eq("plan_day", planDay)
    .maybeSingle();

  if (existing) {
    await sb.from("reading_plan_completions").delete().eq("id", existing.id);
  } else {
    await sb.from("reading_plan_completions").insert({
      plan_id: planId,
      user_id: user.userId,
      plan_day: planDay,
    });
  }

  // Auto-close: progressing plan where every member with any historical
  // allocation has a completion for every plan day in [1..total_days].
  if (!existing && plan.status === "active") {
    await maybeAutoClose(planId);
  }

  revalidatePath("/today");
  revalidatePath(`/plans/${planId}`);
}

async function maybeAutoClose(planId: string) {
  const sb = createAdminClient();
  const { data: plan } = await sb
    .from("reading_plans")
    .select("schedule, total_days, status")
    .eq("id", planId)
    .single();
  if (!plan || plan.schedule !== "progressing" || !plan.total_days || plan.status !== "active") return;

  const { data: allocs } = await sb
    .from("reading_plan_allocations")
    .select("user_id, from_day, to_day")
    .eq("plan_id", planId);
  const { data: comps } = await sb
    .from("reading_plan_completions")
    .select("user_id, plan_day")
    .eq("plan_id", planId);

  const allocsByUser: Record<string, { from_day: number; to_day: number | null }[]> = {};
  for (const a of allocs ?? []) {
    (allocsByUser[a.user_id] ||= []).push({ from_day: a.from_day, to_day: a.to_day });
  }
  const compsByUser: Record<string, Set<number>> = {};
  for (const c of comps ?? []) {
    (compsByUser[c.user_id] ||= new Set()).add(c.plan_day);
  }

  for (const userId of Object.keys(allocsByUser)) {
    for (let d = 1; d <= plan.total_days; d++) {
      const hadAlloc = allocsByUser[userId].some((a) => a.from_day <= d && (a.to_day === null || a.to_day >= d));
      if (hadAlloc && !(compsByUser[userId]?.has(d))) return; // not done yet
    }
  }

  await sb
    .from("reading_plans")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", planId);
}

