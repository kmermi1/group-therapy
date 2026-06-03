"use client";

import { useState, useTransition } from "react";
import { generateAdminResetCodeAction } from "@/app/actions/auth";
import { Button, Card } from "@/components/ui";

export default function AdminResetCodeForm({
  adminId,
  username,
  createdAt,
}: {
  adminId: string;
  username: string;
  createdAt: string;
}) {
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function generateCode() {
    const fd = new FormData();
    fd.set("targetAdminId", adminId);
    start(async () => {
      try {
        setError(null);
        const result = await generateAdminResetCodeAction(fd);
        setGeneratedCode(result.code);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function copyCode() {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      alert("Code copied to clipboard!");
    }
  }

  if (generatedCode) {
    return (
      <Card className="space-y-3 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <h3 className="font-semibold text-green-900 dark:text-green-100">Reset Code for {username}</h3>
        <p className="text-sm text-green-800 dark:text-green-200">
          Share this code with {username} to allow them to reset their password. Code expires in 24 hours.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 bg-white dark:bg-black/30 rounded-lg border border-green-300 dark:border-green-700 p-3">
            <code className="text-lg font-mono font-bold text-green-900 dark:text-green-100">{generatedCode}</code>
          </div>
          <Button type="button" onClick={copyCode} className="self-center">
            Copy
          </Button>
        </div>
        <p className="text-xs text-green-700 dark:text-green-300">
          They can reset password at <code className="bg-green-100 dark:bg-green-900 px-1 rounded">/admin-reset-password</code>
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setGeneratedCode(null)}
          className="w-full"
        >
          Close
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between p-3 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)]">
        <div>
          <div className="font-medium text-sm">{username}</div>
          <div className="text-xs text-[var(--color-foreground)]/60">{createdAt}</div>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={generateCode}
          disabled={pending}
        >
          {pending ? "..." : "Reset"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
