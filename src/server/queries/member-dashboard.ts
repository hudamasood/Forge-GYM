import "server-only";
import { services } from "@/server/container";

/** Aggregate for the member overview (spec B3: GET /api/member/dashboard). */
export async function memberDashboard(userId: string) {
  const { memberships, bookings, orders } = services();
  const [allMemberships, active, coverage, upcoming, orderHistory] = await Promise.all([
    memberships.listForUser(userId),
    memberships.activeForUser(userId),
    memberships.coverageForUser(userId),
    bookings.listUpcomingForUser(userId),
    orders.listForUser(userId),
  ]);
  return {
    memberships: allMemberships,
    activeMemberships: active,
    coverage,
    pastDue: active.some((m) => m.status === "PAST_DUE"),
    upcomingBookings: upcoming,
    recentOrders: orderHistory.slice(0, 5),
  };
}
