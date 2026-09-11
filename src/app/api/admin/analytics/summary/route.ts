import { services } from "@/server/container";
import { apiHandler } from "@/server/http/api";
import { requireUser } from "@/server/http/session";

/** GET /api/admin/analytics/summary — Admin. Basic revenue / inventory / membership counts. */
export const GET = apiHandler(async () => {
  await requireUser(["ADMIN"]);
  return { summary: await services().analytics.summary() };
});
