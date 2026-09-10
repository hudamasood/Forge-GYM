import { NextResponse } from "next/server";
import { services } from "@/server/container";
import { apiHandler, readJson } from "@/server/http/api";
import { LIMITS, clientIp, rateLimit } from "@/server/http/rate-limit";
import { parse, signupSchema } from "@/server/validation/schemas";

/** POST /api/auth/signup — public. Always creates a MEMBER. */
export const POST = apiHandler(async (request) => {
  rateLimit(`signup:${clientIp(request.headers)}`, LIMITS.signup.limit, LIMITS.signup.windowMs);
  const input = parse(signupSchema, await readJson(request));
  const user = await services().users.signup(input);
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } }, { status: 201 });
});
