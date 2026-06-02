import JoinForm from "./JoinForm";
import { PageHeader } from "@/components/ui";

export default function JoinPage() {
  return (
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-8">
      <PageHeader title="Join a group" subtitle="Enter the group code your admin gave you. The app will generate a funny username for you." />
      <JoinForm />
    </main>
  );
}
