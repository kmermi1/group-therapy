"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { submitFeedbackAction } from "@/app/actions/feedback";
import { t, type Locale } from "@/lib/i18n";

export default function FeedbackButton({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tr = (k: Parameters<typeof t>[0]) => t(k, locale);

  function submit() {
    if (!message.trim()) return;
    setError(null);
    const fd = new FormData();
    fd.set("message", message);
    if (anonymous) fd.set("anonymous", "on");
    start(async () => {
      try {
        await submitFeedbackAction(fd);
        setDone(true);
        setMessage("");
        setTimeout(() => {
          setOpen(false);
          setDone(false);
        }, 1400);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={tr("feedback")}
        className="fixed bottom-24 right-4 h-12 w-12 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-fg)] shadow-lg flex items-center justify-center text-xl z-20 active:scale-95"
      >
        💬
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 flex items-end sm:items-center justify-center"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-[var(--color-background)] rounded-t-2xl sm:rounded-2xl border border-[var(--color-border)] p-5 m-0 sm:m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-lg mb-1">{tr("feedback")}</h2>
            <p className="text-xs text-[var(--color-foreground)]/60 mb-3">{tr("feedbackPrompt")}</p>

            {done ? (
              <div className="text-sm py-6 text-center text-emerald-600 dark:text-emerald-400">
                ✓ {tr("feedbackThanks")}
              </div>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={tr("feedbackPlaceholder")}
                  rows={5}
                  maxLength={2000}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-sm outline-none resize-none"
                  autoFocus
                />
                <label className="flex items-start gap-2 mt-3 text-sm">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">{tr("sendAnonymously")}</span>
                    <span className="block text-[11px] text-[var(--color-foreground)]/60">{tr("sendAnonymouslyHint")}</span>
                  </span>
                </label>
                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button onClick={submit} disabled={pending || !message.trim()}>
                    {pending ? tr("sending") : tr("send")}
                  </Button>
                  <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
                    {tr("cancel")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
