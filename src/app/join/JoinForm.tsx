"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label } from "@/components/ui";
import { previewUsernameAction, joinGroupAction } from "@/app/actions/auth";
import Link from "next/link";

export default function JoinForm() {
  const [step, setStep] = useState<"code" | "name">("code");
  const [groupCode, setGroupCode] = useState("");
  const [username, setUsername] = useState("");
  const [groupId, setGroupId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function lookupCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const result = await previewUsernameAction(groupCode);
      if (!result) {
        setError("Group code not found.");
        return;
      }
      setGroupId(result.groupId);
      setUsername(result.username);
      setStep("name");
    });
  }

  async function regenerate() {
    setError(null);
    start(async () => {
      const result = await previewUsernameAction(groupCode);
      if (result) setUsername(result.username);
    });
  }

  if (step === "code") {
    return (
      <form onSubmit={lookupCode} className="space-y-4">
        <div>
          <Label htmlFor="groupCode">Group code</Label>
          <Input
            id="groupCode"
            name="groupCode"
            required
            autoCapitalize="characters"
            value={groupCode}
            onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
            placeholder="e.g. KX72PW"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Checking..." : "Continue"}
        </Button>
        <Link href="/" className="block text-center text-sm text-[var(--color-foreground)]/60">Cancel</Link>
      </form>
    );
  }

  return (
    <form action={joinGroupAction} className="space-y-4">
      <input type="hidden" name="groupCode" value={groupCode} />
      <input type="hidden" name="username" value={username} />
      <div>
        <Label>Your username</Label>
        <div className="flex items-center gap-2 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]">
          <span className="text-lg font-semibold flex-1">{username}</span>
          <Button type="button" variant="secondary" onClick={regenerate} disabled={pending}>
            🎲 Regenerate
          </Button>
        </div>
        <p className="text-xs text-[var(--color-foreground)]/60 mt-1">No one will know this is you unless you tell them.</p>
      </div>
      <div>
        <Label htmlFor="pin">Choose a PIN (4+ digits)</Label>
        <Input id="pin" name="pin" type="password" inputMode="numeric" required minLength={4} maxLength={20} pattern="[0-9]*" />
        <p className="text-xs text-[var(--color-foreground)]/60 mt-1">You&apos;ll need your username + PIN to log in. Save them somewhere safe.</p>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full">Join group</Button>
      <button type="button" onClick={() => setStep("code")} className="block text-center text-sm text-[var(--color-foreground)]/60 mx-auto">Back</button>
    </form>
  );
}
