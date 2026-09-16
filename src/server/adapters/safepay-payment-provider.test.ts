import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { SafepayPaymentProvider } from "./safepay-payment-provider";

const WEBHOOK_SECRET = "whsec_test";
const API_KEY = "sec_test_api";

type Call = { url: string; init: RequestInit };

function fakeFetch(calls: Call[], responses: Record<string, { status?: number; body: unknown }>) {
  return (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const match = Object.entries(responses).find(([path]) => url.endsWith(path));
    const { status = 200, body } = match?.[1] ?? { status: 404, body: {} };
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof fetch;
}

function sign(payload: string) {
  return createHmac("sha512", WEBHOOK_SECRET).update(payload).digest("hex");
}

describe("SafepayPaymentProvider", () => {
  let calls: Call[];
  let provider: SafepayPaymentProvider;

  beforeEach(() => {
    calls = [];
    provider = new SafepayPaymentProvider({
      environment: "sandbox",
      apiKey: API_KEY,
      secretKey: "secret_test",
      webhookSecret: WEBHOOK_SECRET,
      fetch: fakeFetch(calls, {
        "/order/payments/v3/": { body: { data: { tracker: { token: "track_123" } } } },
        "/client/passport/v1/token": { body: { data: "tbt_abc" } },
        "/client/subscriptions/v1/sub_9/cancel": { body: { data: {} } },
      }),
    });
  });

  describe("store checkout", () => {
    it("creates a USD payment session for the server-computed total and returns the hosted checkout URL", async () => {
      const session = await provider.createPaymentCheckout({
        customerEmail: "a@test.dev",
        customerId: null,
        lineItems: [
          { name: "Whey", unitAmount: 5499, quantity: 2 },
          { name: "PDF", unitAmount: 2900, quantity: 1 },
        ],
        metadata: { userId: "usr_1", orderId: "ord_1" },
        successUrl: "https://forge.test/checkout/success",
        cancelUrl: "https://forge.test/cart",
        collectShippingAddress: true,
      });

      const setup = calls.find((c) => c.url.endsWith("/order/payments/v3/"))!;
      expect(setup.url).toBe("https://sandbox.api.getsafepay.com/order/payments/v3/");
      expect((setup.init.headers as Record<string, string>)["X-SFPY-MERCHANT-SECRET"]).toBe("secret_test");
      expect(JSON.parse(String(setup.init.body))).toMatchObject({
        merchant_api_key: API_KEY,
        currency: "USD",
        amount: 5499 * 2 + 2900,
        mode: "payment",
        metadata: { order_id: "ord_1" },
      });

      const url = new URL(session.url);
      expect(`${url.origin}${url.pathname}`).toBe("https://sandbox.api.getsafepay.com/embedded/");
      expect(Object.fromEntries(url.searchParams)).toMatchObject({
        environment: "sandbox",
        tracker: "track_123",
        tbt: "tbt_abc",
        source: "hosted",
        redirect_url: "https://forge.test/checkout/success",
        cancel_url: "https://forge.test/cart",
      });
      expect(session.id).toBe("track_123");
    });

    it("surfaces Safepay API failures as a friendly payment error", async () => {
      const failing = new SafepayPaymentProvider({
        environment: "sandbox",
        apiKey: API_KEY,
        secretKey: "s",
        webhookSecret: WEBHOOK_SECRET,
        fetch: fakeFetch([], { "/order/payments/v3/": { status: 401, body: { status: { errors: ["bad key"] } } } }),
      });
      await expect(
        failing.createPaymentCheckout({ customerEmail: "a", customerId: null, lineItems: [{ name: "x", unitAmount: 100, quantity: 1 }], metadata: { userId: "u", orderId: "o" }, successUrl: "s", cancelUrl: "c", collectShippingAddress: false }),
      ).rejects.toMatchObject({ code: "PAYMENT_ERROR" });
    });
  });

  describe("membership checkout", () => {
    const input = {
      customerEmail: "a@test.dev",
      customerId: null,
      planName: "Yoga Unlimited",
      amount: 3900,
      interval: "MONTHLY" as const,
      priceId: null,
      safepayPlanId: "plan_yoga_m",
      metadata: { userId: "usr_1", planId: "pl_yoga", interval: "MONTHLY" as const },
      successUrl: "https://forge.test/dashboard/membership?checkout=success",
      cancelUrl: "https://forge.test/memberships",
    };

    it("builds a subscribe URL with the Safepay plan and a signed reference", async () => {
      const session = await provider.createSubscriptionCheckout(input);
      const url = new URL(session.url);
      expect(`${url.origin}${url.pathname}`).toBe("https://sandbox.api.getsafepay.com/checkout/subscribe");
      expect(url.searchParams.get("plan_id")).toBe("plan_yoga_m");
      expect(url.searchParams.get("auth_token")).toBe("tbt_abc");
      expect(url.searchParams.get("reference")).toMatch(/^fg1\.usr_1\.pl_yoga\.M\.[\w-]{24}$/);
    });

    it("refuses plans without a Safepay plan id", async () => {
      await expect(provider.createSubscriptionCheckout({ ...input, safepayPlanId: null })).rejects.toThrow(/not set up for online payment/);
    });
  });

  describe("webhooks", () => {
    const reference = () => provider.signReference("usr_1", "pl_yoga", "MONTHLY", "plan_yoga_m");
    const event = (type: string, data: Record<string, unknown>) => JSON.stringify({ token: `evt_${type}`, version: "2.0.0", merchant_api_key: API_KEY, type, data });

    it("rejects bad or missing signatures", async () => {
      const body = event("payment.succeeded", { tracker: "track_1", currency: "USD", metadata: { order_id: "ord_1" } });
      await expect(provider.parseWebhookEvent(body, "nope")).rejects.toThrow(/signature/);
      await expect(provider.parseWebhookEvent(body, "")).rejects.toThrow(/signature/);
    });

    it("accepts a signature over the whole payload or over `data`", async () => {
      const data = { tracker: "track_1", currency: "USD", metadata: { order_id: "ord_1" } };
      const body = event("payment.succeeded", data);
      await expect(provider.parseWebhookEvent(body, sign(body))).resolves.toMatchObject({ kind: "payment.checkout_completed", orderId: "ord_1" });
      await expect(provider.parseWebhookEvent(body, sign(JSON.stringify(data)))).resolves.toMatchObject({ kind: "payment.checkout_completed" });
    });

    it("rejects events for another merchant", async () => {
      const body = JSON.stringify({ token: "evt_x", merchant_api_key: "sec_other", type: "payment.succeeded", data: {} });
      await expect(provider.parseWebhookEvent(body, sign(body))).rejects.toThrow(/merchant/);
    });

    it("maps payment.succeeded to a paid order", async () => {
      const body = event("payment.succeeded", { tracker: "track_1", currency: "USD", amount: 13898, metadata: { order_id: "ord_1" } });
      expect(await provider.parseWebhookEvent(body, sign(body))).toEqual({
        kind: "payment.checkout_completed",
        eventId: "evt_payment.succeeded",
        sessionId: "track_1",
        paymentIntentId: "track_1",
        customerId: null,
        orderId: "ord_1",
        shippingAddress: null,
      });
    });

    it("ignores payments in another currency", async () => {
      const body = event("payment.succeeded", { tracker: "track_1", currency: "PKR", metadata: { order_id: "ord_1" } });
      expect(await provider.parseWebhookEvent(body, sign(body))).toMatchObject({ kind: "ignored" });
    });

    it("activates a membership on the first subscription payment", async () => {
      const body = event("subscription.payment.succeeded", {
        id: "sub_9",
        plan_id: "plan_yoga_m",
        reference: reference(),
        status: "ACTIVE",
        current_billing_cycle: 1,
        current_period_end_date: { seconds: 1_800_000_000 },
      });
      expect(await provider.parseWebhookEvent(body, sign(body))).toEqual({
        kind: "subscription.checkout_completed",
        eventId: "evt_subscription.payment.succeeded",
        subscriptionId: "sub_9",
        customerId: null,
        userId: "usr_1",
        planId: "pl_yoga",
        interval: "MONTHLY",
        currentPeriodEnd: new Date(1_800_000_000 * 1000),
      });
    });

    it("extends the period on renewals without re-activating", async () => {
      const body = event("subscription.payment.succeeded", { id: "sub_9", plan_id: "plan_yoga_m", reference: reference(), current_billing_cycle: 2, current_period_end_date: { seconds: 1_802_000_000 } });
      expect(await provider.parseWebhookEvent(body, sign(body))).toMatchObject({ kind: "subscription.updated", subscriptionId: "sub_9", status: "ACTIVE" });
    });

    it("ignores subscriptions whose plan was swapped or reference forged", async () => {
      const swapped = event("subscription.payment.succeeded", { id: "sub_9", plan_id: "plan_cheaper", reference: reference(), current_billing_cycle: 1 });
      expect(await provider.parseWebhookEvent(swapped, sign(swapped))).toMatchObject({ kind: "ignored" });
      const forged = event("subscription.payment.succeeded", { id: "sub_9", plan_id: "plan_yoga_m", reference: "fg1.usr_evil.pl_all.A.AAAAAAAAAAAAAAAAAAAAAAAA", current_billing_cycle: 1 });
      expect(await provider.parseWebhookEvent(forged, sign(forged))).toMatchObject({ kind: "ignored" });
    });

    it("maps failed renewals, cancellations and endings", async () => {
      const failed = event("subscription.payment.failed", { id: "sub_9" });
      expect(await provider.parseWebhookEvent(failed, sign(failed))).toMatchObject({ kind: "invoice.payment_failed", subscriptionId: "sub_9" });
      for (const type of ["subscription.canceled", "subscription.cancelled", "subscription.ended"]) {
        const body = event(type, { id: "sub_9" });
        expect(await provider.parseWebhookEvent(body, sign(body))).toMatchObject({ kind: "subscription.deleted", subscriptionId: "sub_9" });
      }
    });

    it("acknowledges unknown event types without acting", async () => {
      const body = event("authorization.succeeded", { tracker: "track_1" });
      expect(await provider.parseWebhookEvent(body, sign(body))).toMatchObject({ kind: "ignored", providerType: "authorization.succeeded" });
    });
  });

  it("cancels subscriptions through the Safepay client API", async () => {
    await provider.cancelSubscriptionAtPeriodEnd("sub_9");
    expect(calls.at(-1)!.url).toBe("https://sandbox.api.getsafepay.com/client/subscriptions/v1/sub_9/cancel");
  });

  it("uses production hosts in production", async () => {
    const live = new SafepayPaymentProvider({
      environment: "production",
      apiKey: API_KEY,
      secretKey: "s",
      webhookSecret: WEBHOOK_SECRET,
      fetch: fakeFetch([], { "/client/passport/v1/token": { body: { data: "tbt" } } }),
    });
    const session = await live.createSubscriptionCheckout({
      customerEmail: "a",
      customerId: null,
      planName: "p",
      amount: 1,
      interval: "ANNUAL",
      priceId: null,
      safepayPlanId: "plan_a",
      metadata: { userId: "u", planId: "p", interval: "ANNUAL" },
      successUrl: "s",
      cancelUrl: "c",
    });
    expect(session.url.startsWith("https://getsafepay.com/checkout/subscribe?")).toBe(true);
  });
});
