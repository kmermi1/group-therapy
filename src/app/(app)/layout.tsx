import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");

  const isAdmin = s.kind === "admin";

  return (
    <div className="flex-1 flex flex-col pb-20">
      <div className="flex-1">{children}</div>
      <nav className="fixed bottom-0 inset-x-0 border-t border-[var(--color-border)] bg-[var(--color-background)] z-10">
        <div className="max-w-md mx-auto grid grid-cols-4">
          {isAdmin ? (
            <>
              <NavLink href="/admin" label="Status" icon="📊" />
              <NavLink href="/admin/manage" label="Manage" icon="⚙️" />
              <NavLink href="/leaderboard" label="Group" icon="🏆" />
              <NavLink href="/profile" label="Me" icon="👤" />
            </>
          ) : (
            <>
              <NavLink href="/today" label="Today" icon="✅" />
              <NavLink href="/history" label="History" icon="📅" />
              <NavLink href="/leaderboard" label="Group" icon="🏆" />
              <NavLink href="/profile" label="Me" icon="👤" />
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link href={href} className="flex flex-col items-center py-2.5 text-xs text-[var(--color-foreground)]/70 hover:text-[var(--color-foreground)]">
      <span className="text-xl">{icon}</span>
      <span className="mt-0.5">{label}</span>
    </Link>
  );
}
