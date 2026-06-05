import { requireAdmin } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader, Card, Button, Input, Label } from "@/components/ui";
import Link from "next/link";
import AdminResetCodeForm from "./AdminResetCodeForm";
import { updateMilestoneSettingsAction } from "@/app/actions/tasks";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function formatDateForInput(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const sb = createAdminClient();

  const { data: admins } = await sb
    .from("admins")
    .select("id, username, created_at")
    .eq("group_id", admin.groupId)
    .order("created_at", { ascending: false });

  const { data: group } = await sb
    .from("groups")
    .select("milestone_started_at, default_start_day")
    .eq("id", admin.groupId)
    .single();

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="Admin Settings" subtitle="Manage group and admin settings" />

      <Card className="space-y-4 mb-6">
        <h2 className="font-semibold">Milestone Settings</h2>
        <form action={updateMilestoneSettingsAction} className="space-y-3">
          <div>
            <Label htmlFor="milestoneStartDate">Milestone start date</Label>
            <Input
              id="milestoneStartDate"
              name="milestoneStartDate"
              type="date"
              defaultValue={group ? formatDateForInput(new Date(group.milestone_started_at)) : ""}
              required
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-sm"
            />
            <p className="text-xs text-[var(--color-foreground)]/60 mt-1">When the current milestone started.</p>
          </div>
          <div>
            <Label htmlFor="startDay">Reset day</Label>
            <select
              id="startDay"
              name="startDay"
              defaultValue={group?.default_start_day ?? 3}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-sm"
            >
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
            <p className="text-xs text-[var(--color-foreground)]/60 mt-1">Milestones auto-roll on this weekday if you don&apos;t reset manually.</p>
          </div>
          <div>
            <Label htmlFor="timezone">Group timezone</Label>
            <select
              id="timezone"
              name="timezone"
              defaultValue={group?.timezone ?? "America/New_York"}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-sm"
            >
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
            <p className="text-xs text-[var(--color-foreground)]/60 mt-1">Used for task dates and reading plan calculations.</p>
          </div>
          <Button type="submit" className="w-full">Update settings</Button>
        </form>
      </Card>

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
