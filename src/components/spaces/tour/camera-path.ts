/**
 * Scroll → camera mapping for the Spaces tour. Pure math, no three.js, so it
 * is unit-testable. The camera dwells at each space (eased segments) instead
 * of moving at constant speed, which is what makes scroll feel deliberate
 * rather than jerky.
 */

export type Vec3 = [number, number, number];

export interface Waypoint {
  position: Vec3;
  target: Vec3;
}

export const ZONE_SPACING = 18;

/** Zone i sits at x = i * ZONE_SPACING. The tour starts high and wide, then visits each zone. */
export function buildWaypoints(zoneCount: number): Waypoint[] {
  const intro: Waypoint = { position: [-16, 9, 20], target: [ZONE_SPACING * 1.5, 0.5, 0] };
  const zones = Array.from({ length: zoneCount }, (_, i): Waypoint => {
    const x = i * ZONE_SPACING;
    // Copy cards alternate left/right; aim past the card so the space sits in the open half of the frame.
    const cardSide = i % 2 === 0 ? -1 : 1;
    return { position: [x + cardSide * 2.2, 3.1, 7.6], target: [x + cardSide * 2.4, 0.9, 0] };
  });
  const last = (zoneCount - 1) * ZONE_SPACING;
  const outro: Waypoint = { position: [last + 12, 10, 22], target: [last / 2, 0.5, 0] };
  return [intro, ...zones, outro];
}

export function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

/**
 * Maps overall scroll progress (0..1) to a segment index and eased fraction.
 * With N waypoints there are N-1 segments of equal scroll length.
 */
export function segmentAt(progress: number, waypointCount: number) {
  const segments = waypointCount - 1;
  const u = clamp01(progress) * segments;
  const index = Math.min(segments - 1, Math.floor(u));
  const fraction = smoothstep(u - index);
  return { index, fraction };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function lerpVec(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** Camera position and look-target for a given scroll progress. */
export function cameraAt(progress: number, waypoints: Waypoint[]): Waypoint {
  const { index, fraction } = segmentAt(progress, waypoints.length);
  const a = waypoints[index];
  const b = waypoints[index + 1];
  // Lift the camera slightly mid-segment so travel reads as a glide, not a slide.
  const lift = Math.sin(fraction * Math.PI) * 1.2;
  const position = lerpVec(a.position, b.position, fraction);
  position[1] += lift;
  return { position, target: lerpVec(a.target, b.target, fraction) };
}

/** Which zone (0-based) the visitor is currently looking at, or -1 for intro/outro. */
export function activeZone(progress: number, zoneCount: number) {
  const { index, fraction } = segmentAt(progress, zoneCount + 2);
  const nearest = fraction < 0.5 ? index : index + 1;
  const zone = nearest - 1;
  return zone >= 0 && zone < zoneCount ? zone : -1;
}
