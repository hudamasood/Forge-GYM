import type { Prisma } from "@prisma/client";
import type {
  AnalyticsSummary,
  AuditEntry,
  IAnalyticsRepository,
  IAuditLogRepository,
  IContactMessageRepository,
  IWebhookEventRepository,
} from "@/server/repositories/interfaces";
import { ENTITLED_MEMBERSHIP_STATUSES } from "@/server/domain/types";
import { type Db, isUniqueViolation } from "./shared";

export class PrismaWebhookEventRepository implements IWebhookEventRepository {
  constructor(private readonly db: Db) {}

  async markProcessed(eventId: string, type: string) {
    try {
      await this.db.processedWebhookEvent.create({ data: { id: eventId, type } });
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      throw error;
    }
  }

  async unmark(eventId: string) {
    await this.db.processedWebhookEvent.deleteMany({ where: { id: eventId } });
  }
}

export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly db: Db) {}

  async record(entry: AuditEntry) {
    await this.db.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async listRecent(limit: number) {
    const rows = await this.db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit, include: { actor: { select: { name: true } } } });
    return rows.map((r) => ({
      id: r.id,
      actorId: r.actorId,
      actorName: r.actor.name,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      metadata: (r.metadata ?? undefined) as Record<string, unknown> | undefined,
      createdAt: r.createdAt,
    }));
  }
}

export class PrismaContactMessageRepository implements IContactMessageRepository {
  constructor(private readonly db: Db) {}

  async create(input: { name: string; email: string; subject: string; message: string }) {
    await this.db.contactMessage.create({ data: input });
  }
}

export class PrismaAnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly db: Db) {}

  async summary(now: Date, lowStockThreshold: number): Promise<AnalyticsSummary> {
    const entitled = { status: { in: [...ENTITLED_MEMBERSHIP_STATUSES] }, OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }] } satisfies Prisma.MembershipWhereInput;
    const [revenue, activeMemberships, members, upcomingBookings, lowStockProducts, byPlan] = await Promise.all([
      this.db.order.aggregate({ where: { status: { in: ["PAID", "FULFILLED"] } }, _sum: { total: true }, _count: true }),
      this.db.membership.findMany({ where: entitled, select: { billingInterval: true, plan: { select: { priceMonthly: true, priceAnnual: true } } } }),
      this.db.user.count({ where: { role: "MEMBER" } }),
      this.db.booking.count({ where: { status: "CONFIRMED", schedule: { startTime: { gte: now } } } }),
      this.db.product.findMany({
        where: { stock: { lte: lowStockThreshold }, category: { not: "DIGITAL" } },
        select: { id: true, name: true, slug: true, stock: true },
        orderBy: { stock: "asc" },
      }),
      this.db.membership.groupBy({ by: ["planId"], where: entitled, _count: { _all: true } }),
    ]);

    const plans = await this.db.membershipPlan.findMany({ where: { id: { in: byPlan.map((b) => b.planId) } }, select: { id: true, name: true } });
    const planNames = new Map(plans.map((p) => [p.id, p.name]));

    return {
      revenueCents: revenue._sum.total ?? 0,
      paidOrders: revenue._count,
      activeMemberships: activeMemberships.length,
      monthlyRecurringCents: activeMemberships.reduce(
        (sum, m) => sum + (m.billingInterval === "MONTHLY" ? m.plan.priceMonthly : Math.round(m.plan.priceAnnual / 12)),
        0,
      ),
      members,
      upcomingBookings,
      lowStockProducts,
      membershipsByPlan: byPlan
        .map((b) => ({ planName: planNames.get(b.planId) ?? "Unknown", count: b._count._all }))
        .sort((a, b) => b.count - a.count),
    };
  }
}
