import { NextResponse } from "next/server";
import { services } from "@/server/container";
import { apiHandler, readJson } from "@/server/http/api";
import { requireUser } from "@/server/http/session";
import { bookingSchema, parse } from "@/server/validation/schemas";
import { formatDateTime } from "@/lib/format";

/** POST /api/bookings — Member. Books a class via BookingService.bookClass (entitlement + capacity enforced there). */
export const POST = apiHandler(async (request) => {
  const user = await requireUser(["MEMBER"]);
  const { scheduleId } = parse(bookingSchema, await readJson(request));
  const { bookings, schedules, notifications } = services();

  const booking = await bookings.bookClass(user.id, scheduleId);

  const detail = await schedules.getDetail(scheduleId);
  await notifications
    .bookingConfirmed(user.email, {
      className: detail.class.name,
      startsAt: formatDateTime(detail.startTime),
      trainerName: detail.trainer.name,
      spaceName: detail.accessObject.name,
    })
    .catch((error) => console.error("[bookings] confirmation email failed", error));

  return NextResponse.json({ booking, schedule: { id: detail.id, bookedCount: detail.bookedCount, capacity: detail.capacity } }, { status: 201 });
});

/** GET /api/bookings — Member. The signed-in member's upcoming bookings (used to mark "Booked" in timetables). */
export const GET = apiHandler(async () => {
  const user = await requireUser();
  const upcoming = await services().bookings.listUpcomingForUser(user.id);
  return { bookings: upcoming.map((b) => ({ id: b.id, scheduleId: b.scheduleId, status: b.status })) };
});
