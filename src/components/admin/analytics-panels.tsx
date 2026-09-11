import Link from "next/link";
import { StatCard } from "@/components/layout/portal-shell";
import { Panel } from "@/components/admin/admin-ui";
import { formatUsd } from "@/lib/format";
import type { AnalyticsSummary } from "@/server/repositories/interfaces";

export function KpiGrid({ summary }: { summary: AnalyticsSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Store revenue" value={formatUsd(summary.revenueCents)} hint={`${summary.paidOrders} paid orders`} tone="ember" />
      <StatCard label="Monthly recurring" value={formatUsd(summary.monthlyRecurringCents)} hint={`${summary.activeMemberships} active memberships`} />
      <StatCard label="Members" value={summary.members} />
      <StatCard label="Upcoming bookings" value={summary.upcomingBookings} />
    </div>
  );
}

/** Horizontal bars — no chart library needed for a single series. */
export function MembershipsByPlan({ summary }: { summary: AnalyticsSummary }) {
  const max = Math.max(1, ...summary.membershipsByPlan.map((p) => p.count));
  return (
    <Panel title="Active memberships by plan">
      {summary.membershipsByPlan.length === 0 ? (
        <p className="text-sm text-ink-300">No active memberships yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {summary.membershipsByPlan.map((p) => (
            <li key={p.planName} className="grid grid-cols-[9rem_1fr_2.5rem] items-center gap-3 text-sm">
              <span className="truncate text-bone-100">{p.planName}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-ink-700" aria-hidden>
                <span className="block h-full rounded-full bg-ember-gradient" style={{ width: `${(p.count / max) * 100}%` }} />
              </span>
              <span className="text-right font-medium text-bone-50">{p.count}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function LowStock({ summary }: { summary: AnalyticsSummary }) {
  return (
    <Panel title="Low stock" actions={<Link href="/admin/products" className="text-sm text-ember-300 hover:text-ember-100">Manage products</Link>}>
      {summary.lowStockProducts.length === 0 ? (
        <p className="text-sm text-ink-300">All physical products are well stocked.</p>
      ) : (
        <ul className="divide-y divide-bone-50/6 text-sm">
          {summary.lowStockProducts.map((p) => (
            <li key={p.id} className="flex justify-between gap-3 py-2.5">
              <Link href={`/admin/products/${p.id}`} className="text-bone-100 hover:text-ember-300">
                {p.name}
              </Link>
              <span className={p.stock <= 0 ? "text-error-light" : "text-warning-light"}>{p.stock <= 0 ? "Out of stock" : `${p.stock} left`}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
