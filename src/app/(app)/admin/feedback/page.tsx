import { requireAdmin } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { toggleFeedbackResolvedAction } from "@/app/actions/feedback";

export default async function FeedbackPage() {
  const admin = await requireAdmin();
  const sb = createAdminClient();
  const { data: items } = await sb
    .from("feedback")
    .select("id, message, is_anonymous, resolved, created_at, from_user_id, from_admin_id, users(username), admins(username)")
    .eq("group_id", admin.groupId)
    .order("created_at", { ascending: false })
    .limit(200);

  type Row = NonNullable<typeof items>[number];
  const getSender = (it: Row) => {
    if (it.is_anonymous) return "anonymous";
    const u = Array.isArray(it.users) ? it.users[0] : it.users;
    const a = Array.isArray(it.admins) ? it.admins[0] : it.admins;
    if (u?.username) return `${u.username} (member)`;
    if (a?.username) return `${a.username} (admin)`;
    return "anonymous";
  };

  const open = (items ?? []).filter((i) => !i.resolved);
  const resolved = (items ?? []).filter((i) => i.resolved);

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="Feedback inbox" subtitle="Messages from members and co-admins." />

      {(items ?? []).length === 0 && (
        <p className="text-sm text-[var(--color-foreground)]/60">No feedback yet.</p>
      )}

      {open.length > 0 && (
        <>
          <h2 className="text-xs uppercase tracking-wide text-[var(--color-foreground)]/60 mb-2">Open ({open.length})</h2>
          <div className="space-y-3 mb-6">
            {open.map((it) => (
              <Card key={it.id}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-medium">{getSender(it)}</span>
                  <span className="text-[10px] text-[var(--color-foreground)]/50">{new Date(it.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{it.message}</p>
                <form action={toggleFeedbackResolvedAction} className="mt-2">
                  <input type="hidden" name="id" value={it.id} />
                  <button className="text-xs text-[var(--color-accent)] underline">Mark resolved</button>
                </form>
              </Card>
            ))}
          </div>
        </>
      )}

      {resolved.length > 0 && (
        <>
          <h2 className="text-xs uppercase tracking-wide text-[var(--color-foreground)]/60 mb-2">Resolved ({resolved.length})</h2>
          <div className="space-y-3">
            {resolved.map((it) => (
              <Card key={it.id} className="opacity-60">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-medium">{getSender(it)}</span>
                  <span className="text-[10px] text-[var(--color-foreground)]/50">{new Date(it.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{it.message}</p>
                <form action={toggleFeedbackResolvedAction} className="mt-2">
                  <input type="hidden" name="id" value={it.id} />
                  <button className="text-xs text-[var(--color-foreground)]/60 underline">Reopen</button>
                </form>
              </Card>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
