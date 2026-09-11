import { services } from "@/server/container";
import { PortalHeader } from "@/components/layout/portal-shell";
import { Panel } from "@/components/admin/admin-ui";
import { KpiGrid, LowStock, MembershipsByPlan } from "@/components/admin/analytics-panels";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const summary = await services().analytics.summary();
  const annualRunRate = summary.monthlyRecurringCents * 12;
  const aov = summary.paidOrders ? Math.round(summary.revenueCents / summary.paidOrders) : 0;

  return (
    <>
      <PortalHeader title="Analytics" description="Basic revenue and inventory counts. Deeper analytics and charts are on the post-launch backlog." />
      <KpiGrid summary={summary} />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Panel title="Membership annual run-rate">
          <p className="font-display text-4xl text-bone-50">{formatUsd(annualRunRate)}</p>
          <p className="mt-1 text-sm text-ink-300">Monthly recurring × 12, annual plans normalised per month.</p>
        </Panel>
        <Panel title="Average store order">
          <p className="font-display text-4xl text-bone-50">{formatUsd(aov)}</p>
          <p className="mt-1 text-sm text-ink-300">Across {summary.paidOrders} paid or fulfilled orders.</p>
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MembershipsByPlan summary={summary} />
        <LowStock summary={summary} />
      </div>
    </>
  );
}
