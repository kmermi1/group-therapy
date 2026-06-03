"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { claimRangeAction, releaseRangeAction, adminAssignRangeAction } from "@/app/actions/plans";

type AllocRow = { id: string; user_id: string; start_unit: number | null; end_unit: number | null; extra_id?: string | null };

export default function AllocationGrid({
  planId,
  unitsPerDay,
  blockSize,
  unitOwner,
  usernameMap,
  currentUserId,
  isAdmin,
  users,
  activeAllocs,
  planStatus,
  extras,
  extraOwners,
}: {
  planId: string;
  unitsPerDay: number;
  blockSize: number;
  unitOwner: Record<number, string>;
  usernameMap: Record<string, string>;
  currentUserId: string | null;
  isAdmin: boolean;
  users: { id: string; username: string }[];
  activeAllocs: AllocRow[];
  planStatus: string;
  extras: { id: string; name: string }[];
  extraOwners: Record<string, string>;
}) {
  const [selStart, setSelStart] = useState<number | null>(null);
  const [selEnd, setSelEnd] = useState<number | null>(null);
  const [assignTo, setAssignTo] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const closed = planStatus !== "active";

  const rangeStart = selStart != null && selEnd != null ? Math.min(selStart, selEnd) : selStart;
  const rangeEnd = selStart != null && selEnd != null ? Math.max(selStart, selEnd) : selStart;

  function onTileClick(n: number) {
    if (closed) return;
    const ownerId = unitOwner[n];
    if (ownerId) {
      // tap on own tile = open release prompt for that allocation
      if (ownerId === currentUserId || isAdmin) {
        // find which allocation contains this unit
        const alloc = activeAllocs.find((a) => a.user_id === ownerId && a.start_unit != null && a.end_unit != null && a.start_unit <= n && a.end_unit >= n);
        if (alloc && alloc.start_unit != null && alloc.end_unit != null) {
          if (!confirm(`Release ${alloc.start_unit}–${alloc.end_unit}?`)) return;
          const fd = new FormData();
          fd.set("allocId", alloc.id);
          start(async () => {
            try {
              if (ownerId === currentUserId) await releaseRangeAction(fd);
              else {
                // admin releasing someone else's: not directly supported; we'll
                // overwrite by reassigning via the admin form below instead.
                setError("To release someone else's range, reassign it from the admin form.");
              }
            } catch (e) { setError((e as Error).message); }
          });
        }
      }
      return;
    }
    // free tile -> start or extend selection
    setError(null);
    if (selStart == null) {
      setSelStart(n);
      setSelEnd(null);
    } else if (selEnd == null) {
      setSelEnd(n);
    } else {
      setSelStart(n);
      setSelEnd(null);
    }
  }

  function cancelSelection() {
    setSelStart(null);
    setSelEnd(null);
    setError(null);
  }

  function claimExtra(extraId: string) {
    if (closed) return;
    const existingOwner = extraOwners[extraId];
    if (existingOwner === currentUserId) {
      // your own: release
      const alloc = activeAllocs.find((a) => a.extra_id === extraId && a.user_id === currentUserId);
      if (!alloc) return;
      if (!confirm("Release this extra?")) return;
      const fd = new FormData();
      fd.set("allocId", alloc.id);
      start(async () => {
        try { await releaseRangeAction(fd); } catch (e) { setError((e as Error).message); }
      });
      return;
    }
    if (existingOwner && !isAdmin) return; // taken
    setError(null);
    const fd = new FormData();
    fd.set("planId", planId);
    fd.set("extraId", extraId);
    if (isAdmin) {
      if (!assignTo) { setError("Pick a member to assign this extra to."); return; }
      fd.set("targetUserId", assignTo);
      start(async () => {
        try { await adminAssignRangeAction(fd); } catch (e) { setError((e as Error).message); }
      });
    } else {
      start(async () => {
        try { await claimRangeAction(fd); } catch (e) { setError((e as Error).message); }
      });
    }
  }

  function submitClaim() {
    if (rangeStart == null || rangeEnd == null) return;
    // check no taken tile in between
    for (let n = rangeStart; n <= rangeEnd; n++) {
      if (unitOwner[n]) {
        setError(`Conflicts at ${n} — selection crosses a claimed range.`);
        return;
      }
    }
    // block alignment check
    if (((rangeStart - 1) % blockSize) !== 0 || (rangeEnd % blockSize) !== 0) {
      setError(`Range must align to blocks of ${blockSize} (start at 1, ${blockSize + 1}, etc.).`);
      return;
    }
    const fd = new FormData();
    fd.set("planId", planId);
    fd.set("startUnit", String(rangeStart));
    fd.set("endUnit", String(rangeEnd));
    start(async () => {
      try {
        if (isAdmin) {
          if (!assignTo) {
            setError("Pick a member to assign this range to.");
            return;
          }
          fd.set("targetUserId", assignTo);
          await adminAssignRangeAction(fd);
        } else {
          await claimRangeAction(fd);
        }
        setSelStart(null);
        setSelEnd(null);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: unitsPerDay }, (_, i) => i + 1).map((n) => {
          const ownerId = unitOwner[n];
          const isOwn = ownerId && ownerId === currentUserId;
          const inPreview =
            rangeStart != null && rangeEnd != null && n >= rangeStart && n <= rangeEnd && !ownerId;
          const isSelStart = selStart === n && selEnd == null;
          const classes = ownerId
            ? isOwn
              ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
              : "bg-[var(--color-border)]/60 text-[var(--color-foreground)]/70"
            : inPreview
              ? "bg-[var(--color-accent)]/40 border-[var(--color-accent)]"
              : isSelStart
                ? "ring-2 ring-[var(--color-accent)] bg-[var(--color-card)]"
                : "bg-[var(--color-card)] hover:bg-[var(--color-card)]/70";
          return (
            <button
              key={n}
              onClick={() => onTileClick(n)}
              disabled={pending || closed}
              className={`aspect-square text-[11px] font-mono rounded border border-[var(--color-border)] flex flex-col items-center justify-center px-1 leading-tight ${classes}`}
            >
              <span className="font-bold text-xs">{n}</span>
              {ownerId && (
                <span className="text-[8px] truncate max-w-full opacity-80">{usernameMap[ownerId] ?? "?"}</span>
              )}
            </button>
          );
        })}
      </div>

      {selStart != null && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
          <div className="text-sm">
            Selection: <span className="font-semibold">
              {rangeStart}{rangeEnd != null && rangeEnd !== rangeStart ? `–${rangeEnd}` : ""}
            </span>
            {rangeEnd == null && <span className="text-[var(--color-foreground)]/60"> (tap another tile to set end, or claim single)</span>}
          </div>
          {isAdmin && (
            <div className="mt-2">
              <label className="text-xs text-[var(--color-foreground)]/70 block mb-1">Assign to</label>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                <option value="">— pick member —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button type="button" onClick={submitClaim} disabled={pending}>
              {isAdmin ? "Assign" : "Claim"}
            </Button>
            <Button type="button" variant="secondary" onClick={cancelSelection} disabled={pending}>Cancel</Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {extras.length > 0 && (
        <div className="pt-2">
          <div className="text-xs uppercase tracking-wide text-[var(--foreground-mute)] font-medium mb-2">Extras</div>
          <div className="flex flex-wrap gap-2">
            {extras.map((ex) => {
              const ownerId = extraOwners[ex.id];
              const isOwn = ownerId && ownerId === currentUserId;
              return (
                <button
                  key={ex.id}
                  onClick={() => claimExtra(ex.id)}
                  disabled={pending || closed || (!!ownerId && !isOwn && !isAdmin)}
                  className={`text-sm px-3 py-2 rounded-lg border flex flex-col items-start gap-0.5 ${
                    isOwn
                      ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg)]"
                      : ownerId
                        ? "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-mute)]"
                        : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--accent)]"
                  }`}
                >
                  <span className="font-medium">{ex.name}</span>
                  {ownerId && <span className="text-[10px] opacity-80">{usernameMap[ownerId] ?? "?"}</span>}
                  {!ownerId && <span className="text-[10px] opacity-60">open</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[11px] text-[var(--foreground-mute)]">
        {closed
          ? "This plan is closed."
          : "Tap a free tile, then tap another to make a range. Tap your own tile to release it."}
      </p>
    </div>
  );
}
