"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { togglePlanDayDoneAction } from "@/app/actions/plans";
import { t, type Locale } from "@/lib/i18n";

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year}`;
}

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
  outstandingDays: { planDay: number; label: string | null; date: string; ranges: string; done: boolean }[];
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
    <li className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition">
      <div className="flex items-start gap-3">
        <button
          onClick={() => toggle(props.todayPlanDay, optimisticToday)}
          disabled={pending || !props.todayRanges}
          aria-label={optimisticToday ? "Unmark today" : "Mark done today"}
          className={`mt-0.5 h-7 w-7 rounded-lg border-2 flex items-center justify-center transition shrink-0 ${
            optimisticToday
              ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg)]"
              : "border-[var(--border)] hover:border-[var(--accent)]"
          } ${!props.todayRanges ? "opacity-40" : ""}`}
        >
          {optimisticToday ? <span className="text-sm leading-none font-bold">✓</span> : null}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/plans/${props.planId}`} className="font-semibold text-[15px] hover:underline">
              {props.planName}
            </Link>
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md font-medium bg-purple-500/15 text-purple-600 dark:text-purple-300">
              {props.schedule === "progressing" ? tr("planLabel") : tr("dailyLabel")}
            </span>
            {props.schedule === "progressing" && (
              <span className="text-[10px] numeric px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--foreground-mute)]">
                {tr("dayOf", { n: props.todayPlanDay, total: String(props.totalDays ?? "?") })}
              </span>
            )}
          </div>

          {props.todayLabel && (
            <div className="text-sm mt-1 font-medium text-[var(--accent)]">{props.todayLabel}</div>
          )}

          {props.todayRanges ? (
            <div className="text-sm text-[var(--foreground-mute)] mt-0.5">
              {tr("yourUnitsToday", { unit: props.unitLabel })} <span className="numeric text-[var(--foreground)] font-medium">{props.todayRanges}</span>
            </div>
          ) : (
            <div className="text-sm text-[var(--foreground-mute)] mt-0.5">
              <Link href={`/plans/${props.planId}`} className="text-[var(--accent)] hover:underline">
                {tr("pickRangePrompt", { unit: props.unitLabel })}
              </Link>
            </div>
          )}

          {outstandingCount > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300"
            >
              📥 <span className="numeric font-medium">{outstandingCount}</span> {tr("toCatchUp")} {expanded ? "▴" : "▾"}
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
                    {d.label ?? formatDate(d.date)} — {props.unitLabel}s {d.ranges}
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
