"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label, Card } from "@/components/ui";
import { createPersonalTaskAction } from "@/app/actions/tasks";

export default function AddPersonalTask() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border-2 border-dashed border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)]/70 hover:bg-[var(--color-card)]"
      >
        + Add a personal task
      </button>
    );
  }

  function submit(fd: FormData) {
    setError(null);
    start(async () => {
      try {
        await createPersonalTaskAction(fd);
        setOpen(false);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <Card>
      <h2 className="font-semibold mb-1">New personal task</h2>
      <p className="text-xs text-[var(--color-foreground)]/60 mb-3">Only visible to you. No one else sees it on the leaderboard task list.</p>
      <form action={submit} className="space-y-3">
        <div>
          <Label htmlFor="ptitle">Title</Label>
          <Input id="ptitle" name="title" required maxLength={100} autoFocus />
        </div>
        <div>
          <Label htmlFor="pdescription">Description (optional)</Label>
          <textarea id="pdescription" name="description" rows={2}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pfrequency">Frequency</Label>
            <select id="pfrequency" name="frequency" defaultValue="daily"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <Label htmlFor="ptarget">Minimum per milestone</Label>
            <Input id="ptarget" name="target" type="number" min={1} max={50} defaultValue={1} />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button type="submit" disabled={pending}>{pending ? "Adding..." : "Add task"}</Button>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
