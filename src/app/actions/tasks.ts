"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin, requireUser } from "./auth";
import { todayDateString, effectiveMilestoneStart } from "@/lib/milestone";

const BUCKET = "task-images";

export async function createTaskAction(formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const frequency = String(formData.get("frequency") || "daily") as "daily" | "weekly";
  const target = Math.max(1, Number(formData.get("target") || 1));
  const assigneeRaw = String(formData.get("assigneeUserId") || "");
  const assigneeUserId = assigneeRaw === "all" || assigneeRaw === "" ? null : assigneeRaw;
  const image = formData.get("image") as File | null;

  if (!title) throw new Error("Title required.");

  const sb = createAdminClient();
  let image_path: string | null = null;
  if (image && image.size > 0) {
    const ext = (image.name.split(".").pop() || "bin").toLowerCase();
    const path = `${admin.groupId}/${crypto.randomUUID()}.${ext}`;
    const buf = Buffer.from(await image.arrayBuffer());
    const { error } = await sb.storage.from(BUCKET).upload(path, buf, {
      contentType: image.type || "application/octet-stream",
      upsert: false,
    });
    if (error) throw new Error("Image upload failed: " + error.message);
    image_path = path;
  }

  const { error } = await sb.from("tasks").insert({
    group_id: admin.groupId,
    title,
    description,
    image_path,
    frequency,
    target_per_milestone: target,
    assignee_user_id: assigneeUserId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/today");
}

export async function createPersonalTaskAction(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const frequency = String(formData.get("frequency") || "daily") as "daily" | "weekly";
  const target = Math.max(1, Number(formData.get("target") || 1));

  if (!title) throw new Error("Title required.");

  const sb = createAdminClient();
  const { error } = await sb.from("tasks").insert({
    group_id: user.groupId,
    title,
    description,
    frequency,
    target_per_milestone: target,
    assignee_user_id: user.userId,
    created_by_user_id: user.userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/today");
}

export async function archivePersonalTaskAction(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") || "");
  const sb = createAdminClient();
  // only allow deleting own personal task
  await sb
    .from("tasks")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("group_id", user.groupId)
    .eq("created_by_user_id", user.userId);
  revalidatePath("/today");
}

export async function archiveTaskAction(formData: FormData) {
  const admin = await requireAdmin();
  const taskId = String(formData.get("taskId") || "");
  const sb = createAdminClient();
  await sb.from("tasks").update({ archived_at: new Date().toISOString() }).eq("id", taskId).eq("group_id", admin.groupId);
  revalidatePath("/admin");
}

async function bumpLastSeen(userId: string) {
  const sb = createAdminClient();
  await sb.from("users").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
}

export async function toggleCompletionAction(formData: FormData) {
  const user = await requireUser();
  await bumpLastSeen(user.userId);
  const taskId = String(formData.get("taskId") || "");
  const forDate = String(formData.get("forDate") || todayDateString());

  const sb = createAdminClient();
  // confirm task belongs to user's group + is assigned to them or all
  const { data: task } = await sb
    .from("tasks")
    .select("id, group_id, assignee_user_id, archived_at")
    .eq("id", taskId)
    .maybeSingle();
  if (!task || task.group_id !== user.groupId || task.archived_at) throw new Error("Task not found.");
  if (task.assignee_user_id && task.assignee_user_id !== user.userId) throw new Error("Not your task.");

  const { data: existing } = await sb
    .from("task_completions")
    .select("id")
    .eq("task_id", taskId)
    .eq("user_id", user.userId)
    .eq("completed_for_date", forDate)
    .maybeSingle();

  if (existing) {
    await sb.from("task_completions").delete().eq("id", existing.id);
  } else {
    await sb.from("task_completions").insert({
      task_id: taskId,
      user_id: user.userId,
      completed_for_date: forDate,
    });
  }
  revalidatePath("/today");
  revalidatePath("/leaderboard");
  revalidatePath("/history");
}

export async function adminResetMilestoneAction() {
  const admin = await requireAdmin();
  const sb = createAdminClient();
  const { data: group } = await sb.from("groups").select("*").eq("id", admin.groupId).single();
  if (!group) throw new Error("Group missing.");

  const startedAt = group.milestone_started_at;
  await sb.from("milestones").insert({
    group_id: admin.groupId,
    started_at: startedAt,
    ended_at: new Date().toISOString(),
  });
  await sb.from("groups").update({ milestone_started_at: new Date().toISOString() }).eq("id", admin.groupId);
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
}

export async function removeUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") || "");
  if (!userId) throw new Error("userId required");
  const sb = createAdminClient();
  // confirm user is in the admin's group
  const { data: user } = await sb
    .from("users")
    .select("id, group_id")
    .eq("id", userId)
    .maybeSingle();
  if (!user || user.group_id !== admin.groupId) throw new Error("Not your user.");
  // hard delete — cascades to completions and individually-assigned tasks
  await sb.from("users").delete().eq("id", userId);
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
}

export async function rotateGroupCodeAction() {
  const admin = await requireAdmin();
  const sb = createAdminClient();
  const { generateGroupCode } = await import("@/lib/groupCode");
  let candidate = "";
  for (let i = 0; i < 10; i++) {
    const c = generateGroupCode(6);
    const { data } = await sb.from("groups").select("id").eq("code", c).maybeSingle();
    if (!data) { candidate = c; break; }
  }
  if (!candidate) throw new Error("Could not allocate group code.");
  await sb.from("groups").update({ code: candidate }).eq("id", admin.groupId);
  revalidatePath("/admin");
}

export async function updateStartDayAction(formData: FormData) {
  const admin = await requireAdmin();
  const startDay = Number(formData.get("startDay") ?? 3);
  if (startDay < 0 || startDay > 6) throw new Error("Invalid day.");
  const sb = createAdminClient();
  await sb.from("groups").update({ default_start_day: startDay }).eq("id", admin.groupId);
  revalidatePath("/admin");
}

export async function regenerateUsernameAction(formData: FormData) {
  const user = await requireUser();
  const choice = String(formData.get("choice") || "keep"); // "keep" | "fresh"
  const newUsername = String(formData.get("newUsername") || "").trim();
  if (!newUsername) throw new Error("Missing new username.");

  const sb = createAdminClient();
  // make sure new username is still free
  const { data: clash } = await sb
    .from("users")
    .select("id")
    .eq("group_id", user.groupId)
    .eq("username", newUsername)
    .is("archived_at", null)
    .maybeSingle();
  if (clash) throw new Error("Username taken — regenerate again.");

  if (choice === "keep") {
    // record history, update username on the same row
    const { data: current } = await sb.from("users").select("username").eq("id", user.userId).single();
    if (current?.username) {
      await sb.from("username_history").insert({
        user_id: user.userId,
        group_id: user.groupId,
        old_username: current.username,
      });
    }
    await sb.from("users").update({ username: newUsername }).eq("id", user.userId);
  } else {
    // fresh: archive old user, create a new user record with same PIN hash
    const { data: oldUser } = await sb.from("users").select("pin_hash").eq("id", user.userId).single();
    await sb.from("users").update({ archived_at: new Date().toISOString() }).eq("id", user.userId);
    const { data: created } = await sb
      .from("users")
      .insert({ group_id: user.groupId, username: newUsername, pin_hash: oldUser!.pin_hash })
      .select()
      .single();
    if (!created) throw new Error("Fresh start failed.");
    const { setSession } = await import("@/lib/session");
    await setSession({ kind: "user", userId: created.id, groupId: user.groupId, username: created.username });
  }

  // refresh session username (for keep case)
  if (choice === "keep") {
    const { setSession } = await import("@/lib/session");
    await setSession({ kind: "user", userId: user.userId, groupId: user.groupId, username: newUsername });
  }
  revalidatePath("/profile");
  revalidatePath("/today");
  revalidatePath("/leaderboard");
}

export async function userResetHistoryAction() {
  const user = await requireUser();
  const sb = createAdminClient();
  await sb.from("user_history_resets").upsert({ user_id: user.userId, reset_at: new Date().toISOString() });
  revalidatePath("/history");
}

export async function getMilestoneBounds(groupId: string) {
  const sb = createAdminClient();
  const { data: group } = await sb.from("groups").select("*").eq("id", groupId).single();
  if (!group) throw new Error("Group missing");
  const stored = new Date(group.milestone_started_at);
  const effective = effectiveMilestoneStart(stored, group.default_start_day);
  return { milestoneStart: effective, group };
}

export { todayDateString };
