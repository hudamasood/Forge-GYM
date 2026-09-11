"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, CalendarCheck, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ScheduleRow {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  className: string;
  trainer: { name: string; slug: string };
  accessObject: { name: string; slug: string };
}

type Outcome =
  | { kind: "idle" }
  | { kind: "success" }
  | { kind: "login" }
  | { kind: "not-covered"; message: string }
  | { kind: "full" }
  | { kind: "error"; message: string };

/**
 * Timetable with inline booking (spec B4: Modal used for inline class
 * booking). A table on desktop; stacked cards below md.
 */
export function ScheduleTable({ rows, showClassName = false }: { rows: ScheduleRow[]; showClassName?: boolean }) {
  const pathname = usePathname();
  const { status } = useSession();
  const toast = useToast();
  const [seats, setSeats] = React.useState(() => new Map(rows.map((r) => [r.id, r.bookedCount])));
  const [booked, setBooked] = React.useState<Set<string>>(new Set());
  const [selected, setSelected] = React.useState<ScheduleRow | null>(null);
  const [pending, setPending] = React.useState(false);
  const [outcome, setOutcome] = React.useState<Outcome>({ kind: "idle" });

  React.useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetch("/api/bookings")
      .then((r) => (r.ok ? r.json() : { bookings: [] }))
      .then((data: { bookings: { scheduleId: string }[] }) => !cancelled && setBooked(new Set(data.bookings.map((b) => b.scheduleId))))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [status]);

  const open = (row: ScheduleRow) => {
    setSelected(row);
    setOutcome(status === "unauthenticated" ? { kind: "login" } : { kind: "idle" });
  };

  const confirm = async () => {
    if (!selected) return;
    setPending(true);
    try {
      const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduleId: selected.id }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setSeats((m) => new Map(m).set(selected.id, body.schedule?.bookedCount ?? (m.get(selected.id) ?? 0) + 1));
        setBooked((s) => new Set(s).add(selected.id));
        setOutcome({ kind: "success" });
        toast({ tone: "success", title: "You're booked", description: `${selected.className} · ${formatDateTime(selected.startTime)}` });
      } else if (res.status === 401) setOutcome({ kind: "login" });
      else if (res.status === 403) setOutcome({ kind: "not-covered", message: body.error?.message ?? "Your membership doesn't cover this space." });
      else if (body.error?.code === "CAPACITY_REACHED") {
        setSeats((m) => new Map(m).set(selected.id, selected.capacity));
        setOutcome({ kind: "full" });
      } else if (res.status === 409) {
        setBooked((s) => new Set(s).add(selected.id));
        setOutcome({ kind: "error", message: body.error?.message ?? "You're already booked into this class." });
      } else setOutcome({ kind: "error", message: body.error?.message ?? "Booking failed. Please try again." });
    } catch {
      setOutcome({ kind: "error", message: "Network error — check your connection and try again." });
    } finally {
      setPending(false);
    }
  };

  const seatLabel = (row: ScheduleRow) => {
    const left = Math.max(row.capacity - (seats.get(row.id) ?? row.bookedCount), 0);
    return { left, text: left === 0 ? "Full" : `${left} of ${row.capacity} left`, tone: left === 0 ? "text-error-light" : left <= 3 ? "text-warning-light" : "text-bone-200" };
  };

  const action = (row: ScheduleRow) => {
    const { left } = seatLabel(row);
    if (booked.has(row.id))
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-light">
          <CheckCircle2 className="size-4" aria-hidden /> Booked
        </span>
      );
    return (
      <Button size="sm" variant={left === 0 ? "secondary" : "primary"} disabled={left === 0} onClick={() => open(row)} aria-label={`Book ${row.className} on ${formatDateTime(row.startTime)}`}>
        {left === 0 ? "Full" : "Book"}
      </Button>
    );
  };

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-bone-50/8 md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Upcoming sessions</caption>
          <thead className="bg-ink-800 text-xs uppercase tracking-wider text-ink-300">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Date</th>
              <th scope="col" className="px-5 py-3 font-medium">Time</th>
              {showClassName && <th scope="col" className="px-5 py-3 font-medium">Class</th>}
              <th scope="col" className="px-5 py-3 font-medium">Coach</th>
              <th scope="col" className="px-5 py-3 font-medium">Seats</th>
              <th scope="col" className="px-5 py-3 text-right font-medium"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bone-50/6">
            {rows.map((row) => {
              const seat = seatLabel(row);
              return (
                <tr key={row.id} className="transition-colors hover:bg-bone-50/[0.03]">
                  <td className="px-5 py-4 text-bone-50">{formatDate(row.startTime, { weekday: "short", year: undefined })}</td>
                  <td className="px-5 py-4 text-bone-100">
                    {formatTime(row.startTime)} – {formatTime(row.endTime)}
                  </td>
                  {showClassName && <td className="px-5 py-4 font-medium text-bone-50">{row.className}</td>}
                  <td className="px-5 py-4">
                    <Link href={`/trainers/${row.trainer.slug}`} className="text-bone-100 underline-offset-4 hover:text-ember-300 hover:underline">
                      {row.trainer.name}
                    </Link>
                  </td>
                  <td className={cn("px-5 py-4", seat.tone)}>{seat.text}</td>
                  <td className="px-5 py-4 text-right">{action(row)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards (spec B4: no horizontal scroll below md) */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => {
          const seat = seatLabel(row);
          return (
            <li key={row.id} className="flex items-center justify-between gap-4 rounded-xl border border-bone-50/8 bg-ink-800/60 p-4">
              <div className="flex flex-col gap-1">
                {showClassName && <span className="font-medium text-bone-50">{row.className}</span>}
                <span className="font-display text-lg text-bone-50">{formatDateTime(row.startTime)}</span>
                <span className="text-sm text-ink-300">with {row.trainer.name}</span>
                <span className={cn("text-sm", seat.tone)}>{seat.text}</span>
              </div>
              {action(row)}
            </li>
          );
        })}
      </ul>

      <Dialog open={selected !== null} onOpenChange={(o) => !o && !pending && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{outcome.kind === "success" ? "You're booked" : `Book ${selected.className}`}</DialogTitle>
                <DialogDescription>
                  {formatDateTime(selected.startTime, { year: "numeric" })} · {selected.accessObject.name} · with {selected.trainer.name}
                </DialogDescription>
              </DialogHeader>

              {outcome.kind === "idle" && (
                <p className="text-sm leading-relaxed text-bone-200">
                  Your seat is held the moment you confirm. Cancel from your dashboard any time before the class starts and the seat is released to someone else.
                </p>
              )}
              {outcome.kind === "success" && (
                <p className="flex items-start gap-2 text-sm text-success-light">
                  <CalendarCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> Confirmed. We&apos;ve emailed you the details.
                </p>
              )}
              {outcome.kind === "login" && (
                <p className="flex items-start gap-2 text-sm text-bone-200">
                  <Lock className="mt-0.5 size-4 shrink-0 text-ember-400" aria-hidden /> Log in with a membership that covers the {selected.accessObject.name} to book this class.
                </p>
              )}
              {outcome.kind === "not-covered" && (
                <p role="alert" className="flex items-start gap-2 text-sm text-warning-light">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {outcome.message}. Add the {selected.accessObject.name} plan or upgrade to All-Access.
                </p>
              )}
              {outcome.kind === "full" && (
                <p role="alert" className="flex items-start gap-2 text-sm text-error-light">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> This class just filled up. Pick another session.
                </p>
              )}
              {outcome.kind === "error" && (
                <p role="alert" className="flex items-start gap-2 text-sm text-error-light">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {outcome.message}
                </p>
              )}

              <DialogFooter>
                {outcome.kind === "idle" && (
                  <>
                    <Button variant="ghost" onClick={() => setSelected(null)} disabled={pending}>
                      Cancel
                    </Button>
                    <Button onClick={confirm} loading={pending} loadingText="Booking…">
                      Confirm booking
                    </Button>
                  </>
                )}
                {outcome.kind === "success" && (
                  <>
                    <Button variant="ghost" onClick={() => setSelected(null)}>
                      Close
                    </Button>
                    <Button asChild>
                      <Link href="/dashboard/bookings">View my bookings</Link>
                    </Button>
                  </>
                )}
                {outcome.kind === "login" && (
                  <>
                    <Button asChild variant="secondary">
                      <Link href={`/signup?callbackUrl=${encodeURIComponent(pathname)}`}>Create account</Link>
                    </Button>
                    <Button asChild>
                      <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}>Log in</Link>
                    </Button>
                  </>
                )}
                {outcome.kind === "not-covered" && (
                  <Button asChild>
                    <Link href="/memberships">View memberships</Link>
                  </Button>
                )}
                {(outcome.kind === "full" || outcome.kind === "error") && (
                  <Button variant="secondary" onClick={() => setSelected(null)}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
