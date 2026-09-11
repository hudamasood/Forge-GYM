"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import { PlanCard, type PlanCardData } from "@/components/cards/plan-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { BillingInterval } from "@/server/domain/types";

function JoinButton({ plan, interval }: { plan: PlanCardData; interval: BillingInterval }) {
  const router = useRouter();
  const { status, data } = useSession();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);
  const featured = plan.type === "ALL_ACCESS";

  const join = async () => {
    if (status === "unauthenticated") {
      router.push(`/signup?callbackUrl=${encodeURIComponent("/memberships")}`);
      return;
    }
    // While the session is still loading, let the server decide (401 → sign up).
    if (status === "authenticated" && data.user.role !== "MEMBER") {
      toast({ tone: "info", title: "Member accounts only", description: "Staff accounts can't buy memberships. Log in with a member account." });
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/memberships/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: plan.slug, interval }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.url) {
        window.location.assign(body.url);
        return;
      }
      if (res.status === 401) router.push(`/signup?callbackUrl=${encodeURIComponent("/memberships")}`);
      else toast({ tone: "error", title: "Couldn't start checkout", description: body.error?.message ?? "Please try again." });
    } catch {
      toast({ tone: "error", title: "Network error", description: "Check your connection and try again." });
    }
    setPending(false);
  };

  return (
    <Button onClick={join} loading={pending} loadingText="Opening checkout…" variant={featured ? "primary" : "secondary"} size="lg" className="w-full" aria-label={`Join ${plan.name}, billed ${interval.toLowerCase()}`}>
      Join {plan.accessObject ? "" : "All-Access"} <ArrowRight aria-hidden />
    </Button>
  );
}

export function PlanGrid({ plans }: { plans: PlanCardData[] }) {
  const [interval, setInterval] = React.useState<BillingInterval>("MONTHLY");
  const featured = plans.filter((p) => p.type === "ALL_ACCESS");
  const single = plans.filter((p) => p.type !== "ALL_ACCESS");

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-center">
        <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border border-bone-50/12 bg-ink-800 p-1">
          {(["MONTHLY", "ANNUAL"] as const).map((value) => (
            <button
              key={value}
              role="radio"
              aria-checked={interval === value}
              onClick={() => setInterval(value)}
              className={cn(
                "relative rounded-full px-5 py-2 text-sm font-medium transition-colors",
                interval === value ? "bg-bone-50 text-ink-900" : "text-bone-200 hover:text-bone-50",
              )}
            >
              {value === "MONTHLY" ? "Monthly" : "Annual"}
              {value === "ANNUAL" && <span className={cn("ml-2 text-xs", interval === value ? "text-ember-600" : "text-success-light")}>2 months free</span>}
            </button>
          ))}
        </div>
      </div>

      {featured.map((plan) => (
        <div key={plan.slug} className="mx-auto w-full max-w-3xl">
          <PlanCard plan={plan} interval={interval} action={<JoinButton plan={plan} interval={interval} />} />
        </div>
      ))}

      <div>
        <h2 className="mb-6 text-center font-display text-2xl uppercase text-bone-50">Or pick a single space</h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {single.map((plan) => (
            <li key={plan.slug}>
              <PlanCard plan={plan} interval={interval} action={<JoinButton plan={plan} interval={interval} />} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
