"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { togglePlanDayDoneAction } from "@/app/actions/plans";
import { t, type Locale } from "@/lib/i18n";

export type PlanCardProps = {
  planId: string;
  planName: string;
  schedule: "progressing" | "repeating";
  unitLabel: string;
  todayPlanDay: number;
  totalDays: number | null;
  todayLabel: string | null;
  todayRanges: string | null;
  doneToday: boolean;
  outstandingDays: { planDay: number; label: string | null; ranges: string; done: boolean }[];
  locale: Locale;
};

export default function PlanCard(props: PlanCardProps) {
  const tr = (k: Parameters<typeof t>[0], p?: Record<string, string | number>) => t(k, props.locale, p);
  const [pending, start] = useTransition();
  const [optimisticToday, setOptimisticToday] = useState(props.doneToday);
  const [optimisticOutstanding, setOptimisticOutstanding] = useState(props.outstandingDays);
  const [expanded, setExpanded] = useState(false);

  function toggle(planDay: number, currentlyDone: boolean) {
    const fd = new FormData();
    fd.set("planId", props.planId);
    fd.set("planDay", String(planDay));
    start(async () => {
      try { await togglePlanDayDoneAction(fd); }
      catch {}
    });
    if (planDay === props.todayPlanDay) {
      setOptimisticToday(!currentlyDone);
    } else {
      setOptimisticOutstanding((arr) =>
        arr.map((d) => (d.planDay === planDay ? { ...d, done: !currentlyDone } : d))
      );
    }
  }

  const outstandingCount = optimisticOutstanding.filter((d) => !d.done).length;

  return (
    <li className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <div className="flex items-start gap-3">
        <button
          onClick={() => toggle(props.todayPlanDay, optimisticToday)}
          disabled={pending || !props.todayRanges}
          aria-label={optimisticToday ? "Unmark today" : "Mark done today"}
          className={`mt-0.5 h-7 w-7 rounded-md border-2 flex items-center justify-center transition shrink-0 ${
            optimisticToday
              ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-accent-fg)]"
              : "border-[var(--color-border)]"
          } ${!props.todayRanges ? "opacity-40" : ""}`}
        >
          {optimisticToday ? "✓" : ""}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/plans/${props.planId}`} className="font-semibold hover:underline">
              {props.planName}
            </Link>
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300">
              {props.schedule === "progressing" ? tr("planLabel") : tr("dailyLabel")}
            </span>
            {props.schedule === "progressing" && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-border)]/60">
                {tr("dayOf", { n: props.todayPlanDay, total: String(props.totalDays ?? "?") })}
              </span>
            )}
          </div>

          {props.todayLabel && (
            <div className="text-sm mt-1">{props.todayLabel}</div>
          )}

          {props.todayRanges ? (
            <div className="text-sm text-[var(--color-foreground)]/80 mt-0.5">
              {tr("yourUnitsToday", { unit: props.unitLabel })} <span className="font-semibold">{props.todayRanges}</span>
            </div>
          ) : (
            <div className="text-sm text-[var(--color-foreground)]/60 mt-0.5">
              <Link href={`/plans/${props.planId}`} className="underline">
                {tr("pickRangePrompt", { unit: props.unitLabel })}
              </Link>
            </div>
          )}

          {outstandingCount > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300"
            >
              📥 {outstandingCount} {tr("toCatchUp")} {expanded ? "▴" : "▾"}
            </button>
          )}

          {expanded && outstandingCount > 0 && (
            <ul className="mt-2 space-y-1.5">
              {optimisticOutstanding.filter((d) => !d.done).map((d) => (
                <li key={d.planDay} className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => toggle(d.planDay, d.done)}
                    disabled={pending}
                    aria-label="Mark this day done"
                    className="h-5 w-5 rounded border-2 border-[var(--color-border)] flex items-center justify-center shrink-0"
                  >
                    {d.done ? "✓" : ""}
                  </button>
                  <span className="flex-1 text-[var(--color-foreground)]/80">
                    {d.label ?? `Day ${d.planDay}`} — {props.unitLabel}s {d.ranges}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
