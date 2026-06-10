"use client";

import { toggleCompletionAction, archivePersonalTaskAction } from "@/app/actions/tasks";
import { useState, useTransition, useEffect } from "react";
import { t, type Locale } from "@/lib/i18n";

type Task = {
  id: string;
  title: string;
  description: string | null;
  frequency: "once" | "daily" | "weekly";
  deadline?: string | null;
};

export default function TaskRow({
  task,
  doneToday,
  count,
  target,
  isLongTerm,
  isWeekly,
  doneThisWeek,
  forDate,
  imageUrl,
  badgeText,
  badgeClass,
  canDelete,
  locale,
  onEdit,
}: {
  task: Task;
  doneToday: boolean;
  count: number;
  target: number;
  isLongTerm?: boolean;
  isWeekly?: boolean;
  doneThisWeek?: boolean;
  forDate: string;
  imageUrl?: string;
  badgeText: string;
  badgeClass: string;
  canDelete?: boolean;
  locale: Locale;
  onEdit?: (task: Task) => void;
}) {
  const tr = (k: Parameters<typeof t>[0]) => t(k, locale);
  const [optimisticDone, setOptimisticDone] = useState(doneToday);
  const [optimisticCount, setOptimisticCount] = useState(count);
  const [pending, start] = useTransition();
  const [showImage, setShowImage] = useState(false);

  const metTarget = optimisticCount >= target;
  const isDone = optimisticDone;

  // Compute deadline status for one-time tasks
  let deadlineBadge: React.ReactNode = null;
  if (task.frequency === "once" && task.deadline && !isDone) {
    const deadlineDate = task.deadline;
    const isOverdue = deadlineDate < forDate;
    const isDueToday = deadlineDate === forDate;
    const dateLabel = new Date(deadlineDate + "T00:00:00").toLocaleDateString();
    if (isOverdue) {
      deadlineBadge = (
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/15 text-red-600 dark:text-red-300">
          ⚠ Overdue {dateLabel}
        </span>
      );
    } else if (isDueToday) {
      deadlineBadge = (
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300">
          📅 Due today
        </span>
      );
    } else {
      deadlineBadge = (
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-500/15 text-slate-600 dark:text-slate-300">
          📅 Due {dateLabel}
        </span>
      );
    }
  }

  // Sync optimistic state with server props when transition completes
  useEffect(() => {
    if (!pending) {
      setOptimisticDone(doneToday);
      setOptimisticCount(count);
    }
  }, [pending]);

  function onToggle() {
    const willBeDone = !optimisticDone;
    setOptimisticDone(willBeDone);
    setOptimisticCount((c) => Math.max(0, willBeDone ? c + 1 : c - 1));
    const fd = new FormData();
    fd.set("taskId", task.id);
    fd.set("forDate", forDate);
    start(async () => {
      try {
        await toggleCompletionAction(fd);
      }
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
    <li className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition">
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          disabled={pending}
          aria-label={optimisticDone ? "Unmark today" : "Mark done today"}
          className={`mt-0.5 h-7 w-7 rounded-lg border-2 flex items-center justify-center transition shrink-0 ${
            optimisticDone
              ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg)]"
              : "border-[var(--border)] hover:border-[var(--accent)]"
          }`}
        >
          {optimisticDone ? <span className="text-sm leading-none font-bold">✓</span> : null}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-semibold text-[15px] ${task.frequency !== "once" && isDone ? "line-through opacity-50" : ""}`}>
              {task.title}
            </h3>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md font-medium ${badgeClass}`}>
              {badgeText}
            </span>
            {task.frequency === "once" && (
              <span className={`text-[10px] px-2 py-0.5 rounded-md ${isDone ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-slate-500/15 text-slate-600 dark:text-slate-300"}`}>
                {isDone ? "✓ Done" : "⊙ Pending"}
              </span>
            )}
            {deadlineBadge}
            {task.frequency !== "once" && (target > 1 || isLongTerm) && (
              <span className={`text-[10px] numeric px-2 py-0.5 rounded-md ${metTarget ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-[var(--surface)] text-[var(--foreground-mute)]"}`}>
                {optimisticCount}/{target}{isLongTerm ? ` ${tr("allTime")}` : ""}
              </span>
            )}
            {task.frequency !== "once" && target === 1 && isDone && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                ✓ Done today
              </span>
            )}
            {task.frequency !== "once" && target === 1 && !isDone && isWeekly && doneThisWeek && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-500/15 text-slate-600 dark:text-slate-300">
                ✓ Done this week
              </span>
            )}
            {task.frequency !== "once" && target === 1 && !isDone && !isWeekly && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300">
                ⚠ Need today
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-[var(--foreground-mute)] mt-1 leading-relaxed">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {imageUrl && (
              <button type="button" onClick={() => setShowImage((v) => !v)} className="text-xs text-[var(--accent)] hover:underline">
                {showImage ? tr("hideImage") : tr("viewImage")}
              </button>
            )}
            <span className="text-[11px] text-[var(--foreground-mute)]">
              {optimisticDone ? tr("doneToday") : tr("notDoneToday")}
            </span>
            <div className="ml-auto flex items-center gap-4">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  aria-label="Edit task"
                  className="p-1.5 rounded-md text-[var(--foreground-mute)] hover:text-[var(--accent)] hover:bg-[var(--surface)] transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label="Delete task"
                  className="p-1.5 rounded-md text-[var(--foreground-mute)] hover:text-[var(--danger)] hover:bg-[var(--surface)] transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22m-7 0V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {imageUrl && showImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={task.title} className="mt-2 w-full rounded-xl border border-[var(--border)]" />
          )}
        </div>
      </div>
    </li>
  );
}
