import { services } from "@/server/container";
import { apiHandler, readJson } from "@/server/http/api";
import { LIMITS, clientIp, rateLimit } from "@/server/http/rate-limit";
import { parse, resetPasswordSchema } from "@/server/validation/schemas";

/** POST /api/auth/reset-password — public, token-authenticated. */
export const POST = apiHandler(async (request) => {
  rateLimit(`reset-submit:${clientIp(request.headers)}`, LIMITS.passwordReset.limit * 2, LIMITS.passwordReset.windowMs);
  const { token, password } = parse(resetPasswordSchema, await readJson(request));
  await services().users.resetPassword(token, password);
  return { ok: true };
});
