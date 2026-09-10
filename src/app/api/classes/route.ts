import { services } from "@/server/container";
import { apiHandler, searchParamsObject } from "@/server/http/api";
import { classFilterSchema, parse } from "@/server/validation/schemas";

/** GET /api/classes — public. Filterable by ?object={accessObjectSlug}&difficulty={DIFFICULTY}. */
export const GET = apiHandler(async (request) => {
  const filter = parse(classFilterSchema, searchParamsObject(request));
  const classes = await services().classes.list({ accessObjectSlug: filter.object, difficulty: filter.difficulty });
  return { classes };
});
