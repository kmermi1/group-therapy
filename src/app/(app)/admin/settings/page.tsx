import { requireAdmin } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import Link from "next/link";
import AdminResetCodeForm from "./AdminResetCodeForm";

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const sb = createAdminClient();

  const { data: admins } = await sb
    .from("admins")
    .select("id, username, created_at")
    .eq("group_id", admin.groupId)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="Admin Settings" subtitle="Manage admin credentials" />

      <Card className="space-y-3 mb-6">
        <h2 className="font-semibold">Group Admins</h2>
        <p className="text-xs text-[var(--color-foreground)]/60">
          Generate a password reset code for an admin to help them recover their account.
        </p>
        <div className="space-y-2">
          {(admins ?? []).map((a) => (
            <AdminResetCodeForm
              key={a.id}
              adminId={a.id}
              username={a.username}
              createdAt={new Date(a.created_at).toLocaleDateString()}
            />
          ))}
        </div>
      </Card>

      <div>
        <Link href="/admin" className="block text-center text-sm text-[var(--color-foreground)]/60">
          Back to admin panel
        </Link>
      </div>
    </main>
  );
}
