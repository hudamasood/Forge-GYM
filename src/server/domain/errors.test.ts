import { describe, expect, it } from "vitest";
import { CapacityError, ForbiddenError, ValidationError, isDomainError } from "./errors";

describe("isDomainError", () => {
  it("recognizes domain errors by brand and code", () => {
    expect(isDomainError(new ForbiddenError("x"))).toBe(true);
    expect(isDomainError(new CapacityError("x"), "CAPACITY_REACHED")).toBe(true);
    expect(isDomainError(new CapacityError("x"), "NOT_FOUND")).toBe(false);
  });

  it("works for errors from another copy of the module (no instanceof)", () => {
    const foreign = Object.assign(new Error("x"), { status: 400, code: "VALIDATION_ERROR", [Symbol.for("forge.domain-error")]: true });
    expect(isDomainError(foreign, "VALIDATION_ERROR")).toBe(true);
  });

  it("rejects plain errors and non-errors", () => {
    expect(isDomainError(new Error("x"))).toBe(false);
    expect(isDomainError(null)).toBe(false);
    expect(isDomainError({ code: "NOT_FOUND" })).toBe(false);
  });

  it("keeps field errors on validation errors", () => {
    const e = new ValidationError("bad", { email: ["Required"] });
    expect(isDomainError(e) && e.fieldErrors).toEqual({ email: ["Required"] });
  });
});
