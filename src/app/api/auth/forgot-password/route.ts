import { services } from "@/server/container";
import { apiHandler, readJson } from "@/server/http/api";
import { LIMITS, clientIp, rateLimit } from "@/server/http/rate-limit";
import { forgotPasswordSchema, parse } from "@/server/validation/schemas";

/** POST /api/auth/forgot-password — public. Same response whether or not the account exists. */
export const POST = apiHandler(async (request) => {
  rateLimit(`reset:${clientIp(request.headers)}`, LIMITS.passwordReset.limit, LIMITS.passwordReset.windowMs);
  const { email } = parse(forgotPasswordSchema, await readJson(request));
  await services().users.requestPasswordReset(email);
  return { ok: true, message: "If an account exists for that email, a reset link is on its way." };
});
