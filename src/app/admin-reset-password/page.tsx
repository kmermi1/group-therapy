import { PageHeader, Card } from "@/components/ui";
import AdminResetPasswordForm from "./AdminResetPasswordForm";

export default function AdminResetPasswordPage() {
  return (
    <main className="max-w-md mx-auto w-full px-5 py-6">
      <PageHeader title="Reset Password" subtitle="Enter your reset code to create a new password" />

      <Card>
        <AdminResetPasswordForm />
      </Card>
    </main>
  );
}
