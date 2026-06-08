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

  const extrasRaw = String(formData.get("extras") || "");
  const extras = extrasRaw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

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

  if (extras.length > 0) {
    await sb.from("reading_plan_extras").insert(
      extras.map((name, i) => ({ plan_id: plan.id, name, position: i }))
    );
  }

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
  const unitLabelRaw = String(formData.get("unitLabel") || "").trim();
  const unitsPerDayRaw = String(formData.get("unitsPerDay") || "").trim();
  const blockSizeRaw = String(formData.get("blockSize") || "").trim();
  const startAt = startAtRaw === "" ? null : Number(startAtRaw);
  const totalDays = totalDaysRaw === "" ? null : Math.max(1, Number(totalDaysRaw));

  if (!planId || !name || !startDate) throw new Error("Name and start date required.");

  const sb = createAdminClient();
  const { data: plan } = await sb
    .from("reading_plans")
    .select("id, group_id, schedule, units_per_day, block_size, start_date")
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
  } else {
    // Repeating plans: allow editing units/block_size/unit_label too.
    let newUnitsPerDay = plan.units_per_day;
    let newBlockSize = plan.block_size;
    if (unitLabelRaw) update.unit_label = unitLabelRaw;
    if (unitsPerDayRaw) {
      newUnitsPerDay = Math.max(1, Number(unitsPerDayRaw));
      update.units_per_day = newUnitsPerDay;
    }
    if (blockSizeRaw) {
      newBlockSize = Math.max(1, Number(blockSizeRaw));
      update.block_size = newBlockSize;
    }
    if (newUnitsPerDay % newBlockSize !== 0) {
      throw new Error("Units per day must be a multiple of block size.");
    }
    // If shrinking units_per_day, release allocations that fall outside the new bound.
    if (newUnitsPerDay < plan.units_per_day) {
      try {
        const startDateStr = String(plan.start_date).slice(0, 10);
        const planDay = Math.max(1, todayPlanDay(startDateStr));
        const { data: badAllocs, error: allocError } = await sb
          .from("reading_plan_allocations")
          .select("id, from_day, end_unit")
          .eq("plan_id", planId)
          .is("to_day", null)
          .gt("end_unit", newUnitsPerDay);
        if (allocError) throw new Error(`Allocation query failed: ${allocError.message}`);
        for (const a of badAllocs ?? []) {
          const toDay = planDay - 1;
          if (toDay < a.from_day) {
            await sb.from("reading_plan_allocations").delete().eq("id", a.id);
          } else {
            await sb.from("reading_plan_allocations").update({ to_day: toDay }).eq("id", a.id);
          }
        }
      } catch (e) {
        console.error("Error shrinking units_per_day:", e);
        throw e;
      }
    }
  }

  const { error } = await sb.from("reading_plans").update(update).eq("id", planId);
  if (error) throw new Error(error.message);

  // Replace extras: parse the textarea, then upsert by position.
  // Simplest reliable approach: delete then insert. Existing allocations
  // referencing deleted extras cascade-delete (good — admin chose to remove them).
  const extrasRaw = formData.get("extras");
  if (extrasRaw !== null) {
    const extras = String(extrasRaw)
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    await sb.from("reading_plan_extras").delete().eq("plan_id", planId);
    if (extras.length > 0) {
      await sb.from("reading_plan_extras").insert(
        extras.map((name, i) => ({ plan_id: planId, name, position: i }))
      );
    }
  }

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

export async function openPlanAction(formData: FormData) {
  const admin = await requireAdmin();
  const planId = String(formData.get("planId") || "");
  const sb = createAdminClient();

  // Set plan back to active
  await sb
    .from("reading_plans")
    .update({ status: "active", closed_at: null })
    .eq("id", planId)
    .eq("group_id", admin.groupId);

  // Restore allocations by clearing to_day (members' previous choices)
  await sb
    .from("reading_plan_allocations")
    .update({ to_day: null })
    .eq("plan_id", planId)
    .not("to_day", "is", null);

  revalidatePath("/admin/plans");
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/today");
}

/**
 * Claim a contiguous range OR an extra. Caller is a user.
 * If extraId is provided, claims that extra (single-owner). Otherwise
 * claims (startUnit, endUnit) range with conflict + alignment checks.
 */
export async function claimRangeAction(formData: FormData) {
  const user = await requireUser();
  const planId = String(formData.get("planId") || "");
  const extraId = String(formData.get("extraId") || "");

  if (!planId) throw new Error("Plan missing.");

  // Extras path: single-slot claim
  if (extraId) {
    const sb = createAdminClient();
    const { data: plan } = await sb
      .from("reading_plans")
      .select("id, group_id, status, start_date")
      .eq("id", planId)
      .single();
    if (!plan || plan.group_id !== user.groupId) throw new Error("Plan not found.");
    if (plan.status !== "active") throw new Error("Plan is closed.");

    const { data: extra } = await sb.from("reading_plan_extras").select("id, plan_id").eq("id", extraId).single();
    if (!extra || extra.plan_id !== planId) throw new Error("Extra not found.");

    const { data: existing } = await sb
      .from("reading_plan_allocations")
      .select("id, user_id")
      .eq("plan_id", planId)
      .eq("extra_id", extraId)
      .is("to_day", null);
    if (existing && existing.length > 0) throw new Error("Already claimed.");

    const planDay = Math.max(1, todayPlanDay(plan.start_date));
    const { error } = await sb.from("reading_plan_allocations").insert({
      plan_id: planId,
      user_id: user.userId,
      extra_id: extraId,
      from_day: planDay,
      to_day: null,
    });
    if (error) throw new Error(error.message);

    revalidatePath(`/plans/${planId}`);
    revalidatePath("/today");
    return;
  }

  // Range path
  const start = Number(formData.get("startUnit") || 0);
  const end = Number(formData.get("endUnit") || 0);

  if (start < 1 || end < start) throw new Error("Invalid range.");

  const sb = createAdminClient();
  const { data: plan } = await sb
    .from("reading_plans")
    .select("id, group_id, units_per_day, block_size, status, start_date")
    .eq("id", planId)
    .single();
  if (!plan || plan.group_id !== user.groupId) throw new Error("Plan not found.");
  if (plan.status !== "active") throw new Error("Plan is closed.");
  if (end > plan.units_per_day) throw new Error(`Max unit is ${plan.units_per_day}.`);
  // overlap & alignment checks below also need to ignore extras (start_unit IS NULL)
  if (((start - 1) % plan.block_size) !== 0 || (end % plan.block_size) !== 0) {
    throw new Error(`Range must align to blocks of ${plan.block_size}.`);
  }

  // make sure nothing in this range is already taken by an active alloc
  const { data: existing } = await sb
    .from("reading_plan_allocations")
    .select("start_unit, end_unit, user_id, extra_id")
    .eq("plan_id", planId)
    .is("to_day", null);
  for (const r of existing ?? []) {
    if (r.extra_id) continue; // ignore extras
    if (r.start_unit == null || r.end_unit == null) continue;
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
 * Admin reassigns a range or an extra to a specific user.
 * If extraId is provided, assigns that extra (replacing existing owner).
 * Otherwise assigns the unit range (capping any overlap).
 */
export async function adminAssignRangeAction(formData: FormData) {
  const admin = await requireAdmin();
  const planId = String(formData.get("planId") || "");
  const extraId = String(formData.get("extraId") || "");
  const targetUserId = String(formData.get("targetUserId") || "");
  if (!planId || !targetUserId) throw new Error("Invalid input.");

  if (extraId) {
    const sb = createAdminClient();
    const { data: plan } = await sb
      .from("reading_plans")
      .select("id, group_id, start_date")
      .eq("id", planId)
      .single();
    if (!plan || plan.group_id !== admin.groupId) throw new Error("Plan not found.");
    const planDay = Math.max(1, todayPlanDay(plan.start_date));
    const { data: existing } = await sb
      .from("reading_plan_allocations")
      .select("id, from_day")
      .eq("plan_id", planId)
      .eq("extra_id", extraId)
      .is("to_day", null);
    for (const r of existing ?? []) {
      const toDay = planDay - 1;
      if (toDay < r.from_day) {
        await sb.from("reading_plan_allocations").delete().eq("id", r.id);
      } else {
        await sb.from("reading_plan_allocations").update({ to_day: toDay }).eq("id", r.id);
      }
    }
    await sb.from("reading_plan_allocations").insert({
      plan_id: planId,
      user_id: targetUserId,
      extra_id: extraId,
      from_day: planDay,
      to_day: null,
    });
    revalidatePath(`/plans/${planId}`);
    revalidatePath("/today");
    return;
  }

  const start = Number(formData.get("startUnit") || 0);
  const end = Number(formData.get("endUnit") || 0);
  if (start < 1 || end < start) throw new Error("Invalid input.");

  const sb = createAdminClient();
  const { data: plan } = await sb
    .from("reading_plans")
    .select("id, group_id, units_per_day, block_size, start_date")
    .eq("id", planId)
    .single();
  if (!plan || plan.group_id !== admin.groupId) throw new Error("Plan not found.");
  if (end > plan.units_per_day) throw new Error(`Max unit is ${plan.units_per_day}.`);

  const planDay = Math.max(1, todayPlanDay(plan.start_date));
  // cap any active allocations that overlap this range (skip extras)
  const { data: existing } = await sb
    .from("reading_plan_allocations")
    .select("*")
    .eq("plan_id", planId)
    .is("to_day", null);
  for (const r of existing ?? []) {
    if (r.extra_id) continue;
    if (r.start_unit == null || r.end_unit == null) continue;
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
    .select("id, group_id, status, start_date")
    .eq("id", planId)
    .single();
  if (!plan || plan.group_id !== user.groupId) throw new Error("Plan not found.");

  // Convert plan day to actual calendar date
  const planStartDate = new Date(plan.start_date + "T00:00:00Z");
  const completionDate = new Date(planStartDate);
  completionDate.setUTCDate(completionDate.getUTCDate() + (planDay - 1));
  const completionDateStr = completionDate.toISOString().slice(0, 10);

  // Get all allocations for this user and plan
  const { data: allocations } = await sb
    .from("reading_plan_allocations")
    .select("id")
    .eq("plan_id", planId)
    .eq("user_id", user.userId)
    .is("to_day", null);

  if (!allocations || allocations.length === 0) throw new Error("No allocations found.");

  // For each allocation, toggle the completion
  for (const alloc of allocations) {
    const { data: existing } = await sb
      .from("reading_plan_daily_completion")
      .select("id")
      .eq("allocation_id", alloc.id)
      .eq("completed_for_date", completionDateStr)
      .maybeSingle();

    if (existing) {
      await sb.from("reading_plan_daily_completion").delete().eq("id", existing.id);
    } else {
      await sb.from("reading_plan_daily_completion").insert({
        allocation_id: alloc.id,
        completed_for_date: completionDateStr,
        user_id: user.userId,
      });
    }
  }

  // Auto-close: progressing plan where every member with any historical
  // allocation has a completion for every plan day in [1..total_days].
  if (plan.status === "active") {
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

