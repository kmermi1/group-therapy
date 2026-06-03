"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import JoinForm from "./JoinForm";
import AdminJoinForm from "./AdminJoinForm";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";

export default function JoinFlow() {
  const [role, setRole] = useState<"user" | "admin" | null>(null);
  const [locale, setLocale] = useState<Locale>("en");

  if (role === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-foreground)]/70">How would you like to join?</p>
        <Button onClick={() => setRole("user")} className="w-full">
          Join as user
        </Button>
        <Button onClick={() => setRole("admin")} variant="secondary" className="w-full">
          Join as co-admin
        </Button>
      </div>
    );
  }

  if (role === "user") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setRole(null)}
          className="text-sm text-[var(--color-foreground)]/60 hover:text-[var(--color-foreground)] mb-2"
        >
          ← Back
        </button>
        <div className="mb-5">
          <div className="text-xs text-[var(--color-foreground)]/60 mb-1">Language</div>
          <div className="flex gap-2 p-1 bg-[var(--color-card)] rounded-lg">
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                className={`flex-1 text-center py-2 rounded-md text-sm font-medium ${
                  locale === l ? "bg-[var(--color-background)]" : "text-[var(--color-foreground)]/60"
                }`}
              >
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
        <JoinForm locale={locale} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setRole(null)}
        className="text-sm text-[var(--color-foreground)]/60 hover:text-[var(--color-foreground)] mb-2"
      >
        ← Back
      </button>
      <AdminJoinForm />
    </div>
  );
}
