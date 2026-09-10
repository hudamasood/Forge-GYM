import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { UnauthorizedError } from "@/server/domain/errors";
import { apiHandler, readJson } from "@/server/http/api";
import { loginSchema, parse } from "@/server/validation/schemas";

/** POST /api/auth/login — public. Credential login that sets the session cookie. */
export const POST = apiHandler(async (request) => {
  const input = parse(loginSchema, await readJson(request));
  try {
    await signIn("credentials", { ...input, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) throw new UnauthorizedError(error.type === "CredentialsSignin" && (error as { code?: string }).code === "rate_limited" ? "Too many attempts. Try again later." : "Invalid email or password");
    throw error;
  }
  return { ok: true };
});
