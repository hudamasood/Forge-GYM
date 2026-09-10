import { Check, Crown } from "lucide-react";
import { ObjectIcon } from "@/components/brand/art";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/format";
import type { BillingInterval, PlanType } from "@/server/domain/types";

export interface PlanCardData {
  slug: string;
  name: string;
  type: PlanType;
  priceMonthly: number;
  priceAnnual: number;
  benefits: string[];
  accessObject: { slug: string; name: string } | null;
}

export function PlanCard({ plan, interval, action }: { plan: PlanCardData; interval: BillingInterval; action: React.ReactNode }) {
  const featured = plan.type === "ALL_ACCESS";
  const price = interval === "MONTHLY" ? plan.priceMonthly : plan.priceAnnual;
  const saving = plan.priceMonthly * 12 - plan.priceAnnual;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col gap-6 overflow-hidden rounded-2xl border p-7 transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-forge)] hover:-translate-y-1",
        featured
          ? "border-ember-400/50 bg-[linear-gradient(160deg,rgba(194,65,12,0.28),rgba(37,36,33,0.95)_45%)] shadow-warm-lg"
          : "border-bone-50/8 bg-ink-800/80 hover:border-bone-50/15 hover:shadow-warm",
      )}
    >
      {featured && (
        <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-ember-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-bone-50">
          <Crown className="size-3.5" aria-hidden /> Best value
        </span>
      )}
      <div className="flex items-center gap-3">
        <span className={cn("grid size-11 place-items-center rounded-xl border", featured ? "border-ember-300/40 bg-ember-500/20 text-ember-100" : "border-bone-50/10 bg-ink-900 text-ember-300")}>
          {plan.accessObject ? <ObjectIcon slug={plan.accessObject.slug} className="size-5" /> : <Crown className="size-5" aria-hidden />}
        </span>
        <div>
          <h3 className="font-display text-xl font-semibold text-bone-50">{plan.name}</h3>
          <p className="text-xs text-ink-300">{plan.accessObject ? `${plan.accessObject.name} only` : "Every space, every class"}</p>
        </div>
      </div>

      <div>
        <p className="flex items-baseline gap-1.5">
          <span className="font-display text-5xl font-semibold text-bone-50">{formatUsd(price, { whole: true })}</span>
          <span className="text-sm text-ink-300">/{interval === "MONTHLY" ? "month" : "year"}</span>
        </p>
        <p className="mt-1 h-5 text-sm text-success-light">{interval === "ANNUAL" && saving > 0 ? `Save ${formatUsd(saving, { whole: true })} a year` : ""}</p>
      </div>

      <ul className="flex flex-1 flex-col gap-2.5">
        {plan.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2.5 text-sm text-bone-100">
            <Check className="mt-0.5 size-4 shrink-0 text-ember-400" aria-hidden />
            {benefit}
          </li>
        ))}
      </ul>
      {action}
    </article>
  );
}
