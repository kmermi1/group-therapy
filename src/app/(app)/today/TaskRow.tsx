"use client";

import { toggleCompletionAction, archivePersonalTaskAction } from "@/app/actions/tasks";
import { useState, useTransition } from "react";
import { t, type Locale } from "@/lib/i18n";

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
  locale,
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
  locale: Locale;
}) {
  const tr = (k: Parameters<typeof t>[0]) => t(k, locale);
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
    <li
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
      style={{ boxShadow: "var(--shadow-paper)" }}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          disabled={pending}
          aria-label={optimisticDone ? "Unmark today" : "Mark done today"}
          className={`mt-0.5 h-8 w-8 rounded-full border flex items-center justify-center transition shrink-0 ${
            optimisticDone
              ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg)] shadow-[0_2px_8px_-3px_rgba(45,106,79,0.55)]"
              : "border-[var(--border)] bg-[var(--paper-deep)]"
          }`}
        >
          {optimisticDone ? <span className="text-[14px] leading-none">✓</span> : null}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`display text-[16px] tracking-tight ${metTarget ? "line-through opacity-60" : ""}`}>
              {task.title}
            </h3>
            <span className={`text-[9px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full ${badgeClass}`}>
              {badgeText}
            </span>
            {(target > 1 || isLongTerm) && (
              <span className={`text-[10px] numeric px-2 py-0.5 rounded-full ${metTarget ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-[var(--paper-deep)] text-[var(--foreground-mute)]"}`}>
                {optimisticCount}/{target}{isLongTerm ? ` · ${tr("allTime")}` : ""}
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-[13px] text-[var(--foreground-mute)] mt-1 leading-relaxed italic">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2.5">
            {imageUrl && (
              <button type="button" onClick={() => setShowImage((v) => !v)} className="text-[11px] text-[var(--accent)] underline-offset-2 hover:underline">
                {showImage ? tr("hideImage") : tr("viewImage")}
              </button>
            )}
            {canDelete && (
              <button type="button" onClick={onDelete} className="text-[11px] text-[#a8412e] underline-offset-2 hover:underline">
                {tr("delete")}
              </button>
            )}
            <span className="text-[10px] text-[var(--foreground-mute)] ml-auto tracking-[0.08em] uppercase">
              {optimisticDone ? tr("doneToday") : tr("notDoneToday")}
            </span>
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
