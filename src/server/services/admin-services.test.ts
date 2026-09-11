import { describe, expect, it } from "vitest";
import { AnalyticsService, AuditService, ContactService, LOW_STOCK_THRESHOLD, SeoService } from "@/server/services/admin-services";
import { NotificationService } from "@/server/services/notification-service";
import type { AnalyticsSummary, AuditEntry, IAnalyticsRepository, IAuditLogRepository, ISitemapRepository } from "@/server/repositories/interfaces";
import { RecordingNotificationChannel, clock, NOW } from "@/server/testing/fixtures";

describe("AnalyticsService", () => {
  it("asks for the summary at the current time with the low-stock threshold", async () => {
    const calls: [Date, number][] = [];
    const summary = { revenueCents: 1 } as AnalyticsSummary;
    const repo: IAnalyticsRepository = { summary: async (now, threshold) => (calls.push([now, threshold]), summary) };
    await expect(new AnalyticsService(repo, clock).summary()).resolves.toBe(summary);
    expect(calls).toEqual([[NOW, LOW_STOCK_THRESHOLD]]);
  });
});

describe("AuditService", () => {
  it("records entries and lists the most recent", async () => {
    const entries: AuditEntry[] = [];
    const repo: IAuditLogRepository = {
      record: async (e) => void entries.push(e),
      listRecent: async (limit) => entries.slice(-limit).map((e, i) => ({ ...e, id: String(i), createdAt: NOW, actorName: "Admin" })),
    };
    const audit = new AuditService(repo);
    await audit.record({ actorId: "a", action: "create", entity: "Class", entityId: "c1" });
    expect(await audit.recent()).toHaveLength(1);
  });
});

describe("ContactService", () => {
  it("stores the message and notifies the inbox, even if email fails", async () => {
    const stored: unknown[] = [];
    const channel = new RecordingNotificationChannel();
    const service = new ContactService({ create: async (m) => void stored.push(m) }, new NotificationService(channel, "https://forge.test"), "inbox@forge.test");
    await service.submit({ name: "Pat", email: "pat@test.dev", subject: "Hours", message: "Open on holidays?" });
    expect(stored).toHaveLength(1);
    expect(channel.sent[0]).toMatchObject({ to: "inbox@forge.test", subject: "Contact form: Hours" });

    const failing = new ContactService({ create: async () => undefined }, new NotificationService({ send: () => Promise.reject(new Error("down")) }, "x"), "inbox");
    await expect(failing.submit({ name: "Pat", email: "p@t.dev", subject: "Hi", message: "Hello there" })).resolves.toBeUndefined();
  });

  it("escapes user content in the HTML email", async () => {
    const channel = new RecordingNotificationChannel();
    const service = new ContactService({ create: async () => undefined }, new NotificationService(channel, "https://forge.test"), "inbox");
    await service.submit({ name: "<script>", email: "a@b.c", subject: "x", message: "<img src=x onerror=alert(1)>" });
    expect(channel.sent[0].html).not.toContain("<script>");
    expect(channel.sent[0].html).toContain("&lt;img");
  });
});

describe("SeoService", () => {
  it("combines static and detail routes with lastmod dates", async () => {
    const older = new Date("2026-01-01");
    const newer = new Date("2026-02-01");
    const repo: ISitemapRepository = {
      detailPages: async () => [{ path: "/classes/wod", lastModified: older }],
      sectionLastModified: async () => ({ classes: older, trainers: null, spaces: newer, store: older, memberships: older }),
    };
    const entries = await new SeoService(repo).sitemapEntries(NOW);
    const byPath = Object.fromEntries(entries.map((e) => [e.path, e.lastModified]));
    expect(byPath["/"]).toEqual(newer);
    expect(byPath["/trainers"]).toEqual(NOW);
    expect(byPath["/classes/wod"]).toEqual(older);
    expect(Object.keys(byPath)).toEqual(expect.arrayContaining(["/", "/classes", "/trainers", "/memberships", "/spaces", "/store", "/contact"]));
  });
});
