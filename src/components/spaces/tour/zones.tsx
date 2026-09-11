"use client";

import { Athlete } from "./athlete";
import { BoxingRing, DanceFloor, DumbbellRack, HeavyBag, Kettlebell, Rig, Rower, SpinBike, SquatRack, Treadmill, YogaMat } from "./equipment";
import { MATERIALS } from "./materials";

type V3 = [number, number, number];

/** Floor pad, back wall with index markers in light, and an ember light strip. */
function ZoneShell({ index, children, lightColor = "#dd5a22" }: { index: number; children: React.ReactNode; lightColor?: string }) {
  return (
    <group>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={MATERIALS.mat}>
        <planeGeometry args={[14, 10]} />
      </mesh>
      <mesh position={[0, 3, -5]} receiveShadow material={MATERIALS.floor}>
        <boxGeometry args={[14, 6, 0.2]} />
      </mesh>
      <mesh position={[0, 5.2, -4.88]} material={MATERIALS.emberGlow}>
        <boxGeometry args={[12, 0.05, 0.02]} />
      </mesh>
      {/* Index markers in light; zone names live in the HTML overlay (no runtime font fetch). */}
      {Array.from({ length: index + 1 }, (_, i) => (
        <mesh key={i} position={[-6 + i * 0.5, 4.4, -4.88]} material={MATERIALS.emberGlow}>
          <boxGeometry args={[0.3, 0.3, 0.02]} />
        </mesh>
      ))}
      <mesh position={[0, 3.2, -4.88]} material={MATERIALS.steelGlow}>
        <boxGeometry args={[4, 0.02, 0.02]} />
      </mesh>
      <pointLight position={[0, 4.5, 2.5]} intensity={40} distance={16} color={lightColor} decay={1.5} />
      <spotLight position={[0, 7, 4]} angle={0.7} penumbra={0.6} intensity={60} distance={18} color="#faf8f4" decay={1.4} />
      {children}
    </group>
  );
}

function GymFloor() {
  return (
    <>
      <SquatRack position={[-2.6, 0, 0]} />
      <Athlete exercise="squat" position={[-2.6, 0.04, 0.05]} offset={0.2} prop="barbell" />
      <Treadmill position={[1.4, 0, 0.2]} rotation={Math.PI} />
      <Athlete exercise="run" position={[1.4, 0.19, 0.2]} rotation={Math.PI} offset={1.3} accent="steel" />
      <Treadmill position={[2.6, 0, 0.2]} rotation={Math.PI} />
      <Athlete exercise="run" position={[2.6, 0.19, 0.2]} rotation={Math.PI} offset={2.9} />
      <DumbbellRack position={[0, 0, -3.6]} />
    </>
  );
}

function YogaStudio() {
  const mats: V3[] = [
    [-2.2, 0, 0.4],
    [0, 0, -0.4],
    [2.2, 0, 0.4],
  ];
  return (
    <>
      {mats.map((p, i) => (
        <group key={i}>
          <YogaMat position={p} />
          <Athlete exercise="yoga" position={[p[0], 0.02, p[2]]} offset={i * 0.8} accent={i === 1 ? "ember" : "steel"} speed={0.9} />
        </group>
      ))}
      <pointLight position={[0, 2.5, 3]} intensity={6} distance={10} color="#f6dcc9" />
    </>
  );
}

function ZumbaStudio() {
  const dancers: V3[] = [
    [-1.6, 0.02, 0.8],
    [0, 0.02, 1.4],
    [1.6, 0.02, 0.8],
    [-0.8, 0.02, -0.4],
    [0.8, 0.02, -0.4],
  ];
  return (
    <>
      <DanceFloor position={[0, 0, 0.2]} />
      <Athlete exercise="dance" position={[0, 0.02, -1.9]} rotation={0} offset={0} />
      {dancers.map((p, i) => (
        <Athlete key={i} exercise="dance" position={p} rotation={Math.PI} offset={0.15 * (i + 1)} accent={i % 2 ? "ember" : "steel"} />
      ))}
    </>
  );
}

function SpinStudio() {
  const bikes: V3[] = [
    [-2.4, 0, 0.6],
    [-0.8, 0, 0.9],
    [0.8, 0, 0.9],
    [2.4, 0, 0.6],
    [0, 0, -1.6],
  ];
  return (
    <>
      {bikes.map((p, i) => {
        const facing = i === 4 ? 0 : Math.PI;
        return (
          <group key={i}>
            <SpinBike position={p} rotation={facing} />
            <Athlete exercise="cycle" position={[p[0], 0, p[2] + (facing ? 0.12 : -0.12)]} rotation={facing} offset={i * 0.9} accent={i === 4 ? "ember" : "steel"} />
          </group>
        );
      })}
      <pointLight position={[-4, 3, 0]} intensity={10} distance={8} color="#4a5560" />
      <pointLight position={[4, 3, 0]} intensity={10} distance={8} color="#dd5a22" />
    </>
  );
}

function BoxingZone() {
  return (
    <>
      <BoxingRing position={[-1.6, 0, -0.4]} size={4.2} />
      <Athlete exercise="punch" position={[-2.3, 0.64, -0.2]} rotation={0.9} offset={0.3} />
      <Athlete exercise="punch" position={[-0.9, 0.64, -0.6]} rotation={-2.3} offset={1.1} accent="steel" />
      <HeavyBag position={[3.2, 0, 0.3]} phase={0} />
      <Athlete exercise="punch" position={[3.3, 0, 1.15]} rotation={Math.PI + 0.35} offset={0.6} accent="steel" />
      <HeavyBag position={[4.9, 0, -0.6]} phase={0.9} />
    </>
  );
}

function CrossfitZone() {
  // Figures face +Z (toward the camera) at rotation 0.
  return (
    <>
      <Rig position={[-0.6, 0, -2.4]} bays={4} />
      <Rower position={[-1.9, 0, 0.1]} rotation={Math.PI / 2} />
      <Athlete exercise="row" position={[-1.9, 0, 0.1]} rotation={Math.PI / 2} offset={0.4} />
      <Rower position={[-1.9, 0, 1.3]} rotation={Math.PI / 2} />
      <Athlete exercise="row" position={[-1.9, 0, 1.3]} rotation={Math.PI / 2} offset={1.5} accent="steel" />
      <Athlete exercise="swing" position={[0.9, 0.02, 1.1]} offset={0.2} prop="kettlebell" />
      <Athlete exercise="swing" position={[2.3, 0.02, 0.7]} offset={0.9} accent="steel" prop="kettlebell" />
      {[0.4, 1.6, 2.9].map((x) => (
        <Kettlebell key={x} position={[x, 0, 2.6]} material={x > 2 ? "ember" : "iron"} />
      ))}
    </>
  );
}

const ZONE_CONTENT: Record<string, () => React.ReactElement> = {
  "gym-floor": GymFloor,
  "yoga-studio": YogaStudio,
  "zumba-studio": ZumbaStudio,
  "spin-studio": SpinStudio,
  "boxing-zone": BoxingZone,
  "crossfit-zone": CrossfitZone,
};

export function Zone({ slug, index, x }: { slug: string; index: number; x: number }) {
  const Content = ZONE_CONTENT[slug] ?? GymFloor;
  return (
    <group position={[x, 0, 0]}>
      <ZoneShell index={index} lightColor={index % 2 ? "#a7b0b9" : "#dd5a22"}>
        <Content />
      </ZoneShell>
    </group>
  );
}
