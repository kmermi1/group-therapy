"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label, Card } from "@/components/ui";
import { editPersonalTaskAction } from "@/app/actions/tasks";
import { t, type Locale } from "@/lib/i18n";
import FrequencySelect from "./FrequencySelect";

type Task = {
  id: string;
  title: string;
  description: string | null;
  frequency: "once" | "daily" | "weekly";
  target_per_milestone: number;
  deadline?: string | null;
  image_path?: string | null;
};

export default function EditPersonalTask({ task, locale, onClose }: { task: Task; locale: Locale; onClose: () => void }) {
  const tr = (k: Parameters<typeof t>[0]) => t(k, locale);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<string>(task.frequency);

  function submit(fd: FormData) {
    fd.set("taskId", task.id);
    setError(null);
    start(async () => {
      try {
        await editPersonalTaskAction(fd);
        onClose();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <Card>
      <h2 className="font-semibold mb-1">Edit Task</h2>
      <form action={submit} className="space-y-3">
        <div>
          <Label htmlFor="etitle">{tr("title")}</Label>
          <Input id="etitle" name="title" required maxLength={100} defaultValue={task.title} autoFocus />
        </div>
        <div>
          <Label htmlFor="edescription">{tr("description")}</Label>
          <textarea
            id="edescription"
            name="description"
            rows={2}
            defaultValue={task.description || ""}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm outline-none"
          />
        </div>
        <div>
          <Label htmlFor="efrequency">{tr("frequency")}</Label>
          <FrequencySelect value={frequency} onChange={setFrequency} />
        </div>
        {frequency !== "once" ? (
          <div>
            <Label htmlFor="etarget">{tr("minimumPerMilestone")}</Label>
            <Input id="etarget" name="target" type="number" min={1} max={50} defaultValue={task.target_per_milestone} />
          </div>
        ) : (
          <>
            <input type="hidden" name="target" value="1" />
            <div>
              <Label htmlFor="edeadline">Deadline (optional)</Label>
              <Input id="edeadline" name="deadline" type="date" defaultValue={task.deadline ?? ""} />
            </div>
          </>
        )}
        <div>
          <Label htmlFor="eimage">Image (optional)</Label>
          {task.image_path ? (
            <p className="text-xs text-[var(--color-foreground)]/60 mb-2">
              An image is already attached. Upload a new one to replace, or check the box below to remove.
            </p>
          ) : (
            <p className="text-xs text-[var(--color-foreground)]/60 mb-2">PNG, JPG, WEBP, or GIF. Max 5MB.</p>
          )}
          <input id="eimage" name="image" type="file" accept="image/*" className="text-sm w-full" />
          {task.image_path && (
            <label className="flex items-center gap-2 mt-2 text-sm">
              <input type="checkbox" name="removeImage" />
              Remove existing image
            </label>
          )}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>{tr("cancel")}</Button>
        </div>
      </form>
    </Card>
  );
}
