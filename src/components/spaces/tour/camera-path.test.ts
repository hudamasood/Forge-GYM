import { describe, expect, it } from "vitest";
import { ZONE_SPACING, activeZone, buildWaypoints, cameraAt, segmentAt } from "./camera-path";

describe("camera path", () => {
  const waypoints = buildWaypoints(6);

  it("has an intro, one waypoint per zone and an outro", () => {
    expect(waypoints).toHaveLength(8);
    // Targets sit near each zone's center, offset toward the side opposite the copy card.
    expect(Math.abs(waypoints[1].target[0] - 0)).toBeLessThan(3);
    expect(Math.abs(waypoints[6].target[0] - 5 * ZONE_SPACING)).toBeLessThan(3);
  });

  it("starts at the intro and ends at the outro", () => {
    expect(cameraAt(0, waypoints).position).toEqual(waypoints[0].position);
    expect(cameraAt(1, waypoints).position).toEqual(waypoints[7].position);
  });

  it("lands exactly on each zone's waypoint at segment boundaries", () => {
    const at = cameraAt(2 / 7, waypoints);
    expect(at.target).toEqual(waypoints[2].target);
  });

  it("eases within segments (slow near waypoints)", () => {
    const early = segmentAt(0.01 / 7, 8).fraction;
    const middle = segmentAt(0.5 / 7, 8).fraction;
    expect(early).toBeLessThan(0.01);
    expect(middle).toBeCloseTo(0.5, 5);
  });

  it("clamps out-of-range progress", () => {
    expect(cameraAt(-1, waypoints).position).toEqual(cameraAt(0, waypoints).position);
    expect(cameraAt(2, waypoints).position).toEqual(cameraAt(1, waypoints).position);
  });

  it("reports the active zone", () => {
    expect(activeZone(0, 6)).toBe(-1);
    expect(activeZone(1 / 7, 6)).toBe(0);
    expect(activeZone(3 / 7, 6)).toBe(2);
    expect(activeZone(1, 6)).toBe(-1);
  });
});
