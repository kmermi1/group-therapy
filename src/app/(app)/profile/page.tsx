import { requireSession, logoutAction } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader, Card, Button } from "@/components/ui";
import ProfileRename from "./ProfileRename";
import LanguageSwitcher from "./LanguageSwitcher";
import { t } from "@/lib/i18n";

export default async function ProfilePage() {
  const s = await requireSession();
  const locale = s.kind === "user" ? s.locale : "en";
  const tr = (k: Parameters<typeof t>[0], p?: Record<string, string | number>) => t(k, locale, p);

  const sb = createAdminClient();
  const { data: group } = await sb.from("groups").select("code, name").eq("id", s.groupId).single();

  return (
    <main className="max-w-md mx-auto w-full px-5 py-7 reveal">
      <PageHeader title={tr("meTitle")} />
      <Card className="mb-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--foreground-mute)] mb-1">{tr("youAre")}</div>
        {s.kind === "user" ? (
          <ProfileRename currentUsername={s.username} locale={locale} />
        ) : (
          <div className="display text-[24px] tracking-tight mt-1">{s.username}</div>
        )}
        <div className="rule mt-4 mb-3" />
        <div className="text-[12px] text-[var(--foreground-mute)] flex items-center gap-2">
          <span className="numeric tracking-wider">{group?.code}</span>
          <span className="text-[var(--rule)]">·</span>
          <span className="italic">{group?.name}</span>
        </div>
        <div className="text-[10px] tracking-[0.12em] uppercase text-[var(--foreground-mute)] mt-1">
          {tr("loggedInAs", { kind: s.kind === "admin" ? tr("loggedInAsAdmin") : tr("loggedInAsUser") })}
        </div>
      </Card>

      {s.kind === "user" && (
        <Card className="mb-4">
          <h2 className="display text-[18px] tracking-tight mb-1">{tr("languageSetting")}</h2>
          <p className="text-[11px] text-[var(--foreground-mute)] italic mb-3">{tr("languageHint")}</p>
          <LanguageSwitcher current={locale} />
        </Card>
      )}

      <form action={logoutAction}>
        <Button type="submit" variant="secondary" className="w-full">{tr("logOut")}</Button>
      </form>
    </main>
  );
}
