"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/cards/badges";
import { useToast } from "@/components/ui/toast";
import type { BookingStatus } from "@/server/domain/types";
import { markAttendanceAction } from "../../actions";

export interface RosterEntry {
  bookingId: string;
  name: string;
  email: string;
  status: BookingStatus;
}

export function Roster({ entries, canMark }: { entries: RosterEntry[]; canMark: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const mark = async (entry: RosterEntry, status: "ATTENDED" | "NO_SHOW") => {
    setPendingId(entry.bookingId + status);
    const result = await markAttendanceAction(entry.bookingId, status);
    setPendingId(null);
    if (result.ok) {
      toast({ tone: "success", title: result.message ?? "Saved", description: entry.name });
      router.refresh();
    } else toast({ tone: "error", title: "Couldn't save", description: result.error });
  };

  return (
    <ul className="divide-y divide-bone-50/6 overflow-hidden rounded-2xl border border-bone-50/8">
      {entries.map((e) => (
        <li key={e.bookingId} className="flex flex-col gap-3 bg-ink-800/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-bone-50">{e.name}</p>
            <p className="text-sm text-ink-300">{e.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <BookingStatusBadge status={e.status} />
            {canMark && (
              <>
                <Button size="sm" variant={e.status === "ATTENDED" ? "primary" : "secondary"} onClick={() => mark(e, "ATTENDED")} loading={pendingId === e.bookingId + "ATTENDED"} aria-label={`Mark ${e.name} attended`}>
                  <Check aria-hidden /> Attended
                </Button>
                <Button size="sm" variant={e.status === "NO_SHOW" ? "danger" : "ghost"} onClick={() => mark(e, "NO_SHOW")} loading={pendingId === e.bookingId + "NO_SHOW"} aria-label={`Mark ${e.name} no-show`}>
                  <X aria-hidden /> No-show
                </Button>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
