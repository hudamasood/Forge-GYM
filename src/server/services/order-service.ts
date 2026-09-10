import { ForbiddenError, NotFoundError, ValidationError } from "@/server/domain/errors";
import type { Order, OrderStatus, Role } from "@/server/domain/types";
import type { IOrderRepository, IProductRepository, IUserRepository, ProductFilter, ProductInput } from "@/server/repositories/interfaces";
import type { CheckoutSession, IPaymentProvider } from "@/server/ports/payment";
import type { CheckoutUrls } from "@/server/services/membership-service";

export interface CartLine {
  productId: string;
  quantity: number;
}

export const MAX_LINE_QUANTITY = 10;

/**
 * Store and orders. All prices and totals are computed server-side from the
 * database — never trusted from the client (spec B5).
 */
export class OrderService {
  constructor(
    private readonly products: IProductRepository,
    private readonly orders: IOrderRepository,
    private readonly users: IUserRepository,
    private readonly payments: IPaymentProvider,
  ) {}

  listProducts(filter: ProductFilter = {}) {
    return this.products.list(filter);
  }

  async getProduct(slug: string) {
    const product = await this.products.findBySlug(slug);
    if (!product) throw new NotFoundError("Product not found");
    return product;
  }

  /** Re-prices a client cart against the database (used by the cart page). */
  async priceCart(lines: CartLine[]) {
    const merged = mergeLines(lines);
    const products = await this.products.findManyByIds(merged.map((l) => l.productId));
    const byId = new Map(products.map((p) => [p.id, p]));
    const items = merged
      .filter((l) => byId.has(l.productId))
      .map((l) => {
        const product = byId.get(l.productId)!;
        const quantity = Math.min(l.quantity, MAX_LINE_QUANTITY, Math.max(product.stock, 0));
        return { product, quantity, lineTotal: product.price * quantity, available: product.stock >= l.quantity };
      });
    return { items, subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0) };
  }

  async createCheckout(userId: string, lines: CartLine[], urls: CheckoutUrls): Promise<CheckoutSession & { orderId: string }> {
    const merged = mergeLines(lines);
    if (merged.length === 0) throw new ValidationError("Your cart is empty");

    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const products = await this.products.findManyByIds(merged.map((l) => l.productId));
    const byId = new Map(products.map((p) => [p.id, p]));

    const items = merged.map((line) => {
      const product = byId.get(line.productId);
      if (!product) throw new NotFoundError("A product in your cart no longer exists");
      if (line.quantity < 1 || line.quantity > MAX_LINE_QUANTITY) {
        throw new ValidationError(`Quantity for ${product.name} must be between 1 and ${MAX_LINE_QUANTITY}`);
      }
      if (product.stock < line.quantity) throw new ValidationError(`Only ${product.stock} of ${product.name} left in stock`);
      return { product, quantity: line.quantity };
    });

    const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const order = await this.orders.create({
      userId,
      total,
      items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity, unitPriceAtPurchase: i.product.price })),
    });

    const session = await this.payments.createPaymentCheckout({
      customerEmail: user.email,
      customerId: user.stripeCustomerId,
      lineItems: items.map((i) => ({ name: i.product.name, unitAmount: i.product.price, quantity: i.quantity })),
      metadata: { userId, orderId: order.id },
      collectShippingAddress: items.some((i) => i.product.category !== "DIGITAL"),
      ...urls,
    });
    await this.orders.attachCheckoutSession(order.id, session.id);

    return { ...session, orderId: order.id };
  }

  /** Called from the verified payment webhook. Idempotent. */
  async markPaid(orderId: string, paymentIntentId: string | null) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    return this.orders.markPaid(orderId, paymentIntentId);
  }

  async markCheckoutExpired(orderId: string) {
    const order = await this.orders.findById(orderId);
    if (order?.status === "PENDING") await this.orders.setStatus(orderId, "CANCELLED");
  }

  listForUser(userId: string) {
    return this.orders.listForUser(userId);
  }

  async getForViewer(viewer: { id: string; role: Role }, orderId: string): Promise<Order> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.userId !== viewer.id && viewer.role !== "ADMIN") throw new ForbiddenError("Not your order");
    return order;
  }

  listAll(request: Parameters<IOrderRepository["listAll"]>[0]) {
    return this.orders.listAll(request);
  }

  async setStatus(orderId: string, status: OrderStatus) {
    if (!(await this.orders.findById(orderId))) throw new NotFoundError("Order not found");
    return this.orders.setStatus(orderId, status);
  }

  createProduct(input: ProductInput) {
    validateProduct(input);
    return this.products.create(input);
  }

  async updateProduct(id: string, input: Partial<ProductInput>) {
    validateProduct(input);
    return this.products.update(id, input);
  }

  deleteProduct(id: string) {
    return this.products.delete(id);
  }
}

function mergeLines(lines: CartLine[]): CartLine[] {
  const totals = new Map<string, number>();
  for (const line of lines) totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.quantity);
  return [...totals].map(([productId, quantity]) => ({ productId, quantity }));
}

function validateProduct(input: Partial<ProductInput>) {
  if (input.price != null && (!Number.isInteger(input.price) || input.price < 0)) throw new ValidationError("Price must be a positive amount");
  if (input.stock != null && (!Number.isInteger(input.stock) || input.stock < 0)) throw new ValidationError("Stock cannot be negative");
}
