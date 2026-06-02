// Cumulative completion vs target over plan days. Renders an "on-track" line
// (linear pace from 0 to target across totalDays) and the actual cumulative
// count line.

export function TrajectoryChart({
  cumulative,
  totalDays,
  target,
  currentDay,
  width = 320,
  height = 100,
}: {
  cumulative: number[]; // length = totalDays; cumulative[i] = total completions by day i+1
  totalDays: number;
  target: number;
  currentDay: number;
  width?: number;
  height?: number;
}) {
  const pad = 8;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const xAt = (d: number) => pad + (d / Math.max(1, totalDays)) * innerW;
  const yAt = (v: number) => pad + innerH - (v / Math.max(1, target)) * innerH;

  // ideal line: from (0, 0) to (totalDays, target)
  const idealStart = `${xAt(0)},${yAt(0)}`;
  const idealEnd = `${xAt(totalDays)},${yAt(target)}`;

  // actual polyline: stop at currentDay (don't extrapolate)
  const points: string[] = [`${xAt(0)},${yAt(0)}`];
  for (let i = 0; i < Math.min(currentDay, cumulative.length); i++) {
    points.push(`${xAt(i + 1)},${yAt(cumulative[i])}`);
  }

  return (
    <svg width={width} height={height} className="w-full">
      <line
        x1={idealStart.split(",")[0]}
        y1={idealStart.split(",")[1]}
        x2={idealEnd.split(",")[0]}
        y2={idealEnd.split(",")[1]}
        stroke="var(--color-foreground)"
        strokeOpacity="0.25"
        strokeWidth="1"
        strokeDasharray="3,3"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x={pad} y={pad + 6} fontSize="9" fill="currentColor" opacity="0.5">
        0
      </text>
      <text x={width - pad - 18} y={pad + 6} fontSize="9" fill="currentColor" opacity="0.5">
        {target}
      </text>
    </svg>
  );
}
