import type { AuditEntry, IAnalyticsRepository, IAuditLogRepository, IContactMessageRepository, ISitemapRepository } from "@/server/repositories/interfaces";
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

/** Public URLs with last-modified dates for sitemap.xml (spec C1). */
export class SeoService {
  constructor(private readonly sitemap: ISitemapRepository) {}

  async sitemapEntries(now: Date) {
    const [details, sections] = await Promise.all([this.sitemap.detailPages(), this.sitemap.sectionLastModified()]);
    const latest = [sections.classes, sections.trainers, sections.spaces, sections.store, sections.memberships].filter((d): d is Date => Boolean(d));
    const home = latest.length ? new Date(Math.max(...latest.map((d) => d.getTime()))) : now;
    const listing = (key: keyof typeof sections) => sections[key] ?? now;
    const statics = [
      { path: "/", lastModified: home },
      { path: "/classes", lastModified: listing("classes") },
      { path: "/trainers", lastModified: listing("trainers") },
      { path: "/memberships", lastModified: listing("memberships") },
      { path: "/spaces", lastModified: listing("spaces") },
      { path: "/store", lastModified: listing("store") },
      { path: "/contact", lastModified: home },
    ];
    return [...statics, ...details];
  }
}
