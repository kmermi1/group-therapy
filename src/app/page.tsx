import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Flourish } from "@/components/ui";

export default async function Home() {
  const s = await getSession();
  if (s?.kind === "user") redirect("/today");
  if (s?.kind === "admin") redirect("/admin");

  return (
    <main className="flex-1 flex flex-col px-6 py-14 max-w-md mx-auto w-full">
      <div className="reveal space-y-10 flex-1 flex flex-col justify-center">
        <div className="text-center space-y-5">
          <div className="flex items-center justify-center gap-3 text-[var(--rule)]">
            <Flourish />
            <span className="text-[10px] uppercase tracking-[0.32em] text-[var(--foreground-mute)]">
              Vol. 01 · A shared almanac
            </span>
            <Flourish />
          </div>

          <h1 className="display text-[44px] leading-[1.0]">
            Group<br />
            <span className="italic text-[var(--accent)]">Therapy</span>
          </h1>

          <p className="text-[15px] text-[var(--foreground-mute)] leading-relaxed max-w-[28ch] mx-auto">
            A small, anonymous almanac your circle keeps together — habits,
            readings, and quiet daily progress.
          </p>
        </div>

        <div className="rule rule-dot" />

        <div className="space-y-2.5">
          <Link
            href="/join"
            className="block w-full text-center bg-[var(--accent)] text-[var(--accent-fg)] rounded-xl px-4 py-3.5 font-medium tracking-wide shadow-[0_8px_22px_-12px_rgba(45,106,79,0.55)]"
          >
            Join a group
          </Link>
          <Link
            href="/login"
            className="block w-full text-center bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3.5 font-medium"
          >
            Log in
          </Link>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/create"
              className="block text-center text-[12px] text-[var(--foreground-mute)] hover:text-[var(--foreground)] px-2 py-2.5 underline-offset-4 hover:underline"
            >
              Create new group
            </Link>
            <Link
              href="/admin-join"
              className="block text-center text-[12px] text-[var(--foreground-mute)] hover:text-[var(--foreground)] px-2 py-2.5 underline-offset-4 hover:underline"
            >
              Join as co-admin
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-[var(--foreground-mute)] tracking-[0.2em] uppercase">
          No emails · No tracking
        </p>
      </div>
    </main>
  );
}
