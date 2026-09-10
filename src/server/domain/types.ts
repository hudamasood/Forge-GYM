/**
 * Domain entity shapes. Deliberately independent of Prisma so services and
 * their unit tests never depend on the ORM. Money is always integer USD cents.
 */

export type Role = "MEMBER" | "TRAINER" | "ADMIN";
export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
export type BookingStatus = "CONFIRMED" | "CANCELLED" | "ATTENDED" | "NO_SHOW";
export type PlanType = "SINGLE_OBJECT" | "ALL_ACCESS";
export type MembershipStatus = "INCOMPLETE" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
export type BillingInterval = "MONTHLY" | "ANNUAL";
export type ProductCategory = "SUPPLEMENTS" | "MERCHANDISE" | "EQUIPMENT" | "DIGITAL";
export type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED";

export const ROLES: readonly Role[] = ["MEMBER", "TRAINER", "ADMIN"];
export const DIFFICULTIES: readonly Difficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"];
export const BOOKING_STATUSES: readonly BookingStatus[] = ["CONFIRMED", "CANCELLED", "ATTENDED", "NO_SHOW"];
export const MEMBERSHIP_STATUSES: readonly MembershipStatus[] = ["INCOMPLETE", "ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"];
export const BILLING_INTERVALS: readonly BillingInterval[] = ["MONTHLY", "ANNUAL"];
export const PRODUCT_CATEGORIES: readonly ProductCategory[] = ["SUPPLEMENTS", "MERCHANDISE", "EQUIPMENT", "DIGITAL"];
export const ORDER_STATUSES: readonly OrderStatus[] = ["PENDING", "PAID", "FULFILLED", "CANCELLED", "REFUNDED"];

/** Membership statuses that grant access. Failed payments do not auto-downgrade (A7 default). */
export const ENTITLED_MEMBERSHIP_STATUSES: readonly MembershipStatus[] = ["ACTIVE", "PAST_DUE"];

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: Date | null;
  stripeCustomerId: string | null;
  createdAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string | null;
}

export interface Space {
  id: string;
  accessObjectId: string;
  equipmentList: string[];
  operatingHours: Record<string, string>;
  galleryImages: string[];
}

export interface AccessObject {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  heroImageUrl: string | null;
  sortOrder: number;
}

export interface AccessObjectWithSpace extends AccessObject {
  space: Space | null;
}

export interface Trainer {
  id: string;
  userId: string | null;
  name: string;
  slug: string;
  bio: string;
  specialty: string;
  certifications: string[];
  yearsExperience: number;
  primaryAccessObjectId: string;
  photoUrl: string | null;
}

export interface TrainerWithObject extends Trainer {
  primaryAccessObject: AccessObject;
}

export interface GymClass {
  id: string;
  name: string;
  slug: string;
  accessObjectId: string;
  description: string;
  benefits: string[];
  difficulty: Difficulty;
  durationMinutes: number;
  estCalories: number;
  defaultCapacity: number;
  imageUrl: string | null;
}

export interface GymClassWithObject extends GymClass {
  accessObject: AccessObject;
}

export interface Schedule {
  id: string;
  classId: string;
  trainerId: string;
  spaceId: string;
  startTime: Date;
  endTime: Date;
  capacityOverride: number | null;
}

/** A schedule joined with everything a booking decision needs. */
export interface ScheduleForBooking extends Schedule {
  accessObjectId: string;
  capacity: number;
}

/** A schedule as shown to people: class, trainer and live seat count. */
export interface ScheduleDetail extends Schedule {
  capacity: number;
  bookedCount: number;
  class: Pick<GymClass, "id" | "name" | "slug" | "difficulty" | "durationMinutes" | "accessObjectId">;
  trainer: Pick<Trainer, "id" | "name" | "slug">;
  accessObject: Pick<AccessObject, "id" | "name" | "slug">;
}

export interface Booking {
  id: string;
  userId: string;
  scheduleId: string;
  status: BookingStatus;
  bookedAt: Date;
  cancelledAt: Date | null;
}

export interface BookingWithSchedule extends Booking {
  schedule: ScheduleDetail;
}

export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  type: PlanType;
  accessObjectId: string | null;
  priceMonthly: number;
  priceAnnual: number;
  stripePriceIdMonthly: string | null;
  stripePriceIdAnnual: string | null;
  benefits: string[];
  sortOrder: number;
}

export interface MembershipPlanWithObject extends MembershipPlan {
  accessObject: AccessObject | null;
}

export interface Membership {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId: string | null;
  status: MembershipStatus;
  billingInterval: BillingInterval;
  currentPeriodEnd: Date | null;
  createdAt: Date;
}

export interface MembershipWithPlan extends Membership {
  plan: MembershipPlanWithObject;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  price: number;
  stock: number;
  description: string;
  images: string[];
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPriceAtPurchase: number;
  product?: Pick<Product, "id" | "name" | "slug" | "category">;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  total: number;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  shippingAddress: Record<string, string> | null;
  createdAt: Date;
  items: OrderItem[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
