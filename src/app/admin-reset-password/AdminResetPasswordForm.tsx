"use client";

import { useState } from "react";
import { useTransition } from "react";
import { resetAdminPasswordWithCodeAction } from "@/app/actions/auth";
import { Button, Input, Label } from "@/components/ui";
import { useRouter } from "next/navigation";

export default function AdminResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [pending, start] = useTransition();
  const router = useRouter();

  function handleConfirmChange(e: React.ChangeEvent<HTMLInputElement>) {
    const pwd = (document.getElementById("newPassword") as HTMLInputElement)?.value || "";
    const isMatch = e.currentTarget.value === pwd;
    setPasswordMatch(isMatch);
    e.currentTarget.setCustomValidity(isMatch ? "" : "Passwords do not match");
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    if (!passwordMatch) {
      setError("Passwords do not match");
      return;
    }
    start(async () => {
      try {
        await resetAdminPasswordWithCodeAction(formData);
        router.push("/admin-join?reset=success");
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="resetCode">Reset Code</Label>
        <Input
          id="resetCode"
          name="resetCode"
          type="text"
          placeholder="8-character code"
          required
          maxLength={8}
          className="font-mono uppercase"
        />
        <p className="text-xs text-[var(--color-foreground)]/60 mt-1">
          Ask another admin to generate a reset code for you.
        </p>
      </div>

      <div>
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          placeholder="6+ characters"
          required
          minLength={6}
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Repeat password"
          required
          minLength={6}
          onChange={handleConfirmChange}
        />
        {!passwordMatch && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">{error}</p>}

      <Button type="submit" className="w-full" disabled={pending || !passwordMatch}>
        {pending ? "Resetting..." : "Reset Password"}
      </Button>

      <p className="text-xs text-[var(--color-foreground)]/60 text-center">
        Remember your password now?{" "}
        <a href="/admin-join" className="text-[var(--color-accent)]">
          Back to login
        </a>
      </p>
    </form>
  );
}
