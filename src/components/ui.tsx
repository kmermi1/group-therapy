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
    "inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-medium text-sm transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:opacity-90",
    secondary: "bg-[var(--color-card)] text-[var(--color-foreground)] border border-[var(--color-border)] hover:bg-[var(--color-border)]/40",
    ghost: "text-[var(--color-foreground)] hover:bg-[var(--color-card)]",
    danger: "bg-red-600 text-white hover:bg-red-700",
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
      className={`w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] ${props.className || ""}`}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--color-foreground)] block mb-1.5">
      {children}
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle ? <p className="text-sm text-[var(--color-foreground)]/60 mt-1">{subtitle}</p> : null}
    </header>
  );
}
