"use client";

import { useState } from "react";
import { editTaskAction } from "@/app/actions/tasks";
import { Button, Input, Label, Card } from "@/components/ui";

type Task = {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  target_per_milestone: number;
  assignee_user_id: string | null;
  total_target: number | null;
  image_path: string | null;
};

export default function AdminEditTaskForm({
  task,
  users,
}: {
  task: Task;
  users: Array<{ id: string; username: string }>;
}) {
  const [frequency, setFrequency] = useState(task.frequency);

  async function handleSubmit(formData: FormData) {
    if (frequency !== "once") {
      formData.set("target", formData.get("target") || "1");
    } else {
      formData.set("target", "1");
    }
    await editTaskAction(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="taskId" value={task.id} />

      <Card className="space-y-3">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required maxLength={100} defaultValue={task.title} />
        </div>
        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={task.description ?? ""}
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
              <Input id="target" name="target" type="number" min={1} max={50} defaultValue={task.target_per_milestone} />
            </div>
          )}
          {frequency === "once" && <input type="hidden" name="target" value="1" />}
        </div>
        <div>
          <Label htmlFor="assigneeUserId">Assign to</Label>
          <select
            id="assigneeUserId"
            name="assigneeUserId"
            defaultValue={task.assignee_user_id ?? "all"}
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
          <Input
            id="totalTarget"
            name="totalTarget"
            type="number"
            min={1}
            defaultValue={task.total_target ?? ""}
            placeholder="leave blank for normal weekly task"
          />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold mb-2">Image</h2>
        {task.image_path ? (
          <p className="text-xs text-[var(--color-foreground)]/60 mb-2">
            Current: <code className="break-all">{task.image_path}</code>
          </p>
        ) : (
          <p className="text-xs text-[var(--color-foreground)]/60 mb-2">No image attached.</p>
        )}
        <Label htmlFor="image">Replace image (optional)</Label>
        <input id="image" name="image" type="file" accept="image/*" className="text-sm w-full" />
        {task.image_path && (
          <label className="flex items-center gap-2 mt-2 text-sm">
            <input type="checkbox" name="removeImage" />
            Remove existing image
          </label>
        )}
      </Card>

      <Button type="submit" className="w-full">
        Save changes
      </Button>
    </form>
  );
}
