import { services } from "@/server/container";
import { apiHandler } from "@/server/http/api";

/** GET /api/classes/[slug] — public. Class detail plus its upcoming schedule with live seat counts. */
export const GET = apiHandler<{ params: Promise<{ slug: string }> }>(async (_request, { params }) => {
  const { slug } = await params;
  return { class: await services().classes.getBySlug(slug) };
});
