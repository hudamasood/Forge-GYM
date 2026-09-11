import { services } from "@/server/container";
import { config } from "@/server/config";
import { apiHandler, readJson } from "@/server/http/api";
import { requireUser } from "@/server/http/session";
import { membershipCheckoutSchema, parse } from "@/server/validation/schemas";

/** POST /api/memberships/checkout — Member. Creates a Stripe Checkout session for a plan; price comes from the database. */
export const POST = apiHandler(async (request) => {
  const user = await requireUser(["MEMBER"]);
  const { planSlug, interval } = parse(membershipCheckoutSchema, await readJson(request));
  const session = await services().memberships.startCheckout(user.id, planSlug, interval, {
    successUrl: `${config.siteUrl}/dashboard/membership?checkout=success`,
    cancelUrl: `${config.siteUrl}/memberships?checkout=cancelled`,
  });
  return { url: session.url };
});
