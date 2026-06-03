import { createGroupAction } from "@/app/actions/auth";
import { Button, Input, Label, PageHeader } from "@/components/ui";
import Link from "next/link";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getDefaultDate(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function CreateGroupPage() {
  return (
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-8">
      <PageHeader title="Create a group" subtitle="You'll be the admin. Share the group code with friends to invite them." />
      <form action={createGroupAction} className="space-y-4">
        <div>
          <Label htmlFor="groupName">Group name</Label>
          <Input id="groupName" name="groupName" required maxLength={60} placeholder="e.g. Tuesday Crew" />
        </div>
        <div>
          <Label htmlFor="milestoneStartDate">Milestone start date</Label>
          <Input
            id="milestoneStartDate"
            name="milestoneStartDate"
            type="date"
            defaultValue={getDefaultDate()}
            required
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-sm"
          />
          <p className="text-xs text-[var(--color-foreground)]/60 mt-1">The date your first milestone begins.</p>
        </div>
        <div>
          <Label htmlFor="startDay">Default milestone reset day</Label>
          <select
            id="startDay"
            name="startDay"
            defaultValue={3}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-sm"
          >
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <p className="text-xs text-[var(--color-foreground)]/60 mt-1">Milestones auto-roll on this weekday if you don&apos;t reset manually.</p>
        </div>
        <div>
          <Label htmlFor="adminUsername">Admin username</Label>
          <Input id="adminUsername" name="adminUsername" required maxLength={40} />
        </div>
        <div>
          <Label htmlFor="adminPassword">Admin password</Label>
          <Input id="adminPassword" name="adminPassword" type="password" required minLength={6} />
        </div>
        <Button type="submit" className="w-full">Create group</Button>
        <Link href="/" className="block text-center text-sm text-[var(--color-foreground)]/60 mt-2">Cancel</Link>
      </form>
    </main>
  );
}
