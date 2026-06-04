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
  const [optimistic, setOptimistic] = useState(done);
  const [pending, start] = useTransition();

  function toggle() {
    const newState = !optimistic;
    setOptimistic(newState);
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("forDate", forDate);
    start(async () => {
      try {
        await toggleCompletionAction(fd);
      } catch (e) {
        // Revert optimistic state on error
        setOptimistic(!newState);
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
          optimistic
            ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-accent-fg)]"
            : "border-[var(--color-border)]"
        }`}
        aria-label={optimistic ? "Unmark this day" : "Mark this day done"}
      >
        {optimistic ? "✓" : ""}
      </button>
      <span className={`flex-1 ${optimistic ? "line-through opacity-60" : ""}`}>{title}</span>
      <span className="text-[10px] uppercase tracking-wide text-[var(--color-foreground)]/50">{frequency}</span>
    </li>
  );
}
