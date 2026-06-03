"use client";

import { useState } from "react";
import Link from "next/link";
import { editPlanAction } from "@/app/actions/plans";
import { Button, Input, Label, Card } from "@/components/ui";

type Props = {
  planId: string;
  plan: {
    id: string;
    name: string;
    start_date: string;
    schedule: string;
    unit_label: string;
    units_per_day: number;
    block_size: number;
    day_label_template: string | null;
    start_at: number | null;
    total_days: number | null;
  };
};

export default function EditPlanForm({ planId, plan }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isRepeating = plan.schedule === "repeating";
  const startDate = String(plan.start_date).slice(0, 10);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      await editPlanAction(formData);
    } catch (e) {
      setError((e as Error).message);
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="planId" value={planId} />

      {error && (
        <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 p-3">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </Card>
      )}

      <Card className="space-y-3">
        <div>
          <Label htmlFor="name">Plan name</Label>
          <Input id="name" name="name" required maxLength={80} defaultValue={plan.name} />
        </div>
        <div>
          <Label htmlFor="startDate">Start date (NY local)</Label>
          <Input id="startDate" name="startDate" type="date" defaultValue={startDate} />
        </div>
      </Card>

      {isRepeating && (
        <Card className="space-y-3">
          <h2 className="font-semibold">Units</h2>
          <div>
            <Label htmlFor="unitLabel">Unit name</Label>
            <Input id="unitLabel" name="unitLabel" defaultValue={plan.unit_label} placeholder="page, bab, verse…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="unitsPerDay">Units per day</Label>
              <Input id="unitsPerDay" name="unitsPerDay" type="number" min={1} defaultValue={plan.units_per_day} />
            </div>
            <div>
              <Label htmlFor="blockSize">Block size</Label>
              <Input id="blockSize" name="blockSize" type="number" min={1} defaultValue={plan.block_size} />
            </div>
          </div>
          <p className="text-[11px] text-[var(--foreground-mute)]">
            Units per day must be a multiple of block size (e.g., 100 units ÷ 5 block size = 20 blocks). Lowering units per day will release allocations that fall outside the new range.
          </p>
        </Card>
      )}

      {plan.schedule === "progressing" && (
        <>
          <Card className="space-y-3">
            <h2 className="font-semibold">Day labels</h2>
            <div>
              <Label htmlFor="dayLabelTemplate">Day label template</Label>
              <Input
                id="dayLabelTemplate"
                name="dayLabelTemplate"
                defaultValue={plan.day_label_template ?? "Day {n}"}
              />
              <p className="text-[11px] text-[var(--foreground-mute)] mt-1">
                Use <code>{"{n}"}</code> as the number placeholder.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="startAt">Start at</Label>
                <Input id="startAt" name="startAt" type="number" defaultValue={plan.start_at ?? 1} />
              </div>
              <div>
                <Label htmlFor="totalDays">Total days</Label>
                <Input id="totalDays" name="totalDays" type="number" min={1} defaultValue={plan.total_days ?? 30} />
              </div>
            </div>
          </Card>
          <p className="text-[11px] text-[var(--foreground-mute)]">
            For progressing plans, <em>units per day</em> and <em>block size</em> are locked once members have allocations. To change those, clone the plan instead.
          </p>
        </>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving..." : "Save changes"}
      </Button>
      <Link href={`/plans/${plan.id}`} className="block text-center text-sm text-[var(--foreground-mute)]">
        Cancel
      </Link>
    </form>
  );
}
