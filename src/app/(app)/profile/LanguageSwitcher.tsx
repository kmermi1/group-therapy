"use client";

import { useTransition } from "react";
import { setLanguageAction } from "@/app/actions/auth";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";

export default function LanguageSwitcher({ current }: { current: Locale }) {
  const [pending, start] = useTransition();
  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const l = e.target.value as Locale;
    if (l === current || pending) return;
    const fd = new FormData();
    fd.set("locale", l);
    start(async () => {
      try { await setLanguageAction(fd); } catch {}
    });
  }
  return (
    <select
      value={current}
      onChange={onChange}
      disabled={pending}
      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
      ))}
    </select>
  );
}
