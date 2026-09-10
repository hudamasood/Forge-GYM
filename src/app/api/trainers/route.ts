import { services } from "@/server/container";
import { apiHandler, searchParamsObject } from "@/server/http/api";
import { classFilterSchema, parse } from "@/server/validation/schemas";

/** GET /api/trainers — public. Filterable by ?object={accessObjectSlug}. */
export const GET = apiHandler(async (request) => {
  const { object } = parse(classFilterSchema.pick({ object: true }), searchParamsObject(request));
  const trainers = await services().trainers.list({ accessObjectSlug: object });
  // userId links to a login account — not public information.
  return { trainers: trainers.map((t) => ({ ...t, userId: undefined })) };
});
