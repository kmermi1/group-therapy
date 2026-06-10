"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label, Card } from "@/components/ui";
import { createPersonalTaskAction } from "@/app/actions/tasks";
import { t, type Locale } from "@/lib/i18n";

export default function AddPersonalTask({ locale }: { locale: Locale }) {
  const tr = (k: Parameters<typeof t>[0]) => t(k, locale);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [frequency, setFrequency] = useState("daily");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border-2 border-dashed border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)]/70 hover:bg-[var(--color-card)]"
      >
        {tr("addPersonalTask")}
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
      <h2 className="font-semibold mb-1">{tr("newPersonalTask")}</h2>
      <p className="text-xs text-[var(--color-foreground)]/60 mb-3">{tr("personalTaskNote")}</p>
      <form action={submit} className="space-y-3">
        <div>
          <Label htmlFor="ptitle">{tr("title")}</Label>
          <Input id="ptitle" name="title" required maxLength={100} autoFocus />
        </div>
        <div>
          <Label htmlFor="pdescription">{tr("description")}</Label>
          <textarea id="pdescription" name="description" rows={2}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm outline-none" />
        </div>
        <div>
          <Label htmlFor="pfrequency">{tr("frequency")}</Label>
          <select
            id="pfrequency"
            name="frequency"
            defaultValue="daily"
            value={frequency}
            onChange={(e) => setFrequency(e.currentTarget.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm"
          >
            <option value="once">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        {frequency !== "once" ? (
          <div>
            <Label htmlFor="ptarget">{tr("minimumPerMilestone")}</Label>
            <Input id="ptarget" name="target" type="number" min={1} max={50} defaultValue={1} />
          </div>
        ) : (
          <input type="hidden" name="target" value="1" />
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button type="submit" disabled={pending}>{pending ? tr("adding") : tr("addTask")}</Button>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>{tr("cancel")}</Button>
        </div>
      </form>
    </Card>
  );
}
