"use client";

import { useState } from "react";
import { createTaskAction } from "@/app/actions/tasks";
import { Button, Input, Label, Card } from "@/components/ui";

export default function AdminCreateTaskForm({ users }: { users: Array<{ id: string; username: string }> }) {
  const [frequency, setFrequency] = useState("daily");

  async function handleSubmit(formData: FormData) {
    if (frequency !== "once") {
      formData.set("target", formData.get("target") || "1");
    } else {
      formData.set("target", "1");
    }
    await createTaskAction(formData);
  }

  return (
    <Card className="mb-4">
      <h2 className="font-semibold mb-3">Add task</h2>
      <form action={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required maxLength={100} />
        </div>
        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <textarea
            id="description"
            name="description"
            rows={2}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <select
              id="frequency"
              name="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm"
            >
              <option value="once">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          {frequency !== "once" && (
            <div>
              <Label htmlFor="target">Minimum per milestone</Label>
              <Input id="target" name="target" type="number" min={1} max={50} defaultValue={1} />
            </div>
          )}
          {frequency === "once" && <input type="hidden" name="target" value="1" />}
        </div>
        <div>
          <Label htmlFor="assigneeUserId">Assign to</Label>
          <select
            id="assigneeUserId"
            name="assigneeUserId"
            defaultValue="all"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm"
          >
            <option value="all">Everyone</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="totalTarget">Long-term goal (optional)</Label>
          <Input id="totalTarget" name="totalTarget" type="number" min={1} placeholder="e.g. 604" />
          <p className="text-[11px] text-[var(--color-foreground)]/60 mt-1">
            Total completions across <em>all</em> milestones. Use for goals like &ldquo;read 604 pages of Quran&rdquo; that span many weeks. Leave blank for a
            normal weekly task.
          </p>
        </div>
        <div>
          <Label htmlFor="image">Image (optional)</Label>
          <input id="image" name="image" type="file" accept="image/*" className="text-sm w-full" />
        </div>
        <Button type="submit" className="w-full">
          Create task
        </Button>
      </form>
    </Card>
  );
}
