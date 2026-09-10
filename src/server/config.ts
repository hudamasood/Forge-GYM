import "server-only";

/** Server-side configuration, read once from environment variables (spec B5: secrets never reach the client). */
export const config = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")).replace(/\/$/, ""),
  isProduction: process.env.NODE_ENV === "production",
  authSecret: process.env.AUTH_SECRET ?? "",
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.EMAIL_FROM || "FORGE <no-reply@forge.example>",
    contactInbox: process.env.CONTACT_INBOX || "hello@forge.example",
  },
};

/**
 * Local development without Stripe keys uses a simulated checkout so every
 * flow can be exercised end to end. Never available in production.
 */
export const devPaymentsEnabled = !config.isProduction && !config.stripe.secretKey;
