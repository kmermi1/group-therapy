import { redirect } from "next/navigation";
import { resetAdminPasswordWithCodeAction } from "@/app/actions/auth";
import { Button, Input, Label, PageHeader, Card } from "@/components/ui";

export default async function AdminResetPasswordPage() {
  async function handleReset(formData: FormData) {
    "use server";
    try {
      await resetAdminPasswordWithCodeAction(formData);
      redirect("/admin-join?reset=success");
    } catch (err) {
      throw err;
    }
  }

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="Reset Password" subtitle="Enter your reset code to create a new password" />

      <Card>
        <form action={handleReset} className="space-y-4">
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
              onChange={(e) => {
                const pwd = (document.getElementById("newPassword") as HTMLInputElement)?.value || "";
                const isValid = e.currentTarget.value === pwd && pwd.length >= 6;
                e.currentTarget.setCustomValidity(isValid ? "" : "Passwords do not match");
              }}
            />
          </div>

          <Button type="submit" className="w-full">
            Reset Password
          </Button>

          <p className="text-xs text-[var(--color-foreground)]/60 text-center">
            Remember your password now?{" "}
            <a href="/admin-join" className="text-[var(--color-accent)]">
              Back to login
            </a>
          </p>
        </form>
      </Card>
    </main>
  );
}
