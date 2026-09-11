import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { services } from "@/server/container";
import { isDomainError } from "@/server/domain/errors";
import { requirePageUser } from "@/server/http/session";
import { PortalHeader } from "@/components/layout/portal-shell";
import { EmptyState } from "@/components/ui/states";
import { formatDateTime, formatTime } from "@/lib/format";
import { Roster } from "./roster";

export const dynamic = "force-dynamic";

export default async function RosterPage({ params }: { params: Promise<{ scheduleId: string }> }) {
  const user = await requirePageUser();
  const { scheduleId } = await params;
  const trainer = await services().trainers.findByUserId(user.id);

  let roster;
  try {
    roster = await services().schedules.roster({ role: user.role, trainerId: trainer?.id ?? null }, scheduleId);
  } catch (error) {
    if (isDomainError(error, "NOT_FOUND") || isDomainError(error, "FORBIDDEN")) notFound();
    throw error;
  }
  const { schedule, bookings } = roster;
  const started = schedule.startTime.getTime() <= Date.now();

  return (
    <>
      <Link href="/trainer/attendance" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-300 hover:text-bone-50">
        <ArrowLeft className="size-4" aria-hidden /> All sessions
      </Link>
      <PortalHeader
        title={schedule.class.name}
        description={`${formatDateTime(schedule.startTime)} – ${formatTime(schedule.endTime)} · ${schedule.accessObject.name} · ${bookings.length}/${schedule.capacity} booked`}
      />
      {!started && bookings.length > 0 && <p className="mb-4 text-sm text-ink-300">You can mark attendance once the session starts.</p>}
      {bookings.length === 0 ? (
        <EmptyState icon={Users} title="No one booked yet" message="Members who book this session will appear here." />
      ) : (
        <Roster
          canMark={started}
          entries={bookings.map((b) => ({ bookingId: b.id, name: b.user.name, email: b.user.email, status: b.status }))}
        />
      )}
    </>
  );
}
