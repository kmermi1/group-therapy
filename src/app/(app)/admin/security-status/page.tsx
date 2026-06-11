import { requireAdmin } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { Redis } from "@upstash/redis";

export const revalidate = 0;

type Check = { name: string; ok: boolean | "warn"; detail: string };

async function probeUpstash(): Promise<Check[]> {
  const out: Check[] = [];
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  out.push({
    name: "UPSTASH_REDIS_REST_URL env var",
    ok: !!url,
    detail: url
      ? `present (starts with: ${url.slice(0, 20)}...)`
      : "missing",
  });
  out.push({
    name: "UPSTASH_REDIS_REST_TOKEN env var",
    ok: !!token,
    detail: token ? `present (length ${token.length})` : "missing",
  });

  if (!url || !token) {
    out.push({ name: "URL format check", ok: false, detail: "skipped (vars missing)" });
    out.push({ name: "Live ping (SET/GET)", ok: false, detail: "skipped (vars missing)" });
    return out;
  }

  const formatOk = url.startsWith("https://") && url.includes("upstash.io");
  out.push({
    name: "URL format check",
    ok: formatOk,
    detail: formatOk ? "looks valid (https + upstash.io)" : `unexpected: ${url.slice(0, 40)}...`,
  });

  // Live ping
  try {
    const client = new Redis({ url, token });
    const probeKey = "diag:probe";
    const value = `pong-${Date.now()}`;
    await client.set(probeKey, value, { ex: 30 });
    const back = await client.get<string>(probeKey);
    if (back === value) {
      out.push({ name: "Live ping (SET/GET)", ok: true, detail: "SET + GET round-trip successful" });
    } else {
      out.push({ name: "Live ping (SET/GET)", ok: false, detail: `value mismatch (expected ${value}, got ${back})` });
    }
  } catch (e) {
    out.push({ name: "Live ping (SET/GET)", ok: false, detail: `error: ${(e as Error).message}` });
  }

  // Count rate-limit keys
  try {
    const client = new Redis({ url, token });
    const scanned = await client.scan(0, { match: "rl:*", count: 100 });
    const sample = (scanned[1] as string[]) ?? [];
    out.push({
      name: "Rate-limit keys present",
      ok: sample.length > 0 ? true : "warn",
      detail:
        sample.length > 0
          ? `${sample.length} key(s) found, e.g. ${sample.slice(0, 3).join(", ")}`
          : "0 keys found — no rate-limit activity yet (or keys all expired)",
    });
  } catch (e) {
    out.push({ name: "Rate-limit keys present", ok: false, detail: `scan error: ${(e as Error).message}` });
  }

  return out;
}

export default async function SecurityStatusPage() {
  const admin = await requireAdmin();
  const sb = createAdminClient();
  const checks = await probeUpstash();

  // Recent failed logins in this group
  const { data: recentFailed } = await sb
    .from("failed_logins")
    .select("kind, attempted_username, ip, rate_limited, created_at")
    .eq("group_id", admin.groupId)
    .order("created_at", { ascending: false })
    .limit(10);

  const { count: failedLastHour } = await sb
    .from("failed_logins")
    .select("*", { count: "exact", head: true })
    .eq("group_id", admin.groupId)
    .gt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="Security status" subtitle="Live checks of rate limiting + alerting." />

      <Card className="mb-4">
        <h2 className="font-semibold mb-3">Upstash (rate limiting)</h2>
        <ul className="space-y-2">
          {checks.map((c) => (
            <li key={c.name} className="flex items-start gap-2 text-sm">
              <span className="w-5 shrink-0">
                {c.ok === true ? "✅" : c.ok === "warn" ? "⚠️" : "❌"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-[var(--color-foreground)]/60 break-words">{c.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mb-4">
        <h2 className="font-semibold mb-2">Failed logins (this group)</h2>
        <p className="text-xs text-[var(--color-foreground)]/60 mb-3">
          In the last hour: <strong>{failedLastHour ?? 0}</strong>
        </p>
        {recentFailed && recentFailed.length > 0 ? (
          <ul className="space-y-2">
            {recentFailed.map((r, i) => (
              <li key={i} className="text-xs border-l-2 border-[var(--border)] pl-2">
                <span className="font-mono">{new Date(r.created_at).toLocaleString()}</span>
                {" — "}
                <span className="font-medium">{r.attempted_username}</span>
                {" "}
                <span className="text-[10px] uppercase tracking-wide px-1 rounded bg-[var(--surface)]">{r.kind}</span>
                {r.rate_limited && <span className="ml-1 text-amber-600 dark:text-amber-300">🚧</span>}
                <div className="text-[var(--color-foreground)]/50">IP: {r.ip ?? "—"}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[var(--color-foreground)]/60">No failed logins recorded.</p>
        )}
      </Card>

      <p className="text-[11px] text-[var(--color-foreground)]/60">
        This page is for diagnostics. To stress-test: open an incognito window, hit the login page, and submit a wrong PIN a few times. Reload this page to see the results.
      </p>
    </main>
  );
}
