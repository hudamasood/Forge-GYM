/**
 * In-memory repositories — used only by unit tests (spec B1/B6). They honor
 * the same contracts as the Prisma implementations, including the
 * (scheduleId, userId) uniqueness and serialized booking transactions.
 */
import { ConflictError, NotFoundError } from "@/server/domain/errors";
import {
  ENTITLED_MEMBERSHIP_STATUSES,
  type AccessObject,
  type AccessObjectWithSpace,
  type Booking,
  type BookingWithSchedule,
  type GymClass,
  type Membership,
  type MembershipPlan,
  type Order,
  type Page,
  type Product,
  type Schedule,
  type ScheduleDetail,
  type Space,
  type Trainer,
  type User,
  type UserWithPassword,
} from "@/server/domain/types";
import type {
  BookingTransactionScope,
  IAccessObjectRepository,
  IBookingRepository,
  IClassRepository,
  IMembershipPlanRepository,
  IMembershipRepository,
  IOrderRepository,
  IPasswordResetTokenRepository,
  IProductRepository,
  IScheduleRepository,
  ISpaceRepository,
  ITrainerRepository,
  IUserRepository,
  IWebhookEventRepository,
  PageRequest,
  TransactionRunner,
} from "@/server/repositories/interfaces";

let counter = 0;
export const newId = (prefix = "id") => `${prefix}_${(++counter).toString(36)}`;

export class MemoryStore {
  users: UserWithPassword[] = [];
  resetTokens: { userId: string; tokenHash: string; expiresAt: Date; usedAt: Date | null }[] = [];
  accessObjects: AccessObject[] = [];
  spaces: Space[] = [];
  classes: GymClass[] = [];
  trainers: Trainer[] = [];
  schedules: Schedule[] = [];
  bookings: Booking[] = [];
  plans: MembershipPlan[] = [];
  memberships: Membership[] = [];
  products: Product[] = [];
  orders: Order[] = [];
  webhookEvents = new Set<string>();
}

function paginate<T>(items: T[], request: PageRequest): Page<T> {
  const page = Math.max(1, request.page ?? 1);
  const pageSize = request.pageSize ?? 20;
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize };
}

function omitPassword(user: UserWithPassword): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = user;
  return rest;
}

export class MemoryUserRepository implements IUserRepository {
  constructor(private readonly db: MemoryStore) {}
  async findById(id: string) {
    const u = this.db.users.find((x) => x.id === id);
    return u ? omitPassword(u) : null;
  }
  async findByEmailWithPassword(email: string) {
    return this.db.users.find((x) => x.email === email) ?? null;
  }
  async create(input: Parameters<IUserRepository["create"]>[0]) {
    if (this.db.users.some((u) => u.email === input.email)) throw new ConflictError("Email taken");
    const user: UserWithPassword = {
      id: newId("usr"),
      email: input.email,
      name: input.name,
      role: input.role ?? "MEMBER",
      phone: input.phone ?? null,
      avatarUrl: null,
      emailVerifiedAt: null,
      stripeCustomerId: null,
      createdAt: new Date(),
      passwordHash: input.passwordHash,
    };
    this.db.users.push(user);
    return omitPassword(user);
  }
  async update(id: string, input: Parameters<IUserRepository["update"]>[1]) {
    const u = this.db.users.find((x) => x.id === id);
    if (!u) throw new NotFoundError("User not found");
    Object.assign(u, Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)));
    return omitPassword(u);
  }
  async updatePassword(id: string, passwordHash: string) {
    const u = this.db.users.find((x) => x.id === id);
    if (u) u.passwordHash = passwordHash;
  }
  async setStripeCustomerId(id: string, customerId: string) {
    const u = this.db.users.find((x) => x.id === id);
    if (u) u.stripeCustomerId = customerId;
  }
  async list(request: Parameters<IUserRepository["list"]>[0]) {
    return paginate(
      this.db.users.filter((u) => (!request.role || u.role === request.role) && (!request.search || u.email.includes(request.search))).map(omitPassword),
      request,
    );
  }
  async delete(id: string) {
    this.db.users = this.db.users.filter((u) => u.id !== id);
  }
}

export class MemoryPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(private readonly db: MemoryStore) {}
  async create(userId: string, tokenHash: string, expiresAt: Date) {
    this.db.resetTokens.push({ userId, tokenHash, expiresAt, usedAt: null });
  }
  async findValidUserId(tokenHash: string, now: Date) {
    const t = this.db.resetTokens.find((x) => x.tokenHash === tokenHash && !x.usedAt && x.expiresAt > now);
    return t?.userId ?? null;
  }
  async markUsed(tokenHash: string, now: Date) {
    const t = this.db.resetTokens.find((x) => x.tokenHash === tokenHash);
    if (t) t.usedAt = now;
  }
  async invalidateAllForUser(userId: string, now: Date) {
    for (const t of this.db.resetTokens) if (t.userId === userId && !t.usedAt) t.usedAt = now;
  }
}

export class MemoryAccessObjectRepository implements IAccessObjectRepository {
  constructor(private readonly db: MemoryStore) {}
  private withSpace(o: AccessObject): AccessObjectWithSpace {
    return { ...o, space: this.db.spaces.find((s) => s.accessObjectId === o.id) ?? null };
  }
  async list() {
    return [...this.db.accessObjects].sort((a, b) => a.sortOrder - b.sortOrder).map((o) => this.withSpace(o));
  }
  async findBySlug(slug: string) {
    const o = this.db.accessObjects.find((x) => x.slug === slug);
    return o ? this.withSpace(o) : null;
  }
  async findById(id: string) {
    return this.db.accessObjects.find((x) => x.id === id) ?? null;
  }
  async update(id: string, input: Partial<AccessObject>) {
    const o = this.db.accessObjects.find((x) => x.id === id);
    if (!o) throw new NotFoundError("Access object not found");
    return Object.assign(o, input);
  }
  async updateSpace(accessObjectId: string, input: Partial<Space>) {
    const s = this.db.spaces.find((x) => x.accessObjectId === accessObjectId);
    if (s) Object.assign(s, input);
  }
}

export class MemorySpaceRepository implements ISpaceRepository {
  constructor(private readonly db: MemoryStore) {}
  async findById(id: string) {
    return this.db.spaces.find((s) => s.id === id) ?? null;
  }
  async findByAccessObjectId(accessObjectId: string) {
    return this.db.spaces.find((s) => s.accessObjectId === accessObjectId) ?? null;
  }
}

export class MemoryClassRepository implements IClassRepository {
  constructor(private readonly db: MemoryStore) {}
  private withObject(c: GymClass) {
    return { ...c, accessObject: this.db.accessObjects.find((o) => o.id === c.accessObjectId)! };
  }
  async list(filter: Parameters<IClassRepository["list"]>[0] = {}) {
    return this.db.classes
      .map((c) => this.withObject(c))
      .filter((c) => (!filter.accessObjectSlug || c.accessObject.slug === filter.accessObjectSlug) && (!filter.difficulty || c.difficulty === filter.difficulty));
  }
  async findBySlug(slug: string) {
    const c = this.db.classes.find((x) => x.slug === slug);
    return c ? this.withObject(c) : null;
  }
  async findById(id: string) {
    return this.db.classes.find((x) => x.id === id) ?? null;
  }
  async listTaughtBy(trainerId: string) {
    const ids = new Set(this.db.schedules.filter((s) => s.trainerId === trainerId).map((s) => s.classId));
    return this.db.classes.filter((c) => ids.has(c.id)).map((c) => this.withObject(c));
  }
  async create(input: Parameters<IClassRepository["create"]>[0]) {
    const c: GymClass = { id: newId("cls"), ...input, imageUrl: input.imageUrl ?? null };
    this.db.classes.push(c);
    return c;
  }
  async update(id: string, input: Partial<GymClass>) {
    const c = this.db.classes.find((x) => x.id === id);
    if (!c) throw new NotFoundError("Class not found");
    return Object.assign(c, input);
  }
  async delete(id: string) {
    this.db.classes = this.db.classes.filter((c) => c.id !== id);
  }
}

export class MemoryTrainerRepository implements ITrainerRepository {
  constructor(private readonly db: MemoryStore) {}
  private withObject(t: Trainer) {
    return { ...t, primaryAccessObject: this.db.accessObjects.find((o) => o.id === t.primaryAccessObjectId)! };
  }
  async list(filter: Parameters<ITrainerRepository["list"]>[0] = {}) {
    return this.db.trainers.map((t) => this.withObject(t)).filter((t) => !filter.accessObjectSlug || t.primaryAccessObject.slug === filter.accessObjectSlug);
  }
  async findBySlug(slug: string) {
    const t = this.db.trainers.find((x) => x.slug === slug);
    return t ? this.withObject(t) : null;
  }
  async findById(id: string) {
    return this.db.trainers.find((x) => x.id === id) ?? null;
  }
  async findByUserId(userId: string) {
    return this.db.trainers.find((x) => x.userId === userId) ?? null;
  }
  async create(input: Parameters<ITrainerRepository["create"]>[0]) {
    const t: Trainer = { id: newId("trn"), ...input, photoUrl: input.photoUrl ?? null, userId: input.userId ?? null };
    this.db.trainers.push(t);
    return t;
  }
  async update(id: string, input: Partial<Trainer>) {
    const t = this.db.trainers.find((x) => x.id === id);
    if (!t) throw new NotFoundError("Trainer not found");
    return Object.assign(t, input);
  }
  async delete(id: string) {
    this.db.trainers = this.db.trainers.filter((t) => t.id !== id);
  }
}

export class MemoryScheduleRepository implements IScheduleRepository {
  constructor(private readonly db: MemoryStore) {}
  private capacityOf(s: Schedule) {
    const c = this.db.classes.find((x) => x.id === s.classId)!;
    return s.capacityOverride ?? c.defaultCapacity;
  }
  toDetail(s: Schedule): ScheduleDetail {
    const c = this.db.classes.find((x) => x.id === s.classId)!;
    const t = this.db.trainers.find((x) => x.id === s.trainerId)!;
    const o = this.db.accessObjects.find((x) => x.id === c.accessObjectId)!;
    return {
      ...s,
      capacity: this.capacityOf(s),
      bookedCount: this.db.bookings.filter((b) => b.scheduleId === s.id && b.status === "CONFIRMED").length,
      class: { id: c.id, name: c.name, slug: c.slug, difficulty: c.difficulty, durationMinutes: c.durationMinutes, accessObjectId: c.accessObjectId },
      trainer: { id: t.id, name: t.name, slug: t.slug },
      accessObject: { id: o.id, name: o.name, slug: o.slug },
    };
  }
  async findForBooking(scheduleId: string) {
    const s = this.db.schedules.find((x) => x.id === scheduleId);
    if (!s) return null;
    const c = this.db.classes.find((x) => x.id === s.classId)!;
    return { ...s, accessObjectId: c.accessObjectId, capacity: this.capacityOf(s) };
  }
  async findDetail(scheduleId: string) {
    const s = this.db.schedules.find((x) => x.id === scheduleId);
    return s ? this.toDetail(s) : null;
  }
  async listUpcoming(q: Parameters<IScheduleRepository["listUpcoming"]>[0]) {
    return this.db.schedules
      .filter(
        (s) =>
          s.startTime >= q.from &&
          (!q.to || s.startTime < q.to) &&
          (!q.classId || s.classId === q.classId) &&
          (!q.trainerId || s.trainerId === q.trainerId) &&
          (!q.accessObjectId || this.db.classes.find((c) => c.id === s.classId)?.accessObjectId === q.accessObjectId),
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, q.limit ?? Infinity)
      .map((s) => this.toDetail(s));
  }
  async findOverlapping(q: Parameters<IScheduleRepository["findOverlapping"]>[0]) {
    return this.db.schedules.filter(
      (s) => s.id !== q.excludeScheduleId && (s.trainerId === q.trainerId || s.spaceId === q.spaceId) && s.startTime < q.end && s.endTime > q.start,
    );
  }
  async create(input: Parameters<IScheduleRepository["create"]>[0]) {
    const s: Schedule = { id: newId("sch"), ...input, capacityOverride: input.capacityOverride ?? null };
    this.db.schedules.push(s);
    return s;
  }
  async update(id: string, input: Partial<Schedule>) {
    const s = this.db.schedules.find((x) => x.id === id);
    if (!s) throw new NotFoundError("Schedule not found");
    return Object.assign(s, input);
  }
  async delete(id: string) {
    this.db.schedules = this.db.schedules.filter((s) => s.id !== id);
  }
}

export class MemoryBookingRepository implements IBookingRepository {
  constructor(private readonly db: MemoryStore) {}
  private withSchedule(b: Booking): BookingWithSchedule {
    return { ...b, schedule: new MemoryScheduleRepository(this.db).toDetail(this.db.schedules.find((s) => s.id === b.scheduleId)!) };
  }
  private userOf(b: Booking) {
    const u = this.db.users.find((x) => x.id === b.userId)!;
    return { id: u.id, name: u.name, email: u.email };
  }
  async findById(id: string) {
    return this.db.bookings.find((b) => b.id === id) ?? null;
  }
  async findByUserAndSchedule(userId: string, scheduleId: string) {
    return this.db.bookings.find((b) => b.userId === userId && b.scheduleId === scheduleId) ?? null;
  }
  async countConfirmedForSchedule(scheduleId: string) {
    return this.db.bookings.filter((b) => b.scheduleId === scheduleId && b.status === "CONFIRMED").length;
  }
  async create(userId: string, scheduleId: string) {
    if (this.db.bookings.some((b) => b.userId === userId && b.scheduleId === scheduleId)) {
      throw new ConflictError("Unique constraint failed on (scheduleId, userId)");
    }
    const b: Booking = { id: newId("bkg"), userId, scheduleId, status: "CONFIRMED", bookedAt: new Date(), cancelledAt: null };
    this.db.bookings.push(b);
    return b;
  }
  async reactivate(bookingId: string, at: Date) {
    const b = this.db.bookings.find((x) => x.id === bookingId)!;
    return Object.assign(b, { status: "CONFIRMED", cancelledAt: null, bookedAt: at });
  }
  async cancel(bookingId: string, at: Date) {
    const b = this.db.bookings.find((x) => x.id === bookingId)!;
    return Object.assign(b, { status: "CANCELLED", cancelledAt: at });
  }
  async setStatus(bookingId: string, status: Booking["status"]) {
    const b = this.db.bookings.find((x) => x.id === bookingId)!;
    return Object.assign(b, { status });
  }
  async listForUser(userId: string, options: { from?: Date; includeCancelled?: boolean }) {
    return this.db.bookings
      .filter((b) => b.userId === userId && (options.includeCancelled || b.status !== "CANCELLED"))
      .map((b) => this.withSchedule(b))
      .filter((b) => !options.from || b.schedule.startTime >= options.from)
      .sort((a, b) => a.schedule.startTime.getTime() - b.schedule.startTime.getTime());
  }
  async listForSchedule(scheduleId: string) {
    return this.db.bookings.filter((b) => b.scheduleId === scheduleId).map((b) => ({ ...b, user: this.userOf(b) }));
  }
  async listAll(request: Parameters<IBookingRepository["listAll"]>[0]) {
    return paginate(
      this.db.bookings.filter((b) => !request.status || b.status === request.status).map((b) => ({ ...this.withSchedule(b), user: this.userOf(b) })),
      request,
    );
  }
}

/** Serializes booking transactions, mimicking the row lock taken in Postgres. */
export function memoryBookingTransaction(db: MemoryStore): TransactionRunner<BookingTransactionScope> {
  let queue: Promise<unknown> = Promise.resolve();
  const scope: BookingTransactionScope = {
    bookings: new MemoryBookingRepository(db),
    schedules: { lockForBooking: async () => undefined },
  };
  return <T>(work: (s: BookingTransactionScope) => Promise<T>) => {
    const run = queue.then(() => work(scope));
    queue = run.catch(() => undefined);
    return run;
  };
}

export class MemoryMembershipPlanRepository implements IMembershipPlanRepository {
  constructor(private readonly db: MemoryStore) {}
  private withObject(p: MembershipPlan) {
    return { ...p, accessObject: this.db.accessObjects.find((o) => o.id === p.accessObjectId) ?? null };
  }
  async list() {
    return [...this.db.plans].sort((a, b) => a.sortOrder - b.sortOrder).map((p) => this.withObject(p));
  }
  async findBySlug(slug: string) {
    const p = this.db.plans.find((x) => x.slug === slug);
    return p ? this.withObject(p) : null;
  }
  async findById(id: string) {
    return this.db.plans.find((x) => x.id === id) ?? null;
  }
  async update(id: string, input: Partial<MembershipPlan>) {
    const p = this.db.plans.find((x) => x.id === id);
    if (!p) throw new NotFoundError("Plan not found");
    return Object.assign(p, input);
  }
}

export class MemoryMembershipRepository implements IMembershipRepository {
  constructor(private readonly db: MemoryStore) {}
  private withPlan(m: Membership) {
    const plan = this.db.plans.find((p) => p.id === m.planId)!;
    return { ...m, plan: { ...plan, accessObject: this.db.accessObjects.find((o) => o.id === plan.accessObjectId) ?? null } };
  }
  async userCanAccessObject(userId: string, accessObjectId: string, at: Date) {
    return this.db.memberships.some((m) => {
      if (m.userId !== userId || !ENTITLED_MEMBERSHIP_STATUSES.includes(m.status)) return false;
      if (m.currentPeriodEnd && m.currentPeriodEnd <= at) return false;
      const plan = this.db.plans.find((p) => p.id === m.planId)!;
      return plan.type === "ALL_ACCESS" || plan.accessObjectId === accessObjectId;
    });
  }
  async listForUser(userId: string) {
    return this.db.memberships.filter((m) => m.userId === userId).map((m) => this.withPlan(m));
  }
  async findBySubscriptionId(subscriptionId: string) {
    return this.db.memberships.find((m) => m.stripeSubscriptionId === subscriptionId) ?? null;
  }
  async findById(id: string) {
    const m = this.db.memberships.find((x) => x.id === id);
    return m ? this.withPlan(m) : null;
  }
  async create(input: Parameters<IMembershipRepository["create"]>[0]) {
    const m: Membership = { id: newId("mem"), createdAt: new Date(), ...input };
    this.db.memberships.push(m);
    return m;
  }
  async updateBySubscriptionId(subscriptionId: string, input: Partial<Membership>) {
    const m = this.db.memberships.find((x) => x.stripeSubscriptionId === subscriptionId);
    return m ? Object.assign(m, Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined))) : null;
  }
  async update(id: string, input: Partial<Membership>) {
    const m = this.db.memberships.find((x) => x.id === id)!;
    return Object.assign(m, Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)));
  }
  async listAll(request: Parameters<IMembershipRepository["listAll"]>[0]) {
    return paginate(
      this.db.memberships
        .filter((m) => !request.status || m.status === request.status)
        .map((m) => {
          const u = this.db.users.find((x) => x.id === m.userId)!;
          return { ...this.withPlan(m), user: { id: u.id, name: u.name, email: u.email } };
        }),
      request,
    );
  }
}

export class MemoryProductRepository implements IProductRepository {
  constructor(private readonly db: MemoryStore) {}
  async list(filter: Parameters<IProductRepository["list"]>[0] = {}) {
    return this.db.products.filter((p) => (!filter.category || p.category === filter.category) && (!filter.search || p.name.toLowerCase().includes(filter.search.toLowerCase())));
  }
  async findBySlug(slug: string) {
    return this.db.products.find((p) => p.slug === slug) ?? null;
  }
  async findManyByIds(ids: string[]) {
    return this.db.products.filter((p) => ids.includes(p.id));
  }
  async create(input: Parameters<IProductRepository["create"]>[0]) {
    const p: Product = { id: newId("prd"), updatedAt: new Date(), ...input };
    this.db.products.push(p);
    return p;
  }
  async update(id: string, input: Partial<Product>) {
    const p = this.db.products.find((x) => x.id === id);
    if (!p) throw new NotFoundError("Product not found");
    return Object.assign(p, input);
  }
  async delete(id: string) {
    this.db.products = this.db.products.filter((p) => p.id !== id);
  }
}

export class MemoryOrderRepository implements IOrderRepository {
  constructor(private readonly db: MemoryStore) {}
  async create(input: Parameters<IOrderRepository["create"]>[0]) {
    const id = newId("ord");
    const order: Order = {
      id,
      userId: input.userId,
      status: "PENDING",
      total: input.total,
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      shippingAddress: null,
      createdAt: new Date(),
      items: input.items.map((i) => ({ id: newId("itm"), orderId: id, ...i })),
    };
    this.db.orders.push(order);
    return order;
  }
  async findById(id: string) {
    return this.db.orders.find((o) => o.id === id) ?? null;
  }
  async attachCheckoutSession(orderId: string, sessionId: string) {
    const o = this.db.orders.find((x) => x.id === orderId);
    if (o) o.stripeCheckoutSessionId = sessionId;
  }
  async markPaid(orderId: string, paymentIntentId: string | null, shippingAddress: Record<string, string> | null = null) {
    const o = this.db.orders.find((x) => x.id === orderId);
    if (!o || o.status !== "PENDING") return false;
    o.status = "PAID";
    o.stripePaymentIntentId = paymentIntentId;
    o.shippingAddress = shippingAddress;
    for (const item of o.items) {
      const p = this.db.products.find((x) => x.id === item.productId);
      if (p) p.stock -= item.quantity;
    }
    return true;
  }
  async setStatus(orderId: string, status: Order["status"]) {
    const o = this.db.orders.find((x) => x.id === orderId)!;
    o.status = status;
    return o;
  }
  async listForUser(userId: string) {
    return this.db.orders.filter((o) => o.userId === userId);
  }
  async listAll(request: Parameters<IOrderRepository["listAll"]>[0]) {
    return paginate(
      this.db.orders
        .filter((o) => !request.status || o.status === request.status)
        .map((o) => {
          const u = this.db.users.find((x) => x.id === o.userId)!;
          return { ...o, user: { id: u.id, name: u.name, email: u.email } };
        }),
      request,
    );
  }
}

export class MemoryWebhookEventRepository implements IWebhookEventRepository {
  constructor(private readonly db: MemoryStore) {}
  async markProcessed(eventId: string) {
    if (this.db.webhookEvents.has(eventId)) return false;
    this.db.webhookEvents.add(eventId);
    return true;
  }
  async unmark(eventId: string) {
    this.db.webhookEvents.delete(eventId);
  }
}
