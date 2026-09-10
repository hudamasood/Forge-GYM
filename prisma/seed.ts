/**
 * Loads the placeholder seed content (spec A8) into the database.
 * Destructive: it clears existing catalog/booking data first. Refuses to run
 * in production unless FORCE_SEED=1.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { accessObjects, classes, membershipPlans, products, trainers } from "./seed-data";

const prisma = new PrismaClient();

const SEED_PASSWORD = "Forge123!";
const SCHEDULE_DAYS_AHEAD = 21;

async function reset() {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.processedWebhookEvent.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.schedule.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.membershipPlan.deleteMany(),
    prisma.class.deleteMany(),
    prisma.trainer.deleteMany(),
    prisma.space.deleteMany(),
    prisma.accessObject.deleteMany(),
    prisma.product.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.contactMessage.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/** Every occurrence of each class slot over the next N days (UTC). */
function upcomingOccurrences(slots: { weekday: number; hour: number; minute?: number }[], days: number) {
  const out: Date[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let d = 0; d < days; d++) {
    const date = new Date(today.getTime() + d * 86_400_000);
    const isoWeekday = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
    for (const slot of slots) {
      if (slot.weekday !== isoWeekday) continue;
      const start = new Date(date);
      start.setUTCHours(slot.hour, slot.minute ?? 0, 0, 0);
      if (start.getTime() > Date.now()) out.push(start);
    }
  }
  return out;
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.FORCE_SEED !== "1") {
    throw new Error("Refusing to seed a production database. Set FORCE_SEED=1 to override.");
  }

  await reset();
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const objectIds = new Map<string, string>();
  const spaceIds = new Map<string, string>();
  for (const [index, obj] of accessObjects.entries()) {
    const created = await prisma.accessObject.create({
      data: {
        slug: obj.slug,
        name: obj.name,
        tagline: obj.tagline,
        description: obj.description,
        sortOrder: index,
        space: {
          create: {
            equipmentList: [...obj.equipment],
            operatingHours: { weekdays: "05:00–23:00", weekends: "07:00–21:00" },
            galleryImages: [],
          },
        },
      },
      include: { space: true },
    });
    objectIds.set(obj.slug, created.id);
    spaceIds.set(obj.slug, created.space!.id);
  }

  const admin = await prisma.user.create({
    data: { email: "admin@forge.example", name: "Avery Admin", role: "ADMIN", passwordHash, emailVerifiedAt: new Date() },
  });
  const trainerUser = await prisma.user.create({
    data: { email: "trainer@forge.example", name: "Elena Cruz", role: "TRAINER", passwordHash, emailVerifiedAt: new Date() },
  });
  const member = await prisma.user.create({
    data: { email: "member@forge.example", name: "Morgan Member", role: "MEMBER", passwordHash, emailVerifiedAt: new Date() },
  });

  const trainerIds = new Map<string, string>();
  for (const t of trainers) {
    const created = await prisma.trainer.create({
      data: {
        slug: t.slug,
        name: t.name,
        bio: t.bio,
        specialty: t.specialty,
        certifications: [...t.certifications],
        yearsExperience: t.yearsExperience,
        primaryAccessObjectId: objectIds.get(t.accessObject)!,
        userId: t.slug === "elena-cruz" ? trainerUser.id : null,
      },
    });
    trainerIds.set(t.slug, created.id);
  }

  let scheduleCount = 0;
  for (const c of classes) {
    const created = await prisma.class.create({
      data: {
        slug: c.slug,
        name: c.name,
        accessObjectId: objectIds.get(c.accessObject)!,
        description: c.description,
        benefits: c.benefits,
        difficulty: c.difficulty,
        durationMinutes: c.durationMinutes,
        estCalories: c.estCalories,
        defaultCapacity: c.defaultCapacity,
      },
    });
    const occurrences = upcomingOccurrences(c.slots, SCHEDULE_DAYS_AHEAD);
    await prisma.schedule.createMany({
      data: occurrences.map((start) => ({
        classId: created.id,
        trainerId: trainerIds.get(c.trainer)!,
        spaceId: spaceIds.get(c.accessObject)!,
        startTime: start,
        endTime: new Date(start.getTime() + c.durationMinutes * 60_000),
      })),
    });
    scheduleCount += occurrences.length;
  }

  for (const [index, plan] of membershipPlans.entries()) {
    await prisma.membershipPlan.create({
      data: {
        slug: plan.slug,
        name: plan.name,
        type: plan.type,
        accessObjectId: plan.accessObject ? objectIds.get(plan.accessObject)! : null,
        priceMonthly: plan.priceMonthly,
        priceAnnual: plan.priceAnnual,
        benefits: plan.benefits,
        sortOrder: index,
      },
    });
  }

  // The seeded member holds a single-object (Yoga) membership, so entitlement
  // enforcement is visible out of the box.
  const yogaPlan = await prisma.membershipPlan.findUniqueOrThrow({ where: { slug: "yoga-unlimited" } });
  await prisma.membership.create({
    data: {
      userId: member.id,
      planId: yogaPlan.id,
      status: "ACTIVE",
      billingInterval: "MONTHLY",
      currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000),
    },
  });

  await prisma.product.createMany({
    data: products.map((p) => ({ ...p, images: [] })),
  });

  console.log(
    `Seeded ${accessObjects.length} access objects, ${trainers.length} trainers, ${classes.length} classes ` +
      `(${scheduleCount} scheduled sessions), ${membershipPlans.length} plans, ${products.length} products.`,
  );
  console.log(`Accounts (password "${SEED_PASSWORD}"): ${admin.email}, ${trainerUser.email}, ${member.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
