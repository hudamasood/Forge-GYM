"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { poseAt, SHIN, THIGH, type Exercise } from "./poses";
import { MATERIALS } from "./materials";
import { Barbell, Kettlebell } from "./equipment";

const UPPER_ARM = 0.28;
const FOREARM = 0.26;

/** Capsule that hangs down from its parent joint along -Y. */
function Limb({ length, radius, material }: { length: number; radius: number; material: keyof typeof MATERIALS }) {
  return (
    <mesh position={[0, -length / 2, 0]} castShadow material={MATERIALS[material]}>
      <capsuleGeometry args={[radius, Math.max(0.01, length - radius * 2), 4, 10]} />
    </mesh>
  );
}

/**
 * A jointed, stylized athlete driven by procedural exercise poses. The
 * hierarchy (hips → torso → shoulders → elbows; hips → knees) mirrors a
 * standard humanoid rig, so a skinned GLB can later replace it one-for-one.
 */
export function Athlete({
  exercise,
  position = [0, 0, 0],
  rotation = 0,
  offset = 0,
  speed = 1,
  accent = "ember",
  prop,
}: {
  exercise: Exercise;
  position?: [number, number, number];
  rotation?: number;
  offset?: number;
  speed?: number;
  accent?: "ember" | "steel";
  /** Equipment carried by the rig: a back-racked barbell or a kettlebell in the left hand. */
  prop?: "barbell" | "kettlebell";
}) {
  const root = useRef<Group>(null);
  const hips = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const shL = useRef<Group>(null);
  const shR = useRef<Group>(null);
  const elL = useRef<Group>(null);
  const elR = useRef<Group>(null);
  const hipL = useRef<Group>(null);
  const hipR = useRef<Group>(null);
  const kneeL = useRef<Group>(null);
  const kneeR = useRef<Group>(null);
  const shirt = accent === "ember" ? "ember" : "steelKit";

  // Deterministic per-figure variation so a row of athletes doesn't move in lockstep.
  const jitter = useMemo(() => 0.9 + ((offset * 9301 + 49297) % 233280) / 233280 / 5, [offset]);

  useFrame(({ clock }) => {
    const p = poseAt(exercise, clock.elapsedTime * speed * jitter + offset);
    if (!root.current) return;
    root.current.rotation.y = rotation + p.yaw;
    hips.current!.position.set(0, p.hipsY, p.hipsZ);
    torso.current!.rotation.set(p.torsoX, p.torsoY, p.torsoZ);
    shL.current!.rotation.set(p.shoulderL[0], 0, p.shoulderL[1]);
    shR.current!.rotation.set(p.shoulderR[0], 0, p.shoulderR[1]);
    elL.current!.rotation.x = p.elbowL;
    elR.current!.rotation.x = p.elbowR;
    hipL.current!.rotation.set(p.hipL[0], 0, p.hipL[1]);
    hipR.current!.rotation.set(p.hipR[0], 0, p.hipR[1]);
    kneeL.current!.rotation.x = p.kneeL;
    kneeR.current!.rotation.x = p.kneeR;
  });

  return (
    <group ref={root} position={position} rotation={[0, rotation, 0]}>
      <group ref={hips}>
        {/* Pelvis */}
        <mesh castShadow material={MATERIALS.shorts}>
          <boxGeometry args={[0.3, 0.16, 0.18]} />
        </mesh>

        <group ref={torso} position={[0, 0.06, 0]}>
          <mesh position={[0, 0.3, 0]} castShadow material={MATERIALS[shirt]}>
            <capsuleGeometry args={[0.16, 0.3, 4, 12]} />
          </mesh>
          <mesh position={[0, 0.58, 0]} material={MATERIALS.skin}>
            <cylinderGeometry args={[0.05, 0.06, 0.08, 10]} />
          </mesh>
          <mesh position={[0, 0.72, 0.01]} castShadow material={MATERIALS.skin}>
            <sphereGeometry args={[0.115, 20, 16]} />
          </mesh>

          {prop === "barbell" && <Barbell position={[0, 0.5, -0.14]} />}
          <group ref={shL} position={[0.22, 0.5, 0]}>
            <Limb length={UPPER_ARM} radius={0.05} material="skin" />
            <group ref={elL} position={[0, -UPPER_ARM, 0]}>
              <Limb length={FOREARM} radius={0.043} material="skin" />
              <mesh position={[0, -FOREARM - 0.03, 0]} material={MATERIALS.skin}>
                <sphereGeometry args={[0.048, 10, 8]} />
              </mesh>
              {prop === "kettlebell" && (
                <group position={[-0.1, -FOREARM - 0.33, 0]}>
                  <Kettlebell material="ember" />
                </group>
              )}
            </group>
          </group>
          <group ref={shR} position={[-0.22, 0.5, 0]}>
            <Limb length={UPPER_ARM} radius={0.05} material="skin" />
            <group ref={elR} position={[0, -UPPER_ARM, 0]}>
              <Limb length={FOREARM} radius={0.043} material="skin" />
              <mesh position={[0, -FOREARM - 0.03, 0]} material={MATERIALS.skin}>
                <sphereGeometry args={[0.048, 10, 8]} />
              </mesh>
            </group>
          </group>
        </group>

        {([
          [hipL, kneeL, 0.1],
          [hipR, kneeR, -0.1],
        ] as const).map(([hipRef, kneeRef, x]) => (
          <group key={x} ref={hipRef} position={[x, -0.04, 0]}>
            <Limb length={THIGH} radius={0.075} material="shorts" />
            <group ref={kneeRef} position={[0, -THIGH, 0]}>
              <Limb length={SHIN} radius={0.058} material="skin" />
              <mesh position={[0, -SHIN - 0.02, 0.05]} castShadow material={MATERIALS.shoe}>
                <boxGeometry args={[0.1, 0.07, 0.24]} />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}
