// Milestone math. A milestone is a span of time the admin tracks against.
// If the admin doesn't manually reset, the milestone auto-rolls each week
// on the group's default_start_day (0 = Sun ... 6 = Sat).

export function effectiveMilestoneStart(
  storedStart: Date,
  defaultStartDay: number,
  now: Date = new Date()
): Date {
  // Walk forward in 7-day steps from storedStart on the default_start_day
  // until we pass `now`, then back off one week.
  const ms = 24 * 60 * 60 * 1000;
  const start = new Date(storedStart);
  // Snap start to its weekday at midnight (local server time)
  start.setHours(0, 0, 0, 0);

  // Find the most recent occurrence of default_start_day that is <= now,
  // but not earlier than storedStart.
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  const daysBack = (dow - defaultStartDay + 7) % 7;
  const lastRollover = new Date(today.getTime() - daysBack * ms);

  return lastRollover > start ? lastRollover : start;
}

export function todayDateString(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
