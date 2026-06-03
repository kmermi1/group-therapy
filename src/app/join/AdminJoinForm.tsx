"use client";

import { joinAsAdminAction } from "@/app/actions/auth";
import { Button, Input, Label } from "@/components/ui";
import Link from "next/link";
import { useTransition } from "react";
import { useState } from "react";

export default function AdminJoinForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    start(async () => {
      try {
        await joinAsAdminAction(formData);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <p className="text-sm text-[var(--color-foreground)]/70 mb-4">
        An existing admin shared an admin invite code. You'll become an admin of the same group.
      </p>
      <div>
        <Label htmlFor="inviteCode">Admin invite code</Label>
        <Input
          id="inviteCode"
          name="inviteCode"
          required
          autoCapitalize="characters"
          placeholder="e.g. KX72PWAB"
        />
      </div>
      <div>
        <Label htmlFor="username">Your admin username</Label>
        <Input id="username" name="username" required maxLength={40} />
      </div>
      <div>
        <Label htmlFor="password">Choose a password</Label>
        <Input id="password" name="password" type="password" required minLength={6} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Processing..." : "Become co-admin"}
      </Button>
      <Link href="/" className="block text-center text-sm text-[var(--color-foreground)]/60">
        Cancel
      </Link>
    </form>
  );
}
