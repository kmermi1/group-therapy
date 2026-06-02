import { PageHeader } from "@/components/ui";
import Link from "next/link";
import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const sp = await searchParams;
  const isAdmin = sp.as === "admin";

  return (
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-8 reveal">
      <PageHeader title={isAdmin ? "Admin login" : "Log in"} />
      <div className="flex gap-1 mb-5 p-1 bg-[var(--surface)] rounded-xl">
        <Link
          href="/login"
          className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition ${!isAdmin ? "bg-[var(--card)] text-[var(--foreground)] shadow-[var(--shadow-sm)]" : "text-[var(--foreground-mute)]"}`}
        >
          User
        </Link>
        <Link
          href="/login?as=admin"
          className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition ${isAdmin ? "bg-[var(--card)] text-[var(--foreground)] shadow-[var(--shadow-sm)]" : "text-[var(--foreground-mute)]"}`}
        >
          Admin
        </Link>
      </div>

      <LoginForm isAdmin={isAdmin} />

      <Link href="/" className="block text-center text-sm text-[var(--foreground-mute)] mt-4">Cancel</Link>
    </main>
  );
}
