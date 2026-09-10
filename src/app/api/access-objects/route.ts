import { services } from "@/server/container";
import { apiHandler } from "@/server/http/api";

/** GET /api/access-objects — public. The six Access Objects with their Space info. */
export const GET = apiHandler(async () => ({ accessObjects: await services().accessObjects.list() }));
