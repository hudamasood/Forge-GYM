import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { PaymentError } from "@/server/domain/errors";
import type { BillingInterval } from "@/server/domain/types";
import type { CheckoutSession, IPaymentProvider, PaymentCheckoutInput, PaymentEvent, SubscriptionCheckoutInput } from "@/server/ports/payment";

/**
 * Safepay adapter for the payment port (Pakistan, USD pricing).
 *
 * Endpoints and URL shapes follow Safepay's official SDKs (@sfpy/node-core
 * for hosted payments, @sfpy/node-sdk for subscriptions) and docs. It uses
 * fetch directly so no outdated HTTP client is pulled in.
 *
 * - Store orders: payment session (tracker) + passport token → hosted checkout.
 *   Confirmed by the `payment.succeeded` webhook (metadata.order_id).
 * - Memberships: Safepay bills against plans created in the Safepay dashboard,
 *   so each FORGE plan stores a Safepay plan id per interval. The subscription
 *   `reference` is HMAC-signed over user, plan, interval and Safepay plan id,
 *   so neither the reference nor the plan in the checkout URL can be swapped.
 */

export type SafepayEnvironment = "sandbox" | "production";

export interface SafepayOptions {
  environment: SafepayEnvironment;
  /** Public merchant API key (merchant_api_key). */
  apiKey: string;
  /** Secret key sent as X-SFPY-MERCHANT-SECRET. */
  secretKey: string;
  /** Endpoint shared secret used for webhook HMAC-SHA512 signatures. */
  webhookSecret: string;
  fetch?: typeof fetch;
}

const HOSTS: Record<SafepayEnvironment, { api: string; payment: string; subscribe: string }> = {
  sandbox: {
    api: "https://sandbox.api.getsafepay.com",
    payment: "https://sandbox.api.getsafepay.com/embedded/",
    subscribe: "https://sandbox.api.getsafepay.com/checkout/subscribe",
  },
  production: {
    api: "https://api.getsafepay.com",
    payment: "https://getsafepay.com/embedded/",
    subscribe: "https://getsafepay.com/checkout/subscribe",
  },
};

const CURRENCY = "USD";
const REFERENCE_PREFIX = "fg1";

type Timestamp = { seconds?: number | string } | null | undefined;

interface WebhookBody {
  token?: string;
  type?: string;
  merchant_api_key?: string;
  data?: Record<string, unknown> & {
    tracker?: string;
    id?: string;
    plan_id?: string;
    reference?: string;
    currency?: string;
    status?: string;
    current_billing_cycle?: number;
    current_period_end_date?: Timestamp;
    metadata?: Record<string, string>;
  };
}

function toDate(ts: Timestamp): Date | null {
  const seconds = ts?.seconds != null ? Number(ts.seconds) : NaN;
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000) : null;
}

function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export class SafepayPaymentProvider implements IPaymentProvider {
  readonly isConfigured = true;
  private readonly hosts;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: SafepayOptions) {
    this.hosts = HOSTS[options.environment];
    this.fetchImpl = options.fetch ?? fetch;
  }

  async createPaymentCheckout(input: PaymentCheckoutInput): Promise<CheckoutSession> {
    const amount = input.lineItems.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
    const session = await this.request<{ data?: { tracker?: { token?: string }; token?: string } }>("POST", "/order/payments/v3/", {
      merchant_api_key: this.options.apiKey,
      intent: "CYBERSOURCE",
      mode: "payment",
      entry_mode: "raw",
      currency: CURRENCY,
      amount, // minor units (cents)
      metadata: { order_id: input.metadata.orderId, user_id: input.metadata.userId },
      include_fees: false,
    });
    const tracker = session.data?.tracker?.token ?? session.data?.token;
    if (!tracker) throw new PaymentError("Safepay did not return a payment session");

    const url = this.buildUrl(this.hosts.payment, {
      environment: this.options.environment,
      tracker,
      tbt: await this.authToken(),
      source: "hosted",
      order_id: input.metadata.orderId,
      redirect_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });
    return { id: tracker, url };
  }

  async createSubscriptionCheckout(input: SubscriptionCheckoutInput): Promise<CheckoutSession> {
    if (!input.safepayPlanId) {
      throw new PaymentError(`${input.planName} (${input.interval.toLowerCase()}) is not set up for online payment yet. Please contact the front desk.`);
    }
    const reference = this.signReference(input.metadata.userId, input.metadata.planId, input.interval, input.safepayPlanId);
    const url = this.buildUrl(this.hosts.subscribe, {
      plan_id: input.safepayPlanId,
      auth_token: await this.authToken(),
      env: this.options.environment,
      cancel_url: input.cancelUrl,
      redirect_url: input.successUrl,
      reference,
    });
    return { id: reference, url };
  }

  /** Safepay cancels immediately; the `subscription.canceled` webhook then ends access. */
  async cancelSubscriptionAtPeriodEnd(subscriptionId: string) {
    await this.request("POST", `/client/subscriptions/v1/${encodeURIComponent(subscriptionId)}/cancel`, {});
  }

  async parseWebhookEvent(rawBody: string, signature: string): Promise<PaymentEvent> {
    let body: WebhookBody;
    try {
      body = JSON.parse(rawBody) as WebhookBody;
    } catch {
      throw new Error("Invalid Safepay webhook signature (unparseable body)");
    }
    if (!this.verifySignature(rawBody, body, signature)) throw new Error("Invalid Safepay webhook signature");
    if (body.merchant_api_key && body.merchant_api_key !== this.options.apiKey) throw new Error("Invalid Safepay webhook signature (merchant mismatch)");

    const eventId = body.token ?? `sfpy_${createHash("sha256").update(rawBody).digest("hex")}`;
    const type = body.type ?? "unknown";
    const data = body.data ?? {};
    const ignored = (): PaymentEvent => ({ kind: "ignored", eventId, providerType: type });

    switch (type) {
      case "payment.succeeded": {
        const orderId = data.metadata?.order_id;
        if (!orderId || !data.tracker || (data.currency && data.currency !== CURRENCY)) return ignored();
        return { kind: "payment.checkout_completed", eventId, sessionId: data.tracker, paymentIntentId: data.tracker, customerId: null, orderId, shippingAddress: null };
      }
      case "subscription.created":
      case "subscription.payment.succeeded": {
        if (!data.id || !data.plan_id) return ignored();
        if (type === "subscription.created" && data.status !== "ACTIVE") return ignored();
        const ref = this.verifyReference(data.reference ?? data.metadata?.reference, data.plan_id);
        if (!ref) return ignored();
        const currentPeriodEnd = toDate(data.current_period_end_date);
        if ((data.current_billing_cycle ?? 1) > 1) {
          return { kind: "subscription.updated", eventId, subscriptionId: data.id, status: "ACTIVE", currentPeriodEnd };
        }
        return { kind: "subscription.checkout_completed", eventId, subscriptionId: data.id, customerId: null, ...ref, currentPeriodEnd };
      }
      case "subscription.payment.failed":
        return data.id ? { kind: "invoice.payment_failed", eventId, subscriptionId: data.id } : ignored();
      case "subscription.canceled":
      case "subscription.cancelled":
      case "subscription.ended":
        return data.id ? { kind: "subscription.deleted", eventId, subscriptionId: data.id } : ignored();
      default:
        // Safepay may add event types; unknown ones are acknowledged and ignored.
        return ignored();
    }
  }

  // ------------------------------------------------------------------ internals

  /** Safepay's docs sign the JSON payload; its SDK signs `data`. Accept either. */
  private verifySignature(rawBody: string, body: WebhookBody, signature: string) {
    if (!signature || !this.options.webhookSecret) return false;
    const candidates = [rawBody, JSON.stringify(body), JSON.stringify(body.data ?? null)];
    return candidates.some((payload) => safeEqualHex(createHmac("sha512", this.options.webhookSecret).update(payload).digest("hex"), signature.trim()));
  }

  signReference(userId: string, planId: string, interval: BillingInterval, safepayPlanId: string) {
    const body = `${REFERENCE_PREFIX}.${userId}.${planId}.${interval === "MONTHLY" ? "M" : "A"}`;
    return `${body}.${this.referenceMac(body, safepayPlanId)}`;
  }

  private verifyReference(reference: string | undefined, safepayPlanId: string): { userId: string; planId: string; interval: BillingInterval } | null {
    const parts = reference?.split(".");
    if (!parts || parts.length !== 5 || parts[0] !== REFERENCE_PREFIX) return null;
    const [prefix, userId, planId, code, mac] = parts;
    if (!safeEqualHex(this.referenceMac(`${prefix}.${userId}.${planId}.${code}`, safepayPlanId), mac)) return null;
    if (code !== "M" && code !== "A") return null;
    return { userId, planId, interval: code === "M" ? "MONTHLY" : "ANNUAL" };
  }

  private referenceMac(body: string, safepayPlanId: string) {
    return createHmac("sha256", this.options.secretKey).update(`${body}|${safepayPlanId}`).digest("base64url").slice(0, 24);
  }

  private async authToken(): Promise<string> {
    const response = await this.request<{ data?: string }>("POST", "/client/passport/v1/token", {});
    if (!response.data) throw new PaymentError("Safepay did not return an authentication token");
    return response.data;
  }

  private buildUrl(base: string, params: Record<string, string>) {
    return `${base}?${new URLSearchParams(params).toString()}`;
  }

  private async request<T>(method: "POST" | "GET", path: string, body?: unknown): Promise<T> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.hosts.api}${path}`, {
        method,
        headers: { Accept: "application/json", "Content-Type": "application/json", "X-SFPY-MERCHANT-SECRET": this.options.secretKey },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
      });
    } catch {
      throw new PaymentError("Could not reach Safepay. Please try again.");
    }
    const json = (await response.json().catch(() => ({}))) as T & { status?: { errors?: string[] }; error?: string | { message?: string } };
    if (!response.ok) {
      const detail = json.status?.errors?.[0] ?? (typeof json.error === "string" ? json.error : json.error?.message) ?? `HTTP ${response.status}`;
      console.error(`[safepay] ${method} ${path} failed: ${detail}`);
      throw new PaymentError("Payment could not be started. Please try again.");
    }
    return json;
  }
}
