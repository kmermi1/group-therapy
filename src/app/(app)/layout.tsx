import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { t } from "@/lib/i18n";
import FeedbackButton from "@/components/FeedbackButton";
import UnseenFeedbackModal from "@/components/UnseenFeedbackModal";
import { createAdminClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");

  const isAdmin = s.kind === "admin";
  const locale = s.kind === "user" ? s.locale : "en";

  // Fetch group name for header
  const sbGroup = createAdminClient();
  const { data: groupData } = await sbGroup
    .from("groups")
    .select("name")
    .eq("id", s.groupId)
    .single();
  const groupName = groupData?.name ?? "";

  // Fetch unseen feedback for admins
  let unseenFeedback: Array<{
    id: string;
    message: string;
    created_at: string;
    is_anonymous: boolean;
    fromName: string | null;
  }> = [];
  if (s.kind === "admin") {
    const sb = createAdminClient();
    const { data: ackedRows } = await sb
      .from("feedback_admin_acks")
      .select("feedback_id")
      .eq("admin_id", s.adminId);
    const ackedIds = new Set((ackedRows ?? []).map((r) => r.feedback_id));

    const { data: allFeedback } = await sb
      .from("feedback")
      .select("id, message, created_at, is_anonymous, from_user_id, from_admin_id")
      .eq("group_id", s.groupId)
      .order("created_at", { ascending: true });

    const unseen = (allFeedback ?? []).filter((f) => !ackedIds.has(f.id));

    if (unseen.length > 0) {
      const userIds = unseen.map((f) => f.from_user_id).filter((x): x is string => !!x);
      const adminIds = unseen.map((f) => f.from_admin_id).filter((x): x is string => !!x);
      const [{ data: users }, { data: admins }] = await Promise.all([
        userIds.length
          ? sb.from("users").select("id, username").in("id", userIds)
          : Promise.resolve({ data: [] as { id: string; username: string }[] }),
        adminIds.length
          ? sb.from("admins").select("id, username").in("id", adminIds)
          : Promise.resolve({ data: [] as { id: string; username: string }[] }),
      ]);
      const userMap = new Map((users ?? []).map((u) => [u.id, u.username]));
      const adminMap = new Map((admins ?? []).map((a) => [a.id, a.username]));
      unseenFeedback = unseen.map((f) => ({
        id: f.id,
        message: f.message,
        created_at: f.created_at,
        is_anonymous: f.is_anonymous,
        fromName: f.is_anonymous
          ? null
          : f.from_user_id
          ? userMap.get(f.from_user_id) ?? null
          : f.from_admin_id
          ? adminMap.get(f.from_admin_id) ?? null
          : null,
      }));
    }
  }

  return (
    <div className="flex-1 flex flex-col pb-24 pt-12">
      <header className="fixed top-0 inset-x-0 z-10 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-md mx-auto px-5 py-2.5 flex items-center justify-center gap-2">
          <span className="text-base">👥</span>
          <span className="text-sm font-semibold tracking-tight text-[var(--foreground)] truncate">
            {groupName}
          </span>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <FeedbackButton locale={locale} />
      {unseenFeedback.length > 0 && <UnseenFeedbackModal items={unseenFeedback} />}
      <nav className="fixed bottom-0 inset-x-0 z-10 bg-[var(--background)]/90 backdrop-blur-md border-t border-[var(--border)]">
        <div className="max-w-md mx-auto grid grid-cols-4">
          {isAdmin ? (
            <>
              <NavLink href="/admin" label="Status" icon="📊" />
              <NavLink href="/admin/manage" label="Tasks" icon="⚙️" />
              <NavLink href="/admin/plans" label="Plans" icon="📖" />
              <NavLink href="/profile" label={t("navMe", locale)} icon="👤" />
            </>
          ) : (
            <>
              <NavLink href="/today" label={t("navToday", locale)} icon="✅" />
              <NavLink href="/history" label={t("navHistory", locale)} icon="📅" />
              <NavLink href="/leaderboard" label={t("navGroup", locale)} icon="🏆" />
              <NavLink href="/profile" label={t("navMe", locale)} icon="👤" />
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center pt-2.5 pb-2 text-[11px] text-[var(--foreground-mute)] hover:text-[var(--foreground)] transition"
    >
      <span className="text-xl mb-0.5">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
