import "server-only";
/**
 * Composition root (spec B1, Dependency Inversion): the one place concrete
 * implementations are wired into services. Everything else depends on
 * interfaces.
 */
import { prisma } from "@/server/db";
import { config, devPaymentsEnabled } from "@/server/config";
import { systemClock } from "@/server/ports/security";
import type { IPaymentProvider } from "@/server/ports/payment";
import type { INotificationChannel } from "@/server/ports/notification";
import { BcryptPasswordHasher } from "@/server/adapters/bcrypt-hasher";
import { DevPaymentProvider } from "@/server/adapters/dev-payment-provider";
import { StripePaymentProvider } from "@/server/adapters/stripe-payment-provider";
import { ConsoleNotificationChannel, ResendNotificationChannel } from "@/server/adapters/notification-channels";
import { PrismaPasswordResetTokenRepository, PrismaUserRepository } from "@/server/repositories/prisma/user-repositories";
import {
  PrismaAccessObjectRepository,
  PrismaClassRepository,
  PrismaSpaceRepository,
  PrismaTrainerRepository,
} from "@/server/repositories/prisma/catalog-repositories";
import { PrismaBookingRepository, PrismaScheduleRepository, prismaBookingTransaction } from "@/server/repositories/prisma/scheduling-repositories";
import {
  PrismaMembershipPlanRepository,
  PrismaMembershipRepository,
  PrismaOrderRepository,
  PrismaProductRepository,
} from "@/server/repositories/prisma/commerce-repositories";
import {
  PrismaAnalyticsRepository,
  PrismaAuditLogRepository,
  PrismaContactMessageRepository,
  PrismaSitemapRepository,
  PrismaWebhookEventRepository,
} from "@/server/repositories/prisma/record-repositories";
import { AccessObjectService } from "@/server/services/access-object-service";
import { AnalyticsService, AuditService, ContactService, SeoService } from "@/server/services/admin-services";
import { BookingService } from "@/server/services/booking-service";
import { ClassService } from "@/server/services/class-service";
import { MembershipService } from "@/server/services/membership-service";
import { NotificationService } from "@/server/services/notification-service";
import { OrderService } from "@/server/services/order-service";
import { PaymentWebhookService } from "@/server/services/payment-webhook-service";
import { ScheduleService } from "@/server/services/schedule-service";
import { TrainerService } from "@/server/services/trainer-service";
import { UserService } from "@/server/services/user-service";

function createPaymentProvider(): IPaymentProvider {
  if (config.stripe.secretKey) return new StripePaymentProvider(config.stripe.secretKey, config.stripe.webhookSecret);
  if (devPaymentsEnabled) return new DevPaymentProvider(config.siteUrl, config.authSecret || "forge-dev-secret");
  return {
    isConfigured: false,
    createSubscriptionCheckout: () => Promise.reject(new Error("Payments are not configured")),
    createPaymentCheckout: () => Promise.reject(new Error("Payments are not configured")),
    cancelSubscriptionAtPeriodEnd: () => Promise.reject(new Error("Payments are not configured")),
    parseWebhookEvent: () => Promise.reject(new Error("Payments are not configured")),
  };
}

function createNotificationChannel(): INotificationChannel {
  return config.email.resendApiKey ? new ResendNotificationChannel(config.email.resendApiKey, config.email.from) : new ConsoleNotificationChannel();
}

function build() {
  const now = systemClock;

  const users = new PrismaUserRepository(prisma);
  const resetTokens = new PrismaPasswordResetTokenRepository(prisma);
  const accessObjects = new PrismaAccessObjectRepository(prisma);
  const spaces = new PrismaSpaceRepository(prisma);
  const classes = new PrismaClassRepository(prisma);
  const trainers = new PrismaTrainerRepository(prisma);
  const schedules = new PrismaScheduleRepository(prisma);
  const bookings = new PrismaBookingRepository(prisma);
  const plans = new PrismaMembershipPlanRepository(prisma);
  const memberships = new PrismaMembershipRepository(prisma);
  const products = new PrismaProductRepository(prisma);
  const orders = new PrismaOrderRepository(prisma, prisma);

  const payments = createPaymentProvider();
  const notifications = new NotificationService(createNotificationChannel(), config.siteUrl);

  const membershipService = new MembershipService(plans, memberships, users, payments, now);
  const orderService = new OrderService(products, orders, users, payments);

  return {
    payments,
    notifications,
    users: new UserService(users, resetTokens, new BcryptPasswordHasher(), notifications, now),
    accessObjects: new AccessObjectService(accessObjects),
    classes: new ClassService(classes, schedules, now),
    trainers: new TrainerService(trainers, classes, schedules, now),
    schedules: new ScheduleService(schedules, classes, trainers, spaces, bookings, now),
    bookings: new BookingService(bookings, schedules, memberships, prismaBookingTransaction(prisma), now),
    memberships: membershipService,
    orders: orderService,
    webhooks: new PaymentWebhookService(payments, new PrismaWebhookEventRepository(prisma), membershipService, orderService, orders, users, notifications),
    analytics: new AnalyticsService(new PrismaAnalyticsRepository(prisma), now),
    audit: new AuditService(new PrismaAuditLogRepository(prisma)),
    contact: new ContactService(new PrismaContactMessageRepository(prisma), notifications, config.email.contactInbox),
    seo: new SeoService(new PrismaSitemapRepository(prisma)),
  };
}

export type Container = ReturnType<typeof build>;

// Module-scoped (not globalThis) so code edits apply on hot reload; the Prisma
// client underneath is the shared process-wide singleton.
let container: Container | undefined;

export function services(): Container {
  container ??= build();
  return container;
}
