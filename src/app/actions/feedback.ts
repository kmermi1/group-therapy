"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin, requireSession } from "./auth";

export async function submitFeedbackAction(formData: FormData) {
  const s = await requireSession();
  const message = String(formData.get("message") || "").trim();
  const anonymous = formData.get("anonymous") === "on";
  if (!message) throw new Error("Empty message.");
  if (message.length > 2000) throw new Error("Too long (max 2000 chars).");

  const sb = createAdminClient();
  await sb.from("feedback").insert({
    group_id: s.groupId,
    from_user_id: anonymous ? null : s.kind === "user" ? s.userId : null,
    from_admin_id: anonymous ? null : s.kind === "admin" ? s.adminId : null,
    is_anonymous: anonymous,
    message,
  });
  revalidatePath("/admin/feedback");
}

export async function toggleFeedbackResolvedAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") || "");
  const sb = createAdminClient();
  const { data: row } = await sb.from("feedback").select("id, group_id, resolved").eq("id", id).single();
  if (!row || row.group_id !== admin.groupId) throw new Error("Not found.");
  await sb.from("feedback").update({ resolved: !row.resolved }).eq("id", id);
  revalidatePath("/admin/feedback");
}
