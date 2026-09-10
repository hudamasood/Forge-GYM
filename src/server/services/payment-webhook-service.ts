import type { IOrderRepository, IUserRepository, IWebhookEventRepository } from "@/server/repositories/interfaces";
import type { IPaymentProvider, PaymentEvent } from "@/server/ports/payment";
import type { MembershipService } from "@/server/services/membership-service";
import type { NotificationService } from "@/server/services/notification-service";
import type { OrderService } from "@/server/services/order-service";
import { formatUsd } from "@/lib/format";

/**
 * Applies verified payment events. Idempotent: each provider event id is
 * processed once; a failure un-records it so the provider's retry succeeds.
 */
export class PaymentWebhookService {
  constructor(
    private readonly payments: IPaymentProvider,
    private readonly events: IWebhookEventRepository,
    private readonly memberships: MembershipService,
    private readonly orders: OrderService,
    private readonly orderRepo: IOrderRepository,
    private readonly users: IUserRepository,
    private readonly notifications: NotificationService,
  ) {}

  async handle(rawBody: string, signature: string): Promise<{ duplicate: boolean; kind: PaymentEvent["kind"] }> {
    const event = await this.payments.parseWebhookEvent(rawBody, signature);
    return this.apply(event);
  }

  async apply(event: PaymentEvent): Promise<{ duplicate: boolean; kind: PaymentEvent["kind"] }> {
    if (!(await this.events.markProcessed(event.eventId, event.kind))) return { duplicate: true, kind: event.kind };

    try {
      await this.dispatch(event);
    } catch (error) {
      await this.events.unmark(event.eventId);
      throw error;
    }
    return { duplicate: false, kind: event.kind };
  }

  private async dispatch(event: PaymentEvent) {
    switch (event.kind) {
      case "subscription.checkout_completed": {
        const membership = await this.memberships.activateFromCheckout(event);
        const [user, plans] = await Promise.all([this.users.findById(event.userId), this.memberships.listPlans()]);
        const plan = plans.find((p) => p.id === membership.planId);
        if (user && plan) await this.notifications.membershipActivated(user.email, plan.name).catch(() => undefined);
        return;
      }
      case "payment.checkout_completed": {
        const transitioned = await this.orders.markPaid(event.orderId, event.paymentIntentId);
        if (!transitioned) return;
        const order = await this.orderRepo.findById(event.orderId);
        const user = order && (await this.users.findById(order.userId));
        if (order && user) {
          await this.notifications
            .orderReceipt(user.email, {
              orderId: order.id,
              total: formatUsd(order.total),
              items: order.items.map((i) => ({ name: i.product?.name ?? "Item", quantity: i.quantity })),
            })
            .catch(() => undefined);
        }
        return;
      }
      case "payment.checkout_expired":
        return this.orders.markCheckoutExpired(event.orderId);
      case "subscription.updated":
        await this.memberships.syncSubscription(event.subscriptionId, { status: event.status, currentPeriodEnd: event.currentPeriodEnd });
        return;
      case "subscription.deleted":
        await this.memberships.syncSubscription(event.subscriptionId, { status: "CANCELED" });
        return;
      case "invoice.payment_failed":
        // No auto-downgrade (A7 default): flag PAST_DUE, access continues while the member retries.
        await this.memberships.syncSubscription(event.subscriptionId, { status: "PAST_DUE" });
        return;
      case "ignored":
        return;
    }
  }
}
