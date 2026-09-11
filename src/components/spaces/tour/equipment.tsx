"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { MATERIALS } from "./materials";
import { BIKE, ROWER } from "./poses";

type V3 = [number, number, number];

function Box({ size, position, material = "steel", rotation }: { size: V3; position: V3; material?: keyof typeof MATERIALS; rotation?: V3 }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow material={MATERIALS[material]}>
      <boxGeometry args={size} />
    </mesh>
  );
}

function Cyl({ r, h, position, rotation, material = "steel", segments = 20 }: { r: number; h: number; position: V3; rotation?: V3; material?: keyof typeof MATERIALS; segments?: number }) {
  return (
    <mesh position={position} rotation={rotation} castShadow material={MATERIALS[material]}>
      <cylinderGeometry args={[r, r, h, segments]} />
    </mesh>
  );
}

/** Olympic barbell along X with bumper plates. */
export function Barbell({ position = [0, 0, 0] as V3, plates = 2 }) {
  return (
    <group position={position}>
      <Cyl r={0.016} h={2.1} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material="chrome" />
      {Array.from({ length: plates }, (_, i) =>
        [-1, 1].map((side) => <Cyl key={`${i}${side}`} r={0.225} h={0.05} position={[side * (0.72 + i * 0.055), 0, 0]} rotation={[0, 0, Math.PI / 2]} material={i === 0 ? "ember" : "rubber"} segments={28} />),
      )}
    </group>
  );
}

export function SquatRack({ position = [0, 0, 0] as V3 }) {
  const upright = (x: number, z: number) => <Box key={`${x}${z}`} size={[0.08, 2.3, 0.08]} position={[x, 1.15, z]} material="iron" />;
  return (
    <group position={position}>
      {upright(-0.62, -0.45)}
      {upright(0.62, -0.45)}
      {upright(-0.62, 0.45)}
      {upright(0.62, 0.45)}
      <Box size={[1.32, 0.08, 0.08]} position={[0, 2.3, -0.45]} material="iron" />
      <Box size={[1.32, 0.08, 0.08]} position={[0, 2.3, 0.45]} material="iron" />
      <Box size={[0.08, 0.06, 0.98]} position={[-0.62, 2.3, 0]} material="iron" />
      <Box size={[0.08, 0.06, 0.98]} position={[0.62, 2.3, 0]} material="iron" />
      <Box size={[0.12, 0.05, 0.14]} position={[-0.62, 1.42, 0.52]} material="ember" />
      <Box size={[0.12, 0.05, 0.14]} position={[0.62, 1.42, 0.52]} material="ember" />
      <Box size={[1.7, 0.04, 1.4]} position={[0, 0.02, 0]} material="wood" />
    </group>
  );
}

export function Treadmill({ position = [0, 0, 0] as V3, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box size={[0.8, 0.18, 2.0]} position={[0, 0.09, 0]} material="iron" />
      <mesh position={[0, 0.185, 0]} receiveShadow material={MATERIALS.rubber}>
        <boxGeometry args={[0.6, 0.01, 1.8]} />
      </mesh>
      <Box size={[0.05, 1.2, 0.05]} position={[-0.36, 0.7, 0.9]} rotation={[-0.15, 0, 0]} material="steel" />
      <Box size={[0.05, 1.2, 0.05]} position={[0.36, 0.7, 0.9]} rotation={[-0.15, 0, 0]} material="steel" />
      <Box size={[0.8, 0.3, 0.12]} position={[0, 1.3, 0.98]} rotation={[-0.5, 0, 0]} material="iron" />
      <Box size={[0.5, 0.18, 0.02]} position={[0, 1.32, 0.92]} rotation={[-0.5, 0, 0]} material="steelGlow" />
    </group>
  );
}

export function DumbbellRack({ position = [0, 0, 0] as V3 }) {
  return (
    <group position={position}>
      <Box size={[2.4, 0.06, 0.5]} position={[0, 0.7, 0]} material="iron" />
      <Box size={[2.4, 0.06, 0.5]} position={[0, 0.35, 0.05]} material="iron" />
      {[-1.1, 1.1].map((x) => (
        <Box key={x} size={[0.06, 0.75, 0.5]} position={[x, 0.37, 0]} material="iron" />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i} position={[-0.95 + i * 0.27, 0.78, 0]}>
          <Cyl r={0.018} h={0.3} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material="chrome" />
          <Cyl r={0.055 + i * 0.004} h={0.07} position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} material="rubber" />
          <Cyl r={0.055 + i * 0.004} h={0.07} position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]} material="rubber" />
        </group>
      ))}
    </group>
  );
}

export function YogaMat({ position = [0, 0, 0] as V3, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box size={[0.66, 0.012, 1.85]} position={[0, 0.006, 0]} material="cork" />
      <Box size={[0.16, 0.1, 0.24]} position={[0.45, 0.05, -0.8]} material="mat" />
    </group>
  );
}

export function SpinBike({ position = [0, 0, 0] as V3, rotation = 0 }) {
  const wheel = useRef<Group>(null);
  useFrame((_, dt) => {
    if (wheel.current) wheel.current.rotation.x -= dt * 9;
  });
  const [cy, cz] = BIKE.crankCenter;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box size={[0.08, 0.05, 1.1]} position={[0, 0.04, 0.2]} material="iron" />
      <Box size={[0.6, 0.05, 0.08]} position={[0, 0.03, -0.32]} material="iron" />
      <Box size={[0.6, 0.05, 0.08]} position={[0, 0.03, 0.72]} material="iron" />
      {/* seat post and saddle */}
      <Box size={[0.05, BIKE.saddleHeight - 0.05, 0.05]} position={[0, (BIKE.saddleHeight - 0.05) / 2, -0.06]} rotation={[-0.2, 0, 0]} material="steel" />
      <Box size={[0.2, 0.05, 0.28]} position={[0, BIKE.saddleHeight - 0.07, -0.12]} material="rubber" />
      {/* handlebar stem */}
      <Box size={[0.05, 1.05, 0.05]} position={[0, 0.55, 0.62]} rotation={[0.25, 0, 0]} material="steel" />
      <Box size={[0.5, 0.04, 0.06]} position={[0, 1.08, 0.76]} material="chrome" />
      {/* flywheel */}
      <group ref={wheel} position={[0, cy + 0.12, cz + 0.4]}>
        <Cyl r={0.26} h={0.05} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material="ember" segments={32} />
        <Box size={[0.06, 0.04, 0.5]} position={[0, 0, 0]} material="iron" />
      </group>
      <Cyl r={BIKE.crankRadius} h={0.02} position={[0.12, cy, cz]} rotation={[0, 0, Math.PI / 2]} material="iron" segments={24} />
    </group>
  );
}

export function HeavyBag({ position = [0, 0, 0] as V3, phase = 0 }) {
  const bag = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (bag.current) {
      const t = clock.elapsedTime * 2.6 + phase;
      bag.current.rotation.x = 0.06 * Math.sin(t * Math.PI);
      bag.current.rotation.z = 0.03 * Math.sin(t * 1.7);
    }
  });
  return (
    <group position={position}>
      <Box size={[0.08, 0.08, 1.2]} position={[0, 3.2, -0.5]} material="iron" />
      <group ref={bag} position={[0, 3.2, 0]}>
        <Cyl r={0.008} h={0.7} position={[0, -0.35, 0]} material="chrome" />
        <Cyl r={0.19} h={1.15} position={[0, -1.3, 0]} material="leather" segments={24} />
        <Cyl r={0.195} h={0.06} position={[0, -0.78, 0]} material="rubber" />
      </group>
    </group>
  );
}

export function BoxingRing({ position = [0, 0, 0] as V3, size = 5 }) {
  const half = size / 2;
  const corners: [number, number][] = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ];
  return (
    <group position={position}>
      <Box size={[size + 0.4, 0.6, size + 0.4]} position={[0, 0.3, 0]} material="iron" />
      <Box size={[size, 0.04, size]} position={[0, 0.62, 0]} material="canvas" />
      {corners.map(([x, z], i) => (
        <group key={i}>
          <Cyl r={0.06} h={1.5} position={[x, 1.35, z]} material={i % 2 ? "ember" : "steel"} />
        </group>
      ))}
      {[1.0, 1.35, 1.7].map((y) =>
        corners.map(([x, z], i) => {
          const [nx, nz] = corners[(i + 1) % 4];
          const len = Math.hypot(nx - x, nz - z);
          return (
            <Cyl
              key={`${y}-${i}`}
              r={0.018}
              h={len}
              position={[(x + nx) / 2, y, (z + nz) / 2]}
              rotation={[x === nx ? Math.PI / 2 : 0, 0, x === nx ? 0 : Math.PI / 2]}
              material={y === 1.35 ? "emberGlow" : "bone"}
            />
          );
        }),
      )}
    </group>
  );
}

export function Rower({ position = [0, 0, 0] as V3, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box size={[0.14, 0.08, 2.4]} position={[0, ROWER.seatHeight - 0.14, -0.3]} material="steel" />
      <Box size={[0.06, ROWER.seatHeight - 0.14, 0.06]} position={[0, (ROWER.seatHeight - 0.14) / 2, -1.45]} material="iron" />
      <Box size={[0.36, 0.06, 0.3]} position={[0, ROWER.seatHeight - 0.06, 0]} material="rubber" />
      <Box size={[0.4, 0.3, 0.06]} position={[0, ROWER.footY + 0.05, ROWER.footZ + 0.12]} rotation={[-0.5, 0, 0]} material="iron" />
      <mesh position={[0, 0.42, 1.05]} castShadow material={MATERIALS.iron}>
        <cylinderGeometry args={[0.32, 0.32, 0.22, 28]} />
      </mesh>
      <mesh position={[0, 0.42, 1.05]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.emberGlow}>
        <torusGeometry args={[0.32, 0.012, 8, 40]} />
      </mesh>
    </group>
  );
}

export function Kettlebell({ position = [0, 0, 0] as V3, material = "iron" as keyof typeof MATERIALS }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.13, 0]} castShadow material={MATERIALS[material]}>
        <sphereGeometry args={[0.13, 20, 16]} />
      </mesh>
      <mesh position={[0, 0.27, 0]} castShadow material={MATERIALS[material]}>
        <torusGeometry args={[0.07, 0.018, 8, 20, Math.PI]} />
      </mesh>
    </group>
  );
}

export function Rig({ position = [0, 0, 0] as V3, bays = 3 }) {
  const width = bays * 1.4;
  return (
    <group position={position}>
      {Array.from({ length: bays + 1 }, (_, i) =>
        [-0.7, 0.7].map((z) => <Box key={`${i}${z}`} size={[0.09, 2.9, 0.09]} position={[-width / 2 + i * 1.4, 1.45, z]} material="iron" />),
      )}
      <Box size={[width + 0.1, 0.09, 0.09]} position={[0, 2.9, -0.7]} material="iron" />
      <Box size={[width + 0.1, 0.09, 0.09]} position={[0, 2.9, 0.7]} material="iron" />
      {Array.from({ length: bays }, (_, i) => (
        <Cyl key={i} r={0.02} h={1.4} position={[-width / 2 + 0.7 + i * 1.4, 2.6, 0]} rotation={[Math.PI / 2, 0, 0]} material="chrome" />
      ))}
      {Array.from({ length: bays }, (_, i) => (
        <group key={`r${i}`} position={[-width / 2 + 0.7 + i * 1.4, 0, 0.7]}>
          <mesh position={[-0.15, 1.7, 0]} material={MATERIALS.bone}>
            <torusGeometry args={[0.11, 0.02, 8, 24]} />
          </mesh>
          <mesh position={[0.15, 1.7, 0]} material={MATERIALS.bone}>
            <torusGeometry args={[0.11, 0.02, 8, 24]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Pulsing floor tiles and speaker stacks for the Zumba studio. */
export function DanceFloor({ position = [0, 0, 0] as V3, size = 6 }) {
  const tiles = useRef<Group>(null);
  const n = 6;
  useFrame(({ clock }) => {
    tiles.current?.children.forEach((tile, i) => {
      const m = (tile as Mesh).material as unknown as MeshStandardMaterial;
      const beat = Math.max(0, Math.sin(clock.elapsedTime * 5.2 + (i % n) * 0.6 + Math.floor(i / n) * 1.1));
      m.emissiveIntensity = 0.15 + beat * 1.4;
    });
  });
  const cell = size / n;
  return (
    <group position={position}>
      <group ref={tiles}>
        {Array.from({ length: n * n }, (_, i) => (
          <mesh key={i} position={[-size / 2 + cell / 2 + (i % n) * cell, 0.011, -size / 2 + cell / 2 + Math.floor(i / n) * cell]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[cell * 0.94, cell * 0.94]} />
            <meshStandardMaterial color="#2a1a12" emissive={(i + Math.floor(i / n)) % 2 ? "#dd5a22" : "#4a5560"} emissiveIntensity={0.4} roughness={0.35} />
          </mesh>
        ))}
      </group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (size / 2 + 0.5), 0, -size / 2 + 0.5]}>
          <Box size={[0.7, 1.6, 0.6]} position={[0, 0.8, 0]} material="iron" />
          <Cyl r={0.2} h={0.04} position={[0, 1.1, 0.31]} rotation={[Math.PI / 2, 0, 0]} material="rubber" />
          <Cyl r={0.12} h={0.04} position={[0, 0.5, 0.31]} rotation={[Math.PI / 2, 0, 0]} material="rubber" />
        </group>
      ))}
    </group>
  );
}
