import { ReactNode } from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  size = "md",
  ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit" | "reset";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "inline-flex items-center justify-center rounded-lg font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-[15px]",
  }[size];
  const variants = {
    primary:
      "bg-[var(--accent)] text-[var(--accent-fg)] hover:brightness-110",
    secondary:
      "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--border)]/40",
    ghost:
      "text-[var(--foreground)] hover:bg-[var(--surface)]",
    danger:
      "bg-[var(--danger)] text-white hover:brightness-110",
  };
  return (
    <button type={type} className={`${base} ${sizes} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm outline-none placeholder:text-[var(--foreground-mute)] transition focus:border-[var(--accent)] ${props.className || ""}`}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--foreground)] block mb-1.5">
      {children}
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-[26px] font-semibold tracking-tight leading-tight">{title}</h1>
      {subtitle ? (
        <p className="text-sm text-[var(--foreground-mute)] mt-1">{subtitle}</p>
      ) : null}
    </header>
  );
}
