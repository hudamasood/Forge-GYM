import { beforeEach, describe, expect, it } from "vitest";
import { ScheduleService } from "@/server/services/schedule-service";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/server/domain/errors";
import {
  MemoryBookingRepository,
  MemoryClassRepository,
  MemoryScheduleRepository,
  MemorySpaceRepository,
  MemoryTrainerRepository,
  type MemoryStore,
} from "@/server/repositories/memory";
import { buildWorld, clock, hoursFromNow } from "@/server/testing/fixtures";

describe("ScheduleService", () => {
  let db: MemoryStore;
  let service: ScheduleService;

  beforeEach(() => {
    db = buildWorld().db;
    service = new ScheduleService(
      new MemoryScheduleRepository(db),
      new MemoryClassRepository(db),
      new MemoryTrainerRepository(db),
      new MemorySpaceRepository(db),
      new MemoryBookingRepository(db),
      clock,
    );
  });

  const base = { classId: "cl_vinyasa", trainerId: "tr_elena", spaceId: "sp_yoga" };

  it("creates a non-overlapping session", async () => {
    const created = await service.create({ ...base, startTime: hoursFromNow(72), endTime: hoursFromNow(73) });
    expect(db.schedules.map((s) => s.id)).toContain(created.id);
  });

  it("rejects a trainer double-booking", async () => {
    await expect(service.create({ ...base, spaceId: "sp_yoga", startTime: hoursFromNow(24.5), endTime: hoursFromNow(25.5) })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("rejects a space double-booking by another trainer", async () => {
    db.trainers.push({ ...db.trainers[0], id: "tr_other", userId: null, slug: "other" });
    await expect(service.create({ ...base, trainerId: "tr_other", startTime: hoursFromNow(24), endTime: hoursFromNow(25) })).rejects.toThrow(
      /space is already booked/,
    );
  });

  it("allows back-to-back sessions", async () => {
    await expect(service.create({ ...base, startTime: hoursFromNow(25), endTime: hoursFromNow(26) })).resolves.toBeDefined();
  });

  it("ignores the session being edited when checking overlap", async () => {
    await expect(service.update("sch_yoga", { ...base, startTime: hoursFromNow(24.25), endTime: hoursFromNow(25.25) })).resolves.toBeDefined();
  });

  it("rejects scheduling a class outside its Access Object's space", async () => {
    await expect(service.create({ ...base, spaceId: "sp_box", startTime: hoursFromNow(80), endTime: hoursFromNow(81) })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("rejects an end time before the start", async () => {
    await expect(service.create({ ...base, startTime: hoursFromNow(81), endTime: hoursFromNow(80) })).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects unknown references", async () => {
    await expect(service.create({ ...base, classId: "nope", startTime: hoursFromNow(90), endTime: hoursFromNow(91) })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lists upcoming sessions only, soonest first", async () => {
    const upcoming = await service.listUpcoming({});
    expect(upcoming.map((s) => s.id)).toEqual(["sch_yoga", "sch_box"]);
  });

  it("restricts rosters to the teaching trainer or an admin", async () => {
    await expect(service.roster({ role: "TRAINER", trainerId: "tr_elena" }, "sch_yoga")).resolves.toBeDefined();
    await expect(service.roster({ role: "TRAINER", trainerId: "tr_elena" }, "sch_box")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(service.roster({ role: "ADMIN", trainerId: null }, "sch_box")).resolves.toBeDefined();
  });
});
