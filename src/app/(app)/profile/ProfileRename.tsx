"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { regenerateUsernameAction } from "@/app/actions/tasks";

export default function ProfileRename({ currentUsername }: { currentUsername: string }) {
  const [candidate, setCandidate] = useState<string>("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function rollNew() {
    setError(null);
    start(async () => {
      const res = await fetch("/api/regenerate-username", { method: "POST" });
      if (!res.ok) { setError("Could not generate name."); return; }
      const json = await res.json();
      setCandidate(json.username);
    });
  }

  function cancel() {
    setCandidate("");
    setError(null);
  }

  async function submit(choice: "keep" | "fresh") {
    if (!candidate) return;
    const fd = new FormData();
    fd.set("newUsername", candidate);
    fd.set("choice", choice);
    start(async () => {
      try {
        await regenerateUsernameAction(fd);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div className="mt-1">
      <div className="flex items-center gap-2">
        <div className="text-xl font-bold flex-1 break-all">{currentUsername}</div>
        <Button type="button" variant="secondary" onClick={rollNew} disabled={pending}>
          🎲 Change name
        </Button>
      </div>
      <p className="text-[11px] text-[var(--color-foreground)]/60 mt-1">
        Roll a new random username if you want to refresh your anonymous identity.
      </p>

      {candidate && (
        <div className="mt-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-xs text-[var(--color-foreground)]/60 flex-1">New name</div>
            <button type="button" onClick={rollNew} disabled={pending} className="text-xs underline text-[var(--color-foreground)]/70">
              🎲 Roll again
            </button>
          </div>
          <div className="font-semibold break-all mb-3">{candidate}</div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={() => submit("keep")} disabled={pending}>
              Keep history
            </Button>
            <Button type="button" variant="secondary" onClick={() => submit("fresh")} disabled={pending}>
              Fresh start
            </Button>
          </div>
          <button type="button" onClick={cancel} className="block w-full text-center text-xs text-[var(--color-foreground)]/60 mt-2">
            Cancel
          </button>
          <p className="text-[11px] text-[var(--color-foreground)]/60 mt-2">
            <strong>Keep:</strong> stats, history, and reading-plan allocations follow your new name. <strong>Fresh start:</strong> all completions and plan slots are released, you start over. <em>Cannot be undone.</em>
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
