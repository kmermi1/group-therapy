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
    <main className="max-w-md mx-auto w-full px-5 py-6 reveal">
      <PageHeader title={tr("meTitle")} />
      <Card className="mb-4">
        <div className="text-xs uppercase tracking-wide text-[var(--foreground-mute)] font-medium mb-1">{tr("youAre")}</div>
        {s.kind === "user" ? (
          <ProfileRename currentUsername={s.username} locale={locale} />
        ) : (
          <div className="text-2xl font-semibold tracking-tight mt-1">{s.username}</div>
        )}
        <div className="text-sm text-[var(--foreground-mute)] mt-3 flex items-center gap-2">
          <span className="numeric">{group?.code}</span>
          <span>·</span>
          <span>{group?.name}</span>
        </div>
        <div className="text-[11px] text-[var(--foreground-mute)] mt-1">
          {tr("loggedInAs", { kind: s.kind === "admin" ? tr("loggedInAsAdmin") : tr("loggedInAsUser") })}
        </div>
      </Card>

      {s.kind === "user" && (
        <Card className="mb-4">
          <h2 className="font-semibold mb-1">{tr("languageSetting")}</h2>
          <p className="text-xs text-[var(--foreground-mute)] mb-3">{tr("languageHint")}</p>
          <LanguageSwitcher current={locale} />
        </Card>
      )}

      <form action={logoutAction}>
        <Button type="submit" variant="secondary" className="w-full">{tr("logOut")}</Button>
      </form>
    </main>
  );
}
