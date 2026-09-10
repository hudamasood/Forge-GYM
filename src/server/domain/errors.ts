/**
 * Domain errors. Services throw these; the application layer (Route Handlers
 * and Server Actions) maps them to HTTP status codes in one place.
 */
export abstract class DomainError extends Error {
  abstract readonly status: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
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
