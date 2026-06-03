"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label } from "@/components/ui";
import { previewUsernameAction, joinGroupAction } from "@/app/actions/auth";
import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";

export default function JoinForm({ locale = "en" }: { locale?: Locale }) {
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);
  const [step, setStep] = useState<"code" | "name">("code");
  const [groupCode, setGroupCode] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const tr = (k: Parameters<typeof t>[0], p?: Record<string, string | number>) => t(k, currentLocale, p);

  async function lookupCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const result = await previewUsernameAction(groupCode, locale);
      if (!result) {
        setError(tr("groupNotFound"));
        return;
      }
      setUsername(result.username);
      setStep("name");
    });
  }

  async function regenerate() {
    setError(null);
    start(async () => {
      const result = await previewUsernameAction(groupCode, locale);
      if (result) setUsername(result.username);
    });
  }

  return (
    <>
      {step === "code" ? (
        <form onSubmit={lookupCode} className="space-y-4">
          <div>
            <Label htmlFor="groupCode">{tr("groupCode")}</Label>
            <Input
              id="groupCode"
              name="groupCode"
              required
              autoCapitalize="characters"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
              placeholder={tr("groupCodeExample")}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? tr("checking") : tr("continue")}
          </Button>
          <Link href="/" className="block text-center text-sm text-[var(--color-foreground)]/60">{tr("cancel")}</Link>
        </form>
      ) : (
        <form action={joinGroupAction} className="space-y-4">
          <input type="hidden" name="groupCode" value={groupCode} />
          <input type="hidden" name="username" value={username} />
          <input type="hidden" name="locale" value={currentLocale} />
          <div>
            <Label>{tr("yourUsername")}</Label>
            <div className="flex items-center gap-2 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]">
              <span className="text-lg font-semibold flex-1 break-all">{username}</span>
              <Button type="button" variant="secondary" onClick={regenerate} disabled={pending}>
                {tr("regenerate")}
              </Button>
            </div>
            <p className="text-xs text-[var(--color-foreground)]/60 mt-1">{tr("anonymousNote")}</p>
          </div>
          <div>
            <Label htmlFor="pin">{tr("pinLabel")}</Label>
            <Input id="pin" name="pin" type="password" inputMode="numeric" required minLength={4} maxLength={20} />
            <p className="text-xs text-[var(--color-foreground)]/60 mt-1">{tr("pinHint")}</p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full">{tr("joinButton")}</Button>
          <button type="button" onClick={() => setStep("code")} className="block text-center text-sm text-[var(--color-foreground)]/60 mx-auto">
            {tr("back")}
          </button>
        </form>
      )}
    </>
  );
}
