// Milestone math. A milestone is a span of time the admin tracks against.
// If the admin doesn't manually reset, the milestone auto-rolls each week
// on the group's default_start_day (0 = Sun ... 6 = Sat).

export function effectiveMilestoneStart(
  storedStart: Date,
  defaultStartDay: number,
  now: Date = new Date(),
  groupTimezone: string = "America/New_York"
): Date {
  // Get today's date in the group's timezone (as YYYY-MM-DD)
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: groupTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = fmt.format(now);

  // Parse the date in UTC to get midnight UTC for today's group-timezone date
  const todayUtc = new Date(`${todayStr}T00:00:00Z`);
  const dow = todayUtc.getUTCDay();

  // Calculate days back to the most recent occurrence of defaultStartDay
  const daysBack = (dow - defaultStartDay + 7) % 7;
  const ms = 24 * 60 * 60 * 1000;
  const lastRollover = new Date(todayUtc.getTime() - daysBack * ms);

  // Use the later of the calculated rollover or the original stored start
  return lastRollover > storedStart ? lastRollover : storedStart;
}

export function todayDateString(d: Date = new Date(), groupTimezone: string = "America/New_York"): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: groupTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d);
}
