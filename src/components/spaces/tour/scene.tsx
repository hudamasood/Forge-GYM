"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { Vector3 } from "three";
import { Zone } from "./zones";
import { MATERIALS } from "./materials";
import { ZONE_SPACING, buildWaypoints, cameraAt } from "./camera-path";

export type TourQuality = "high" | "low";

function CameraRig({ progress, zoneCount }: { progress: React.RefObject<number>; zoneCount: number }) {
  const { camera } = useThree();
  const waypoints = useMemo(() => buildWaypoints(zoneCount), [zoneCount]);
  const smoothed = useRef(progress.current ?? 0);
  const target = useMemo(() => new Vector3(), []);
  const pointer = useRef({ x: 0, y: 0 });

  useFrame((state, dt) => {
    // Critically damped follow: scroll is the input, the camera eases after it.
    const goal = progress.current ?? 0;
    smoothed.current += (goal - smoothed.current) * (1 - Math.exp(-dt * 4));
    pointer.current.x += (state.pointer.x - pointer.current.x) * 0.05;
    pointer.current.y += (state.pointer.y - pointer.current.y) * 0.05;

    const at = cameraAt(smoothed.current, waypoints);
    camera.position.set(at.position[0] + pointer.current.x * 0.6, at.position[1] + pointer.current.y * 0.3, at.position[2]);
    target.set(at.target[0], at.target[1], at.target[2]);
    camera.lookAt(target);
  });
  return null;
}

function Environment({ length }: { length: number }) {
  return (
    <>
      <color attach="background" args={["#121110"]} />
      <fog attach="fog" args={["#121110", 16, 52]} />
      <hemisphereLight args={["#f2eee6", "#3d3a35", 1.35]} />
      <ambientLight intensity={0.35} color="#f6dcc9" />
      <directionalLight position={[length / 2, 14, 10]} intensity={2.2} color="#faf8f4" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-length / 2 - 12} shadow-camera-right={length / 2 + 12} shadow-camera-top={12} shadow-camera-bottom={-12} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[length / 2 - ZONE_SPACING / 2, 0, 0]} receiveShadow material={MATERIALS.floor}>
        <planeGeometry args={[length + 60, 60]} />
      </mesh>
      {/* Ember guide line running the length of the building */}
      <mesh position={[length / 2 - ZONE_SPACING / 2, 0.012, 5.6]} rotation={[-Math.PI / 2, 0, 0]} material={MATERIALS.emberGlow}>
        <planeGeometry args={[length + 20, 0.06]} />
      </mesh>
    </>
  );
}

/**
 * The Spaces tour scene: six zones along one corridor, a scroll-driven
 * camera, and quality tiers for weaker devices (spec A10, C1).
 */
export default function TourScene({ zones, progress, quality }: { zones: { slug: string; name: string }[]; progress: React.RefObject<number>; quality: TourQuality }) {
  const length = zones.length * ZONE_SPACING;
  return (
    <Canvas
      shadows={quality === "high"}
      dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
      camera={{ fov: 42, near: 0.1, far: 120, position: [-16, 9, 20] }}
      gl={{ antialias: quality === "high", powerPreference: "high-performance" }}
      aria-hidden
    >
      <PerformanceMonitor>
        <AdaptiveDpr pixelated={false} />
      </PerformanceMonitor>
      <Environment length={length} />
      {zones.map((z, i) => (
        <Zone key={z.slug} slug={z.slug} index={i} x={i * ZONE_SPACING} />
      ))}
      <CameraRig progress={progress} zoneCount={zones.length} />
    </Canvas>
  );
}
