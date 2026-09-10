import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/server/domain/errors";
import type { Role, Schedule, ScheduleDetail } from "@/server/domain/types";
import type {
  IBookingRepository,
  IClassRepository,
  IScheduleRepository,
  ISpaceRepository,
  ITrainerRepository,
  ScheduleInput,
  ScheduleQuery,
} from "@/server/repositories/interfaces";
import type { Clock } from "@/server/ports/security";

/**
 * Timetable management. Trainer/space double-booking is prevented here with an
 * application-level overlap check (spec B2); a DB exclusion constraint is a
 * Phase 2 hardening step.
 */
export class ScheduleService {
  constructor(
    private readonly schedules: IScheduleRepository,
    private readonly classes: IClassRepository,
    private readonly trainers: ITrainerRepository,
    private readonly spaces: ISpaceRepository,
    private readonly bookings: IBookingRepository,
    private readonly now: Clock,
  ) {}

  listUpcoming(query: Omit<ScheduleQuery, "from"> & { from?: Date }): Promise<ScheduleDetail[]> {
    return this.schedules.listUpcoming({ ...query, from: query.from ?? this.now() });
  }

  async getDetail(scheduleId: string): Promise<ScheduleDetail> {
    const detail = await this.schedules.findDetail(scheduleId);
    if (!detail) throw new NotFoundError("Schedule not found");
    return detail;
  }

  async create(input: ScheduleInput): Promise<Schedule> {
    await this.validate(input);
    return this.schedules.create(input);
  }

  async update(id: string, input: ScheduleInput): Promise<Schedule> {
    const current = await this.schedules.findDetail(id);
    if (!current) throw new NotFoundError("Schedule not found");
    await this.validate(input, id);
    return this.schedules.update(id, input);
  }

  async delete(id: string): Promise<void> {
    const current = await this.schedules.findDetail(id);
    if (!current) throw new NotFoundError("Schedule not found");
    await this.schedules.delete(id);
  }

  /** Session roster: the trainer who teaches it, or any admin. */
  async roster(actor: { role: Role; trainerId: string | null }, scheduleId: string) {
    const detail = await this.getDetail(scheduleId);
    if (actor.role !== "ADMIN" && !(actor.role === "TRAINER" && actor.trainerId === detail.trainerId)) {
      throw new ForbiddenError("You can only view rosters for your own sessions");
    }
    const bookings = await this.bookings.listForSchedule(scheduleId);
    return { schedule: detail, bookings: bookings.filter((b) => b.status !== "CANCELLED") };
  }

  private async validate(input: ScheduleInput, excludeScheduleId?: string) {
    if (input.endTime <= input.startTime) throw new ValidationError("End time must be after start time");
    if (input.capacityOverride != null && input.capacityOverride < 1) throw new ValidationError("Capacity must be at least 1");

    const [gymClass, trainer, space] = await Promise.all([
      this.classes.findById(input.classId),
      this.trainers.findById(input.trainerId),
      this.spaces.findById(input.spaceId),
    ]);
    if (!gymClass) throw new NotFoundError("Class not found");
    if (!trainer) throw new NotFoundError("Trainer not found");
    if (!space) throw new NotFoundError("Space not found");
    if (space.accessObjectId !== gymClass.accessObjectId) {
      throw new ValidationError("A class must be scheduled in the space of its own Access Object");
    }

    const overlapping = await this.schedules.findOverlapping({
      start: input.startTime,
      end: input.endTime,
      trainerId: input.trainerId,
      spaceId: input.spaceId,
      excludeScheduleId,
    });
    const trainerClash = overlapping.find((s) => s.trainerId === input.trainerId);
    if (trainerClash) throw new ConflictError(`${trainer.name} is already teaching at that time`);
    if (overlapping.some((s) => s.spaceId === input.spaceId)) throw new ConflictError("That space is already booked at that time");
  }
}
