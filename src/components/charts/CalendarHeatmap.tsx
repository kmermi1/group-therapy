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
  const days: { date: string; count: number }[] = [];
  const start = new Date(endDate);
  start.setDate(start.getDate() - (totalDays - 1));
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = toIso(d);
    days.push({ date: iso, count: counts[iso] ?? 0 });
  }
  // chunk by 7 -> columns
  const cols: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7));

  const maxCount = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="flex gap-[3px]" aria-label="completion heatmap">
      {cols.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-[3px]">
          {col.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.count}`}
              className={`h-[12px] w-[12px] rounded-sm ${intensity(d.count, maxCount)}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
