"use client";

import { useState, useTransition } from "react";
import { markReadingDayAction, unmarkReadingDayAction } from "@/app/actions/reading";

export default function HistoryReadingDayButton({
  date,
  allocationId,
  isCompleted,
}: {
  date: string;
  allocationId: string;
  isCompleted: boolean;
}) {
  const [optimisticCompleted, setOptimisticCompleted] = useState(isCompleted);
  const [pending, start] = useTransition();

  function handleClick() {
    const newState = !optimisticCompleted;
    setOptimisticCompleted(newState);

    const fd = new FormData();
    fd.set("allocationId", allocationId);
    fd.set("forDate", date);

    start(async () => {
      try {
        if (newState) {
          await markReadingDayAction(fd);
        } else {
          await unmarkReadingDayAction(fd);
        }
      } catch (e) {
        setOptimisticCompleted(!newState);
        console.error("Failed to toggle reading day:", e);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`flex-1 px-2 py-1 text-xs rounded border text-left transition-all duration-200 ${
        optimisticCompleted
          ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-accent-fg)]"
          : "border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-card)]/70"
      } ${pending ? "opacity-75" : ""}`}
    >
      {date}
    </button>
  );
}
