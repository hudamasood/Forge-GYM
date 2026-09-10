import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/format";
import type { BookingStatus, Difficulty, MembershipStatus, OrderStatus } from "@/server/domain/types";

const DIFFICULTY_TONE = { BEGINNER: "success", INTERMEDIATE: "warning", ADVANCED: "error", ALL_LEVELS: "neutral" } as const;

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <Badge tone={DIFFICULTY_TONE[difficulty]}>{titleCase(difficulty)}</Badge>;
}

const ORDER_TONE = { PENDING: "warning", PAID: "success", FULFILLED: "steel", CANCELLED: "neutral", REFUNDED: "error" } as const;

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_TONE[status]}>{titleCase(status)}</Badge>;
}

const MEMBERSHIP_TONE = { INCOMPLETE: "neutral", ACTIVE: "success", PAST_DUE: "warning", CANCELED: "neutral", EXPIRED: "error" } as const;

export function MembershipStatusBadge({ status }: { status: MembershipStatus }) {
  return <Badge tone={MEMBERSHIP_TONE[status]}>{status === "PAST_DUE" ? "Payment due" : titleCase(status)}</Badge>;
}

const BOOKING_TONE = { CONFIRMED: "success", CANCELLED: "neutral", ATTENDED: "steel", NO_SHOW: "error" } as const;

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={BOOKING_TONE[status]}>{status === "NO_SHOW" ? "No-show" : titleCase(status)}</Badge>;
}
