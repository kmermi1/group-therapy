"use server";

import { requireUser } from "./auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markReadingDayAction(formData: FormData) {
  const user = await requireUser();
  const allocationId = String(formData.get("allocationId") || "");
  const forDate = String(formData.get("forDate") || "");

  if (!allocationId || !forDate) {
    throw new Error("Allocation and date required");
  }

  const sb = createAdminClient();

  // Check if already marked
  const { data: existing } = await sb
    .from("reading_plan_daily_completion")
    .select("id")
    .eq("allocation_id", allocationId)
    .eq("completed_for_date", forDate)
    .maybeSingle();

  if (!existing) {
    const { error } = await sb
      .from("reading_plan_daily_completion")
      .insert({
        allocation_id: allocationId,
        completed_for_date: forDate,
        user_id: user.userId,
      });

    if (error) throw new Error(error.message);
  }

  revalidatePath("/history");
}

export async function unmarkReadingDayAction(formData: FormData) {
  const user = await requireUser();
  const allocationId = String(formData.get("allocationId") || "");
  const forDate = String(formData.get("forDate") || "");

  if (!allocationId || !forDate) {
    throw new Error("Allocation and date required");
  }

  const sb = createAdminClient();
  const { error } = await sb
    .from("reading_plan_daily_completion")
    .delete()
    .eq("allocation_id", allocationId)
    .eq("completed_for_date", forDate)
    .eq("user_id", user.userId);

  if (error) throw new Error(error.message);

  revalidatePath("/history");
}
