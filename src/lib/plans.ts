// Reading plan helpers. All "today" math is in the group's time zone.

export const GROUP_TIMEZONE = "America/New_York";

/** Today's date in the group time zone, as YYYY-MM-DD. */
export function todayInGroupTz(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: GROUP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now); // en-CA -> YYYY-MM-DD
}

/** Difference in calendar days between two YYYY-MM-DD strings. b - a. */
export function daysBetween(a: string, b: string): number {
  // Treat each as midnight UTC; difference in UTC days is the calendar
  // difference since both came from the same group-tz date formatter.
  const aD = new Date(`${a}T00:00:00Z`).getTime();
  const bD = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((bD - aD) / (24 * 60 * 60 * 1000));
}

/**
 * Plan day index (1-based) for a given calendar date.
 * Returns 0 or negative if before start.
 */
export function planDayForDate(startDate: string, dateStr: string): number {
  return daysBetween(startDate, dateStr) + 1;
}

/** Plan day for "today" in group tz. */
export function todayPlanDay(startDate: string): number {
  return planDayForDate(startDate, todayInGroupTz());
}

/**
 * Generate the label for a given plan day on a progressing schedule.
 * Template uses "{n}" as a placeholder for the integer.
 */
export function dayLabel(template: string, startAt: number, planDay: number): string {
  const n = startAt + (planDay - 1);
  return template.replaceAll("{n}", String(n));
}

/** Is the plan day in range for a progressing plan? */
export function isWithinSchedule(planDay: number, totalDays: number | null): boolean {
  if (totalDays == null) return planDay >= 1; // repeating: any day >= 1
  return planDay >= 1 && planDay <= totalDays;
}

/**
 * Given a list of allocation rows for one user and a plan day, return the
 * effective ranges for that day. Each allocation has from_day / to_day
 * (inclusive); to_day null means ongoing.
 */
export type AllocationRow = {
  id: string;
  start_unit: number;
  end_unit: number;
  from_day: number;
  to_day: number | null;
};

export function rangesActiveOnDay(allocs: AllocationRow[], planDay: number): AllocationRow[] {
  return allocs.filter(
    (a) => a.from_day <= planDay && (a.to_day === null || a.to_day >= planDay)
  );
}

/** Pretty-print a set of ranges, e.g. [{1,5},{7,9}] -> "1–5, 7–9". */
export function formatRanges(ranges: { start_unit: number; end_unit: number }[]): string {
  return ranges
    .slice()
    .sort((a, b) => a.start_unit - b.start_unit)
    .map((r) => (r.start_unit === r.end_unit ? `${r.start_unit}` : `${r.start_unit}–${r.end_unit}`))
    .join(", ");
}

/** Sum of units across a set of ranges. */
export function totalUnits(ranges: { start_unit: number; end_unit: number }[]): number {
  return ranges.reduce((sum, r) => sum + (r.end_unit - r.start_unit + 1), 0);
}
