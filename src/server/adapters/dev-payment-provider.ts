import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { CheckoutSession, IPaymentProvider, PaymentCheckoutInput, PaymentEvent, SubscriptionCheckoutInput } from "@/server/ports/payment";

export interface PendingDevCheckout {
  event: PaymentEvent;
  successUrl: string;
  cancelUrl: string;
  summary: { title: string; lines: { name: string; amount: number; quantity: number }[]; total: number; recurring: string | null };
  expiresAt: number;
}

const TTL_MS = 60 * 60 * 1000;

/**
 * Development-only stand-in for Stripe. Checkout "sessions" are signed tokens
 * that the /dev-checkout page turns into the same normalized events the
 * Stripe webhook would deliver. Disabled whenever Stripe keys exist or in
 * production (see config.devPaymentsEnabled).
 */
export class DevPaymentProvider implements IPaymentProvider {
  readonly isConfigured = false;

  constructor(
    private readonly siteUrl: string,
    private readonly secret: string,
  ) {}

  async createSubscriptionCheckout(input: SubscriptionCheckoutInput): Promise<CheckoutSession> {
    return this.session({
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      expiresAt: Date.now() + TTL_MS,
      summary: {
        title: `FORGE — ${input.planName}`,
        lines: [{ name: input.planName, amount: input.amount, quantity: 1 }],
        total: input.amount,
        recurring: input.interval === "MONTHLY" ? "month" : "year",
      },
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
    return this.session(
      {
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        expiresAt: Date.now() + TTL_MS,
        summary: {
          title: "FORGE Store order",
          lines: input.lineItems.map((l) => ({ name: l.name, amount: l.unitAmount, quantity: l.quantity })),
          total: input.lineItems.reduce((sum, l) => sum + l.unitAmount * l.quantity, 0),
          recurring: null,
        },
        event: {
          kind: "payment.checkout_completed",
          eventId: `dev_evt_${randomUUID()}`,
          sessionId: id,
          paymentIntentId: null,
          customerId: null,
          orderId: input.metadata.orderId,
          shippingAddress: null,
        },
      },
      id,
    );
  }

  async cancelSubscriptionAtPeriodEnd() {}

  async parseWebhookEvent(): Promise<PaymentEvent> {
    throw new Error("The development payment provider does not receive webhooks");
  }

  /** Verifies and decodes a token minted by this provider; null if tampered with or expired. */
  decode(token: string): PendingDevCheckout | null {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const expected = this.sign(payload);
    if (expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PendingDevCheckout;
    if (parsed.expiresAt < Date.now()) return null;
    if (parsed.event.kind === "subscription.checkout_completed" && parsed.event.currentPeriodEnd) {
      parsed.event.currentPeriodEnd = new Date(parsed.event.currentPeriodEnd);
    }
    return parsed;
  }

  private session(pending: PendingDevCheckout, id = `dev_cs_${randomUUID()}`): CheckoutSession {
    const payload = Buffer.from(JSON.stringify(pending)).toString("base64url");
    return { id, url: `${this.siteUrl}/dev-checkout?token=${payload}.${this.sign(payload)}` };
  }

  private sign(payload: string) {
    return createHmac("sha256", this.secret).update(payload).digest("base64url");
  }
}
