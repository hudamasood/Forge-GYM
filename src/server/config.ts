import "server-only";

/** Server-side configuration, read once from environment variables (spec B5: secrets never reach the client). */
export const config = {
  // SITE_URL is read at runtime; NEXT_PUBLIC_SITE_URL is inlined at build time.
  siteUrl: (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")).replace(/\/$/, ""),
  isProduction: process.env.NODE_ENV === "production",
  authSecret: process.env.AUTH_SECRET ?? "",
  /** "safepay" or "stripe". Unset keeps the previous behaviour: Stripe when its key exists. */
  paymentProvider: (process.env.PAYMENT_PROVIDER ?? "").trim().toLowerCase(),
  safepay: {
    environment: (process.env.SAFEPAY_ENVIRONMENT === "production" ? "production" : "sandbox") as "production" | "sandbox",
    apiKey: process.env.SAFEPAY_API_KEY ?? "",
    secretKey: process.env.SAFEPAY_SECRET_KEY ?? "",
    webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET ?? "",
  },
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
 * Without Stripe keys, a simulated checkout lets every flow be exercised end
 * to end: automatically in development, and in production builds only when
 * ENABLE_TEST_CHECKOUT=1 (CI e2e / staging). Never set that on a real
 * deployment; it is ignored whenever a Stripe key is configured.
 */
export const devPaymentsEnabled =
  config.paymentProvider !== "safepay" && !config.stripe.secretKey && (!config.isProduction || process.env.ENABLE_TEST_CHECKOUT === "1");
