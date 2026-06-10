// A simple GitHub-style heatmap. Renders the last `weeks` columns (default 12)
// of daily completion counts. Cells colored by intensity.

type Counts = Record<string, number>; // YYYY-MM-DD -> count

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function intensity(count: number, max: number): string {
  if (count <= 0) return "bg-[var(--color-border)]/30";
  const ratio = max > 0 ? count / max : 1;
  if (ratio < 0.25) return "bg-emerald-500/25";
  if (ratio < 0.5) return "bg-emerald-500/50";
  if (ratio < 0.75) return "bg-emerald-500/70";
  return "bg-emerald-500";
}

export function CalendarHeatmap({
  counts,
  weeks = 12,
  endDate = new Date(),
}: {
  counts: Counts;
  weeks?: number;
  endDate?: Date;
}) {
  // build columns oldest -> newest, each column = 7 days, ending on Saturday
  // simpler: build last N*7 days ending today; group into columns of 7
  const totalDays = weeks * 7;
  const days: { date: string; count: number; isToday: boolean }[] = [];
  const start = new Date(endDate);
  start.setDate(start.getDate() - (totalDays - 1));
  const todayStr = toIso(endDate);

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = toIso(d);
    days.push({ date: iso, count: counts[iso] ?? 0, isToday: iso === todayStr });
  }
  // chunk by 7 -> columns
  const cols: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7));

  const maxCount = Math.max(1, ...days.map((d) => d.count));

  // Format week label: "This week" for current, "W2", "W3", etc for older
  function getWeekLabel(weekIndex: number): string {
    const weeksAgo = weeks - 1 - weekIndex;
    if (weeksAgo === 0) return "This week";
    return `W${weeksAgo + 1}`;
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-xs text-[var(--color-foreground)]/60">
        <span>Less</span>
        <div className="flex gap-[2px]">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <div
              key={ratio}
              className={`h-[10px] w-[10px] rounded-sm ${intensity(ratio === 0 ? 0 : ratio, 1)}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>
      <div className="flex gap-[8px]" aria-label="completion heatmap">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col items-center gap-[2px]">
            <div className={`text-[11px] font-medium h-5 flex items-center ${
              ci === cols.length - 1
                ? "text-[var(--accent)] font-semibold"
                : "text-[var(--color-foreground)]/60"
            }`}>
              {getWeekLabel(ci)}
            </div>
            <div className="flex flex-col gap-[3px]">
              {col.map((d) => (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.count} completions`}
                  className={`h-[14px] w-[14px] rounded-sm transition-all ${
                    d.isToday ? "ring-2 ring-[var(--accent)] ring-offset-1" : ""
                  } ${intensity(d.count, maxCount)}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
