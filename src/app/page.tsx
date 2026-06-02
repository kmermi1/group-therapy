import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const s = await getSession();
  if (s?.kind === "user") redirect("/today");
  if (s?.kind === "admin") redirect("/admin");

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full reveal">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Group Therapy</h1>
        <p className="text-[var(--foreground-mute)] mt-3 text-[15px] leading-relaxed">
          Anonymous weekly task tracker for your circle. No emails, no tracking — just funny names and progress.
        </p>
      </div>
      <div className="w-full space-y-2.5">
        <Link
          href="/join"
          className="block w-full text-center bg-[var(--accent)] text-[var(--accent-fg)] rounded-lg px-4 py-3 font-medium hover:brightness-110 transition"
        >
          Join a group
        </Link>
        <Link
          href="/login"
          className="block w-full text-center bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 font-medium hover:bg-[var(--border)]/40 transition"
        >
          Log in
        </Link>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link href="/create" className="block text-center text-xs text-[var(--foreground-mute)] hover:text-[var(--foreground)] px-2 py-2.5 transition">
            Create new group
          </Link>
          <Link href="/admin-join" className="block text-center text-xs text-[var(--foreground-mute)] hover:text-[var(--foreground)] px-2 py-2.5 transition">
            Join as co-admin
          </Link>
        </div>
      </div>
    </main>
  );
}
