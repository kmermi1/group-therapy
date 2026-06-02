"use client";

import { toggleCompletionAction, archivePersonalTaskAction } from "@/app/actions/tasks";
import { useState, useTransition } from "react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  frequency: "daily" | "weekly";
};

export default function TaskRow({
  task,
  doneToday,
  count,
  target,
  isLongTerm,
  forDate,
  imageUrl,
  badgeText,
  badgeClass,
  canDelete,
}: {
  task: Task;
  doneToday: boolean;
  count: number;
  target: number;
  isLongTerm?: boolean;
  forDate: string;
  imageUrl?: string;
  badgeText: string;
  badgeClass: string;
  canDelete?: boolean;
}) {
  const [optimisticDone, setOptimisticDone] = useState(doneToday);
  const [optimisticCount, setOptimisticCount] = useState(count);
  const [pending, start] = useTransition();
  const [showImage, setShowImage] = useState(false);

  const metTarget = optimisticCount >= target;

  function onToggle() {
    const willBeDone = !optimisticDone;
    setOptimisticDone(willBeDone);
    setOptimisticCount((c) => Math.max(0, willBeDone ? c + 1 : c - 1));
    const fd = new FormData();
    fd.set("taskId", task.id);
    fd.set("forDate", forDate);
    start(async () => {
      try { await toggleCompletionAction(fd); }
      catch {
        setOptimisticDone(!willBeDone);
        setOptimisticCount((c) => (willBeDone ? c - 1 : c + 1));
      }
    });
  }

  function onDelete() {
    if (!confirm(`Delete "${task.title}"?`)) return;
    const fd = new FormData();
    fd.set("taskId", task.id);
    start(async () => {
      try { await archivePersonalTaskAction(fd); } catch {}
    });
  }

  return (
    <li className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          disabled={pending}
          aria-label={optimisticDone ? "Unmark today" : "Mark done today"}
          className={`mt-0.5 h-7 w-7 rounded-md border-2 flex items-center justify-center transition ${
            optimisticDone
              ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-accent-fg)]"
              : "border-[var(--color-border)]"
          }`}
        >
          {optimisticDone ? "✓" : ""}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-semibold ${metTarget ? "line-through opacity-60" : ""}`}>
              {task.title}
            </h3>
            <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${badgeClass}`}>
              {badgeText}
            </span>
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--color-border)]/60">
              {task.frequency}
            </span>
            {(target > 1 || isLongTerm) && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${metTarget ? "bg-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-[var(--color-border)]/60"}`}>
                {optimisticCount}/{target}{isLongTerm ? " all-time" : ""}
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-[var(--color-foreground)]/70 mt-1">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {imageUrl && (
              <button type="button" onClick={() => setShowImage((v) => !v)} className="text-xs text-[var(--color-accent)]">
                {showImage ? "Hide image" : "View image"}
              </button>
            )}
            {canDelete && (
              <button type="button" onClick={onDelete} className="text-xs text-red-500">
                Delete
              </button>
            )}
            <span className="text-[11px] text-[var(--color-foreground)]/50 ml-auto">
              {optimisticDone ? "Done today" : "Not done today"}
            </span>
          </div>
          {imageUrl && showImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={task.title} className="mt-2 w-full rounded-lg" />
          )}
        </div>
      </div>
    </li>
  );
}
