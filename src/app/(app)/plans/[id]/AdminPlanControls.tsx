"use client";

import { useState } from "react";
import { Button, Input, Label, Card } from "@/components/ui";
import { closePlanAction, clonePlanAction } from "@/app/actions/plans";
import { todayInGroupTz } from "@/lib/plans";

export default function AdminPlanControls({
  planId,
  planName,
  status,
}: {
  planId: string;
  planName: string;
  status: string;
}) {
  const [cloning, setCloning] = useState(false);
  return (
    <div className="mt-6 space-y-3">
      {status === "active" && (
        <form action={closePlanAction}>
          <input type="hidden" name="planId" value={planId} />
          <Button
            type="submit"
            variant="danger"
            className="w-full"
            onClick={(e) => {
              if (!confirm("Close this plan? Members can no longer claim or complete days.")) {
                e.preventDefault();
              }
            }}
          >
            Close plan
          </Button>
        </form>
      )}

      {!cloning ? (
        <Button type="button" variant="secondary" className="w-full" onClick={() => setCloning(true)}>
          Clone plan (start a new round)
        </Button>
      ) : (
        <Card>
          <h3 className="font-semibold mb-3">Clone plan</h3>
          <form action={clonePlanAction} className="space-y-3">
            <input type="hidden" name="planId" value={planId} />
            <div>
              <Label htmlFor="newName">New plan name</Label>
              <Input id="newName" name="newName" required defaultValue={`${planName} (2)`} />
            </div>
            <div>
              <Label htmlFor="newStartDate">Start date</Label>
              <Input id="newStartDate" name="newStartDate" type="date" defaultValue={todayInGroupTz()} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="copyAllocations" />
              Pre-fill allocations from this plan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button type="submit">Clone</Button>
              <Button type="button" variant="secondary" onClick={() => setCloning(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
