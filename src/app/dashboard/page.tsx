import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarPlus, ShoppingBag } from "lucide-react";
import { requirePageUser } from "@/server/http/session";
import { memberDashboard } from "@/server/queries/member-dashboard";
import { PortalHeader, StatCard } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { OrderStatusBadge } from "@/components/cards/badges";
import { formatDate, formatDateTime, formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MemberOverviewPage() {
  const user = await requirePageUser();
  const data = await memberDashboard(user.id);
  const first = user.name.split(" ")[0];
  const coverageLabel = data.coverage === "ALL" ? "All six spaces" : data.coverage.length ? `${data.coverage.length} space${data.coverage.length > 1 ? "s" : ""}` : "None yet";
  const nextBooking = data.upcomingBookings[0];

  return (
    <>
      <PortalHeader
        title={`Hey, ${first}`}
        description="Your membership, bookings and orders at a glance."
        actions={
          <Button asChild>
            <Link href="/classes">
              <CalendarPlus aria-hidden /> Book a class
            </Link>
          </Button>
        }
      />

      {data.pastDue && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-warning-light/40 bg-warning/10 p-5 text-warning-light">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>
            Your last membership payment didn&apos;t go through. Your access continues for now — please update your payment method to avoid interruption.{" "}
            <Link href="/dashboard/membership" className="font-medium underline">
              Manage membership
            </Link>
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Membership"
          value={data.activeMemberships.length ? data.activeMemberships.map((m) => m.plan.name).join(" + ") : "No plan"}
          hint={data.activeMemberships.length ? `Covers ${coverageLabel.toLowerCase()}` : <Link className="text-ember-300 hover:underline" href="/memberships">Choose a membership</Link>}
          tone="ember"
        />
        <StatCard label="Spaces covered" value={coverageLabel} />
        <StatCard label="Upcoming bookings" value={data.upcomingBookings.length} hint={nextBooking ? `Next: ${formatDateTime(nextBooking.schedule.startTime)}` : "Nothing booked"} />
        <StatCard label="Orders" value={data.recentOrders.length} hint={data.recentOrders[0] ? `Last on ${formatDate(data.recentOrders[0].createdAt)}` : "No orders yet"} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="next-heading" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 id="next-heading" className="font-display text-2xl text-bone-50">
              Next up
            </h2>
            <Link href="/dashboard/bookings" className="text-sm text-ember-300 hover:text-ember-100">
              All bookings
            </Link>
          </div>
          {data.upcomingBookings.length === 0 ? (
            <EmptyState icon={CalendarPlus} title="No classes booked" message="Browse the timetable and grab a spot." action={{ label: "Browse classes", href: "/classes" }} />
          ) : (
            <ul className="flex flex-col gap-3">
              {data.upcomingBookings.slice(0, 4).map((b) => (
                <li key={b.id}>
                  <Link href={`/classes/${b.schedule.class.slug}`} className="group flex items-center justify-between gap-4 rounded-2xl border border-bone-50/8 bg-ink-800/60 p-5 transition-colors hover:border-bone-50/15">
                    <div>
                      <p className="font-display text-xl uppercase text-bone-50 group-hover:text-ember-300">{b.schedule.class.name}</p>
                      <p className="text-sm text-ink-300">
                        {formatDateTime(b.schedule.startTime)} · {b.schedule.accessObject.name} · {b.schedule.trainer.name}
                      </p>
                    </div>
                    <ArrowRight className="size-5 text-ink-300 transition-transform group-hover:translate-x-1" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="orders-heading" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 id="orders-heading" className="font-display text-2xl text-bone-50">
              Recent orders
            </h2>
            <Link href="/dashboard/orders" className="text-sm text-ember-300 hover:text-ember-100">
              Order history
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No orders yet" message="Fuel, gear and programs from the FORGE store." action={{ label: "Visit the store", href: "/store" }} />
          ) : (
            <ul className="flex flex-col gap-3">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 rounded-2xl border border-bone-50/8 bg-ink-800/60 p-5">
                  <div>
                    <p className="text-bone-50">{o.items.map((i) => `${i.quantity} × ${i.product?.name}`).join(", ")}</p>
                    <p className="text-sm text-ink-300">{formatDate(o.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-display text-lg text-bone-50">{formatUsd(o.total)}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
