import { beforeEach, describe, expect, it } from "vitest";
import { PaymentWebhookService } from "@/server/services/payment-webhook-service";
import { MembershipService } from "@/server/services/membership-service";
import { NotificationService } from "@/server/services/notification-service";
import { OrderService } from "@/server/services/order-service";
import {
  MemoryMembershipPlanRepository,
  MemoryMembershipRepository,
  MemoryOrderRepository,
  MemoryProductRepository,
  MemoryUserRepository,
  MemoryWebhookEventRepository,
  type MemoryStore,
} from "@/server/repositories/memory";
import { FakePaymentProvider, RecordingNotificationChannel, buildWorld, clock } from "@/server/testing/fixtures";

describe("PaymentWebhookService", () => {
  let db: MemoryStore;
  let payments: FakePaymentProvider;
  let channel: RecordingNotificationChannel;
  let orders: OrderService;
  let service: PaymentWebhookService;

  beforeEach(() => {
    db = buildWorld().db;
    payments = new FakePaymentProvider();
    channel = new RecordingNotificationChannel();
    const users = new MemoryUserRepository(db);
    const orderRepo = new MemoryOrderRepository(db);
    const notifications = new NotificationService(channel, "https://forge.test");
    const memberships = new MembershipService(new MemoryMembershipPlanRepository(db), new MemoryMembershipRepository(db), users, payments, clock);
    orders = new OrderService(new MemoryProductRepository(db), orderRepo, users, payments);
    service = new PaymentWebhookService(payments, new MemoryWebhookEventRepository(db), memberships, orders, orderRepo, users, notifications);
  });

  it("rejects events with an invalid signature", async () => {
    payments.nextEvent = { kind: "ignored", eventId: "evt_0", providerType: "x" };
    await expect(service.handle("{}", "forged")).rejects.toThrow(/signature/);
  });

  it("activates a membership once, even when the event is delivered twice", async () => {
    payments.nextEvent = {
      kind: "subscription.checkout_completed",
      eventId: "evt_1",
      subscriptionId: "sub_x",
      customerId: "cus_x",
      userId: "usr_none",
      planId: "pl_all",
      interval: "MONTHLY",
      currentPeriodEnd: null,
    };
    await expect(service.handle("{}", "valid")).resolves.toEqual({ duplicate: false, kind: "subscription.checkout_completed" });
    await expect(service.handle("{}", "valid")).resolves.toMatchObject({ duplicate: true });
    expect(db.memberships.filter((m) => m.stripeSubscriptionId === "sub_x")).toHaveLength(1);
    expect(channel.sent.map((m) => m.subject)).toEqual(["Your premium-all-access membership is active"]);
  });

  it("marks orders paid and emails a receipt", async () => {
    const { orderId } = await orders.createCheckout("usr_none", [{ productId: "prd_whey", quantity: 1 }], { successUrl: "a", cancelUrl: "b" });
    await service.apply({ kind: "payment.checkout_completed", eventId: "evt_2", sessionId: "cs", paymentIntentId: "pi", customerId: null, orderId, shippingAddress: null });
    expect(db.orders.find((o) => o.id === orderId)!.status).toBe("PAID");
    expect(channel.sent.at(-1)!.text).toContain("$54.99");
  });

  it("flags failed renewals as past due without removing access", async () => {
    await service.apply({ kind: "invoice.payment_failed", eventId: "evt_3", subscriptionId: "sub_usr_yoga" });
    expect(db.memberships.find((m) => m.userId === "usr_yoga")!.status).toBe("PAST_DUE");
  });

  it("cancels memberships when the subscription is deleted", async () => {
    await service.apply({ kind: "subscription.deleted", eventId: "evt_4", subscriptionId: "sub_usr_yoga" });
    expect(db.memberships.find((m) => m.userId === "usr_yoga")!.status).toBe("CANCELED");
  });

  it("un-records a failed event so the provider's retry is processed", async () => {
    const event = { kind: "payment.checkout_completed" as const, eventId: "evt_5", sessionId: "cs", paymentIntentId: null, customerId: null, orderId: "missing", shippingAddress: null };
    await expect(service.apply(event)).rejects.toThrow();
    expect(db.webhookEvents.has("evt_5")).toBe(false);
  });
});
