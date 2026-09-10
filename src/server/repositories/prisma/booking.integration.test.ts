/**
 * Integration tests (spec B6): the full service → repository → Postgres path,
 * including the capacity transaction and the (scheduleId, userId) unique index.
 * Requires DATABASE_URL pointing at a migrated test database.
 */
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BookingService } from "@/server/services/booking-service";
import { CapacityError, ConflictError, ForbiddenError } from "@/server/domain/errors";
import { PrismaBookingRepository, PrismaScheduleRepository, prismaBookingTransaction } from "./scheduling-repositories";
import { PrismaMembershipRepository, PrismaOrderRepository } from "./commerce-repositories";

const prisma = new PrismaClient();
const tag = randomUUID().slice(0, 8);

let scheduleId: string;
const memberIds: string[] = [];
let outsiderId: string;
let service: BookingService;

beforeAll(async () => {
  const object = await prisma.accessObject.create({
    data: {
      name: `IT Object ${tag}`,
      slug: `it-object-${tag}`,
      description: "integration",
      space: { create: { equipmentList: [], operatingHours: {}, galleryImages: [] } },
    },
    include: { space: true },
  });
  const otherObject = await prisma.accessObject.create({ data: { name: `IT Other ${tag}`, slug: `it-other-${tag}`, description: "integration" } });
  const trainer = await prisma.trainer.create({
    data: { name: "IT Trainer", slug: `it-trainer-${tag}`, bio: "", specialty: "", certifications: [], yearsExperience: 1, primaryAccessObjectId: object.id },
  });
  const gymClass = await prisma.class.create({
    data: {
      name: "IT Class",
      slug: `it-class-${tag}`,
      accessObjectId: object.id,
      description: "",
      benefits: [],
      difficulty: "ALL_LEVELS",
      durationMinutes: 60,
      estCalories: 100,
      defaultCapacity: 2,
    },
  });
  const start = new Date(Date.now() + 86_400_000);
  const schedule = await prisma.schedule.create({
    data: { classId: gymClass.id, trainerId: trainer.id, spaceId: object.space!.id, startTime: start, endTime: new Date(start.getTime() + 3_600_000) },
  });
  scheduleId = schedule.id;

  const plan = await prisma.membershipPlan.create({
    data: { name: "IT Plan", slug: `it-plan-${tag}`, type: "SINGLE_OBJECT", accessObjectId: object.id, priceMonthly: 100, priceAnnual: 1000, benefits: [] },
  });
  const otherPlan = await prisma.membershipPlan.create({
    data: { name: "IT Other Plan", slug: `it-other-plan-${tag}`, type: "SINGLE_OBJECT", accessObjectId: otherObject.id, priceMonthly: 100, priceAnnual: 1000, benefits: [] },
  });

  for (let i = 0; i < 4; i++) {
    const user = await prisma.user.create({ data: { email: `it-${tag}-${i}@test.dev`, name: `IT ${i}` } });
    await prisma.membership.create({ data: { userId: user.id, planId: plan.id, status: "ACTIVE", billingInterval: "MONTHLY" } });
    memberIds.push(user.id);
  }
  const outsider = await prisma.user.create({ data: { email: `it-${tag}-out@test.dev`, name: "IT Outsider" } });
  await prisma.membership.create({ data: { userId: outsider.id, planId: otherPlan.id, status: "ACTIVE", billingInterval: "MONTHLY" } });
  outsiderId = outsider.id;

  service = new BookingService(
    new PrismaBookingRepository(prisma),
    new PrismaScheduleRepository(prisma),
    new PrismaMembershipRepository(prisma),
    prismaBookingTransaction(prisma),
    () => new Date(),
  );
});

afterAll(async () => {
  const users = await prisma.user.findMany({ where: { email: { startsWith: `it-${tag}` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await prisma.booking.deleteMany({ where: { scheduleId } });
  await prisma.orderItem.deleteMany({ where: { order: { userId: { in: userIds } } } });
  await prisma.order.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.membership.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.schedule.deleteMany({ where: { id: scheduleId } });
  await prisma.class.deleteMany({ where: { slug: `it-class-${tag}` } });
  await prisma.trainer.deleteMany({ where: { slug: `it-trainer-${tag}` } });
  await prisma.membershipPlan.deleteMany({ where: { slug: { in: [`it-plan-${tag}`, `it-other-plan-${tag}`] } } });
  await prisma.product.deleteMany({ where: { slug: `it-product-${tag}` } });
  await prisma.accessObject.deleteMany({ where: { slug: { in: [`it-object-${tag}`, `it-other-${tag}`] } } });
  await prisma.$disconnect();
});

describe("booking against Postgres", () => {
  it("enforces entitlement from the database", async () => {
    await expect(service.bookClass(outsiderId, scheduleId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("never exceeds capacity under concurrent requests", async () => {
    const results = await Promise.allSettled(memberIds.map((id) => service.bookClass(id, scheduleId)));
    const succeeded = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(succeeded).toHaveLength(2);
    expect(rejected.every((r) => r.reason instanceof CapacityError)).toBe(true);
    expect(await prisma.booking.count({ where: { scheduleId, status: "CONFIRMED" } })).toBe(2);
  });

  it("rejects a double booking at the database level", async () => {
    const repo = new PrismaBookingRepository(prisma);
    const existing = await prisma.booking.findFirstOrThrow({ where: { scheduleId } });
    await expect(repo.create(existing.userId, scheduleId)).rejects.toBeInstanceOf(ConflictError);
  });

  it("frees the seat on cancellation and lets the next member book", async () => {
    const booked = await prisma.booking.findFirstOrThrow({ where: { scheduleId, status: "CONFIRMED" } });
    await service.cancelBooking({ id: booked.userId, role: "MEMBER" }, booked.id);

    const confirmed = await prisma.booking.findMany({ where: { scheduleId, status: "CONFIRMED" }, select: { userId: true } });
    const waiting = memberIds.find((id) => id !== booked.userId && !confirmed.some((b) => b.userId === id))!;
    await expect(service.bookClass(waiting, scheduleId)).resolves.toMatchObject({ status: "CONFIRMED" });
  });
});

describe("orders against Postgres", () => {
  it("marks an order paid exactly once and decrements stock once", async () => {
    const product = await prisma.product.create({
      data: { name: "IT Product", slug: `it-product-${tag}`, category: "EQUIPMENT", price: 1000, stock: 5, description: "", images: [] },
    });
    const orders = new PrismaOrderRepository(prisma, prisma);
    const order = await orders.create({ userId: memberIds[0], total: 2000, items: [{ productId: product.id, quantity: 2, unitPriceAtPurchase: 1000 }] });

    const results = await Promise.all([orders.markPaid(order.id, "pi_it"), orders.markPaid(order.id, "pi_it")]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(3);
  });
});
