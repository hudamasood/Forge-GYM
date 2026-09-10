/**
 * Payment provider port (Open/Closed): services depend on this interface, the
 * Stripe adapter implements it. A second provider is a new adapter, never an
 * edit to MembershipService or OrderService.
 */
import type { BillingInterval, MembershipStatus } from "@/server/domain/types";

export interface CheckoutSession {
  id: string;
  url: string;
}

export interface SubscriptionCheckoutInput {
  customerEmail: string;
  customerId: string | null;
  planName: string;
  /** USD cents per billing interval. */
  amount: number;
  interval: BillingInterval;
  /** Pre-configured provider price; when absent the adapter prices inline from `amount`. */
  priceId: string | null;
  metadata: { userId: string; planId: string; interval: BillingInterval };
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentCheckoutInput {
  customerEmail: string;
  customerId: string | null;
  lineItems: { name: string; unitAmount: number; quantity: number }[];
  metadata: { userId: string; orderId: string };
  successUrl: string;
  cancelUrl: string;
  collectShippingAddress: boolean;
}

/** Provider-neutral webhook events, already signature-verified. */
export type PaymentEvent =
  | {
      kind: "subscription.checkout_completed";
      eventId: string;
      subscriptionId: string;
      customerId: string | null;
      userId: string;
      planId: string;
      interval: BillingInterval;
      currentPeriodEnd: Date | null;
    }
  | {
      kind: "payment.checkout_completed";
      eventId: string;
      sessionId: string;
      paymentIntentId: string | null;
      customerId: string | null;
      orderId: string;
      shippingAddress: Record<string, string> | null;
    }
  | {
      kind: "payment.checkout_expired";
      eventId: string;
      orderId: string;
    }
  | {
      kind: "subscription.updated";
      eventId: string;
      subscriptionId: string;
      status: MembershipStatus;
      currentPeriodEnd: Date | null;
    }
  | {
      kind: "subscription.deleted";
      eventId: string;
      subscriptionId: string;
    }
  | {
      kind: "invoice.payment_failed";
      eventId: string;
      subscriptionId: string;
    }
  | {
      kind: "ignored";
      eventId: string;
      providerType: string;
    };

export interface IPaymentProvider {
  readonly isConfigured: boolean;
  createSubscriptionCheckout(input: SubscriptionCheckoutInput): Promise<CheckoutSession>;
  createPaymentCheckout(input: PaymentCheckoutInput): Promise<CheckoutSession>;
  cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<void>;
  /** Verifies the signature and normalizes the event. Throws on an invalid signature. */
  parseWebhookEvent(rawBody: string, signature: string): Promise<PaymentEvent>;
}
