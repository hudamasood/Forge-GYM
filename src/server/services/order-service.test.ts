import { beforeEach, describe, expect, it } from "vitest";
import { OrderService } from "@/server/services/order-service";
import { NotFoundError, ValidationError } from "@/server/domain/errors";
import { MemoryOrderRepository, MemoryProductRepository, MemoryUserRepository, type MemoryStore } from "@/server/repositories/memory";
import { FakePaymentProvider, buildWorld } from "@/server/testing/fixtures";

const urls = { successUrl: "https://forge.test/ok", cancelUrl: "https://forge.test/cancel" };

describe("OrderService", () => {
  let db: MemoryStore;
  let payments: FakePaymentProvider;
  let service: OrderService;

  beforeEach(() => {
    db = buildWorld().db;
    payments = new FakePaymentProvider();
    service = new OrderService(new MemoryProductRepository(db), new MemoryOrderRepository(db), new MemoryUserRepository(db), payments);
  });

  it("computes the total server-side and snapshots unit prices", async () => {
    const { orderId } = await service.createCheckout(
      "usr_none",
      [
        { productId: "prd_whey", quantity: 2 },
        { productId: "prd_pdf", quantity: 1 },
      ],
      urls,
    );
    const order = db.orders.find((o) => o.id === orderId)!;
    expect(order.total).toBe(5499 * 2 + 2900);
    expect(order.status).toBe("PENDING");
    expect(order.items.map((i) => i.unitPriceAtPurchase)).toEqual([5499, 2900]);
    expect(order.stripeCheckoutSessionId).toBeTruthy();
    expect(payments.paymentCheckouts[0].collectShippingAddress).toBe(true);
  });

  it("does not ask for shipping on digital-only carts", async () => {
    await service.createCheckout("usr_none", [{ productId: "prd_pdf", quantity: 1 }], urls);
    expect(payments.paymentCheckouts[0].collectShippingAddress).toBe(false);
  });

  it("merges duplicate cart lines", async () => {
    const { orderId } = await service.createCheckout(
      "usr_none",
      [
        { productId: "prd_whey", quantity: 1 },
        { productId: "prd_whey", quantity: 2 },
      ],
      urls,
    );
    expect(db.orders.find((o) => o.id === orderId)!.items).toEqual([expect.objectContaining({ productId: "prd_whey", quantity: 3 })]);
  });

  it("rejects empty carts, bad quantities, unknown products and insufficient stock", async () => {
    await expect(service.createCheckout("usr_none", [], urls)).rejects.toBeInstanceOf(ValidationError);
    await expect(service.createCheckout("usr_none", [{ productId: "prd_whey", quantity: 0 }], urls)).rejects.toBeInstanceOf(ValidationError);
    await expect(service.createCheckout("usr_none", [{ productId: "ghost", quantity: 1 }], urls)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.createCheckout("usr_none", [{ productId: "prd_whey", quantity: 6 }], urls)).rejects.toThrow(/Only 5/);
  });

  it("marks an order paid once and decrements stock once", async () => {
    const { orderId } = await service.createCheckout("usr_none", [{ productId: "prd_whey", quantity: 2 }], urls);
    await expect(service.markPaid(orderId, "pi_1")).resolves.toBe(true);
    await expect(service.markPaid(orderId, "pi_1")).resolves.toBe(false);
    expect(db.products.find((p) => p.id === "prd_whey")!.stock).toBe(3);
    expect(db.orders.find((o) => o.id === orderId)!.status).toBe("PAID");
  });

  it("cancels pending orders whose checkout expired", async () => {
    const { orderId } = await service.createCheckout("usr_none", [{ productId: "prd_whey", quantity: 1 }], urls);
    await service.markCheckoutExpired(orderId);
    expect(db.orders.find((o) => o.id === orderId)!.status).toBe("CANCELLED");
  });

  it("re-prices a client cart and clamps to stock", async () => {
    const priced = await service.priceCart([{ productId: "prd_whey", quantity: 8 }]);
    expect(priced.items[0]).toMatchObject({ quantity: 5, available: false });
    expect(priced.subtotal).toBe(5499 * 5);
  });

  it("only shows an order to its owner or an admin", async () => {
    const { orderId } = await service.createCheckout("usr_none", [{ productId: "prd_pdf", quantity: 1 }], urls);
    await expect(service.getForViewer({ id: "usr_none", role: "MEMBER" }, orderId)).resolves.toBeDefined();
    await expect(service.getForViewer({ id: "usr_admin", role: "ADMIN" }, orderId)).resolves.toBeDefined();
    await expect(service.getForViewer({ id: "usr_yoga", role: "MEMBER" }, orderId)).rejects.toThrow(/Not your order/);
  });
});
