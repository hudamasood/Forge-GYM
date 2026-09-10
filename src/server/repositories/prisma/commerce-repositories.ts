import type { Prisma, PrismaClient } from "@prisma/client";
import { ENTITLED_MEMBERSHIP_STATUSES, type MembershipStatus, type Order, type OrderStatus } from "@/server/domain/types";
import type {
  CreateMembershipInput,
  CreateOrderInput,
  IMembershipPlanRepository,
  IMembershipRepository,
  IOrderRepository,
  IProductRepository,
  PageRequest,
  PlanInput,
  ProductFilter,
  ProductInput,
} from "@/server/repositories/interfaces";
import { type Db, asStringArray, asStringRecord, defined, deleteOrConflict, pageArgs, toPage, uniqueOrConflict } from "./shared";

const objectSelect = { id: true, name: true, slug: true, tagline: true, description: true, heroImageUrl: true, sortOrder: true } as const;

type PlanRow = Prisma.MembershipPlanGetPayload<object>;

function toPlan<T extends PlanRow>(row: T) {
  return { ...row, benefits: asStringArray(row.benefits) };
}

export class PrismaMembershipPlanRepository implements IMembershipPlanRepository {
  constructor(private readonly db: Db) {}

  async list() {
    const rows = await this.db.membershipPlan.findMany({ include: { accessObject: { select: objectSelect } }, orderBy: { sortOrder: "asc" } });
    return rows.map(toPlan);
  }

  async findBySlug(slug: string) {
    const row = await this.db.membershipPlan.findUnique({ where: { slug }, include: { accessObject: { select: objectSelect } } });
    return row ? toPlan(row) : null;
  }

  async findById(id: string) {
    const row = await this.db.membershipPlan.findUnique({ where: { id } });
    return row ? toPlan(row) : null;
  }

  async update(id: string, input: Partial<PlanInput>) {
    const row = await uniqueOrConflict(() => this.db.membershipPlan.update({ where: { id }, data: defined(input) }), "That slug is already in use");
    return toPlan(row);
  }
}

const planInclude = { plan: { include: { accessObject: { select: objectSelect } } } } satisfies Prisma.MembershipInclude;
type MembershipRow = Prisma.MembershipGetPayload<{ include: typeof planInclude }>;

function toMembershipWithPlan<T extends MembershipRow>(row: T) {
  return { ...row, plan: toPlan(row.plan) };
}

export class PrismaMembershipRepository implements IMembershipRepository {
  constructor(private readonly db: Db) {}

  async userCanAccessObject(userId: string, accessObjectId: string, at: Date) {
    const count = await this.db.membership.count({
      where: {
        userId,
        status: { in: [...ENTITLED_MEMBERSHIP_STATUSES] },
        OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: at } }],
        plan: { OR: [{ type: "ALL_ACCESS" }, { accessObjectId }] },
      },
    });
    return count > 0;
  }

  async listForUser(userId: string) {
    const rows = await this.db.membership.findMany({ where: { userId }, include: planInclude, orderBy: { createdAt: "desc" } });
    return rows.map(toMembershipWithPlan);
  }

  findBySubscriptionId(subscriptionId: string) {
    return this.db.membership.findUnique({ where: { stripeSubscriptionId: subscriptionId } });
  }

  async findById(id: string) {
    const row = await this.db.membership.findUnique({ where: { id }, include: planInclude });
    return row ? toMembershipWithPlan(row) : null;
  }

  create(input: CreateMembershipInput) {
    return uniqueOrConflict(() => this.db.membership.create({ data: input }), "This subscription is already linked to a membership");
  }

  async updateBySubscriptionId(subscriptionId: string, input: { status?: MembershipStatus; currentPeriodEnd?: Date | null }) {
    const result = await this.db.membership.updateMany({ where: { stripeSubscriptionId: subscriptionId }, data: defined(input) });
    return result.count ? this.findBySubscriptionId(subscriptionId) : null;
  }

  update(id: string, input: { status?: MembershipStatus; currentPeriodEnd?: Date | null }) {
    return this.db.membership.update({ where: { id }, data: defined(input) });
  }

  async listAll(request: PageRequest & { status?: MembershipStatus }) {
    const args = pageArgs(request);
    const where: Prisma.MembershipWhereInput = {
      status: request.status,
      ...(request.search ? { user: { email: { contains: request.search, mode: "insensitive" } } } : {}),
    };
    const [rows, total] = await Promise.all([
      this.db.membership.findMany({
        where,
        include: { ...planInclude, user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: args.skip,
        take: args.take,
      }),
      this.db.membership.count({ where }),
    ]);
    return toPage(rows.map(toMembershipWithPlan), total, args);
  }
}

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly db: Db) {}

  list(filter: ProductFilter = {}) {
    return this.db.product.findMany({
      where: { category: filter.category, ...(filter.search ? { name: { contains: filter.search, mode: "insensitive" } } : {}) },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  }

  findBySlug(slug: string) {
    return this.db.product.findUnique({ where: { slug } });
  }

  findManyByIds(ids: string[]) {
    return this.db.product.findMany({ where: { id: { in: ids } } });
  }

  create(input: ProductInput) {
    return uniqueOrConflict(() => this.db.product.create({ data: input }), "A product with that slug already exists");
  }

  update(id: string, input: Partial<ProductInput>) {
    return uniqueOrConflict(() => this.db.product.update({ where: { id }, data: defined(input) }), "A product with that slug already exists");
  }

  async delete(id: string) {
    await deleteOrConflict(() => this.db.product.delete({ where: { id } }), "This product appears in past orders — set its stock to 0 instead");
  }
}

const orderInclude = {
  items: { include: { product: { select: { id: true, name: true, slug: true, category: true } } } },
} satisfies Prisma.OrderInclude;
type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function toOrder<T extends OrderRow>(row: T): T & Order {
  return { ...row, shippingAddress: row.shippingAddress ? asStringRecord(row.shippingAddress) : null };
}

export class PrismaOrderRepository implements IOrderRepository {
  constructor(
    private readonly db: Db,
    private readonly client: PrismaClient,
  ) {}

  async create(input: CreateOrderInput) {
    const row = await this.db.order.create({
      data: { userId: input.userId, total: input.total, items: { create: input.items } },
      include: orderInclude,
    });
    return toOrder(row);
  }

  async findById(id: string) {
    const row = await this.db.order.findUnique({ where: { id }, include: orderInclude });
    return row ? toOrder(row) : null;
  }

  async attachCheckoutSession(orderId: string, sessionId: string) {
    await this.db.order.update({ where: { id: orderId }, data: { stripeCheckoutSessionId: sessionId } });
  }

  /** PENDING → PAID and stock decrement in one transaction; the status guard makes it idempotent. */
  markPaid(orderId: string, paymentIntentId: string | null, shippingAddress: Record<string, string> | null = null) {
    return this.client.$transaction(async (tx) => {
      const transitioned = await tx.order.updateMany({
        where: { id: orderId, status: "PENDING" },
        data: { status: "PAID", stripePaymentIntentId: paymentIntentId, shippingAddress: shippingAddress ?? undefined },
      });
      if (transitioned.count === 0) return false;
      const items = await tx.orderItem.findMany({ where: { orderId }, select: { productId: true, quantity: true } });
      for (const item of items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }
      return true;
    });
  }

  async setStatus(orderId: string, status: OrderStatus) {
    const row = await this.db.order.update({ where: { id: orderId }, data: { status }, include: orderInclude });
    return toOrder(row);
  }

  async listForUser(userId: string) {
    const rows = await this.db.order.findMany({ where: { userId, status: { not: "PENDING" } }, include: orderInclude, orderBy: { createdAt: "desc" } });
    return rows.map(toOrder);
  }

  async listAll(request: PageRequest & { status?: OrderStatus }) {
    const args = pageArgs(request);
    const where: Prisma.OrderWhereInput = {
      status: request.status,
      ...(request.search ? { user: { email: { contains: request.search, mode: "insensitive" } } } : {}),
    };
    const [rows, total] = await Promise.all([
      this.db.order.findMany({
        where,
        include: { ...orderInclude, user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: args.skip,
        take: args.take,
      }),
      this.db.order.count({ where }),
    ]);
    return toPage(rows.map(toOrder), total, args);
  }
}
