import Link from "next/link";
import { CheckCircle2, CreditCard } from "lucide-react";
import { services } from "@/server/container";
import { requirePageUser } from "@/server/http/session";
import { PortalHeader } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { MembershipStatusBadge } from "@/components/cards/badges";
import { ObjectIcon } from "@/components/brand/art";
import { ConfirmActionButton } from "@/components/portal/confirm-action-button";
import { formatDate, formatUsd } from "@/lib/format";
import { ENTITLED_MEMBERSHIP_STATUSES } from "@/server/domain/types";
import { cancelMembershipAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function MembershipPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const user = await requirePageUser();
  const [memberships, success] = await Promise.all([services().memberships.listForUser(user.id), searchParams.then((p) => p.checkout === "success")]);
  const hasAllAccess = memberships.some((m) => m.plan.type === "ALL_ACCESS" && ENTITLED_MEMBERSHIP_STATUSES.includes(m.status));

  return (
    <>
      <PortalHeader
        title="Membership"
        description="Your plans, what they cover and when they renew."
        actions={
          !hasAllAccess && (
            <Button asChild variant="outline">
              <Link href="/memberships">{memberships.length ? "Add a space or go All-Access" : "Choose a membership"}</Link>
            </Button>
          )
        }
      />

      {success && (
        <p role="status" className="mb-6 flex items-center gap-2 rounded-2xl border border-success-light/30 bg-success/10 p-5 text-success-light">
          <CheckCircle2 className="size-5 shrink-0" aria-hidden /> Payment received — welcome aboard. Your membership activates the moment payment is confirmed, usually within seconds.
        </p>
      )}

      {memberships.length === 0 ? (
        <EmptyState icon={CreditCard} title="No membership yet" message="Pick a single space from $35/month, or unlock all six with All-Access." action={{ label: "Compare memberships", href: "/memberships" }} />
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {memberships.map((m) => {
            const entitled = ENTITLED_MEMBERSHIP_STATUSES.includes(m.status);
            const price = m.billingInterval === "MONTHLY" ? m.plan.priceMonthly : m.plan.priceAnnual;
            return (
              <li key={m.id} className={entitled ? "rounded-2xl border border-ember-400/30 bg-ember-500/[0.06] p-6" : "rounded-2xl border border-bone-50/8 bg-ink-800/40 p-6 opacity-80"}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl border border-bone-50/10 bg-ink-900 text-ember-300">
                      {m.plan.accessObject ? <ObjectIcon slug={m.plan.accessObject.slug} className="size-5" /> : <CreditCard className="size-5" aria-hidden />}
                    </span>
                    <div>
                      <h2 className="font-display text-2xl text-bone-50">{m.plan.name}</h2>
                      <p className="text-sm text-ink-300">{m.plan.accessObject ? `${m.plan.accessObject.name} classes and access` : "Every space, every class"}</p>
                    </div>
                  </div>
                  <MembershipStatusBadge status={m.status} />
                </div>
                <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-ink-300">Billing</dt>
                    <dd className="text-bone-50">
                      {formatUsd(price)} / {m.billingInterval === "MONTHLY" ? "month" : "year"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-300">{entitled ? "Current period ends" : "Ended"}</dt>
                    <dd className="text-bone-50">{m.currentPeriodEnd ? formatDate(m.currentPeriodEnd) : "—"}</dd>
                  </div>
                </dl>
                {entitled && (
                  <div className="mt-6 flex flex-wrap gap-3 border-t border-bone-50/8 pt-5">
                    <Button asChild size="sm">
                      <Link href={m.plan.accessObject ? `/classes?object=${m.plan.accessObject.slug}` : "/classes"}>Book a class</Link>
                    </Button>
                    <ConfirmActionButton
                      action={cancelMembershipAction.bind(null, m.id)}
                      label="Cancel membership"
                      ariaLabel={`Cancel ${m.plan.name}`}
                      title={`Cancel ${m.plan.name}?`}
                      description={`You won't be charged again. You keep access${m.currentPeriodEnd ? ` until ${formatDate(m.currentPeriodEnd)}` : ""}.`}
                      confirmLabel="Cancel membership"
                      variant="ghost"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
