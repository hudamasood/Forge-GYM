import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/server/domain/errors";
import { ENTITLED_MEMBERSHIP_STATUSES, type BillingInterval, type MembershipStatus, type MembershipWithPlan } from "@/server/domain/types";
import type { IMembershipPlanRepository, IMembershipRepository, IUserRepository, PlanInput } from "@/server/repositories/interfaces";
import type { CheckoutSession, IPaymentProvider } from "@/server/ports/payment";
import type { Clock } from "@/server/ports/security";

export interface CheckoutUrls {
  successUrl: string;
  cancelUrl: string;
}

/**
 * Object-based memberships (spec A5). Coverage is derived from the plan at
 * query time; activation happens only from verified payment webhooks.
 */
export class MembershipService {
  constructor(
    private readonly plans: IMembershipPlanRepository,
    private readonly memberships: IMembershipRepository,
    private readonly users: IUserRepository,
    private readonly payments: IPaymentProvider,
    private readonly now: Clock,
  ) {}

  listPlans() {
    return this.plans.list();
  }

  async getPlan(slug: string) {
    const plan = await this.plans.findBySlug(slug);
    if (!plan) throw new NotFoundError("Plan not found");
    return plan;
  }

  userCanAccessObject(userId: string, accessObjectId: string) {
    return this.memberships.userCanAccessObject(userId, accessObjectId, this.now());
  }

  listForUser(userId: string) {
    return this.memberships.listForUser(userId);
  }

  /** Memberships currently granting access. */
  async activeForUser(userId: string): Promise<MembershipWithPlan[]> {
    const now = this.now();
    const all = await this.memberships.listForUser(userId);
    return all.filter((m) => ENTITLED_MEMBERSHIP_STATUSES.includes(m.status) && (!m.currentPeriodEnd || m.currentPeriodEnd > now));
  }

  /** Access Object ids the user can currently book, or "ALL". */
  async coverageForUser(userId: string): Promise<"ALL" | string[]> {
    const active = await this.activeForUser(userId);
    if (active.some((m) => m.plan.type === "ALL_ACCESS")) return "ALL";
    return [...new Set(active.map((m) => m.plan.accessObjectId).filter((id): id is string => Boolean(id)))];
  }

  async startCheckout(userId: string, planSlug: string, interval: BillingInterval, urls: CheckoutUrls): Promise<CheckoutSession> {
    const [user, plan] = await Promise.all([this.users.findById(userId), this.plans.findBySlug(planSlug)]);
    if (!user) throw new NotFoundError("User not found");
    if (!plan) throw new NotFoundError("Plan not found");

    const active = await this.activeForUser(userId);
    if (active.some((m) => m.plan.type === "ALL_ACCESS")) {
      throw new ConflictError("Your All-Access membership already covers every space");
    }
    if (active.some((m) => m.planId === plan.id)) throw new ConflictError("You already hold this membership");

    return this.payments.createSubscriptionCheckout({
      customerEmail: user.email,
      customerId: user.stripeCustomerId,
      planName: plan.name,
      amount: interval === "MONTHLY" ? plan.priceMonthly : plan.priceAnnual,
      interval,
      priceId: interval === "MONTHLY" ? plan.stripePriceIdMonthly : plan.stripePriceIdAnnual,
      safepayPlanId: interval === "MONTHLY" ? plan.safepayPlanIdMonthly : plan.safepayPlanIdAnnual,
      metadata: { userId, planId: plan.id, interval },
      ...urls,
    });
  }

  /** Idempotent: a repeated webhook for the same subscription only refreshes it. */
  async activateFromCheckout(input: {
    userId: string;
    planId: string;
    interval: BillingInterval;
    subscriptionId: string;
    customerId: string | null;
    currentPeriodEnd: Date | null;
  }) {
    const existing = await this.memberships.findBySubscriptionId(input.subscriptionId);
    if (existing) {
      return this.memberships.update(existing.id, { status: "ACTIVE", currentPeriodEnd: input.currentPeriodEnd });
    }
    const plan = await this.plans.findById(input.planId);
    if (!plan) throw new NotFoundError("Plan not found");
    if (input.customerId) await this.users.setStripeCustomerId(input.userId, input.customerId);

    return this.memberships.create({
      userId: input.userId,
      planId: plan.id,
      status: "ACTIVE",
      billingInterval: input.interval,
      stripeSubscriptionId: input.subscriptionId,
      currentPeriodEnd: input.currentPeriodEnd,
    });
  }

  syncSubscription(subscriptionId: string, update: { status?: MembershipStatus; currentPeriodEnd?: Date | null }) {
    return this.memberships.updateBySubscriptionId(subscriptionId, update);
  }

  async cancel(actor: { id: string; role: string }, membershipId: string) {
    const membership = await this.memberships.findById(membershipId);
    if (!membership) throw new NotFoundError("Membership not found");
    if (membership.userId !== actor.id && actor.role !== "ADMIN") throw new ForbiddenError("Not your membership");
    if (!ENTITLED_MEMBERSHIP_STATUSES.includes(membership.status)) throw new ConflictError("This membership is not active");

    // Access continues until the paid period ends; the subscription webhook
    // then moves the membership to CANCELED.
    if (membership.stripeSubscriptionId && this.payments.isConfigured) {
      await this.payments.cancelSubscriptionAtPeriodEnd(membership.stripeSubscriptionId);
      return membership;
    }
    return this.memberships.update(membership.id, { status: "CANCELED" });
  }

  listAll(request: Parameters<IMembershipRepository["listAll"]>[0]) {
    return this.memberships.listAll(request);
  }

  async adminSetStatus(membershipId: string, status: MembershipStatus) {
    if (!(await this.memberships.findById(membershipId))) throw new NotFoundError("Membership not found");
    return this.memberships.update(membershipId, { status });
  }

  async updatePlan(id: string, input: Partial<PlanInput>) {
    if (input.priceMonthly != null && input.priceMonthly < 0) throw new ValidationError("Price cannot be negative");
    if (input.priceAnnual != null && input.priceAnnual < 0) throw new ValidationError("Price cannot be negative");
    if (!(await this.plans.findById(id))) throw new NotFoundError("Plan not found");
    return this.plans.update(id, input);
  }
}
