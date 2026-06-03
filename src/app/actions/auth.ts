"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { generateGroupCode } from "@/lib/groupCode";
import { generateUniqueUsername } from "@/lib/username";
import { setSession, clearSession, getSession } from "@/lib/session";

export async function createGroupAction(formData: FormData) {
  const groupName = String(formData.get("groupName") || "").trim();
  const milestoneStartDate = String(formData.get("milestoneStartDate") || "").trim();
  const startDay = Number(formData.get("startDay") ?? 3);
  const adminUsername = String(formData.get("adminUsername") || "").trim();
  const adminPassword = String(formData.get("adminPassword") || "");

  if (!groupName || !milestoneStartDate || !adminUsername || adminPassword.length < 6) {
    throw new Error("Group name, milestone date, admin username, and password (6+ chars) required.");
  }

  const sb = createAdminClient();

  // generate a unique group code
  let code = "";
  for (let i = 0; i < 10; i++) {
    const candidate = generateGroupCode(6);
    const { data } = await sb.from("groups").select("id").eq("code", candidate).maybeSingle();
    if (!data) { code = candidate; break; }
  }
  if (!code) throw new Error("Could not allocate group code, try again.");

  // separate code for inviting co-admins
  let adminCode = "";
  for (let i = 0; i < 10; i++) {
    const candidate = generateGroupCode(8);
    const { data } = await sb.from("groups").select("id").eq("admin_invite_code", candidate).maybeSingle();
    if (!data) { adminCode = candidate; break; }
  }
  if (!adminCode) throw new Error("Could not allocate admin invite code, try again.");

  const { data: group, error: groupErr } = await sb
    .from("groups")
    .insert({ code, admin_invite_code: adminCode, name: groupName, default_start_day: startDay, milestone_started_at: `${milestoneStartDate}T00:00:00+00` })
    .select()
    .single();
  if (groupErr || !group) throw new Error(groupErr?.message || "Group create failed");

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const { data: admin, error: adminErr } = await sb
    .from("admins")
    .insert({ group_id: group.id, username: adminUsername, password_hash: passwordHash })
    .select()
    .single();
  if (adminErr || !admin) throw new Error(adminErr?.message || "Admin create failed");

  await setSession({ kind: "admin", adminId: admin.id, groupId: group.id, username: admin.username });
  redirect("/admin");
}

export async function previewUsernameAction(groupCode: string, locale: "en" | "tr" = "en"): Promise<{ groupId: string; username: string } | null> {
  const sb = createAdminClient();
  const { data: group } = await sb.from("groups").select("id").eq("code", groupCode.toUpperCase()).maybeSingle();
  if (!group) return null;
  const username = await generateUniqueUsername(group.id, locale);
  return { groupId: group.id, username };
}

export async function joinGroupAction(formData: FormData) {
  const groupCode = String(formData.get("groupCode") || "").trim().toUpperCase();
  const username = String(formData.get("username") || "").trim();
  const pin = String(formData.get("pin") || "");
  const localeRaw = String(formData.get("locale") || "en");
  const locale: "en" | "tr" = localeRaw === "tr" ? "tr" : "en";

  if (!groupCode || !username || pin.length < 4) {
    throw new Error("Group code, username, and PIN (4+ digits) required.");
  }

  const sb = createAdminClient();
  const { data: group } = await sb.from("groups").select("id").eq("code", groupCode).maybeSingle();
  if (!group) throw new Error("Group not found.");

  const { data: existing } = await sb.from("users").select("id").eq("group_id", group.id).eq("username", username).is("archived_at", null).maybeSingle();
  if (existing) throw new Error("Username just got taken — regenerate and try again.");

  const pinHash = await bcrypt.hash(pin, 10);
  const { data: user, error: userErr } = await sb
    .from("users")
    .insert({ group_id: group.id, username, pin_hash: pinHash, language: locale })
    .select()
    .single();
  if (userErr || !user) throw new Error(userErr?.message || "Join failed");

  await setSession({ kind: "user", userId: user.id, groupId: group.id, username: user.username, locale });
  redirect("/today");
}

export async function loginUserAction(formData: FormData): Promise<{ error?: string }> {
  const groupCode = String(formData.get("groupCode") || "").trim().toUpperCase();
  const username = String(formData.get("username") || "").trim();
  const pin = String(formData.get("pin") || "");

  const sb = createAdminClient();
  const { data: group } = await sb.from("groups").select("id").eq("code", groupCode).maybeSingle();
  if (!group) return { error: "Invalid credentials." };

  const { data: user } = await sb
    .from("users")
    .select("*")
    .eq("group_id", group.id)
    .eq("username", username)
    .is("archived_at", null)
    .maybeSingle();
  if (!user) return { error: "Invalid credentials." };

  const ok = await bcrypt.compare(pin, user.pin_hash);
  if (!ok) return { error: "Invalid credentials." };

  await sb.from("users").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);
  const locale: "en" | "tr" = user.language === "tr" ? "tr" : "en";
  await setSession({ kind: "user", userId: user.id, groupId: group.id, username: user.username, locale });
  redirect("/today");
}

export async function setLanguageAction(formData: FormData) {
  const s = await getSession();
  if (!s || s.kind !== "user") throw new Error("User only.");
  const raw = String(formData.get("locale") || "en");
  const locale: "en" | "tr" = raw === "tr" ? "tr" : "en";
  const sb = createAdminClient();
  await sb.from("users").update({ language: locale }).eq("id", s.userId);
  await setSession({ ...s, locale });
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/profile");
  revalidatePath("/today");
}

export async function joinAsAdminAction(formData: FormData) {
  const inviteCode = String(formData.get("inviteCode") || "").trim().toUpperCase();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!inviteCode || !username || password.length < 6) {
    throw new Error("Invite code, admin username, and password (6+ chars) required.");
  }

  const sb = createAdminClient();
  const { data: group } = await sb
    .from("groups")
    .select("id")
    .eq("admin_invite_code", inviteCode)
    .maybeSingle();
  if (!group) throw new Error("Admin invite code not found.");

  const { data: clash } = await sb
    .from("admins")
    .select("id")
    .eq("group_id", group.id)
    .eq("username", username)
    .maybeSingle();
  if (clash) throw new Error("That admin username is taken in this group.");

  const passwordHash = await bcrypt.hash(password, 10);
  const { data: admin, error: adminErr } = await sb
    .from("admins")
    .insert({ group_id: group.id, username, password_hash: passwordHash })
    .select()
    .single();
  if (adminErr || !admin) throw new Error(adminErr?.message || "Admin create failed");

  await setSession({ kind: "admin", adminId: admin.id, groupId: group.id, username: admin.username });
  redirect("/admin");
}

export async function rotateAdminInviteAction() {
  const s = await getSession();
  if (!s || s.kind !== "admin") throw new Error("Admin only.");
  const sb = createAdminClient();
  let candidate = "";
  for (let i = 0; i < 10; i++) {
    const c = generateGroupCode(8);
    const { data } = await sb.from("groups").select("id").eq("admin_invite_code", c).maybeSingle();
    if (!data) { candidate = c; break; }
  }
  if (!candidate) throw new Error("Could not allocate code.");
  await sb.from("groups").update({ admin_invite_code: candidate }).eq("id", s.groupId);
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin");
}

export async function loginAdminAction(formData: FormData): Promise<{ error?: string }> {
  const groupCode = String(formData.get("groupCode") || "").trim().toUpperCase();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  const sb = createAdminClient();
  const { data: group } = await sb.from("groups").select("id").eq("code", groupCode).maybeSingle();
  if (!group) return { error: "Invalid credentials." };

  const { data: admin } = await sb
    .from("admins")
    .select("*")
    .eq("group_id", group.id)
    .eq("username", username)
    .maybeSingle();
  if (!admin) return { error: "Invalid credentials." };

  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return { error: "Invalid credentials." };

  await setSession({ kind: "admin", adminId: admin.id, groupId: group.id, username: admin.username });
  redirect("/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function generateAdminResetCodeAction(formData: FormData) {
  const admin = await requireAdmin();
  const targetAdminId = String(formData.get("targetAdminId") || "");

  if (!targetAdminId) throw new Error("Target admin ID required.");

  const sb = createAdminClient();

  // Verify target admin is in same group
  const { data: targetAdmin } = await sb
    .from("admins")
    .select("id, group_id, username")
    .eq("id", targetAdminId)
    .single();

  if (!targetAdmin || targetAdmin.group_id !== admin.groupId) {
    throw new Error("Admin not found in your group.");
  }

  // Generate unique reset code
  let code = "";
  for (let i = 0; i < 10; i++) {
    const candidate = generateGroupCode(8);
    const { data } = await sb
      .from("admin_password_reset_codes")
      .select("id")
      .eq("code", candidate)
      .maybeSingle();
    if (!data) { code = candidate; break; }
  }
  if (!code) throw new Error("Could not generate reset code, try again.");

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await sb.from("admin_password_reset_codes").insert({
    admin_id: targetAdminId,
    code,
    expires_at: expiresAt,
    created_by_admin_id: admin.adminId,
  });

  if (error) throw new Error(error.message);

  return { code, targetUsername: targetAdmin.username };
}

export async function resetAdminPasswordWithCodeAction(formData: FormData) {
  const resetCode = String(formData.get("resetCode") || "").trim();
  const newPassword = String(formData.get("newPassword") || "");

  if (!resetCode || newPassword.length < 6) {
    throw new Error("Valid reset code and password (6+ chars) required.");
  }

  const sb = createAdminClient();

  // Find and validate reset code
  const { data: resetRecord } = await sb
    .from("admin_password_reset_codes")
    .select("id, admin_id, expires_at, used_at")
    .eq("code", resetCode)
    .maybeSingle();

  if (!resetRecord) throw new Error("Invalid reset code.");
  if (resetRecord.used_at) throw new Error("This reset code has already been used.");
  if (new Date(resetRecord.expires_at) < new Date()) throw new Error("Reset code has expired.");

  // Update password and mark code as used
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const { error: updateErr } = await sb
    .from("admins")
    .update({ password_hash: passwordHash })
    .eq("id", resetRecord.admin_id);

  if (updateErr) throw new Error(updateErr.message);

  const { error: useErr } = await sb
    .from("admin_password_reset_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", resetRecord.id);

  if (useErr) throw new Error(useErr.message);

  return { success: true };
}

export async function requireSession() {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireUser() {
  const s = await getSession();
  if (!s || s.kind !== "user") redirect("/login");
  return s;
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s || s.kind !== "admin") redirect("/login");
  return s;
}
