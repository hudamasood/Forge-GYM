/** Test doubles and a small fixture world for service unit tests. */
import type { CheckoutSession, IPaymentProvider, PaymentCheckoutInput, PaymentEvent, SubscriptionCheckoutInput } from "@/server/ports/payment";
import type { INotificationChannel, OutgoingMessage } from "@/server/ports/notification";
import type { IPasswordHasher } from "@/server/ports/security";
import type { Difficulty, MembershipStatus } from "@/server/domain/types";
import { MemoryStore, newId } from "@/server/repositories/memory";

export class FakePaymentProvider implements IPaymentProvider {
  readonly isConfigured = true;
  subscriptionCheckouts: SubscriptionCheckoutInput[] = [];
  paymentCheckouts: PaymentCheckoutInput[] = [];
  cancelled: string[] = [];
  nextEvent: PaymentEvent | null = null;

  async createSubscriptionCheckout(input: SubscriptionCheckoutInput): Promise<CheckoutSession> {
    this.subscriptionCheckouts.push(input);
    return { id: newId("cs_sub"), url: "https://checkout.test/sub" };
  }
  async createPaymentCheckout(input: PaymentCheckoutInput): Promise<CheckoutSession> {
    this.paymentCheckouts.push(input);
    return { id: newId("cs_pay"), url: "https://checkout.test/pay" };
  }
  async cancelSubscriptionAtPeriodEnd(subscriptionId: string) {
    this.cancelled.push(subscriptionId);
  }
  async parseWebhookEvent(_raw: string, signature: string): Promise<PaymentEvent> {
    if (signature !== "valid") throw new Error("Invalid signature");
    if (!this.nextEvent) throw new Error("No event queued");
    return this.nextEvent;
  }
}

export class RecordingNotificationChannel implements INotificationChannel {
  sent: OutgoingMessage[] = [];
  async send(message: OutgoingMessage) {
    this.sent.push(message);
  }
}

/** Reversible "hash" — fast and deterministic for unit tests only. */
export class PlainHasher implements IPasswordHasher {
  async hash(plain: string) {
    return `hashed:${plain}`;
  }
  async verify(plain: string, hash: string) {
    return hash === `hashed:${plain}`;
  }
}

export const NOW = new Date("2026-03-02T09:00:00.000Z");
export const clock = () => NOW;
export const hoursFromNow = (h: number) => new Date(NOW.getTime() + h * 3_600_000);

/** Builds a small world: two access objects, trainers, a class each, plans and users. */
export function buildWorld() {
  const db = new MemoryStore();

  const yoga = { id: "ao_yoga", name: "Yoga Studio", slug: "yoga-studio", tagline: "", description: "", heroImageUrl: null, sortOrder: 0 };
  const boxing = { id: "ao_box", name: "Boxing / Combat Zone", slug: "boxing-zone", tagline: "", description: "", heroImageUrl: null, sortOrder: 1 };
  db.accessObjects.push(yoga, boxing);
  db.spaces.push(
    { id: "sp_yoga", accessObjectId: yoga.id, equipmentList: [], operatingHours: {}, galleryImages: [] },
    { id: "sp_box", accessObjectId: boxing.id, equipmentList: [], operatingHours: {}, galleryImages: [] },
  );

  const trainer = (id: string, name: string, objectId: string, userId: string | null = null) => ({
    id,
    userId,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    bio: "",
    specialty: "",
    certifications: [],
    yearsExperience: 5,
    primaryAccessObjectId: objectId,
    photoUrl: null,
  });
  db.trainers.push(trainer("tr_elena", "Elena Cruz", yoga.id, "usr_trainer"), trainer("tr_andre", "Andre Okafor", boxing.id));

  const gymClass = (id: string, name: string, objectId: string, capacity: number, difficulty: Difficulty = "ALL_LEVELS") => ({
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    accessObjectId: objectId,
    description: "",
    benefits: [],
    difficulty,
    durationMinutes: 60,
    estCalories: 300,
    defaultCapacity: capacity,
    imageUrl: null,
  });
  db.classes.push(gymClass("cl_vinyasa", "Vinyasa Flow", yoga.id, 2), gymClass("cl_boxing", "Boxing Fundamentals", boxing.id, 10, "BEGINNER"));

  db.schedules.push(
    { id: "sch_yoga", classId: "cl_vinyasa", trainerId: "tr_elena", spaceId: "sp_yoga", startTime: hoursFromNow(24), endTime: hoursFromNow(25), capacityOverride: null },
    { id: "sch_box", classId: "cl_boxing", trainerId: "tr_andre", spaceId: "sp_box", startTime: hoursFromNow(48), endTime: hoursFromNow(49), capacityOverride: null },
    { id: "sch_past", classId: "cl_vinyasa", trainerId: "tr_elena", spaceId: "sp_yoga", startTime: hoursFromNow(-2), endTime: hoursFromNow(-1), capacityOverride: null },
  );

  const plan = (id: string, slug: string, type: "SINGLE_OBJECT" | "ALL_ACCESS", objectId: string | null, monthly: number) => ({
    id,
    name: slug,
    slug,
    type,
    accessObjectId: objectId,
    priceMonthly: monthly,
    priceAnnual: monthly * 10,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual: null,
    benefits: [],
    sortOrder: 0,
  });
  db.plans.push(plan("pl_yoga", "yoga-unlimited", "SINGLE_OBJECT", yoga.id, 3900), plan("pl_all", "premium-all-access", "ALL_ACCESS", null, 9900));

  const user = (id: string, email: string, role: "MEMBER" | "TRAINER" | "ADMIN" = "MEMBER") => ({
    id,
    email,
    name: email.split("@")[0],
    role,
    phone: null,
    avatarUrl: null,
    emailVerifiedAt: null,
    stripeCustomerId: null,
    createdAt: NOW,
    passwordHash: "hashed:Password1",
  });
  db.users.push(
    user("usr_yoga", "yogi@test.dev"),
    user("usr_all", "all@test.dev"),
    user("usr_none", "none@test.dev"),
    user("usr_other", "other@test.dev"),
    user("usr_trainer", "elena@test.dev", "TRAINER"),
    user("usr_admin", "admin@test.dev", "ADMIN"),
  );

  const membership = (userId: string, planId: string, status: MembershipStatus = "ACTIVE", currentPeriodEnd: Date | null = hoursFromNow(24 * 30)) => ({
    id: newId("mem"),
    userId,
    planId,
    stripeSubscriptionId: `sub_${userId}`,
    status,
    billingInterval: "MONTHLY" as const,
    currentPeriodEnd,
    createdAt: NOW,
  });
  db.memberships.push(membership("usr_yoga", "pl_yoga"), membership("usr_all", "pl_all"), membership("usr_other", "pl_yoga"));

  db.products.push(
    { id: "prd_whey", name: "Whey Protein Isolate", slug: "whey", category: "SUPPLEMENTS", price: 5499, stock: 5, description: "", images: [], updatedAt: NOW },
    { id: "prd_pdf", name: "Strength Program", slug: "program", category: "DIGITAL", price: 2900, stock: 9999, description: "", images: [], updatedAt: NOW },
  );

  return { db, membership };
}
