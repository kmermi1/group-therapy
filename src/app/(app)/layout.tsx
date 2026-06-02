import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { t } from "@/lib/i18n";
import FeedbackButton from "@/components/FeedbackButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");

  const isAdmin = s.kind === "admin";
  const locale = s.kind === "user" ? s.locale : "en";

  return (
    <div className="flex-1 flex flex-col pb-24">
      <div className="flex-1">{children}</div>
      <FeedbackButton locale={locale} />
      <nav className="fixed bottom-0 inset-x-0 z-10 bg-[var(--background)]/90 backdrop-blur-md border-t border-[var(--border)]">
        <div className="max-w-md mx-auto grid grid-cols-4">
          {isAdmin ? (
            <>
              <NavLink href="/admin" label="Status" icon="📊" />
              <NavLink href="/admin/manage" label="Tasks" icon="⚙️" />
              <NavLink href="/admin/plans" label="Plans" icon="📖" />
              <NavLink href="/profile" label={t("navMe", locale)} icon="👤" />
            </>
          ) : (
            <>
              <NavLink href="/today" label={t("navToday", locale)} icon="✅" />
              <NavLink href="/history" label={t("navHistory", locale)} icon="📅" />
              <NavLink href="/leaderboard" label={t("navGroup", locale)} icon="🏆" />
              <NavLink href="/profile" label={t("navMe", locale)} icon="👤" />
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center pt-2.5 pb-2 text-[11px] text-[var(--foreground-mute)] hover:text-[var(--foreground)] transition"
    >
      <span className="text-xl mb-0.5">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
