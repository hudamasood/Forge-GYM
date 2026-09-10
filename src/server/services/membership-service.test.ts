import { beforeEach, describe, expect, it } from "vitest";
import { MembershipService } from "@/server/services/membership-service";
import { ConflictError, ForbiddenError, NotFoundError } from "@/server/domain/errors";
import { MemoryMembershipPlanRepository, MemoryMembershipRepository, MemoryUserRepository, type MemoryStore } from "@/server/repositories/memory";
import { FakePaymentProvider, buildWorld, clock } from "@/server/testing/fixtures";

const urls = { successUrl: "https://forge.test/ok", cancelUrl: "https://forge.test/cancel" };

describe("MembershipService", () => {
  let db: MemoryStore;
  let payments: FakePaymentProvider;
  let service: MembershipService;

  beforeEach(() => {
    db = buildWorld().db;
    payments = new FakePaymentProvider();
    service = new MembershipService(new MemoryMembershipPlanRepository(db), new MemoryMembershipRepository(db), new MemoryUserRepository(db), payments, clock);
  });

  it("creates a subscription checkout priced from the database, never the client", async () => {
    const session = await service.startCheckout("usr_none", "yoga-unlimited", "ANNUAL", urls);
    expect(session.url).toContain("checkout.test");
    expect(payments.subscriptionCheckouts[0]).toMatchObject({ amount: 39000, interval: "ANNUAL", metadata: { userId: "usr_none", planId: "pl_yoga" } });
  });

  it("refuses to sell a plan the user already holds", async () => {
    await expect(service.startCheckout("usr_yoga", "yoga-unlimited", "MONTHLY", urls)).rejects.toBeInstanceOf(ConflictError);
  });

  it("refuses to sell anything to an All-Access member", async () => {
    await expect(service.startCheckout("usr_all", "yoga-unlimited", "MONTHLY", urls)).rejects.toThrow(/already covers/);
  });

  it("allows upgrading from a single-object plan to All-Access", async () => {
    await expect(service.startCheckout("usr_yoga", "premium-all-access", "MONTHLY", urls)).resolves.toBeDefined();
  });

  it("rejects unknown plans", async () => {
    await expect(service.startCheckout("usr_none", "nope", "MONTHLY", urls)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("activates a membership from a completed checkout, idempotently", async () => {
    const input = { userId: "usr_none", planId: "pl_all", interval: "MONTHLY" as const, subscriptionId: "sub_new", customerId: "cus_1", currentPeriodEnd: null };
    await service.activateFromCheckout(input);
    await service.activateFromCheckout(input);
    expect(db.memberships.filter((m) => m.stripeSubscriptionId === "sub_new")).toHaveLength(1);
    expect(db.users.find((u) => u.id === "usr_none")!.stripeCustomerId).toBe("cus_1");
    await expect(service.userCanAccessObject("usr_none", "ao_box")).resolves.toBe(true);
  });

  it("derives coverage from active plans", async () => {
    await expect(service.coverageForUser("usr_all")).resolves.toBe("ALL");
    await expect(service.coverageForUser("usr_yoga")).resolves.toEqual(["ao_yoga"]);
    await expect(service.coverageForUser("usr_none")).resolves.toEqual([]);
  });

  it("cancels at period end through the payment provider", async () => {
    const membership = db.memberships.find((m) => m.userId === "usr_yoga")!;
    await service.cancel({ id: "usr_yoga", role: "MEMBER" }, membership.id);
    expect(payments.cancelled).toEqual([membership.stripeSubscriptionId]);
  });

  it("forbids cancelling another member's membership", async () => {
    const membership = db.memberships.find((m) => m.userId === "usr_yoga")!;
    await expect(service.cancel({ id: "usr_all", role: "MEMBER" }, membership.id)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
