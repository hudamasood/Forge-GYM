"use client";

import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/admin/action-form";
import { TextField } from "@/components/admin/fields";
import { updatePlanPricingAction } from "../actions";

export function PlanPricingForm({
  plan,
}: {
  plan: { id: string; name: string; priceMonthly: number; priceAnnual: number; stripePriceIdMonthly: string | null; stripePriceIdAnnual: string | null };
}) {
  return (
    <ActionForm action={updatePlanPricingAction.bind(null, plan.id)} className="grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr_1.4fr_auto] sm:items-end">
      {(pending) => (
        <>
          <TextField name="priceMonthly" label="Monthly (USD)" type="number" min={0} step="0.01" defaultValue={(plan.priceMonthly / 100).toFixed(2)} required />
          <TextField name="priceAnnual" label="Annual (USD)" type="number" min={0} step="0.01" defaultValue={(plan.priceAnnual / 100).toFixed(2)} required />
          <TextField name="stripePriceIdMonthly" label="Stripe price (monthly)" placeholder="price_… (optional)" defaultValue={plan.stripePriceIdMonthly ?? ""} />
          <TextField name="stripePriceIdAnnual" label="Stripe price (annual)" placeholder="price_… (optional)" defaultValue={plan.stripePriceIdAnnual ?? ""} />
          <Button type="submit" variant="secondary" loading={pending} loadingText="Saving…" aria-label={`Save pricing for ${plan.name}`}>
            Save
          </Button>
        </>
      )}
    </ActionForm>
  );
}
