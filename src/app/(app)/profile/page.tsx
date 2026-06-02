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
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title={tr("meTitle")} />
      <Card className="mb-4">
        <div className="text-xs uppercase tracking-wide text-[var(--color-foreground)]/60">{tr("youAre")}</div>
        {s.kind === "user" ? (
          <ProfileRename currentUsername={s.username} locale={locale} />
        ) : (
          <div className="text-xl font-bold mt-1">{s.username}</div>
        )}
        <div className="text-xs text-[var(--color-foreground)]/60 mt-3">
          {tr("groupLine", { code: group?.code ?? "", name: group?.name ?? "" })}
        </div>
        <div className="text-[11px] text-[var(--color-foreground)]/50 mt-1">
          {tr("loggedInAs", { kind: s.kind === "admin" ? tr("loggedInAsAdmin") : tr("loggedInAsUser") })}
        </div>
      </Card>

      {s.kind === "user" && (
        <Card className="mb-4">
          <h2 className="font-semibold mb-1">{tr("languageSetting")}</h2>
          <p className="text-[11px] text-[var(--color-foreground)]/60 mb-3">{tr("languageHint")}</p>
          <LanguageSwitcher current={locale} />
        </Card>
      )}

      <form action={logoutAction}>
        <Button type="submit" variant="secondary" className="w-full">{tr("logOut")}</Button>
      </form>
    </main>
  );
}
