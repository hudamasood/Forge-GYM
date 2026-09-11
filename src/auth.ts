import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { services } from "@/server/container";
import { LIMITS, clientIp, rateLimit } from "@/server/http/rate-limit";
import { loginSchema } from "@/server/validation/schemas";
import { isDomainError } from "@/server/domain/errors";

class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        try {
          rateLimit(`login:ip:${clientIp(request.headers)}`, LIMITS.login.limit * 3, LIMITS.login.windowMs);
          rateLimit(`login:email:${parsed.data.email}`, LIMITS.login.limit, LIMITS.login.windowMs);
        } catch (error) {
          if (isDomainError(error, "RATE_LIMITED")) throw new RateLimitedSignin();
          throw error;
        }

        const user = await services().users.verifyCredentials(parsed.data.email, parsed.data.password);
        return user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null;
      },
    }),
  ],
});
