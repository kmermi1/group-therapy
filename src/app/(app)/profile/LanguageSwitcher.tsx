"use client";

import { useTransition } from "react";
import { setLanguageAction } from "@/app/actions/auth";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";

export default function LanguageSwitcher({ current }: { current: Locale }) {
  const [pending, start] = useTransition();
  function pick(l: Locale) {
    if (l === current || pending) return;
    const fd = new FormData();
    fd.set("locale", l);
    start(async () => {
      try { await setLanguageAction(fd); } catch {}
    });
  }
  return (
    <div className="flex gap-2 p-1 bg-[var(--color-background)] rounded-lg">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => pick(l)}
          disabled={pending}
          className={`flex-1 text-center py-2 rounded-md text-sm font-medium ${
            current === l ? "bg-[var(--color-card)]" : "text-[var(--color-foreground)]/60"
          }`}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
