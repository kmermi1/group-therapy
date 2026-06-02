import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const s = await getSession();
  if (s?.kind === "user") redirect("/today");
  if (s?.kind === "admin") redirect("/admin");

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Group Therapy</h1>
        <p className="text-[var(--color-foreground)]/70 mt-3">
          Anonymous weekly task tracker for your circle. No emails, no tracking — just funny names and progress.
        </p>
      </div>
      <div className="w-full space-y-3">
        <Link href="/join" className="block w-full text-center bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-lg px-4 py-3 font-medium">
          Join a group
        </Link>
        <Link href="/login" className="block w-full text-center bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-4 py-3 font-medium">
          Log in
        </Link>
        <Link href="/create" className="block w-full text-center text-[var(--color-foreground)]/70 hover:text-[var(--color-foreground)] px-4 py-3 text-sm">
          Create a new group (admin)
        </Link>
        <Link href="/admin-join" className="block w-full text-center text-[var(--color-foreground)]/70 hover:text-[var(--color-foreground)] px-4 py-3 text-sm">
          Join an existing group as co-admin
        </Link>
      </div>
    </main>
  );
}
