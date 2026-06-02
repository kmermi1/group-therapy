import { createPlanAction } from "@/app/actions/plans";
import { Button, Input, Label, PageHeader, Card } from "@/components/ui";
import { todayInGroupTz } from "@/lib/plans";
import Link from "next/link";

export default function NewPlanPage() {
  const today = todayInGroupTz();
  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="New reading plan" />
      <form action={createPlanAction} className="space-y-4">
        <Card className="space-y-3">
          <div>
            <Label htmlFor="name">Plan name</Label>
            <Input id="name" name="name" required maxLength={80} placeholder="e.g. Quran — Ramadan 2026" />
          </div>
          <div>
            <Label htmlFor="schedule">Schedule</Label>
            <select id="schedule" name="schedule" defaultValue="progressing"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm">
              <option value="progressing">Progressing (e.g., Cüz 15, 16, 17 … over N days)</option>
              <option value="repeating">Repeating (same content every day, no end)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="startDate">Start date (NY local)</Label>
            <Input id="startDate" name="startDate" type="date" defaultValue={today} />
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Units</h2>
          <div>
            <Label htmlFor="unitLabel">Unit name</Label>
            <Input id="unitLabel" name="unitLabel" defaultValue="page" placeholder="page, bab, verse…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="unitsPerDay">Units per day</Label>
              <Input id="unitsPerDay" name="unitsPerDay" type="number" min={1} required placeholder="20" />
            </div>
            <div>
              <Label htmlFor="blockSize">Block size</Label>
              <Input id="blockSize" name="blockSize" type="number" min={1} defaultValue={1} />
              <p className="text-[11px] text-[var(--color-foreground)]/60 mt-1">Min chunk a member can claim. e.g. 5 for Jawshan blocks.</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Day labels <span className="text-xs font-normal text-[var(--color-foreground)]/60">(progressing only)</span></h2>
          <div>
            <Label htmlFor="dayLabelTemplate">Day label template</Label>
            <Input id="dayLabelTemplate" name="dayLabelTemplate" defaultValue="Cüz {n}" placeholder="Cüz {n}" />
            <p className="text-[11px] text-[var(--color-foreground)]/60 mt-1">Use <code>{"{n}"}</code> as the number placeholder.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startAt">Start at</Label>
              <Input id="startAt" name="startAt" type="number" defaultValue={1} />
            </div>
            <div>
              <Label htmlFor="totalDays">Total days</Label>
              <Input id="totalDays" name="totalDays" type="number" min={1} defaultValue={30} />
            </div>
          </div>
        </Card>

        <Button type="submit" className="w-full">Create plan</Button>
        <Link href="/admin/plans" className="block text-center text-sm text-[var(--color-foreground)]/60">Cancel</Link>
      </form>
    </main>
  );
}
