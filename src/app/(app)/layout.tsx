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
      <nav className="fixed bottom-0 inset-x-0 z-10 bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/80 border-t border-[var(--border)]">
        <div className="max-w-md mx-auto grid grid-cols-4">
          {isAdmin ? (
            <>
              <NavLink href="/admin" label="Status" glyph="◇" />
              <NavLink href="/admin/manage" label="Tasks" glyph="✦" />
              <NavLink href="/admin/plans" label="Plans" glyph="❡" />
              <NavLink href="/profile" label={t("navMe", locale)} glyph="◯" />
            </>
          ) : (
            <>
              <NavLink href="/today" label={t("navToday", locale)} glyph="✦" />
              <NavLink href="/history" label={t("navHistory", locale)} glyph="❡" />
              <NavLink href="/leaderboard" label={t("navGroup", locale)} glyph="◈" />
              <NavLink href="/profile" label={t("navMe", locale)} glyph="◯" />
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, label, glyph }: { href: string; label: string; glyph: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center pt-3 pb-2 text-[10px] text-[var(--foreground-mute)] hover:text-[var(--foreground)]"
    >
      <span className="text-base mb-0.5 leading-none">{glyph}</span>
      <span className="tracking-[0.14em] uppercase">{label}</span>
    </Link>
  );
}
