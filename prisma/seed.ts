/**
 * Loads the placeholder seed content (spec A8) from prisma/seed-data.ts.
 *
 * Safe and repeatable: records are matched by slug (users by email) and only
 * created when missing — existing rows are never updated or deleted, so
 * re-running it cannot overwrite edits made in the admin portal. Upcoming
 * class sessions are topped up for the next SCHEDULE_DAYS_AHEAD days without
 * duplicates or trainer/space clashes.
 *
 *   npm run db:seed                  local/CI: catalog + demo accounts
 *   npm run db:seed:production       production: catalog only (reads .env.production.local)
 *   npm run db:seed -- --reset       local only: delete every row first
 *
 * Flags: --production, --with-demo-accounts, --no-demo-accounts, --reset, --dry-run
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { accessObjects, classes, membershipPlans, products, trainers } from "./seed-data";
import { assertSafeTarget, describeTarget, parseSeedArgs } from "./seed-target";

const DEMO_PASSWORD = "Forge123!";
const SCHEDULE_DAYS_AHEAD = 21;

const options = parseSeedArgs(process.argv.slice(2));
const target = describeTarget(process.env.DATABASE_URL);
assertSafeTarget(target, options);

const prisma = new PrismaClient();
const tally = new Map<string, { created: number; existing: number }>();

function count(entity: string, created: boolean) {
  const row = tally.get(entity) ?? { created: 0, existing: 0 };
  row[created ? "created" : "existing"] += 1;
  tally.set(entity, row);
}

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

async function seedAccessObjects() {
  for (const [index, obj] of accessObjects.entries()) {
    const existing = await prisma.accessObject.findUnique({ where: { slug: obj.slug }, include: { space: true } });
    const spaceData = {
      equipmentList: [...obj.equipment],
      operatingHours: { weekdays: "05:00–23:00", weekends: "07:00–21:00" },
      galleryImages: [],
    };
    if (!existing) {
      await prisma.accessObject.create({
        data: { slug: obj.slug, name: obj.name, tagline: obj.tagline, description: obj.description, sortOrder: index, space: { create: spaceData } },
      });
      count("access objects", true);
      count("spaces", true);
      continue;
    }
    count("access objects", false);
    if (existing.space) {
      count("spaces", false);
    } else {
      await prisma.space.create({ data: { accessObjectId: existing.id, ...spaceData } });
      count("spaces", true);
    }
  }
}

async function seedTrainers() {
  for (const t of trainers) {
    const existing = await prisma.trainer.findUnique({ where: { slug: t.slug }, select: { id: true } });
    if (existing) {
      count("trainers", false);
      continue;
    }
    const object = await prisma.accessObject.findUniqueOrThrow({ where: { slug: t.accessObject }, select: { id: true } });
    await prisma.trainer.create({
      data: {
        slug: t.slug,
        name: t.name,
        bio: t.bio,
        specialty: t.specialty,
        certifications: [...t.certifications],
        yearsExperience: t.yearsExperience,
        primaryAccessObjectId: object.id,
      },
    });
    count("trainers", true);
  }
}

async function seedClassesAndSchedule() {
  for (const c of classes) {
    const object = await prisma.accessObject.findUniqueOrThrow({ where: { slug: c.accessObject }, include: { space: true } });
    let gymClass = await prisma.class.findUnique({ where: { slug: c.slug }, select: { id: true, durationMinutes: true } });
    if (gymClass) {
      count("classes", false);
    } else {
      gymClass = await prisma.class.create({
        data: {
          slug: c.slug,
          name: c.name,
          accessObjectId: object.id,
          description: c.description,
          benefits: c.benefits,
          difficulty: c.difficulty,
          durationMinutes: c.durationMinutes,
          estCalories: c.estCalories,
          defaultCapacity: c.defaultCapacity,
        },
        select: { id: true, durationMinutes: true },
      });
      count("classes", true);
    }

    const trainer = await prisma.trainer.findUnique({ where: { slug: c.trainer }, select: { id: true } });
    if (!trainer || !object.space) continue;

    for (const start of upcomingOccurrences(c.slots, SCHEDULE_DAYS_AHEAD)) {
      const end = new Date(start.getTime() + gymClass.durationMinutes * 60_000);
      // Skip if this session exists, or if the trainer or space is already busy then.
      const clash = await prisma.schedule.findFirst({
        where: {
          OR: [{ classId: gymClass.id, startTime: start }, { OR: [{ trainerId: trainer.id }, { spaceId: object.space.id }], startTime: { lt: end }, endTime: { gt: start } }],
        },
        select: { id: true },
      });
      if (clash) {
        count("scheduled sessions", false);
        continue;
      }
      await prisma.schedule.create({ data: { classId: gymClass.id, trainerId: trainer.id, spaceId: object.space.id, startTime: start, endTime: end } });
      count("scheduled sessions", true);
    }
  }
}

async function seedPlans() {
  for (const [index, plan] of membershipPlans.entries()) {
    const existing = await prisma.membershipPlan.findUnique({ where: { slug: plan.slug }, select: { id: true } });
    if (existing) {
      count("membership plans", false);
      continue;
    }
    const object = plan.accessObject ? await prisma.accessObject.findUniqueOrThrow({ where: { slug: plan.accessObject }, select: { id: true } }) : null;
    await prisma.membershipPlan.create({
      data: {
        slug: plan.slug,
        name: plan.name,
        type: plan.type,
        accessObjectId: object?.id ?? null,
        priceMonthly: plan.priceMonthly,
        priceAnnual: plan.priceAnnual,
        benefits: plan.benefits,
        sortOrder: index,
      },
    });
    count("membership plans", true);
  }
}

async function seedProducts() {
  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug }, select: { id: true } });
    if (existing) {
      count("products", false);
      continue;
    }
    // images stays empty: the storefront uses the bundled photo for each slug (src/lib/imagery.ts).
    await prisma.product.create({ data: { ...p, images: [] } });
    count("products", true);
  }
}

async function seedDemoAccounts() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const accounts = [
    { email: "admin@forge.example", name: "Avery Admin", role: "ADMIN" as const },
    { email: "trainer@forge.example", name: "Elena Cruz", role: "TRAINER" as const },
    { email: "member@forge.example", name: "Morgan Member", role: "MEMBER" as const },
  ];
  const ids = new Map<string, string>();
  for (const account of accounts) {
    const existing = await prisma.user.findUnique({ where: { email: account.email }, select: { id: true } });
    if (existing) {
      ids.set(account.email, existing.id);
      count("demo accounts", false);
      continue;
    }
    const created = await prisma.user.create({ data: { ...account, passwordHash, emailVerifiedAt: new Date() }, select: { id: true } });
    ids.set(account.email, created.id);
    count("demo accounts", true);
  }

  // Link the trainer login to Elena's profile if nobody else holds it.
  await prisma.trainer.updateMany({ where: { slug: "elena-cruz", userId: null }, data: { userId: ids.get("trainer@forge.example")! } });

  // The demo member holds a single-object (Yoga) membership so entitlement enforcement is visible.
  const memberId = ids.get("member@forge.example")!;
  if ((await prisma.membership.count({ where: { userId: memberId } })) === 0) {
    const yogaPlan = await prisma.membershipPlan.findUniqueOrThrow({ where: { slug: "yoga-unlimited" }, select: { id: true } });
    await prisma.membership.create({
      data: { userId: memberId, planId: yogaPlan.id, status: "ACTIVE", billingInterval: "MONTHLY", currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000) },
    });
    count("demo memberships", true);
  } else {
    count("demo memberships", false);
  }
}

async function printCounts(label: string) {
  const [objects, spaces, trainerCount, classCount, sessions, plans, productCount, users] = await Promise.all([
    prisma.accessObject.count(),
    prisma.space.count(),
    prisma.trainer.count(),
    prisma.class.count(),
    prisma.schedule.count({ where: { startTime: { gte: new Date() } } }),
    prisma.membershipPlan.count(),
    prisma.product.count(),
    prisma.user.count(),
  ]);
  console.log(
    `${label}: ${objects} access objects, ${spaces} spaces, ${trainerCount} trainers, ${classCount} classes, ` +
      `${sessions} upcoming sessions, ${plans} plans, ${productCount} products, ${users} users`,
  );
}

async function main() {
  console.log(`Seeding ${target.isLocal ? "LOCAL" : "REMOTE"} database ${target.host}/${target.database}${options.dryRun ? " (dry run)" : ""}`);
  await printCounts("Before");
  if (options.dryRun) return;

  if (options.reset) {
    console.log("--reset: deleting every row");
    await reset();
  }

  await seedAccessObjects();
  await seedTrainers();
  await seedClassesAndSchedule();
  await seedPlans();
  await seedProducts();
  if (options.demoAccounts) await seedDemoAccounts();

  for (const [entity, { created, existing }] of tally) console.log(`  ${entity}: ${created} created, ${existing} already present`);
  await printCounts("After");
  if (options.demoAccounts) console.log(`Demo accounts (password "${DEMO_PASSWORD}"): admin@forge.example, trainer@forge.example, member@forge.example`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
