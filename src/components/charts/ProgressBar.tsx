export function ProgressBar({
  value,
  max,
  className = "",
  showLabel = false,
  tone = "accent",
}: {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
  tone?: "accent" | "success" | "warning";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const colorByTone = {
    accent: "bg-[var(--color-accent)]",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
  }[tone];
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)]/60 overflow-hidden">
        <div className={`h-full ${colorByTone} transition-[width]`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className="text-[10px] font-mono text-[var(--color-foreground)]/60 w-12 text-right">
          {value}/{max}
        </span>
      )}
    </div>
  );
}
