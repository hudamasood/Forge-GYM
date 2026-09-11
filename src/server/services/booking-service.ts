import { CapacityError, ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/server/domain/errors";
import type { Booking, BookingStatus, BookingWithSchedule, Role } from "@/server/domain/types";
import type {
  BookingTransactionScope,
  IBookingRepository,
  IMembershipRepository,
  IScheduleRepository,
  TransactionRunner,
} from "@/server/repositories/interfaces";
import type { Clock } from "@/server/ports/security";

export interface Actor {
  id: string;
  role: Role;
}

/**
 * Class booking rules (spec A5/B1). Entitlement is checked on every request —
 * never assumed from the UI — and the capacity check runs inside a
 * transaction holding a row lock on the schedule.
 */
export class BookingService {
  constructor(
    private readonly bookings: IBookingRepository,
    private readonly schedules: IScheduleRepository,
    private readonly memberships: IMembershipRepository,
    private readonly transaction: TransactionRunner<BookingTransactionScope>,
    private readonly now: Clock,
  ) {}

  async bookClass(userId: string, scheduleId: string): Promise<Booking> {
    const schedule = await this.schedules.findForBooking(scheduleId);
    if (!schedule) throw new NotFoundError("Schedule not found");

    const now = this.now();
    if (schedule.startTime <= now) throw new ValidationError("This class has already started");

    const hasAccess = await this.memberships.userCanAccessObject(userId, schedule.accessObjectId, now);
    if (!hasAccess) throw new ForbiddenError("Your membership does not cover this space");

    return this.transaction(async ({ bookings, schedules }) => {
      await schedules.lockForBooking(scheduleId);

      const existing = await bookings.findByUserAndSchedule(userId, scheduleId);
      if (existing && existing.status !== "CANCELLED") throw new ConflictError("You have already booked this class");

      const confirmed = await bookings.countConfirmedForSchedule(scheduleId);
      if (confirmed >= schedule.capacity) throw new CapacityError("This class is full");

      return existing ? bookings.reactivate(existing.id, now) : bookings.create(userId, scheduleId);
    });
  }

  /** Cancels a booking. Seats are released immediately; no refund is modeled (A7 default). */
  async cancelBooking(actor: Actor, bookingId: string): Promise<Booking> {
    const booking = await this.bookings.findById(bookingId);
    if (!booking) throw new NotFoundError("Booking not found");
    if (booking.userId !== actor.id && actor.role !== "ADMIN") throw new ForbiddenError("You can only cancel your own bookings");
    if (booking.status !== "CONFIRMED") throw new ConflictError("Only confirmed bookings can be cancelled");

    const schedule = await this.schedules.findForBooking(booking.scheduleId);
    if (schedule && schedule.startTime <= this.now() && actor.role !== "ADMIN") {
      throw new ValidationError("Classes that have already started cannot be cancelled");
    }

    return this.bookings.cancel(bookingId, this.now());
  }

  async listUpcomingForUser(userId: string): Promise<BookingWithSchedule[]> {
    return this.bookings.listForUser(userId, { from: this.now() });
  }

  /** Admin listing of every booking. */
  listAll(request: Parameters<IBookingRepository["listAll"]>[0]) {
    return this.bookings.listAll(request);
  }

  async listHistoryForUser(userId: string): Promise<BookingWithSchedule[]> {
    return this.bookings.listForUser(userId, { includeCancelled: true });
  }

  /** Trainers mark attendance for sessions they teach; admins for any session. */
  async markAttendance(actor: Actor & { trainerId: string | null }, bookingId: string, status: Extract<BookingStatus, "ATTENDED" | "NO_SHOW">) {
    const booking = await this.bookings.findById(bookingId);
    if (!booking) throw new NotFoundError("Booking not found");

    const schedule = await this.schedules.findDetail(booking.scheduleId);
    if (!schedule) throw new NotFoundError("Schedule not found");

    const teaches = actor.role === "TRAINER" && actor.trainerId === schedule.trainerId;
    if (!teaches && actor.role !== "ADMIN") throw new ForbiddenError("You can only mark attendance for your own sessions");
    if (booking.status === "CANCELLED") throw new ConflictError("Cancelled bookings cannot be marked");

    return this.bookings.setStatus(bookingId, status);
  }
}
