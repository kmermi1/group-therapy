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
    <li
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
      style={{ boxShadow: "var(--shadow-paper)" }}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => toggle(props.todayPlanDay, optimisticToday)}
          disabled={pending || !props.todayRanges}
          aria-label={optimisticToday ? "Unmark today" : "Mark done today"}
          className={`mt-0.5 h-8 w-8 rounded-full border flex items-center justify-center transition shrink-0 ${
            optimisticToday
              ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg)] shadow-[0_2px_8px_-3px_rgba(45,106,79,0.55)]"
              : "border-[var(--border)] bg-[var(--paper-deep)]"
          } ${!props.todayRanges ? "opacity-40" : ""}`}
        >
          {optimisticToday ? <span className="text-[14px] leading-none">✓</span> : null}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/plans/${props.planId}`} className="display text-[16px] tracking-tight hover:underline underline-offset-2">
              {props.planName}
            </Link>
            <span className="text-[9px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full bg-[var(--gold-soft)] text-[var(--gold)]">
              {props.schedule === "progressing" ? tr("planLabel") : tr("dailyLabel")}
            </span>
            {props.schedule === "progressing" && (
              <span className="text-[10px] numeric px-2 py-0.5 rounded-full bg-[var(--paper-deep)] text-[var(--foreground-mute)]">
                {tr("dayOf", { n: props.todayPlanDay, total: String(props.totalDays ?? "?") })}
              </span>
            )}
          </div>

          {props.todayLabel && (
            <div className="display italic text-[14px] mt-1 text-[var(--accent)]">{props.todayLabel}</div>
          )}

          {props.todayRanges ? (
            <div className="text-[13px] text-[var(--foreground-mute)] mt-0.5">
              {tr("yourUnitsToday", { unit: props.unitLabel })} <span className="numeric text-[var(--foreground)]">{props.todayRanges}</span>
            </div>
          ) : (
            <div className="text-[13px] text-[var(--foreground-mute)] mt-0.5 italic">
              <Link href={`/plans/${props.planId}`} className="underline underline-offset-2">
                {tr("pickRangePrompt", { unit: props.unitLabel })}
              </Link>
            </div>
          )}

          {outstandingCount > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[var(--gold-soft)] text-[var(--gold)]"
            >
              <span className="numeric">{outstandingCount}</span> {tr("toCatchUp")} {expanded ? "▴" : "▾"}
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
