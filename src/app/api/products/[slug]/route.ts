import { services } from "@/server/container";
import { apiHandler } from "@/server/http/api";

/** GET /api/products/[slug] — public. Product detail. */
export const GET = apiHandler<{ params: Promise<{ slug: string }> }>(async (_request, { params }) => {
  const { slug } = await params;
  return { product: await services().orders.getProduct(slug) };
});
