import { describe, expect, it } from "vitest";
import { BIKE, FOOT_HEIGHT, SHIN, STANDING_HIP_HEIGHT, THIGH, groundedHipHeight, legIK, poseAt, type Exercise } from "./poses";

/** Forward kinematics for one leg in the Y/Z plane, matching the rig's sign convention. */
function footFromHip(hip: number, knee: number) {
  const thigh = -hip; // forward positive
  const shin = thigh - knee;
  return { dy: -(THIGH * Math.cos(thigh) + SHIN * Math.cos(shin)), dz: THIGH * Math.sin(thigh) + SHIN * Math.sin(shin) };
}

describe("legIK", () => {
  it.each([
    [-0.7, 0.3],
    [-0.5, 0.5],
    [-0.8, 0.1],
    [-0.6, -0.2],
  ])("reaches the target (dy=%s, dz=%s)", (dy, dz) => {
    const { hip, knee } = legIK(dy, dz);
    const foot = footFromHip(hip, knee);
    expect(foot.dy).toBeCloseTo(dy, 4);
    expect(foot.dz).toBeCloseTo(dz, 4);
    expect(knee).toBeGreaterThanOrEqual(0);
  });

  it("straightens the leg for unreachable targets instead of producing NaN", () => {
    const { hip, knee } = legIK(-5, 0);
    expect(Number.isFinite(hip)).toBe(true);
    expect(knee).toBeCloseTo(0, 1);
  });
});

describe("poses", () => {
  const exercises: Exercise[] = ["squat", "run", "yoga", "dance", "cycle", "punch", "row", "swing", "idle"];

  it.each(exercises)("%s produces finite joint angles over time", (exercise) => {
    for (let t = 0; t < 10; t += 0.37) {
      const pose = poseAt(exercise, t);
      for (const value of Object.values(pose).flat()) expect(Number.isFinite(value)).toBe(true);
    }
  });

  it("keeps the feet on the floor through a squat", () => {
    for (let t = 0; t < 4; t += 0.25) {
      const p = poseAt("squat", t);
      const foot = footFromHip(p.hipL[0], p.kneeL);
      expect(p.hipsY + foot.dy).toBeCloseTo(FOOT_HEIGHT, 3);
    }
  });

  it("stands at full height when not bending", () => {
    expect(groundedHipHeight(0, 0)).toBeCloseTo(STANDING_HIP_HEIGHT, 6);
  });

  it("keeps the cyclist's feet on the pedal circle", () => {
    for (let t = 0; t < 3; t += 0.2) {
      const p = poseAt("cycle", t);
      const foot = footFromHip(p.hipL[0], p.kneeL);
      const y = p.hipsY + foot.dy - FOOT_HEIGHT;
      const r = Math.hypot(y - BIKE.crankCenter[0], foot.dz - BIKE.crankCenter[1]);
      expect(r).toBeCloseTo(BIKE.crankRadius, 3);
    }
  });
});
