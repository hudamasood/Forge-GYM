import { services } from "@/server/container";
import { apiHandler, readJson } from "@/server/http/api";
import { cartCheckoutSchema, parse } from "@/server/validation/schemas";

/** POST /api/cart/price — public. Re-prices a client cart against current database prices and stock. */
export const POST = apiHandler(async (request) => {
  const { items } = parse(cartCheckoutSchema, await readJson(request));
  const priced = await services().orders.priceCart(items);
  return {
    subtotal: priced.subtotal,
    items: priced.items.map((i) => ({
      productId: i.product.id,
      slug: i.product.slug,
      name: i.product.name,
      category: i.product.category,
      price: i.product.price,
      stock: i.product.stock,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
      available: i.available,
    })),
  };
});
