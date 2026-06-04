"use client";

import { useState, useTransition } from "react";
import { toggleCompletionAction } from "@/app/actions/tasks";

export default function HistoryDayRow({
  taskId,
  title,
  frequency,
  forDate,
  done,
}: {
  taskId: string;
  title: string;
  frequency: string;
  forDate: string;
  done: boolean;
}) {
  const [isDone, setIsDone] = useState(done);
  const [pending, start] = useTransition();

  function toggle() {
    const newState = !isDone;
    setIsDone(newState);
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("forDate", forDate);
    start(async () => {
      try {
        await toggleCompletionAction(fd);
        // After action completes, state should update from revalidatePath
      } catch (e) {
        // Revert on error
        setIsDone(!newState);
        console.error("Failed to toggle completion:", e);
      }
    });
  }

  return (
    <li className="flex items-center gap-3 text-sm">
      <button
        onClick={toggle}
        disabled={pending}
        className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${
          isDone
            ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-accent-fg)]"
            : "border-[var(--color-border)]"
        }`}
        aria-label={isDone ? "Unmark this day" : "Mark this day done"}
      >
        {isDone ? "✓" : ""}
      </button>
      <span className={`flex-1 ${isDone ? "line-through opacity-60" : ""}`}>{title}</span>
      <span className="text-[10px] uppercase tracking-wide text-[var(--color-foreground)]/50">{frequency}</span>
    </li>
  );
}
