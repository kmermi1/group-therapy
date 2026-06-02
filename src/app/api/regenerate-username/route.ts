import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { generateUniqueUsername } from "@/lib/username";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST() {
  const s = await getSession();
  if (!s || s.kind !== "user") return NextResponse.json({ error: "auth" }, { status: 401 });
  const username = await generateUniqueUsername(s.groupId);
  const sb = createAdminClient();
  const { data: group } = await sb.from("groups").select("code").eq("id", s.groupId).single();
  return NextResponse.json({ username, groupCode: group?.code });
}
