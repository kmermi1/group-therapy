import { joinAsAdminAction } from "@/app/actions/auth";
import { Button, Input, Label, PageHeader } from "@/components/ui";
import Link from "next/link";

export default function AdminJoinPage() {
  return (
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-8">
      <PageHeader
        title="Join as co-admin"
        subtitle="An existing admin shared an admin invite code. You'll become an admin of the same group."
      />
      <form action={joinAsAdminAction} className="space-y-4">
        <div>
          <Label htmlFor="inviteCode">Admin invite code</Label>
          <Input id="inviteCode" name="inviteCode" required autoCapitalize="characters" placeholder="e.g. KX72PWAB" />
        </div>
        <div>
          <Label htmlFor="username">Your admin username</Label>
          <Input id="username" name="username" required maxLength={40} />
        </div>
        <div>
          <Label htmlFor="password">Choose a password</Label>
          <Input id="password" name="password" type="password" required minLength={6} />
        </div>
        <Button type="submit" className="w-full">Become co-admin</Button>
        <Link href="/" className="block text-center text-sm text-[var(--color-foreground)]/60">Cancel</Link>
      </form>
    </main>
  );
}
