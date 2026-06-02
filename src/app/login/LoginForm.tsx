"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label } from "@/components/ui";
import { loginAdminAction, loginUserAction } from "@/app/actions/auth";

export default function LoginForm({ isAdmin }: { isAdmin: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function submit(formData: FormData) {
    setError(null);
    start(async () => {
      try {
        const res = isAdmin ? await loginAdminAction(formData) : await loginUserAction(formData);
        if (res?.error) setError(res.error);
        // success path triggers a redirect, which we won't see here
      } catch (e) {
        const msg = (e as Error).message || "Login failed.";
        if (!msg.includes("NEXT_REDIRECT")) setError(msg);
      }
    });
  }

  return (
    <form action={submit} className="space-y-4">
      <div>
        <Label htmlFor="groupCode">Group code</Label>
        <Input id="groupCode" name="groupCode" required autoCapitalize="characters" />
      </div>
      <div>
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" required />
      </div>
      {isAdmin ? (
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>
      ) : (
        <div>
          <Label htmlFor="pin">PIN</Label>
          <Input id="pin" name="pin" type="password" inputMode="numeric" required />
        </div>
      )}
      {error && (
        <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 px-3 py-2 rounded-lg">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Log in"}
      </Button>
    </form>
  );
}
