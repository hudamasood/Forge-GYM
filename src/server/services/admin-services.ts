import type { AuditEntry, IAnalyticsRepository, IAuditLogRepository, IContactMessageRepository } from "@/server/repositories/interfaces";
import type { Clock } from "@/server/ports/security";
import type { NotificationService } from "@/server/services/notification-service";

export const LOW_STOCK_THRESHOLD = 10;

/** Basic revenue / inventory / membership counts for the admin overview. */
export class AnalyticsService {
  constructor(
    private readonly analytics: IAnalyticsRepository,
    private readonly now: Clock,
  ) {}

  summary() {
    return this.analytics.summary(this.now(), LOW_STOCK_THRESHOLD);
  }
}

/** Admin audit trail (spec B5): who changed what, when. */
export class AuditService {
  constructor(private readonly audit: IAuditLogRepository) {}

  record(entry: AuditEntry) {
    return this.audit.record(entry);
  }

  recent(limit = 25) {
    return this.audit.listRecent(limit);
  }
}

export class ContactService {
  constructor(
    private readonly messages: IContactMessageRepository,
    private readonly notifications: NotificationService,
    private readonly inbox: string,
  ) {}

  async submit(input: { name: string; email: string; subject: string; message: string }) {
    await this.messages.create(input);
    await this.notifications.contactReceived(this.inbox, input).catch(() => undefined);
  }
}
