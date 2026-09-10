import { services } from "@/server/container";
import { apiHandler } from "@/server/http/api";

/** GET /api/trainers/[slug] — public. Trainer detail plus classes taught. */
export const GET = apiHandler<{ params: Promise<{ slug: string }> }>(async (_request, { params }) => {
  const { slug } = await params;
  const trainer = await services().trainers.getBySlug(slug);
  // userId links to a login account — not public information.
  return { trainer: { ...trainer, userId: undefined } };
});
