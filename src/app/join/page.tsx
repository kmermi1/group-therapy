import JoinForm from "./JoinForm";

export default function JoinPage() {
  // Join is bilingual; the page headings come from inside JoinForm based
  // on the user's language pick.
  return (
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Join a group / Gruba katıl</h1>
      </header>
      <JoinForm />
    </main>
  );
}
