import { NotFoundError } from "@/server/domain/errors";
import type { IClassRepository, IScheduleRepository, ITrainerRepository, TrainerInput } from "@/server/repositories/interfaces";
import type { Clock } from "@/server/ports/security";

export class TrainerService {
  constructor(
    private readonly trainers: ITrainerRepository,
    private readonly classes: IClassRepository,
    private readonly schedules: IScheduleRepository,
    private readonly now: Clock,
  ) {}

  list(filter: { accessObjectSlug?: string } = {}) {
    return this.trainers.list(filter);
  }

  /** Trainer detail plus the classes they teach and their next sessions. */
  async getBySlug(slug: string) {
    const trainer = await this.trainers.findBySlug(slug);
    if (!trainer) throw new NotFoundError("Trainer not found");
    const [classes, upcoming] = await Promise.all([
      this.classes.listTaughtBy(trainer.id),
      this.schedules.listUpcoming({ from: this.now(), trainerId: trainer.id, limit: 8 }),
    ]);
    return { ...trainer, classes, upcoming };
  }

  findByUserId(userId: string) {
    return this.trainers.findByUserId(userId);
  }

  /** The trainer portal's schedule view for the signed-in trainer. */
  async scheduleForUser(userId: string, days = 14) {
    const trainer = await this.trainers.findByUserId(userId);
    if (!trainer) throw new NotFoundError("No trainer profile is linked to this account");
    const from = this.now();
    const to = new Date(from.getTime() + days * 86_400_000);
    const sessions = await this.schedules.listUpcoming({ from, to, trainerId: trainer.id });
    return { trainer, sessions };
  }

  create(input: TrainerInput) {
    return this.trainers.create(input);
  }

  async update(id: string, input: Partial<TrainerInput>) {
    if (!(await this.trainers.findById(id))) throw new NotFoundError("Trainer not found");
    return this.trainers.update(id, input);
  }

  async delete(id: string) {
    if (!(await this.trainers.findById(id))) throw new NotFoundError("Trainer not found");
    await this.trainers.delete(id);
  }
}
