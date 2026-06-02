import { loginAdminAction, loginUserAction } from "@/app/actions/auth";
import { Button, Input, Label, PageHeader } from "@/components/ui";
import Link from "next/link";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const sp = await searchParams;
  const isAdmin = sp.as === "admin";

  return (
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-8">
      <PageHeader title={isAdmin ? "Admin login" : "Log in"} />
      <div className="flex gap-2 mb-5 p-1 bg-[var(--color-card)] rounded-lg">
        <Link
          href="/login"
          className={`flex-1 text-center py-2 rounded-md text-sm font-medium ${!isAdmin ? "bg-[var(--color-background)]" : "text-[var(--color-foreground)]/60"}`}
        >
          User
        </Link>
        <Link
          href="/login?as=admin"
          className={`flex-1 text-center py-2 rounded-md text-sm font-medium ${isAdmin ? "bg-[var(--color-background)]" : "text-[var(--color-foreground)]/60"}`}
        >
          Admin
        </Link>
      </div>

      <form action={isAdmin ? loginAdminAction : loginUserAction} className="space-y-4">
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
        <Button type="submit" className="w-full">Log in</Button>
        <Link href="/" className="block text-center text-sm text-[var(--color-foreground)]/60">Cancel</Link>
      </form>
    </main>
  );
}
