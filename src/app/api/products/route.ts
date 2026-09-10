import { services } from "@/server/container";
import { apiHandler, searchParamsObject } from "@/server/http/api";
import { parse, productFilterSchema } from "@/server/validation/schemas";

/** GET /api/products — public. Store catalog, filterable by ?category={CATEGORY}&q={search}. */
export const GET = apiHandler(async (request) => {
  const { category, q } = parse(productFilterSchema, searchParamsObject(request));
  return { products: await services().orders.listProducts({ category, search: q }) };
});
