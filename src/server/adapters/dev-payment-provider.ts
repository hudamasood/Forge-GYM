import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { CheckoutSession, IPaymentProvider, PaymentCheckoutInput, PaymentEvent, SubscriptionCheckoutInput } from "@/server/ports/payment";

type PendingCheckout = { event: PaymentEvent; successUrl: string };

/**
 * Development-only stand-in for Stripe. Checkout "sessions" are signed tokens
 * that /api/dev/checkout turns into the same normalized events the Stripe
 * webhook would deliver. Disabled whenever Stripe keys exist or in production.
 */
export class DevPaymentProvider implements IPaymentProvider {
  readonly isConfigured = false;

  constructor(
    private readonly siteUrl: string,
    private readonly secret: string,
  ) {}

  async createSubscriptionCheckout(input: SubscriptionCheckoutInput): Promise<CheckoutSession> {
    const id = `dev_cs_${randomUUID()}`;
    return this.session(id, {
      successUrl: input.successUrl,
      event: {
        kind: "subscription.checkout_completed",
        eventId: `dev_evt_${randomUUID()}`,
        subscriptionId: `dev_sub_${randomUUID()}`,
        customerId: null,
        userId: input.metadata.userId,
        planId: input.metadata.planId,
        interval: input.interval,
        currentPeriodEnd: new Date(Date.now() + (input.interval === "MONTHLY" ? 30 : 365) * 86_400_000),
      },
    });
  }

  async createPaymentCheckout(input: PaymentCheckoutInput): Promise<CheckoutSession> {
    const id = `dev_cs_${randomUUID()}`;
    return this.session(id, {
      successUrl: input.successUrl,
      event: {
        kind: "payment.checkout_completed",
        eventId: `dev_evt_${randomUUID()}`,
        sessionId: id,
        paymentIntentId: null,
        customerId: null,
        orderId: input.metadata.orderId,
        shippingAddress: null,
      },
    });
  }

  async cancelSubscriptionAtPeriodEnd() {}

  async parseWebhookEvent(): Promise<PaymentEvent> {
    throw new Error("The development payment provider does not receive webhooks");
  }

  /** Verifies and decodes a token minted by this provider. */
  decode(token: string): PendingCheckout | null {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const expected = this.sign(payload);
    if (expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PendingCheckout;
    if ("currentPeriodEnd" in parsed.event && parsed.event.currentPeriodEnd) parsed.event.currentPeriodEnd = new Date(parsed.event.currentPeriodEnd);
    return parsed;
  }

  private session(id: string, pending: PendingCheckout): CheckoutSession {
    const payload = Buffer.from(JSON.stringify(pending)).toString("base64url");
    return { id, url: `${this.siteUrl}/api/dev/checkout?token=${payload}.${this.sign(payload)}` };
  }

  private sign(payload: string) {
    return createHmac("sha256", this.secret).update(payload).digest("base64url");
  }
}
