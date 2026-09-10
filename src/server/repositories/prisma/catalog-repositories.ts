import type { Prisma } from "@prisma/client";
import type { AccessObjectWithSpace, Space } from "@/server/domain/types";
import type {
  AccessObjectInput,
  ClassFilter,
  ClassInput,
  IAccessObjectRepository,
  IClassRepository,
  ISpaceRepository,
  ITrainerRepository,
  TrainerFilter,
  TrainerInput,
} from "@/server/repositories/interfaces";
import { type Db, asStringArray, asStringRecord, defined, deleteOrConflict, uniqueOrConflict } from "./shared";

type SpaceRow = Prisma.SpaceGetPayload<object>;

function toSpace(row: SpaceRow): Space {
  return {
    id: row.id,
    accessObjectId: row.accessObjectId,
    equipmentList: asStringArray(row.equipmentList),
    operatingHours: asStringRecord(row.operatingHours),
    galleryImages: row.galleryImages,
  };
}

const objectSelect = {
  id: true,
  name: true,
  slug: true,
  tagline: true,
  description: true,
  heroImageUrl: true,
  sortOrder: true,
} satisfies Prisma.AccessObjectSelect;

export class PrismaAccessObjectRepository implements IAccessObjectRepository {
  constructor(private readonly db: Db) {}

  async list(): Promise<AccessObjectWithSpace[]> {
    const rows = await this.db.accessObject.findMany({ select: { ...objectSelect, space: true }, orderBy: { sortOrder: "asc" } });
    return rows.map((r) => ({ ...r, space: r.space ? toSpace(r.space) : null }));
  }

  async findBySlug(slug: string) {
    const row = await this.db.accessObject.findUnique({ where: { slug }, select: { ...objectSelect, space: true } });
    return row ? { ...row, space: row.space ? toSpace(row.space) : null } : null;
  }

  findById(id: string) {
    return this.db.accessObject.findUnique({ where: { id }, select: objectSelect });
  }

  update(id: string, input: Partial<AccessObjectInput>) {
    return uniqueOrConflict(() => this.db.accessObject.update({ where: { id }, data: defined(input), select: objectSelect }), "That slug is already in use");
  }

  async updateSpace(accessObjectId: string, input: Partial<Pick<Space, "equipmentList" | "operatingHours" | "galleryImages">>) {
    await this.db.space.update({ where: { accessObjectId }, data: defined(input) });
  }
}

export class PrismaSpaceRepository implements ISpaceRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string) {
    const row = await this.db.space.findUnique({ where: { id } });
    return row ? toSpace(row) : null;
  }

  async findByAccessObjectId(accessObjectId: string) {
    const row = await this.db.space.findUnique({ where: { accessObjectId } });
    return row ? toSpace(row) : null;
  }
}

const classSelect = {
  id: true,
  name: true,
  slug: true,
  accessObjectId: true,
  description: true,
  benefits: true,
  difficulty: true,
  durationMinutes: true,
  estCalories: true,
  defaultCapacity: true,
  imageUrl: true,
} satisfies Prisma.ClassSelect;

const classWithObject = { ...classSelect, accessObject: { select: objectSelect } } satisfies Prisma.ClassSelect;

export class PrismaClassRepository implements IClassRepository {
  constructor(private readonly db: Db) {}

  list(filter: ClassFilter = {}) {
    return this.db.class.findMany({
      where: { difficulty: filter.difficulty, accessObject: filter.accessObjectSlug ? { slug: filter.accessObjectSlug } : undefined },
      select: classWithObject,
      orderBy: [{ accessObject: { sortOrder: "asc" } }, { name: "asc" }],
    });
  }

  findBySlug(slug: string) {
    return this.db.class.findUnique({ where: { slug }, select: classWithObject });
  }

  findById(id: string) {
    return this.db.class.findUnique({ where: { id }, select: classSelect });
  }

  listTaughtBy(trainerId: string) {
    return this.db.class.findMany({ where: { schedules: { some: { trainerId } } }, select: classWithObject, orderBy: { name: "asc" } });
  }

  create(input: ClassInput) {
    return uniqueOrConflict(() => this.db.class.create({ data: input, select: classSelect }), "A class with that slug already exists");
  }

  update(id: string, input: Partial<ClassInput>) {
    return uniqueOrConflict(() => this.db.class.update({ where: { id }, data: defined(input), select: classSelect }), "A class with that slug already exists");
  }

  async delete(id: string) {
    await deleteOrConflict(() => this.db.class.delete({ where: { id } }), "This class still has scheduled sessions — delete them first");
  }
}

const trainerSelect = {
  id: true,
  userId: true,
  name: true,
  slug: true,
  bio: true,
  specialty: true,
  certifications: true,
  yearsExperience: true,
  primaryAccessObjectId: true,
  photoUrl: true,
} satisfies Prisma.TrainerSelect;

export class PrismaTrainerRepository implements ITrainerRepository {
  constructor(private readonly db: Db) {}

  list(filter: TrainerFilter = {}) {
    return this.db.trainer.findMany({
      where: { primaryAccessObject: filter.accessObjectSlug ? { slug: filter.accessObjectSlug } : undefined },
      select: { ...trainerSelect, primaryAccessObject: { select: objectSelect } },
      orderBy: [{ primaryAccessObject: { sortOrder: "asc" } }, { name: "asc" }],
    });
  }

  findBySlug(slug: string) {
    return this.db.trainer.findUnique({ where: { slug }, select: { ...trainerSelect, primaryAccessObject: { select: objectSelect } } });
  }

  findById(id: string) {
    return this.db.trainer.findUnique({ where: { id }, select: trainerSelect });
  }

  findByUserId(userId: string) {
    return this.db.trainer.findUnique({ where: { userId }, select: trainerSelect });
  }

  create(input: TrainerInput) {
    return uniqueOrConflict(() => this.db.trainer.create({ data: input, select: trainerSelect }), "A trainer with that slug or account already exists");
  }

  update(id: string, input: Partial<TrainerInput>) {
    return uniqueOrConflict(
      () => this.db.trainer.update({ where: { id }, data: defined(input), select: trainerSelect }),
      "A trainer with that slug or account already exists",
    );
  }

  async delete(id: string) {
    await deleteOrConflict(() => this.db.trainer.delete({ where: { id } }), "This trainer still has scheduled sessions — reassign or delete them first");
  }
}
