// Circular progress ring for things like "X of N days done".

export function ProgressRing({
  value,
  max,
  size = 40,
  strokeWidth = 4,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-border)"
          strokeOpacity="0.6"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={pct >= 1 ? "rgb(16 185 129)" : "var(--color-accent)"}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono">
        {value}/{max}
      </div>
    </div>
  );
}
