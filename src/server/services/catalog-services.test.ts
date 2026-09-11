import { beforeEach, describe, expect, it } from "vitest";
import { AccessObjectService } from "@/server/services/access-object-service";
import { ClassService } from "@/server/services/class-service";
import { TrainerService } from "@/server/services/trainer-service";
import { NotFoundError } from "@/server/domain/errors";
import {
  MemoryAccessObjectRepository,
  MemoryClassRepository,
  MemoryScheduleRepository,
  MemoryTrainerRepository,
  type MemoryStore,
} from "@/server/repositories/memory";
import { buildWorld, clock } from "@/server/testing/fixtures";

let db: MemoryStore;
beforeEach(() => {
  db = buildWorld().db;
});

describe("AccessObjectService", () => {
  it("lists objects in display order with their space", async () => {
    const service = new AccessObjectService(new MemoryAccessObjectRepository(db));
    const list = await service.list();
    expect(list.map((o) => o.slug)).toEqual(["yoga-studio", "boxing-zone"]);
    expect(list[0].space?.id).toBe("sp_yoga");
  });

  it("finds by slug, 404s otherwise, and updates text and equipment", async () => {
    const service = new AccessObjectService(new MemoryAccessObjectRepository(db));
    await expect(service.getBySlug("nope")).rejects.toBeInstanceOf(NotFoundError);
    await service.update("ao_yoga", { tagline: "Breathe" });
    await service.updateSpace("ao_yoga", { equipmentList: ["Mats"] });
    const yoga = await service.getBySlug("yoga-studio");
    expect(yoga.tagline).toBe("Breathe");
    expect(yoga.space?.equipmentList).toEqual(["Mats"]);
  });
});

describe("ClassService", () => {
  const make = () => new ClassService(new MemoryClassRepository(db), new MemoryScheduleRepository(db), clock);

  it("filters by Access Object and difficulty", async () => {
    const service = make();
    expect((await service.list({ accessObjectSlug: "boxing-zone" })).map((c) => c.slug)).toEqual(["boxing-fundamentals"]);
    expect((await service.list({ difficulty: "BEGINNER" })).map((c) => c.slug)).toEqual(["boxing-fundamentals"]);
  });

  it("returns detail with only upcoming sessions", async () => {
    const detail = await make().getBySlug("vinyasa-flow");
    expect(detail.schedule.map((s) => s.id)).toEqual(["sch_yoga"]);
    expect(detail.schedule[0].capacity).toBe(2);
  });

  it("creates, updates and deletes, and 404s for unknown ids", async () => {
    const service = make();
    const created = await service.create({
      name: "Mobility",
      slug: "mobility",
      accessObjectId: "ao_yoga",
      description: "Stretch",
      benefits: [],
      difficulty: "BEGINNER",
      durationMinutes: 30,
      estCalories: 100,
      defaultCapacity: 10,
    });
    await service.update(created.id, { defaultCapacity: 12 });
    expect(db.classes.find((c) => c.id === created.id)?.defaultCapacity).toBe(12);
    await service.delete(created.id);
    expect(db.classes.some((c) => c.id === created.id)).toBe(false);
    await expect(service.getBySlug("mobility")).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.update("ghost", {})).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.delete("ghost")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("TrainerService", () => {
  const make = () => new TrainerService(new MemoryTrainerRepository(db), new MemoryClassRepository(db), new MemoryScheduleRepository(db), clock);

  it("filters by lead space", async () => {
    expect((await make().list({ accessObjectSlug: "yoga-studio" })).map((t) => t.slug)).toEqual(["elena-cruz"]);
  });

  it("returns detail with classes taught and upcoming sessions", async () => {
    const elena = await make().getBySlug("elena-cruz");
    expect(elena.classes.map((c) => c.slug)).toEqual(["vinyasa-flow"]);
    expect(elena.upcoming.map((s) => s.id)).toEqual(["sch_yoga"]);
    await expect(make().getBySlug("nobody")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("builds the trainer portal schedule for a linked account only", async () => {
    const { trainer, sessions } = await make().scheduleForUser("usr_trainer");
    expect(trainer.id).toBe("tr_elena");
    expect(sessions).toHaveLength(1);
    await expect(make().scheduleForUser("usr_yoga")).rejects.toBeInstanceOf(NotFoundError);
    expect(await make().findByUserId("usr_trainer")).toMatchObject({ id: "tr_elena" });
  });

  it("creates, updates and deletes trainers", async () => {
    const service = make();
    const created = await service.create({
      name: "New Coach",
      slug: "new-coach",
      bio: "Bio",
      specialty: "Strength",
      certifications: [],
      yearsExperience: 3,
      primaryAccessObjectId: "ao_box",
    });
    await service.update(created.id, { yearsExperience: 4 });
    expect(db.trainers.find((t) => t.id === created.id)?.yearsExperience).toBe(4);
    await service.delete(created.id);
    await expect(service.update(created.id, {})).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.delete(created.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
