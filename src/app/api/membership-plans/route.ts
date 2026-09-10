import { services } from "@/server/container";
import { apiHandler } from "@/server/http/api";

/** GET /api/membership-plans — public. All seven plans (six single-object + All-Access). */
export const GET = apiHandler(async () => {
  const plans = await services().memberships.listPlans();
  // Stripe price ids are configuration, not public data.
  return { plans: plans.map(({ stripePriceIdMonthly: _m, stripePriceIdAnnual: _a, ...plan }) => plan) };
});
