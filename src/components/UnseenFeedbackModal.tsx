"use client";

import { useState, useTransition } from "react";
import { ackFeedbackAction } from "@/app/actions/feedback";

type Feedback = {
  id: string;
  message: string;
  created_at: string;
  is_anonymous: boolean;
  fromName: string | null;
};

export default function UnseenFeedbackModal({ items }: { items: Feedback[] }) {
  const [index, setIndex] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || items.length === 0) return null;
  const current = items[index];
  if (!current) return null;
  const total = items.length;

  function ack() {
    setError(null);
    const fd = new FormData();
    fd.set("feedbackId", current.id);
    start(async () => {
      try {
        await ackFeedbackAction(fd);
        if (index + 1 >= total) {
          setDismissed(true);
        } else {
          setIndex(index + 1);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  const dateStr = new Date(current.created_at).toLocaleString();

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold">📨 New feedback</h2>
          <span className="text-xs text-[var(--foreground-mute)]">
            {index + 1} of {total}
          </span>
        </div>

        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 mb-3">
          <div className="text-xs text-[var(--foreground-mute)] mb-2">
            From: <span className="font-medium text-[var(--foreground)]">
              {current.is_anonymous ? "Anonymous" : current.fromName ?? "Unknown"}
            </span>
            <span className="mx-1">·</span>
            {dateStr}
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{current.message}</p>
        </div>

        <p className="text-xs text-[var(--foreground-mute)] mb-3">
          Please acknowledge this feedback before continuing. Other admins will still see it independently.
        </p>

        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

        <button
          type="button"
          onClick={ack}
          disabled={pending}
          className="w-full rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] font-medium py-2.5 text-sm hover:opacity-90 disabled:opacity-50 transition"
        >
          {pending ? "Acknowledging..." : index + 1 < total ? "Acknowledge & next" : "Acknowledge"}
        </button>
      </div>
    </div>
  );
}
