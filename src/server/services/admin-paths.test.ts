import { beforeEach, describe, expect, it } from "vitest";
import { MembershipService } from "@/server/services/membership-service";
import { OrderService } from "@/server/services/order-service";
import { NotificationService } from "@/server/services/notification-service";
import { NotFoundError, ValidationError } from "@/server/domain/errors";
import {
  MemoryMembershipPlanRepository,
  MemoryMembershipRepository,
  MemoryOrderRepository,
  MemoryProductRepository,
  MemoryUserRepository,
  type MemoryStore,
} from "@/server/repositories/memory";
import { FakePaymentProvider, RecordingNotificationChannel, buildWorld, clock } from "@/server/testing/fixtures";

let db: MemoryStore;
let payments: FakePaymentProvider;
beforeEach(() => {
  db = buildWorld().db;
  payments = new FakePaymentProvider();
});

describe("MembershipService admin paths", () => {
  const make = () => new MembershipService(new MemoryMembershipPlanRepository(db), new MemoryMembershipRepository(db), new MemoryUserRepository(db), payments, clock);

  it("lists plans and memberships, and finds plans by slug", async () => {
    const service = make();
    expect(await service.listPlans()).toHaveLength(2);
    expect((await service.getPlan("yoga-unlimited")).id).toBe("pl_yoga");
    await expect(service.getPlan("nope")).rejects.toBeInstanceOf(NotFoundError);
    expect((await service.listAll({})).total).toBe(3);
    expect(await service.listForUser("usr_yoga")).toHaveLength(1);
  });

  it("updates pricing with validation", async () => {
    const service = make();
    await service.updatePlan("pl_yoga", { priceMonthly: 4200 });
    expect(db.plans.find((p) => p.id === "pl_yoga")?.priceMonthly).toBe(4200);
    await expect(service.updatePlan("pl_yoga", { priceMonthly: -1 })).rejects.toBeInstanceOf(ValidationError);
    await expect(service.updatePlan("ghost", { priceMonthly: 1 })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lets admins set a membership status", async () => {
    const service = make();
    const membership = db.memberships[0];
    await service.adminSetStatus(membership.id, "EXPIRED");
    expect(db.memberships[0].status).toBe("EXPIRED");
    await expect(service.adminSetStatus("ghost", "ACTIVE")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("syncs subscriptions from provider events", async () => {
    const service = make();
    await service.syncSubscription("sub_usr_yoga", { status: "PAST_DUE" });
    expect(db.memberships.find((m) => m.userId === "usr_yoga")?.status).toBe("PAST_DUE");
  });
});

describe("OrderService admin paths", () => {
  const make = () => new OrderService(new MemoryProductRepository(db), new MemoryOrderRepository(db), new MemoryUserRepository(db), payments);

  it("manages products with validation", async () => {
    const service = make();
    const created = await service.createProduct({ name: "Chalk", slug: "chalk", category: "EQUIPMENT", price: 900, stock: 20, description: "Block chalk", images: [] });
    await service.updateProduct(created.id, { stock: 5 });
    expect((await service.getProduct("chalk")).stock).toBe(5);
    await expect(service.createProduct({ name: "Bad", slug: "bad", category: "EQUIPMENT", price: -5, stock: 1, description: "x", images: [] })).rejects.toBeInstanceOf(ValidationError);
    await expect(service.updateProduct(created.id, { stock: -1 })).rejects.toBeInstanceOf(ValidationError);
    await service.deleteProduct(created.id);
    await expect(service.getProduct("chalk")).rejects.toBeInstanceOf(NotFoundError);
    expect((await service.listProducts({ category: "DIGITAL" })).map((p) => p.slug)).toEqual(["program"]);
  });

  it("lists and updates orders", async () => {
    const service = make();
    const { orderId } = await service.createCheckout("usr_yoga", [{ productId: "prd_pdf", quantity: 1 }], { successUrl: "a", cancelUrl: "b" });
    expect((await service.listAll({})).total).toBe(1);
    expect(await service.listForUser("usr_yoga")).toHaveLength(1);
    await service.setStatus(orderId, "FULFILLED");
    expect(db.orders[0].status).toBe("FULFILLED");
    await expect(service.setStatus("ghost", "PAID")).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.markPaid("ghost", null)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("NotificationService templates", () => {
  it("renders every transactional email with text and escaped HTML", async () => {
    const channel = new RecordingNotificationChannel();
    const n = new NotificationService(channel, "https://forge.test");
    await n.bookingConfirmed("a@b.c", { className: "WOD", startsAt: "Mon 6:00", trainerName: "Kai", spaceName: "CrossFit" });
    await n.orderReceipt("a@b.c", { orderId: "o1", total: "$10.00", items: [{ name: "Chalk", quantity: 2 }] });
    await n.membershipActivated("a@b.c", "Yoga Unlimited");
    expect(channel.sent.map((m) => m.subject)).toEqual(["Booked: WOD", "Your FORGE order is confirmed", "Your Yoga Unlimited membership is active"]);
    expect(channel.sent.every((m) => m.text.length > 0 && m.html.includes("FORGE"))).toBe(true);
  });
});
