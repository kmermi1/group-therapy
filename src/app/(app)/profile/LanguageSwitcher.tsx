"use client";

import { useTransition } from "react";
import { setLanguageAction } from "@/app/actions/auth";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import CustomSelect from "@/components/CustomSelect";

export default function LanguageSwitcher({ current }: { current: Locale }) {
  const [pending, start] = useTransition();

  function onChange(l: Locale) {
    if (l === current || pending) return;
    const fd = new FormData();
    fd.set("locale", l);
    start(async () => {
      try { await setLanguageAction(fd); } catch {}
    });
  }

  return (
    <CustomSelect
      value={current}
      onChange={onChange}
      disabled={pending}
      options={LOCALES.map((l) => ({ value: l, label: LOCALE_LABELS[l] }))}
    />
  );
}
