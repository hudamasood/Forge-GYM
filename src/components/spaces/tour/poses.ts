/**
 * Procedural exercise animation for the tour's athletes. Pure functions of
 * time → joint angles (radians), so they are testable and cheap to run every
 * frame. Figures face +Z; rotating a hanging limb by a NEGATIVE angle about
 * X swings it forward.
 *
 * These stand in for the specialist-rigged character animation planned for
 * the 3D track (spec A10/D3); a GLB with baked clips can replace any exercise
 * without touching the scene.
 */

export const THIGH = 0.44;
export const SHIN = 0.44;
export const FOOT_HEIGHT = 0.06;
export const STANDING_HIP_HEIGHT = THIGH + SHIN + FOOT_HEIGHT;

export interface Pose {
  /** Pelvis height above the floor. */
  hipsY: number;
  /** Pelvis forward/back offset (e.g. rowing seat slide). */
  hipsZ: number;
  /** Whole-body yaw. */
  yaw: number;
  torsoX: number;
  torsoY: number;
  torsoZ: number;
  shoulderL: [number, number];
  shoulderR: [number, number];
  elbowL: number;
  elbowR: number;
  hipL: [number, number];
  hipR: [number, number];
  kneeL: number;
  kneeR: number;
}

export type Exercise = "squat" | "run" | "yoga" | "dance" | "cycle" | "punch" | "row" | "swing" | "idle";

const TAU = Math.PI * 2;

export function neutralPose(): Pose {
  return {
    hipsY: STANDING_HIP_HEIGHT,
    hipsZ: 0,
    yaw: 0,
    torsoX: 0,
    torsoY: 0,
    torsoZ: 0,
    shoulderL: [0, 0.08],
    shoulderR: [0, -0.08],
    elbowL: -0.15,
    elbowR: -0.15,
    hipL: [0, 0],
    hipR: [0, 0],
    kneeL: 0,
    kneeR: 0,
  };
}

/**
 * Planar two-bone IK in the Y/Z plane. Given the foot's position relative to
 * the hip, returns the hip flexion (forward = negative, matching the rig) and
 * knee flexion (positive).
 */
export function legIK(dy: number, dz: number, l1 = THIGH, l2 = SHIN): { hip: number; knee: number } {
  const reach = Math.min(Math.hypot(dy, dz), l1 + l2 - 1e-4);
  const line = Math.atan2(dz, -dy); // angle of hip→foot from straight down, forward positive
  const cosKnee = (l1 * l1 + l2 * l2 - reach * reach) / (2 * l1 * l2);
  const knee = Math.PI - Math.acos(Math.max(-1, Math.min(1, cosKnee)));
  const cosHip = (l1 * l1 + reach * reach - l2 * l2) / (2 * l1 * reach);
  const thighForward = line + Math.acos(Math.max(-1, Math.min(1, cosHip)));
  return { hip: -thighForward, knee };
}

/** Hip height that keeps the feet on the floor for a symmetric leg bend. */
export function groundedHipHeight(hipFlex: number, kneeFlex: number) {
  const thighAngle = Math.abs(hipFlex);
  const shinAngle = thighAngle - kneeFlex;
  return THIGH * Math.cos(thighAngle) + SHIN * Math.cos(shinAngle) + FOOT_HEIGHT;
}

function wave(t: number, speed: number, phase = 0) {
  return Math.sin(t * speed + phase);
}

function squat(t: number): Pose {
  const depth = (1 - Math.cos(t * 1.6)) / 2; // 0 standing → 1 bottom
  const hip = -1.35 * depth;
  const knee = 2.1 * depth;
  const p = neutralPose();
  p.hipsY = groundedHipHeight(hip, knee);
  p.hipsZ = -0.18 * depth;
  p.hipL = [hip, 0.18];
  p.hipR = [hip, -0.18];
  p.kneeL = knee;
  p.kneeR = knee;
  p.torsoX = 0.55 * depth;
  // Hands on a back-racked barbell.
  p.shoulderL = [-0.4, 1.35];
  p.shoulderR = [-0.4, -1.35];
  p.elbowL = -1.9;
  p.elbowR = -1.9;
  return p;
}

function run(t: number): Pose {
  const s = 7;
  const p = neutralPose();
  const l = wave(t, s);
  const r = wave(t, s, Math.PI);
  p.hipL = [-0.65 * l, 0];
  p.hipR = [-0.65 * r, 0];
  p.kneeL = 0.35 + 0.9 * Math.max(0, -l) + 0.25 * Math.max(0, l);
  p.kneeR = 0.35 + 0.9 * Math.max(0, -r) + 0.25 * Math.max(0, r);
  p.hipsY = STANDING_HIP_HEIGHT - 0.05 + 0.04 * Math.abs(wave(t, s * 2));
  p.torsoX = 0.18;
  p.shoulderL = [0.7 * l, 0.12];
  p.shoulderR = [0.7 * r, -0.12];
  p.elbowL = -1.5;
  p.elbowR = -1.5;
  return p;
}

function yoga(t: number): Pose {
  // Slow flow: mountain (arms overhead) ↔ warrior II (wide stance, arms out).
  const k = (1 - Math.cos(t * 0.45)) / 2;
  const p = neutralPose();
  const stance = 0.5 * k;
  p.hipL = [-0.35 * k, stance];
  p.hipR = [0, -stance];
  p.kneeL = 0.85 * k;
  p.hipsY = STANDING_HIP_HEIGHT - 0.2 * k;
  p.yaw = 0.9 * k;
  p.torsoY = -0.9 * k;
  p.shoulderL = [0, 3.0 - 1.45 * k];
  p.shoulderR = [0, -(3.0 - 1.45 * k)];
  p.elbowL = -0.05;
  p.elbowR = -0.05;
  return p;
}

function dance(t: number): Pose {
  const s = 5.2;
  const p = neutralPose();
  const step = wave(t, s / 2);
  const bounce = Math.abs(wave(t, s));
  p.hipsY = STANDING_HIP_HEIGHT - 0.08 - 0.07 * bounce;
  p.hipL = [-0.3 * Math.max(0, step), 0.22 + 0.1 * step];
  p.hipR = [-0.3 * Math.max(0, -step), -0.22 + 0.1 * step];
  p.kneeL = 0.3 + 0.4 * Math.max(0, step);
  p.kneeR = 0.3 + 0.4 * Math.max(0, -step);
  p.torsoZ = 0.18 * step;
  p.torsoY = 0.35 * wave(t, s / 4);
  p.yaw = 0.25 * wave(t, s / 8);
  p.shoulderL = [-0.4 + 0.5 * wave(t, s, 0.5), 1.1 + 0.9 * Math.max(0, step)];
  p.shoulderR = [-0.4 + 0.5 * wave(t, s, 2.1), -(1.1 + 0.9 * Math.max(0, -step))];
  p.elbowL = -0.9 - 0.5 * wave(t, s);
  p.elbowR = -0.9 + 0.5 * wave(t, s);
  return p;
}

/** Seated on a spin bike: pelvis fixed at the saddle, feet trace the crank circle. */
export const BIKE = { saddleHeight: 0.98, crankCenter: [0.36, 0.2] as const, crankRadius: 0.17 };

function cycle(t: number): Pose {
  const p = neutralPose();
  const crank = t * 5.5;
  const [cy, cz] = BIKE.crankCenter;
  const hipY = BIKE.saddleHeight;
  const footL = { y: cy + BIKE.crankRadius * Math.cos(crank), z: cz + BIKE.crankRadius * Math.sin(crank) };
  const footR = { y: cy + BIKE.crankRadius * Math.cos(crank + Math.PI), z: cz + BIKE.crankRadius * Math.sin(crank + Math.PI) };
  const l = legIK(footL.y - hipY + FOOT_HEIGHT, footL.z);
  const r = legIK(footR.y - hipY + FOOT_HEIGHT, footR.z);
  p.hipsY = hipY;
  p.hipL = [l.hip, 0.06];
  p.hipR = [r.hip, -0.06];
  p.kneeL = l.knee;
  p.kneeR = r.knee;
  p.torsoX = 0.75 + 0.04 * wave(t, 11);
  p.shoulderL = [-1.0, 0.18];
  p.shoulderR = [-1.0, -0.18];
  p.elbowL = -0.55;
  p.elbowR = -0.55;
  return p;
}

function punch(t: number): Pose {
  const p = neutralPose();
  const cycleT = (t * 2.6) % 2; // jab (L) then cross (R)
  const jab = cycleT < 1 ? Math.sin(Math.min(cycleT, 1) * Math.PI) : 0;
  const cross = cycleT >= 1 ? Math.sin((cycleT - 1) * Math.PI) : 0;
  p.hipsY = STANDING_HIP_HEIGHT - 0.1 + 0.03 * wave(t, 6);
  p.hipL = [-0.3, 0.12];
  p.hipR = [0.25, -0.12];
  p.kneeL = 0.35;
  p.kneeR = 0.3;
  p.yaw = -0.35;
  p.torsoY = 0.3 * jab - 0.55 * cross;
  p.torsoX = 0.12;
  // Guard: fists by the chin; punches extend forward.
  p.shoulderL = [-0.9 - 0.6 * jab, 0.35 - 0.2 * jab];
  p.shoulderR = [-0.9 - 0.6 * cross, -0.35 + 0.2 * cross];
  p.elbowL = -2.2 + 2.1 * jab;
  p.elbowR = -2.2 + 2.1 * cross;
  return p;
}

/** Rowing: seat slides along Z, feet fixed on the footplate. */
export const ROWER = { seatHeight: 0.42, footZ: 0.72, footY: 0.2 };

function row(t: number): Pose {
  const p = neutralPose();
  const phase = (1 - Math.cos(t * 1.9)) / 2; // 0 catch (compressed) → 1 finish (legs straight)
  const hipZ = -0.1 - 0.5 * phase;
  const leg = legIK(ROWER.footY - ROWER.seatHeight + FOOT_HEIGHT, ROWER.footZ - hipZ);
  p.hipsY = ROWER.seatHeight;
  p.hipsZ = hipZ;
  p.hipL = [leg.hip, 0.1];
  p.hipR = [leg.hip, -0.1];
  p.kneeL = leg.knee;
  p.kneeR = leg.knee;
  p.torsoX = 0.45 - 0.75 * phase;
  const pull = Math.max(0, (phase - 0.55) / 0.45);
  p.shoulderL = [-1.45 + 0.9 * pull, 0.12];
  p.shoulderR = [-1.45 + 0.9 * pull, -0.12];
  p.elbowL = -0.1 - 1.9 * pull;
  p.elbowR = -0.1 - 1.9 * pull;
  return p;
}

function swing(t: number): Pose {
  const p = neutralPose();
  const s = (1 - Math.cos(t * 2.4)) / 2; // 0 hinge → 1 bell at chest height
  const hinge = 1 - s;
  const hip = -0.35 * hinge;
  const knee = 0.45 * hinge;
  p.hipsY = groundedHipHeight(hip, knee);
  p.hipsZ = -0.2 * hinge;
  p.hipL = [hip, 0.2];
  p.hipR = [hip, -0.2];
  p.kneeL = knee;
  p.kneeR = knee;
  p.torsoX = 1.0 * hinge;
  const arm = -0.2 - 1.3 * s + 0.6 * hinge;
  p.shoulderL = [arm, 0.05];
  p.shoulderR = [arm, -0.05];
  p.elbowL = -0.05;
  p.elbowR = -0.05;
  return p;
}

function idle(t: number): Pose {
  const p = neutralPose();
  p.torsoX = 0.02 * wave(t, 1.3);
  p.shoulderL = [0.05 * wave(t, 1.3), 0.1];
  p.shoulderR = [0.05 * wave(t, 1.3, 1), -0.1];
  return p;
}

const EXERCISES: Record<Exercise, (t: number) => Pose> = { squat, run, yoga, dance, cycle, punch, row, swing, idle };

export function poseAt(exercise: Exercise, t: number): Pose {
  return EXERCISES[exercise](((t % 1000) + 1000) % 1000);
}

export { TAU };
