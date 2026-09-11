import Link from "next/link";
import { CalendarPlus, History } from "lucide-react";
import { services } from "@/server/container";
import { requirePageUser } from "@/server/http/session";
import { PortalHeader } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { BookingStatusBadge } from "@/components/cards/badges";
import { ConfirmActionButton } from "@/components/portal/confirm-action-button";
import { formatDateTime } from "@/lib/format";
import { cancelBookingAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const user = await requirePageUser();
  const { bookings } = services();
  const [upcoming, history] = await Promise.all([bookings.listUpcomingForUser(user.id), bookings.listHistoryForUser(user.id)]);
  const now = Date.now();
  const past = history.filter((b) => b.schedule.startTime.getTime() < now || b.status === "CANCELLED");

  return (
    <>
      <PortalHeader
        title="Bookings"
        description="Cancel any time before a class starts — your seat is released immediately."
        actions={
          <Button asChild>
            <Link href="/classes">
              <CalendarPlus aria-hidden /> Book a class
            </Link>
          </Button>
        }
      />

      <section aria-labelledby="upcoming-heading" className="flex flex-col gap-4">
        <h2 id="upcoming-heading" className="font-display text-2xl text-bone-50">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarPlus} title="Nothing booked" message="Your next session is one click away." action={{ label: "Browse classes", href: "/classes" }} />
        ) : (
          <ul className="flex flex-col gap-3">
            {upcoming.map((b) => (
              <li key={b.id} className="flex flex-col gap-4 rounded-2xl border border-bone-50/8 bg-ink-800/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/classes/${b.schedule.class.slug}`} className="font-display text-xl uppercase text-bone-50 hover:text-ember-300">
                    {b.schedule.class.name}
                  </Link>
                  <p className="text-sm text-ink-300">
                    {formatDateTime(b.schedule.startTime)} · {b.schedule.accessObject.name} · with {b.schedule.trainer.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <BookingStatusBadge status={b.status} />
                  <ConfirmActionButton
                    action={cancelBookingAction.bind(null, b.id)}
                    label="Cancel"
                    ariaLabel={`Cancel ${b.schedule.class.name} on ${formatDateTime(b.schedule.startTime)}`}
                    title="Cancel this booking?"
                    description={`${b.schedule.class.name}, ${formatDateTime(b.schedule.startTime)}. Your seat goes straight back on the timetable.`}
                    confirmLabel="Cancel booking"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="history-heading" className="mt-12 flex flex-col gap-4">
        <h2 id="history-heading" className="font-display text-2xl text-bone-50">
          History
        </h2>
        {past.length === 0 ? (
          <EmptyState icon={History} title="No history yet" message="Classes you've attended or cancelled will show up here." />
        ) : (
          <ul className="divide-y divide-bone-50/6 overflow-hidden rounded-2xl border border-bone-50/8">
            {past.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-4 bg-ink-800/30 p-4 text-sm">
                <span className="text-bone-100">
                  {b.schedule.class.name} · {formatDateTime(b.schedule.startTime)}
                </span>
                <BookingStatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
