import { services } from "@/server/container";
import { apiHandler } from "@/server/http/api";
import { requireUser } from "@/server/http/session";

/** DELETE /api/bookings/[id] — Member (owner) or Admin. Cancels and releases the seat immediately. */
export const DELETE = apiHandler<{ params: Promise<{ id: string }> }>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const booking = await services().bookings.cancelBooking({ id: user.id, role: user.role }, id);
  return { booking };
});
