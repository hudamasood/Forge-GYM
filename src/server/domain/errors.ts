/**
 * Domain errors. Services throw these; the application layer (Route Handlers
 * and Server Actions) maps them to HTTP status codes in one place.
 */
const DOMAIN_ERROR = Symbol.for("forge.domain-error");

export abstract class DomainError extends Error {
  abstract readonly status: number;
  abstract readonly code: string;
  /** Cross-bundle brand: the bundler may load this module more than once, which breaks `instanceof`. */
  readonly [DOMAIN_ERROR] = true;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export type DomainErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "CAPACITY_REACHED"
  | "PAYMENT_ERROR"
  | "RATE_LIMITED";

/** Use instead of `instanceof` anywhere outside the domain layer. */
export function isDomainError(error: unknown, code?: DomainErrorCode): error is DomainError & { fieldErrors?: Record<string, string[]> } {
  const branded = typeof error === "object" && error !== null && (error as Record<symbol, unknown>)[DOMAIN_ERROR] === true;
  return branded && (!code || (error as DomainError).code === code);
}

export class ValidationError extends DomainError {
  readonly status = 400;
  readonly code = "VALIDATION_ERROR";

  constructor(
    message: string,
    readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

export class UnauthorizedError extends DomainError {
  readonly status = 401;
  readonly code = "UNAUTHORIZED";
}

export class ForbiddenError extends DomainError {
  readonly status = 403;
  readonly code = "FORBIDDEN";
}

export class NotFoundError extends DomainError {
  readonly status = 404;
  readonly code = "NOT_FOUND";
}

export class ConflictError extends DomainError {
  readonly status = 409;
  readonly code = "CONFLICT";
}

export class CapacityError extends DomainError {
  readonly status = 409;
  readonly code = "CAPACITY_REACHED";
}

export class PaymentError extends DomainError {
  readonly status = 502;
  readonly code = "PAYMENT_ERROR";
}

export class RateLimitError extends DomainError {
  readonly status = 429;
  readonly code = "RATE_LIMITED";
}
