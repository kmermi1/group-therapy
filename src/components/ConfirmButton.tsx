"use client";

import { ReactNode } from "react";

export default function ConfirmButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
