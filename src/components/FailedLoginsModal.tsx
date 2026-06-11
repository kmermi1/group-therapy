"use client";

import { useState, useTransition } from "react";
import { ackFailedLoginsAction } from "@/app/actions/auth";

export type FailedLoginItem = {
  id: string;
  kind: "user" | "admin";
  attempted_username: string;
  ip: string | null;
  rate_limited: boolean;
  created_at: string;
};

export default function FailedLoginsModal({
  items,
  total,
}: {
  items: FailedLoginItem[];
  total: number;
}) {
  const [pending, start] = useTransition();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || items.length === 0) return null;

  function ack() {
    start(async () => {
      try {
        await ackFailedLoginsAction();
        setDismissed(true);
      } catch {
        // swallow — leaving modal open is fine if ack fails
      }
    });
  }

  // Aggregate by username for readability
  const grouped = new Map<string, FailedLoginItem[]>();
  for (const it of items) {
    const key = `${it.kind}:${it.attempted_username}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(it);
  }
  const rows = Array.from(grouped.entries()).map(([key, arr]) => ({
    key,
    kind: arr[0].kind,
    username: arr[0].attempted_username,
    count: arr.length,
    rateLimited: arr.some((x) => x.rate_limited),
    mostRecent: arr[0].created_at,
    ips: Array.from(new Set(arr.map((x) => x.ip).filter(Boolean))) as string[],
  }));

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-lg font-semibold">⚠️ Failed login attempts</h2>
          <span className="text-xs text-[var(--foreground-mute)]">{total} new</span>
        </div>
        <p className="text-xs text-[var(--foreground-mute)] mb-3">
          Showing failed login attempts to your group since you last checked. Acknowledge to dismiss; other admins will still see this independently.
        </p>

        <ul className="space-y-2 mb-4">
          {rows.map((r) => (
            <li
              key={r.key}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-medium truncate">{r.username || "(empty)"}</span>
                <span
                  className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                    r.kind === "admin"
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                      : "bg-slate-500/20 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {r.kind}
                </span>
                <span className="text-xs font-mono text-[var(--foreground-mute)] ml-auto">
                  ×{r.count}
                </span>
              </div>
              <div className="text-[11px] text-[var(--foreground-mute)] mt-1">
                Latest: {new Date(r.mostRecent).toLocaleString()}
              </div>
              {r.ips.length > 0 && (
                <div className="text-[11px] text-[var(--foreground-mute)] mt-0.5 break-all">
                  IP{r.ips.length > 1 ? "s" : ""}: {r.ips.join(", ")}
                </div>
              )}
              {r.rateLimited && (
                <div className="text-[11px] text-amber-600 dark:text-amber-300 mt-1">
                  🚧 Rate limit triggered — automatic block applied
                </div>
              )}
            </li>
          ))}
        </ul>

        {total > items.length && (
          <p className="text-[11px] text-[var(--foreground-mute)] mb-3">
            Showing {items.length} of {total} attempts. Older ones are summarized above.
          </p>
        )}

        <button
          type="button"
          onClick={ack}
          disabled={pending}
          className="w-full rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] font-medium py-2.5 text-sm hover:opacity-90 disabled:opacity-50 transition"
        >
          {pending ? "Dismissing..." : "Got it — dismiss"}
        </button>
      </div>
    </div>
  );
}
