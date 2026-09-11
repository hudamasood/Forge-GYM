import { services } from "@/server/container";
import { config } from "@/server/config";
import { apiHandler, readJson } from "@/server/http/api";
import { requireUser } from "@/server/http/session";
import { cartCheckoutSchema, parse } from "@/server/validation/schemas";

/**
 * POST /api/orders/checkout — signed-in users (guest checkout is off by
 * default, spec A7). Totals are computed server-side from the database.
 */
export const POST = apiHandler(async (request) => {
  const user = await requireUser();
  const { items } = parse(cartCheckoutSchema, await readJson(request));
  const session = await services().orders.createCheckout(user.id, items, {
    successUrl: `${config.siteUrl}/checkout/success`,
    cancelUrl: `${config.siteUrl}/cart?checkout=cancelled`,
  });
  return { url: session.url, orderId: session.orderId };
});
