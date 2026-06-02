import { ReactNode } from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit" | "reset";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-medium text-sm transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-[var(--accent)] text-[var(--accent-fg)] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_4px_12px_-6px_rgba(45,106,79,0.45)] hover:brightness-[1.04]",
    secondary:
      "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--paper-deep)]",
    ghost:
      "text-[var(--foreground)] hover:bg-[var(--paper-deep)]",
    danger:
      "bg-[#a8412e] text-[#faf6f0] hover:brightness-110",
  };
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm outline-none placeholder:text-[var(--foreground-mute)] ${props.className || ""}`}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs uppercase tracking-[0.08em] text-[var(--foreground-mute)] block mb-1.5 font-medium">
      {children}
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 ${className}`}
      style={{ boxShadow: "var(--shadow-paper)" }}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-7">
      <h1 className="display text-[28px] leading-[1.1]">{title}</h1>
      {subtitle ? (
        <p className="text-sm text-[var(--foreground-mute)] mt-1.5 italic">{subtitle}</p>
      ) : null}
      <div className="rule rule-dot mt-4" />
    </header>
  );
}

export function SectionDivider() {
  return <div className="rule rule-dot my-6" />;
}

/** A small ornamental flourish — geometric four-pointed star.
 *  Used as decorative spacer at section breaks for plans/long-term. */
export function Flourish({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="14"
      height="14"
      className={`inline-block text-[var(--rule)] ${className}`}
      aria-hidden="true"
    >
      <path
        d="M10 0 L11.5 8.5 L20 10 L11.5 11.5 L10 20 L8.5 11.5 L0 10 L8.5 8.5 Z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}
