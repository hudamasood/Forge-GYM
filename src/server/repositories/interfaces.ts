/**
 * Repository contracts (spec B1). Each interface exposes only what its
 * consuming services need (Interface Segregation). Every interface has one
 * Prisma-backed implementation and one in-memory implementation for tests
 * (Liskov Substitution).
 */
import type {
  AccessObject,
  AccessObjectWithSpace,
  BillingInterval,
  Booking,
  BookingStatus,
  BookingWithSchedule,
  Difficulty,
  GymClass,
  GymClassWithObject,
  Membership,
  MembershipPlan,
  MembershipPlanWithObject,
  MembershipStatus,
  MembershipWithPlan,
  Order,
  OrderStatus,
  Page,
  PlanType,
  Product,
  ProductCategory,
  Role,
  Schedule,
  ScheduleDetail,
  ScheduleForBooking,
  Space,
  Trainer,
  TrainerWithObject,
  User,
  UserWithPassword,
} from "@/server/domain/types";

export interface PageRequest {
  page?: number;
  pageSize?: number;
  search?: string;
}

/** Runs `work` inside one database transaction, handing it transaction-scoped repositories. */
export type TransactionRunner<Scope> = <T>(work: (scope: Scope) => Promise<T>) => Promise<T>;

// ---------------------------------------------------------------- Users

export interface CreateUserInput {
  email: string;
  name: string;
  passwordHash: string | null;
  role?: Role;
  phone?: string | null;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string | null;
  role?: Role;
  avatarUrl?: string | null;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmailWithPassword(email: string): Promise<UserWithPassword | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, input: UpdateUserInput): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  setStripeCustomerId(id: string, customerId: string): Promise<void>;
  list(request: PageRequest & { role?: Role }): Promise<Page<User>>;
  delete(id: string): Promise<void>;
}

export interface IPasswordResetTokenRepository {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  /** Returns the userId for an unused, unexpired token. */
  findValidUserId(tokenHash: string, now: Date): Promise<string | null>;
  markUsed(tokenHash: string, now: Date): Promise<void>;
  invalidateAllForUser(userId: string, now: Date): Promise<void>;
}

// ---------------------------------------------------------------- Catalog

export interface AccessObjectInput {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  heroImageUrl?: string | null;
  sortOrder?: number;
}

export interface IAccessObjectRepository {
  list(): Promise<AccessObjectWithSpace[]>;
  findBySlug(slug: string): Promise<AccessObjectWithSpace | null>;
  findById(id: string): Promise<AccessObject | null>;
  update(id: string, input: Partial<AccessObjectInput>): Promise<AccessObject>;
  updateSpace(accessObjectId: string, input: Partial<Pick<Space, "equipmentList" | "operatingHours" | "galleryImages">>): Promise<void>;
}

export interface ISpaceRepository {
  findById(id: string): Promise<Space | null>;
  findByAccessObjectId(accessObjectId: string): Promise<Space | null>;
}

export interface ClassFilter {
  accessObjectSlug?: string;
  difficulty?: Difficulty;
}

export interface ClassInput {
  name: string;
  slug: string;
  accessObjectId: string;
  description: string;
  benefits: string[];
  difficulty: Difficulty;
  durationMinutes: number;
  estCalories: number;
  defaultCapacity: number;
  imageUrl?: string | null;
}

export interface IClassRepository {
  list(filter?: ClassFilter): Promise<GymClassWithObject[]>;
  findBySlug(slug: string): Promise<GymClassWithObject | null>;
  findById(id: string): Promise<GymClass | null>;
  listTaughtBy(trainerId: string): Promise<GymClassWithObject[]>;
  create(input: ClassInput): Promise<GymClass>;
  update(id: string, input: Partial<ClassInput>): Promise<GymClass>;
  delete(id: string): Promise<void>;
}

export interface TrainerFilter {
  accessObjectSlug?: string;
}

export interface TrainerInput {
  name: string;
  slug: string;
  bio: string;
  specialty: string;
  certifications: string[];
  yearsExperience: number;
  primaryAccessObjectId: string;
  photoUrl?: string | null;
  userId?: string | null;
}

export interface ITrainerRepository {
  list(filter?: TrainerFilter): Promise<TrainerWithObject[]>;
  findBySlug(slug: string): Promise<TrainerWithObject | null>;
  findById(id: string): Promise<Trainer | null>;
  findByUserId(userId: string): Promise<Trainer | null>;
  create(input: TrainerInput): Promise<Trainer>;
  update(id: string, input: Partial<TrainerInput>): Promise<Trainer>;
  delete(id: string): Promise<void>;
}

// ---------------------------------------------------------------- Scheduling

export interface ScheduleQuery {
  from: Date;
  to?: Date;
  classId?: string;
  trainerId?: string;
  accessObjectId?: string;
  limit?: number;
}

export interface ScheduleInput {
  classId: string;
  trainerId: string;
  spaceId: string;
  startTime: Date;
  endTime: Date;
  capacityOverride?: number | null;
}

export interface OverlapQuery {
  start: Date;
  end: Date;
  trainerId: string;
  spaceId: string;
  excludeScheduleId?: string;
}

export interface IScheduleRepository {
  findForBooking(scheduleId: string): Promise<ScheduleForBooking | null>;
  findDetail(scheduleId: string): Promise<ScheduleDetail | null>;
  listUpcoming(query: ScheduleQuery): Promise<ScheduleDetail[]>;
  findOverlapping(query: OverlapQuery): Promise<Schedule[]>;
  create(input: ScheduleInput): Promise<Schedule>;
  update(id: string, input: Partial<ScheduleInput>): Promise<Schedule>;
  delete(id: string): Promise<void>;
}

/** Transaction-scoped schedule access used by the booking capacity check. */
export interface IScheduleLockRepository {
  /** Takes a row lock on the schedule (SELECT ... FOR UPDATE) for the rest of the transaction. */
  lockForBooking(scheduleId: string): Promise<void>;
}

export interface IBookingRepository {
  findById(id: string): Promise<Booking | null>;
  findByUserAndSchedule(userId: string, scheduleId: string): Promise<Booking | null>;
  countConfirmedForSchedule(scheduleId: string): Promise<number>;
  create(userId: string, scheduleId: string): Promise<Booking>;
  /** Re-confirms a previously cancelled booking row (the unique index keeps one row per user+schedule). */
  reactivate(bookingId: string, at: Date): Promise<Booking>;
  cancel(bookingId: string, at: Date): Promise<Booking>;
  setStatus(bookingId: string, status: BookingStatus): Promise<Booking>;
  listForUser(userId: string, options: { from?: Date; includeCancelled?: boolean }): Promise<BookingWithSchedule[]>;
  listForSchedule(scheduleId: string): Promise<(Booking & { user: Pick<User, "id" | "name" | "email"> })[]>;
  listAll(request: PageRequest & { status?: BookingStatus }): Promise<Page<BookingWithSchedule & { user: Pick<User, "id" | "name" | "email"> }>>;
}

export interface BookingTransactionScope {
  bookings: IBookingRepository;
  schedules: IScheduleLockRepository;
}

// ---------------------------------------------------------------- Memberships

export interface PlanInput {
  name: string;
  slug: string;
  type: PlanType;
  accessObjectId: string | null;
  priceMonthly: number;
  priceAnnual: number;
  benefits: string[];
  stripePriceIdMonthly?: string | null;
  stripePriceIdAnnual?: string | null;
  sortOrder?: number;
}

export interface IMembershipPlanRepository {
  list(): Promise<MembershipPlanWithObject[]>;
  findBySlug(slug: string): Promise<MembershipPlanWithObject | null>;
  findById(id: string): Promise<MembershipPlan | null>;
  update(id: string, input: Partial<PlanInput>): Promise<MembershipPlan>;
}

export interface CreateMembershipInput {
  userId: string;
  planId: string;
  status: MembershipStatus;
  billingInterval: BillingInterval;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
}

export interface IMembershipRepository {
  userCanAccessObject(userId: string, accessObjectId: string, at: Date): Promise<boolean>;
  listForUser(userId: string): Promise<MembershipWithPlan[]>;
  findBySubscriptionId(subscriptionId: string): Promise<Membership | null>;
  findById(id: string): Promise<MembershipWithPlan | null>;
  create(input: CreateMembershipInput): Promise<Membership>;
  updateBySubscriptionId(subscriptionId: string, input: { status?: MembershipStatus; currentPeriodEnd?: Date | null }): Promise<Membership | null>;
  update(id: string, input: { status?: MembershipStatus; currentPeriodEnd?: Date | null }): Promise<Membership>;
  listAll(request: PageRequest & { status?: MembershipStatus }): Promise<Page<MembershipWithPlan & { user: Pick<User, "id" | "name" | "email"> }>>;
}

// ---------------------------------------------------------------- Store

export interface ProductFilter {
  category?: ProductCategory;
  search?: string;
}

export interface ProductInput {
  name: string;
  slug: string;
  category: ProductCategory;
  price: number;
  stock: number;
  description: string;
  images: string[];
}

export interface IProductRepository {
  list(filter?: ProductFilter): Promise<Product[]>;
  findBySlug(slug: string): Promise<Product | null>;
  findManyByIds(ids: string[]): Promise<Product[]>;
  create(input: ProductInput): Promise<Product>;
  update(id: string, input: Partial<ProductInput>): Promise<Product>;
  delete(id: string): Promise<void>;
}

export interface CreateOrderInput {
  userId: string;
  total: number;
  items: { productId: string; quantity: number; unitPriceAtPurchase: number }[];
}

export interface IOrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  attachCheckoutSession(orderId: string, sessionId: string): Promise<void>;
  /**
   * Atomically moves a PENDING order to PAID and decrements stock for each
   * item. Returns false when the order was not PENDING (already processed).
   */
  markPaid(orderId: string, paymentIntentId: string | null): Promise<boolean>;
  setStatus(orderId: string, status: OrderStatus): Promise<Order>;
  listForUser(userId: string): Promise<Order[]>;
  listAll(request: PageRequest & { status?: OrderStatus }): Promise<Page<Order & { user: Pick<User, "id" | "name" | "email"> }>>;
}

// ---------------------------------------------------------------- Infrastructure records

export interface IWebhookEventRepository {
  /** Records the event id; returns false if it was already recorded (duplicate delivery). */
  markProcessed(eventId: string, type: string): Promise<boolean>;
  /** Removes the record so a failed event can be retried by the provider. */
  unmark(eventId: string): Promise<void>;
}

export interface AuditEntry {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface IAuditLogRepository {
  record(entry: AuditEntry): Promise<void>;
  listRecent(limit: number): Promise<(AuditEntry & { id: string; createdAt: Date; actorName: string })[]>;
}

export interface IContactMessageRepository {
  create(input: { name: string; email: string; subject: string; message: string }): Promise<void>;
}

export interface AnalyticsSummary {
  revenueCents: number;
  paidOrders: number;
  activeMemberships: number;
  monthlyRecurringCents: number;
  members: number;
  upcomingBookings: number;
  lowStockProducts: Pick<Product, "id" | "name" | "slug" | "stock">[];
  membershipsByPlan: { planName: string; count: number }[];
}

export interface IAnalyticsRepository {
  summary(now: Date, lowStockThreshold: number): Promise<AnalyticsSummary>;
}
