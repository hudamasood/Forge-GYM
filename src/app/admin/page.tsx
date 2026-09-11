import { services } from "@/server/container";
import { PortalHeader } from "@/components/layout/portal-shell";
import { Panel } from "@/components/admin/admin-ui";
import { KpiGrid, LowStock, MembershipsByPlan } from "@/components/admin/analytics-panels";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [summary, audit] = await Promise.all([services().analytics.summary(), services().audit.recent(12)]);
  return (
    <>
      <PortalHeader title="Overview" description="Revenue, memberships, bookings and inventory at a glance." />
      <KpiGrid summary={summary} />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MembershipsByPlan summary={summary} />
        <LowStock summary={summary} />
      </div>
      <Panel title="Recent admin activity" className="mt-6">
        {audit.length === 0 ? (
          <p className="text-sm text-ink-300">No admin changes yet. Every create, update and delete is recorded here.</p>
        ) : (
          <ul className="divide-y divide-bone-50/6 text-sm">
            {audit.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2.5">
                <span className="text-bone-100">
                  <span className="font-medium text-bone-50">{a.actorName}</span> {a.action} {a.entity}
                  {a.entityId ? <span className="text-ink-400"> · {a.entityId.slice(-8)}</span> : null}
                </span>
                <span className="text-ink-300">{formatDateTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
