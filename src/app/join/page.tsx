import JoinFlow from "./JoinFlow";

export default function JoinPage() {
  return (
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-8 reveal">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Join a group</h1>
      </header>
      <JoinFlow />
    </main>
  );
}
