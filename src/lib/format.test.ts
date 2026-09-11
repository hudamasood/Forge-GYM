import { describe, expect, it } from "vitest";
import { formatUsd, gymLocalToUtc, titleCase, utcToGymLocal } from "./format";

describe("formatUsd", () => {
  it("formats cents as USD", () => {
    expect(formatUsd(5499)).toBe("$54.99");
    expect(formatUsd(9900, { whole: true })).toBe("$99");
    expect(formatUsd(9950, { whole: true })).toBe("$99.50");
  });
});

describe("gym timezone conversion", () => {
  it("is identity for UTC", () => {
    expect(gymLocalToUtc("2026-09-12T10:00", "UTC").toISOString()).toBe("2026-09-12T10:00:00.000Z");
  });

  it("applies the zone offset, including DST", () => {
    expect(gymLocalToUtc("2026-07-01T09:00", "America/New_York").toISOString()).toBe("2026-07-01T13:00:00.000Z");
    expect(gymLocalToUtc("2026-01-15T09:00", "America/New_York").toISOString()).toBe("2026-01-15T14:00:00.000Z");
    expect(gymLocalToUtc("2026-03-01T09:00", "Asia/Karachi").toISOString()).toBe("2026-03-01T04:00:00.000Z");
  });

  it("round-trips for datetime-local inputs", () => {
    const utc = new Date("2026-07-01T13:00:00.000Z");
    expect(utcToGymLocal(utc, "America/New_York")).toBe("2026-07-01T09:00");
    expect(gymLocalToUtc(utcToGymLocal(utc, "Europe/London"), "Europe/London").toISOString()).toBe(utc.toISOString());
  });
});

describe("titleCase", () => {
  it("humanizes enum values", () => {
    expect(titleCase("ALL_LEVELS")).toBe("All Levels");
  });
});
