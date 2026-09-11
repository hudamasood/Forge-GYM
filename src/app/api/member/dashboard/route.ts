import { apiHandler } from "@/server/http/api";
import { requireUser } from "@/server/http/session";
import { memberDashboard } from "@/server/queries/member-dashboard";

/** GET /api/member/dashboard — Member. Membership + bookings + orders in one payload. */
export const GET = apiHandler(async () => {
  const user = await requireUser(["MEMBER"]);
  return memberDashboard(user.id);
});
