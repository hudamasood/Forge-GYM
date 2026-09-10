import Stripe from "stripe";
import { PaymentError } from "@/server/domain/errors";
import type { MembershipStatus } from "@/server/domain/types";
import type { CheckoutSession, IPaymentProvider, PaymentCheckoutInput, PaymentEvent, SubscriptionCheckoutInput } from "@/server/ports/payment";

const STATUS_MAP: Record<Stripe.Subscription.Status, MembershipStatus> = {
  active: "ACTIVE",
  trialing: "ACTIVE",
  past_due: "PAST_DUE",
  unpaid: "PAST_DUE",
  paused: "PAST_DUE",
  canceled: "CANCELED",
  incomplete: "INCOMPLETE",
  incomplete_expired: "EXPIRED",
};

function periodEnd(subscription: Stripe.Subscription): Date | null {
  // Newer API versions expose the period on subscription items; older ones on the subscription.
  const legacy = (subscription as unknown as { current_period_end?: number }).current_period_end;
  const fromItem = subscription.items?.data?.[0]?.current_period_end;
  const seconds = fromItem ?? legacy;
  return seconds ? new Date(seconds * 1000) : null;
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function toAddressRecord(details: { name?: string | null; address?: Stripe.Address | null } | null | undefined): Record<string, string> | null {
  if (!details?.address) return null;
  const entries = Object.entries({ name: details.name, ...details.address }).filter((e): e is [string, string] => typeof e[1] === "string" && e[1] !== "");
  return Object.fromEntries(entries);
}

/** Stripe adapter for the payment port. USD only (spec A9). */
export class StripePaymentProvider implements IPaymentProvider {
  readonly isConfigured = true;
  private readonly stripe: Stripe;

  constructor(
    secretKey: string,
    private readonly webhookSecret: string,
  ) {
    this.stripe = new Stripe(secretKey, { typescript: true, appInfo: { name: "FORGE" } });
  }

  async createSubscriptionCheckout(input: SubscriptionCheckoutInput): Promise<CheckoutSession> {
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = input.priceId
      ? { price: input.priceId, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: input.amount,
            recurring: { interval: input.interval === "MONTHLY" ? "month" : "year" },
            product_data: { name: `FORGE — ${input.planName}` },
          },
        };
    return this.createSession({
      mode: "subscription",
      line_items: [lineItem],
      ...(input.customerId ? { customer: input.customerId } : { customer_email: input.customerEmail }),
      client_reference_id: input.metadata.userId,
      metadata: input.metadata,
      subscription_data: { metadata: input.metadata },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      allow_promotion_codes: false,
    });
  }

  async createPaymentCheckout(input: PaymentCheckoutInput): Promise<CheckoutSession> {
    return this.createSession({
      mode: "payment",
      line_items: input.lineItems.map((item) => ({
        quantity: item.quantity,
        price_data: { currency: "usd", unit_amount: item.unitAmount, product_data: { name: item.name } },
      })),
      ...(input.customerId ? { customer: input.customerId } : { customer_email: input.customerEmail, customer_creation: "always" }),
      client_reference_id: input.metadata.userId,
      metadata: input.metadata,
      payment_intent_data: { metadata: input.metadata },
      shipping_address_collection: input.collectShippingAddress ? { allowed_countries: ["US", "CA", "GB", "AE", "PK"] } : undefined,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    });
  }

  async cancelSubscriptionAtPeriodEnd(subscriptionId: string) {
    try {
      await this.stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
    } catch (error) {
      throw new PaymentError(error instanceof Error ? error.message : "Could not cancel the subscription");
    }
  }

  async parseWebhookEvent(rawBody: string, signature: string): Promise<PaymentEvent> {
    const event = await this.stripe.webhooks.constructEventAsync(rawBody, signature, this.webhookSecret);
    const eventId = event.id;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const metadata = session.metadata ?? {};
        if (session.mode === "subscription") {
          const subscriptionId = idOf(session.subscription);
          if (!subscriptionId || !metadata.userId || !metadata.planId) break;
          const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
          return {
            kind: "subscription.checkout_completed",
            eventId,
            subscriptionId,
            customerId: idOf(session.customer),
            userId: metadata.userId,
            planId: metadata.planId,
            interval: metadata.interval === "ANNUAL" ? "ANNUAL" : "MONTHLY",
            currentPeriodEnd: periodEnd(subscription),
          };
        }
        if (session.mode === "payment" && metadata.orderId && session.payment_status === "paid") {
          const shipping =
            (session as unknown as { collected_information?: { shipping_details?: { name?: string; address?: Stripe.Address } } }).collected_information
              ?.shipping_details ?? (session as unknown as { shipping_details?: { name?: string; address?: Stripe.Address } }).shipping_details;
          return {
            kind: "payment.checkout_completed",
            eventId,
            sessionId: session.id,
            paymentIntentId: idOf(session.payment_intent),
            customerId: idOf(session.customer),
            orderId: metadata.orderId,
            shippingAddress: toAddressRecord(shipping),
          };
        }
        break;
      }
      case "checkout.session.expired": {
        const orderId = event.data.object.metadata?.orderId;
        if (orderId) return { kind: "payment.checkout_expired", eventId, orderId };
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        return {
          kind: "subscription.updated",
          eventId,
          subscriptionId: subscription.id,
          status: STATUS_MAP[subscription.status] ?? "ACTIVE",
          currentPeriodEnd: periodEnd(subscription),
        };
      }
      case "customer.subscription.deleted":
        return { kind: "subscription.deleted", eventId, subscriptionId: event.data.object.id };
      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as {
          subscription?: string | { id: string } | null;
          parent?: { subscription_details?: { subscription?: string | { id: string } | null } | null } | null;
        };
        const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription) ?? idOf(invoice.subscription);
        if (subscriptionId) return { kind: "invoice.payment_failed", eventId, subscriptionId };
        break;
      }
    }
    return { kind: "ignored", eventId, providerType: event.type };
  }

  private async createSession(params: Stripe.Checkout.SessionCreateParams): Promise<CheckoutSession> {
    try {
      const session = await this.stripe.checkout.sessions.create(params);
      if (!session.url) throw new Error("Stripe did not return a checkout URL");
      return { id: session.id, url: session.url };
    } catch (error) {
      throw new PaymentError(error instanceof Error ? error.message : "Could not start checkout");
    }
  }
}
