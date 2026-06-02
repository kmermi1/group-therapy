import JoinForm from "./JoinForm";
import { Flourish } from "@/components/ui";

export default function JoinPage() {
  return (
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-10 reveal">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 text-[var(--rule)] mb-3">
          <Flourish />
        </div>
        <h1 className="display text-[32px] leading-[1.0]">
          Join a group
        </h1>
        <p className="display italic text-[16px] text-[var(--foreground-mute)] mt-1">Gruba katıl</p>
        <div className="rule rule-dot mt-5" />
      </header>
      <JoinForm />
    </main>
  );
}
