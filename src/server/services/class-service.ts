import { NotFoundError } from "@/server/domain/errors";
import type { Difficulty } from "@/server/domain/types";
import type { ClassInput, IClassRepository, IScheduleRepository } from "@/server/repositories/interfaces";
import type { Clock } from "@/server/ports/security";

const UPCOMING_LIMIT = 20;

export class ClassService {
  constructor(
    private readonly classes: IClassRepository,
    private readonly schedules: IScheduleRepository,
    private readonly now: Clock,
  ) {}

  list(filter: { accessObjectSlug?: string; difficulty?: Difficulty } = {}) {
    return this.classes.list(filter);
  }

  /** Class detail plus its upcoming timetable with live seat counts. */
  async getBySlug(slug: string) {
    const gymClass = await this.classes.findBySlug(slug);
    if (!gymClass) throw new NotFoundError("Class not found");
    const schedule = await this.schedules.listUpcoming({ from: this.now(), classId: gymClass.id, limit: UPCOMING_LIMIT });
    return { ...gymClass, schedule };
  }

  create(input: ClassInput) {
    return this.classes.create(input);
  }

  async update(id: string, input: Partial<ClassInput>) {
    if (!(await this.classes.findById(id))) throw new NotFoundError("Class not found");
    return this.classes.update(id, input);
  }

  async delete(id: string) {
    if (!(await this.classes.findById(id))) throw new NotFoundError("Class not found");
    await this.classes.delete(id);
  }
}
