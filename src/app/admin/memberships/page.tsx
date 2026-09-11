import { CreditCard } from "lucide-react";
import { services } from "@/server/container";
import { pageQuerySchema } from "@/server/validation/schemas";
import { MEMBERSHIP_STATUSES, type MembershipStatus } from "@/server/domain/types";
import { PortalHeader } from "@/components/layout/portal-shell";
import { Pagination, Panel, SearchBar } from "@/components/admin/admin-ui";
import { FilterChips } from "@/components/layout/filter-chips";
import { StatusSelect } from "@/components/admin/status-select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { formatDate, titleCase } from "@/lib/format";
import { setMembershipStatusAction } from "../actions";
import { PlanPricingForm } from "./plan-pricing-form";

export const dynamic = "force-dynamic";

export default async function AdminMembershipsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const query = pageQuerySchema.parse(params);
  const status = MEMBERSHIP_STATUSES.includes(params.status as MembershipStatus) ? (params.status as MembershipStatus) : undefined;
  const [plans, result] = await Promise.all([services().memberships.listPlans(), services().memberships.listAll({ ...query, status, pageSize: 20 })]);

  return (
    <>
      <PortalHeader title="Memberships" description="Plan pricing and every member's subscription. Prices are in USD; leave Stripe price ids empty to price checkout inline." />

      <Panel title="Plans & pricing" className="mb-8">
        <ul className="flex flex-col divide-y divide-bone-50/6">
          {plans.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
              <p className="font-medium text-bone-50">
                {p.name} <span className="text-sm font-normal text-ink-300">· {p.accessObject?.name ?? "All six spaces"}</span>
              </p>
              <PlanPricingForm plan={p} />
            </li>
          ))}
        </ul>
      </Panel>

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          label="Filter by status"
          param="status"
          basePath="/admin/memberships"
          current={status}
          otherParams={{ search: query.search }}
          options={[{ label: "All", value: undefined }, ...MEMBERSHIP_STATUSES.map((s) => ({ label: titleCase(s), value: s }))]}
        />
        <SearchBar action="/admin/memberships" defaultValue={query.search} placeholder="Search member email" hidden={{ status }} />
      </div>

      {result.items.length === 0 ? (
        <EmptyState icon={CreditCard} title="No memberships found" message="Memberships appear here once members check out." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Member</TH>
              <TH>Plan</TH>
              <TH>Billing</TH>
              <TH>Period ends</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {result.items.map((m) => (
              <TR key={m.id}>
                <TD>
                  <span className="block font-medium text-bone-50">{m.user.name}</span>
                  <span className="text-xs text-ink-300">{m.user.email}</span>
                </TD>
                <TD>{m.plan.name}</TD>
                <TD>{titleCase(m.billingInterval)}</TD>
                <TD>{m.currentPeriodEnd ? formatDate(m.currentPeriodEnd) : "—"}</TD>
                <TD>
                  <StatusSelect value={m.status} options={MEMBERSHIP_STATUSES} action={setMembershipStatusAction.bind(null, m.id)} label={`Status for ${m.user.email} ${m.plan.name}`} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} basePath="/admin/memberships" params={{ search: query.search, status }} />
    </>
  );
}
