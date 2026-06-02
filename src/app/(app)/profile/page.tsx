import { requireSession, logoutAction } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader, Card, Button } from "@/components/ui";
import ProfileRename from "./ProfileRename";

export default async function ProfilePage() {
  const s = await requireSession();
  const sb = createAdminClient();
  const { data: group } = await sb.from("groups").select("code, name").eq("id", s.groupId).single();

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="Me" />
      <Card className="mb-4">
        <div className="text-xs uppercase tracking-wide text-[var(--color-foreground)]/60">You are</div>
        {s.kind === "user" ? (
          <ProfileRename currentUsername={s.username} />
        ) : (
          <div className="text-xl font-bold mt-1">{s.username}</div>
        )}
        <div className="text-xs text-[var(--color-foreground)]/60 mt-3">
          Group <span className="font-mono">{group?.code}</span> · {group?.name}
        </div>
        <div className="text-[11px] text-[var(--color-foreground)]/50 mt-1">
          Logged in as: {s.kind === "admin" ? "admin" : "user"}
        </div>
      </Card>

      <form action={logoutAction}>
        <Button type="submit" variant="secondary" className="w-full">Log out</Button>
      </form>
    </main>
  );
}
