import { describe, expect, it } from "vitest";
import { rateLimit } from "./rate-limit";
import { RateLimitError } from "@/server/domain/errors";

describe("rateLimit", () => {
  it("allows up to the limit within a window, then rejects", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 1000, 0);
    expect(() => rateLimit(key, 3, 1000, 10)).toThrow(RateLimitError);
  });

  it("resets after the window", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 1000, 0);
    expect(() => rateLimit(key, 3, 1000, 1001)).not.toThrow();
  });
});
