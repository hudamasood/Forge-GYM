import { beforeEach, describe, expect, it } from "vitest";
import { BookingService } from "@/server/services/booking-service";
import { CapacityError, ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/server/domain/errors";
import {
  MemoryBookingRepository,
  MemoryMembershipRepository,
  MemoryScheduleRepository,
  memoryBookingTransaction,
  type MemoryStore,
} from "@/server/repositories/memory";
import { buildWorld, clock, hoursFromNow } from "@/server/testing/fixtures";

describe("BookingService", () => {
  let db: MemoryStore;
  let service: BookingService;
  let world: ReturnType<typeof buildWorld>;

  beforeEach(() => {
    world = buildWorld();
    db = world.db;
    service = new BookingService(
      new MemoryBookingRepository(db),
      new MemoryScheduleRepository(db),
      new MemoryMembershipRepository(db),
      memoryBookingTransaction(db),
      clock,
    );
  });

  describe("bookClass", () => {
    it("books a class covered by the member's single-object plan", async () => {
      const booking = await service.bookClass("usr_yoga", "sch_yoga");
      expect(booking.status).toBe("CONFIRMED");
      expect(db.bookings).toHaveLength(1);
    });

    it("lets an All-Access member book any Access Object", async () => {
      await expect(service.bookClass("usr_all", "sch_box")).resolves.toMatchObject({ status: "CONFIRMED" });
      await expect(service.bookClass("usr_all", "sch_yoga")).resolves.toMatchObject({ status: "CONFIRMED" });
    });

    it("rejects a class outside the member's plan", async () => {
      await expect(service.bookClass("usr_yoga", "sch_box")).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("rejects users without any membership", async () => {
      await expect(service.bookClass("usr_none", "sch_yoga")).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("rejects expired or cancelled memberships", async () => {
      db.memberships.push(world.membership("usr_none", "pl_yoga", "ACTIVE", hoursFromNow(-1)));
      db.memberships.push(world.membership("usr_none", "pl_all", "CANCELED"));
      await expect(service.bookClass("usr_none", "sch_yoga")).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("keeps access while a payment is past due (no auto-downgrade)", async () => {
      db.memberships.push(world.membership("usr_none", "pl_yoga", "PAST_DUE"));
      await expect(service.bookClass("usr_none", "sch_yoga")).resolves.toMatchObject({ status: "CONFIRMED" });
    });

    it("rejects an unknown schedule", async () => {
      await expect(service.bookClass("usr_yoga", "missing")).rejects.toBeInstanceOf(NotFoundError);
    });

    it("rejects a class that has already started", async () => {
      await expect(service.bookClass("usr_yoga", "sch_past")).rejects.toBeInstanceOf(ValidationError);
    });

    it("rejects a double booking", async () => {
      await service.bookClass("usr_yoga", "sch_yoga");
      await expect(service.bookClass("usr_yoga", "sch_yoga")).rejects.toBeInstanceOf(ConflictError);
    });

    it("rejects bookings once capacity is reached", async () => {
      await service.bookClass("usr_yoga", "sch_yoga");
      await service.bookClass("usr_all", "sch_yoga");
      await expect(service.bookClass("usr_other", "sch_yoga")).rejects.toBeInstanceOf(CapacityError);
    });

    it("honors a schedule capacity override", async () => {
      db.schedules.find((s) => s.id === "sch_yoga")!.capacityOverride = 1;
      await service.bookClass("usr_yoga", "sch_yoga");
      await expect(service.bookClass("usr_all", "sch_yoga")).rejects.toBeInstanceOf(CapacityError);
    });

    it("never overbooks under concurrent requests for the last seat", async () => {
      await service.bookClass("usr_yoga", "sch_yoga");
      const results = await Promise.allSettled([service.bookClass("usr_all", "sch_yoga"), service.bookClass("usr_other", "sch_yoga")]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
      expect(db.bookings.filter((b) => b.status === "CONFIRMED")).toHaveLength(2);
    });

    it("re-confirms a previously cancelled booking instead of inserting a duplicate row", async () => {
      const first = await service.bookClass("usr_yoga", "sch_yoga");
      await service.cancelBooking({ id: "usr_yoga", role: "MEMBER" }, first.id);
      const again = await service.bookClass("usr_yoga", "sch_yoga");
      expect(again.id).toBe(first.id);
      expect(again.status).toBe("CONFIRMED");
      expect(db.bookings).toHaveLength(1);
    });
  });

  describe("cancelBooking", () => {
    it("releases the seat immediately", async () => {
      const booking = await service.bookClass("usr_yoga", "sch_yoga");
      await service.bookClass("usr_all", "sch_yoga");
      await service.cancelBooking({ id: "usr_yoga", role: "MEMBER" }, booking.id);
      await expect(service.bookClass("usr_other", "sch_yoga")).resolves.toMatchObject({ status: "CONFIRMED" });
    });

    it("forbids cancelling someone else's booking", async () => {
      const booking = await service.bookClass("usr_yoga", "sch_yoga");
      await expect(service.cancelBooking({ id: "usr_all", role: "MEMBER" }, booking.id)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("allows an admin to cancel any booking", async () => {
      const booking = await service.bookClass("usr_yoga", "sch_yoga");
      await expect(service.cancelBooking({ id: "usr_admin", role: "ADMIN" }, booking.id)).resolves.toMatchObject({ status: "CANCELLED" });
    });

    it("rejects cancelling twice", async () => {
      const booking = await service.bookClass("usr_yoga", "sch_yoga");
      await service.cancelBooking({ id: "usr_yoga", role: "MEMBER" }, booking.id);
      await expect(service.cancelBooking({ id: "usr_yoga", role: "MEMBER" }, booking.id)).rejects.toBeInstanceOf(ConflictError);
    });

    it("rejects member cancellation after the class started", async () => {
      db.bookings.push({ id: "bk_past", userId: "usr_yoga", scheduleId: "sch_past", status: "CONFIRMED", bookedAt: hoursFromNow(-5), cancelledAt: null });
      await expect(service.cancelBooking({ id: "usr_yoga", role: "MEMBER" }, "bk_past")).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe("markAttendance", () => {
    it("lets the teaching trainer mark attendance", async () => {
      const booking = await service.bookClass("usr_yoga", "sch_yoga");
      const marked = await service.markAttendance({ id: "usr_trainer", role: "TRAINER", trainerId: "tr_elena" }, booking.id, "ATTENDED");
      expect(marked.status).toBe("ATTENDED");
    });

    it("forbids a trainer from marking another trainer's session", async () => {
      const booking = await service.bookClass("usr_all", "sch_box");
      await expect(service.markAttendance({ id: "usr_trainer", role: "TRAINER", trainerId: "tr_elena" }, booking.id, "NO_SHOW")).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });
  });

  it("lists only upcoming, non-cancelled bookings for the dashboard", async () => {
    await service.bookClass("usr_all", "sch_yoga");
    const cancelled = await service.bookClass("usr_all", "sch_box");
    await service.cancelBooking({ id: "usr_all", role: "MEMBER" }, cancelled.id);
    const upcoming = await service.listUpcomingForUser("usr_all");
    expect(upcoming.map((b) => b.scheduleId)).toEqual(["sch_yoga"]);
    expect(upcoming[0].schedule.class.name).toBe("Vinyasa Flow");
  });
});
