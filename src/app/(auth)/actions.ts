"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { services } from "@/server/container";
import { type ActionState, runAction } from "@/server/http/action";
import { LIMITS, clientIp, rateLimit } from "@/server/http/rate-limit";
import { forgotPasswordSchema, formToObject, loginSchema, parse, resetPasswordSchema, signupSchema } from "@/server/validation/schemas";
import { safeCallbackUrl } from "@/lib/safe-redirect";

function continueUrl(form: FormData) {
  const callbackUrl = safeCallbackUrl(form.get("callbackUrl"));
  return `/continue${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;
}

async function signInOrExplain(email: string, password: string, redirectTo: string): Promise<ActionState | never> {
  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type !== "CredentialsSignin") {
        console.error("[auth] sign-in failed", error);
        return { ok: false, error: "We couldn't sign you in right now. Please try again in a moment." };
      }
      const limited = (error as { code?: string }).code === "rate_limited";
      return { ok: false, error: limited ? "Too many attempts. Please wait a few minutes and try again." : "That email and password don't match." };
    }
    throw error; // includes the redirect
  }
  return { ok: true };
}

export async function loginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(formToObject(form));
  if (!parsed.success) return { ok: false, error: "Enter your email and password." };
  return signInOrExplain(parsed.data.email, parsed.data.password, continueUrl(form));
}

export async function signupAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const values = formToObject(form);
  const state = await runAction(async () => {
    rateLimit(`signup:${clientIp(await headers())}`, LIMITS.signup.limit, LIMITS.signup.windowMs);
    const input = parse(signupSchema, values);
    await services().users.signup(input);
  });
  if (!state.ok) return state;
  return signInOrExplain(String(values.email), String(values.password), continueUrl(form));
}

export async function forgotPasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const state = await runAction(async () => {
    rateLimit(`reset:${clientIp(await headers())}`, LIMITS.passwordReset.limit, LIMITS.passwordReset.windowMs);
    const { email } = parse(forgotPasswordSchema, formToObject(form));
    await services().users.requestPasswordReset(email);
  });
  if (!state.ok) return state;
  redirect("/verify");
}

export async function resetPasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const state = await runAction(async () => {
    const { token, password } = parse(resetPasswordSchema, formToObject(form));
    await services().users.resetPassword(token, password);
  });
  if (!state.ok) return state;
  redirect("/login?reset=1");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
