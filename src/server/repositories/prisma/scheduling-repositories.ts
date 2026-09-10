import type { Prisma, PrismaClient } from "@prisma/client";
import type { Booking, BookingStatus, BookingWithSchedule, ScheduleDetail } from "@/server/domain/types";
import type {
  BookingTransactionScope,
  IBookingRepository,
  IScheduleLockRepository,
  IScheduleRepository,
  OverlapQuery,
  PageRequest,
  ScheduleInput,
  ScheduleQuery,
  TransactionRunner,
} from "@/server/repositories/interfaces";
import { type Db, defined, pageArgs, toPage, uniqueOrConflict } from "./shared";

const detailInclude = {
  class: { select: { id: true, name: true, slug: true, difficulty: true, durationMinutes: true, accessObjectId: true, defaultCapacity: true, accessObject: { select: { id: true, name: true, slug: true } } } },
  trainer: { select: { id: true, name: true, slug: true } },
  _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
} satisfies Prisma.ScheduleInclude;

type DetailRow = Prisma.ScheduleGetPayload<{ include: typeof detailInclude }>;

function toDetail(row: DetailRow): ScheduleDetail {
  const { class: cls, trainer, _count, ...schedule } = row;
  const { accessObject, defaultCapacity, ...classFields } = cls;
  return {
    id: schedule.id,
    classId: schedule.classId,
    trainerId: schedule.trainerId,
    spaceId: schedule.spaceId,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    capacityOverride: schedule.capacityOverride,
    capacity: schedule.capacityOverride ?? defaultCapacity,
    bookedCount: _count.bookings,
    class: classFields,
    trainer,
    accessObject,
  };
}

const scheduleSelect = {
  id: true,
  classId: true,
  trainerId: true,
  spaceId: true,
  startTime: true,
  endTime: true,
  capacityOverride: true,
} satisfies Prisma.ScheduleSelect;

export class PrismaScheduleRepository implements IScheduleRepository {
  constructor(private readonly db: Db) {}

  async findForBooking(scheduleId: string) {
    const row = await this.db.schedule.findUnique({
      where: { id: scheduleId },
      select: { ...scheduleSelect, class: { select: { accessObjectId: true, defaultCapacity: true } } },
    });
    if (!row) return null;
    const { class: cls, ...schedule } = row;
    return { ...schedule, accessObjectId: cls.accessObjectId, capacity: schedule.capacityOverride ?? cls.defaultCapacity };
  }

  async findDetail(scheduleId: string) {
    const row = await this.db.schedule.findUnique({ where: { id: scheduleId }, include: detailInclude });
    return row ? toDetail(row) : null;
  }

  async listUpcoming(query: ScheduleQuery) {
    const rows = await this.db.schedule.findMany({
      where: {
        startTime: { gte: query.from, ...(query.to ? { lt: query.to } : {}) },
        classId: query.classId,
        trainerId: query.trainerId,
        class: query.accessObjectId ? { accessObjectId: query.accessObjectId } : undefined,
      },
      include: detailInclude,
      orderBy: { startTime: "asc" },
      take: query.limit,
    });
    return rows.map(toDetail);
  }

  findOverlapping(query: OverlapQuery) {
    return this.db.schedule.findMany({
      where: {
        id: query.excludeScheduleId ? { not: query.excludeScheduleId } : undefined,
        OR: [{ trainerId: query.trainerId }, { spaceId: query.spaceId }],
        startTime: { lt: query.end },
        endTime: { gt: query.start },
      },
      select: scheduleSelect,
    });
  }

  create(input: ScheduleInput) {
    return this.db.schedule.create({ data: input, select: scheduleSelect });
  }

  update(id: string, input: Partial<ScheduleInput>) {
    return this.db.schedule.update({ where: { id }, data: defined(input), select: scheduleSelect });
  }

  async delete(id: string) {
    await this.db.schedule.delete({ where: { id } });
  }
}

export class PrismaScheduleLockRepository implements IScheduleLockRepository {
  constructor(private readonly db: Db) {}

  /** Row lock held until the surrounding transaction commits (spec B2 capacity rule). */
  async lockForBooking(scheduleId: string) {
    await this.db.$queryRaw`SELECT id FROM "Schedule" WHERE id = ${scheduleId} FOR UPDATE`;
  }
}

const bookingSelect = { id: true, userId: true, scheduleId: true, status: true, bookedAt: true, cancelledAt: true } satisfies Prisma.BookingSelect;
const userBrief = { select: { id: true, name: true, email: true } } as const;

export class PrismaBookingRepository implements IBookingRepository {
  constructor(private readonly db: Db) {}

  findById(id: string): Promise<Booking | null> {
    return this.db.booking.findUnique({ where: { id }, select: bookingSelect });
  }

  findByUserAndSchedule(userId: string, scheduleId: string) {
    return this.db.booking.findUnique({ where: { scheduleId_userId: { scheduleId, userId } }, select: bookingSelect });
  }

  countConfirmedForSchedule(scheduleId: string) {
    return this.db.booking.count({ where: { scheduleId, status: "CONFIRMED" } });
  }

  create(userId: string, scheduleId: string) {
    return uniqueOrConflict(() => this.db.booking.create({ data: { userId, scheduleId }, select: bookingSelect }), "You have already booked this class");
  }

  reactivate(bookingId: string, at: Date) {
    return this.db.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED", cancelledAt: null, bookedAt: at }, select: bookingSelect });
  }

  cancel(bookingId: string, at: Date) {
    return this.db.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED", cancelledAt: at }, select: bookingSelect });
  }

  setStatus(bookingId: string, status: BookingStatus) {
    return this.db.booking.update({ where: { id: bookingId }, data: { status }, select: bookingSelect });
  }

  async listForUser(userId: string, options: { from?: Date; includeCancelled?: boolean }): Promise<BookingWithSchedule[]> {
    const rows = await this.db.booking.findMany({
      where: {
        userId,
        status: options.includeCancelled ? undefined : { not: "CANCELLED" },
        schedule: options.from ? { startTime: { gte: options.from } } : undefined,
      },
      select: { ...bookingSelect, schedule: { include: detailInclude } },
      orderBy: { schedule: { startTime: options.from ? "asc" : "desc" } },
    });
    return rows.map(({ schedule, ...booking }) => ({ ...booking, schedule: toDetail(schedule) }));
  }

  listForSchedule(scheduleId: string) {
    return this.db.booking.findMany({ where: { scheduleId }, select: { ...bookingSelect, user: userBrief }, orderBy: { bookedAt: "asc" } });
  }

  async listAll(request: PageRequest & { status?: BookingStatus }) {
    const args = pageArgs(request);
    const where: Prisma.BookingWhereInput = {
      status: request.status,
      ...(request.search ? { user: { email: { contains: request.search, mode: "insensitive" } } } : {}),
    };
    const [rows, total] = await Promise.all([
      this.db.booking.findMany({
        where,
        select: { ...bookingSelect, user: userBrief, schedule: { include: detailInclude } },
        orderBy: { bookedAt: "desc" },
        skip: args.skip,
        take: args.take,
      }),
      this.db.booking.count({ where }),
    ]);
    return toPage(
      rows.map(({ schedule, ...booking }) => ({ ...booking, schedule: toDetail(schedule) })),
      total,
      args,
    );
  }
}

/** Interactive transaction handing the booking service lock-aware, transaction-scoped repositories. */
export function prismaBookingTransaction(client: PrismaClient): TransactionRunner<BookingTransactionScope> {
  return (work) =>
    client.$transaction((tx) => work({ bookings: new PrismaBookingRepository(tx), schedules: new PrismaScheduleLockRepository(tx) }), {
      isolationLevel: "ReadCommitted",
      timeout: 10_000,
    });
}
