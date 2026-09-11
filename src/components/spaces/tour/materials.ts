import { MeshStandardMaterial } from "three";

/** Shared materials (one instance each) in the FORGE palette. */
export const MATERIALS = {
  floor: new MeshStandardMaterial({ color: "#3a3631", roughness: 0.9, metalness: 0.05 }),
  rubber: new MeshStandardMaterial({ color: "#161514", roughness: 0.95 }),
  steel: new MeshStandardMaterial({ color: "#4a5560", roughness: 0.35, metalness: 0.85 }),
  chrome: new MeshStandardMaterial({ color: "#c9ced3", roughness: 0.18, metalness: 1 }),
  iron: new MeshStandardMaterial({ color: "#1f1e1c", roughness: 0.55, metalness: 0.6 }),
  ember: new MeshStandardMaterial({ color: "#c2410c", roughness: 0.5, metalness: 0.1 }),
  emberGlow: new MeshStandardMaterial({ color: "#dd5a22", emissive: "#dd5a22", emissiveIntensity: 2.2, roughness: 0.4 }),
  steelGlow: new MeshStandardMaterial({ color: "#7d8893", emissive: "#a7b0b9", emissiveIntensity: 1.2 }),
  bone: new MeshStandardMaterial({ color: "#e5dfd3", roughness: 0.7 }),
  wood: new MeshStandardMaterial({ color: "#6b4a2f", roughness: 0.6 }),
  cork: new MeshStandardMaterial({ color: "#a47b52", roughness: 0.9 }),
  mat: new MeshStandardMaterial({ color: "#4a4640", roughness: 0.95 }),
  canvas: new MeshStandardMaterial({ color: "#e5dfd3", roughness: 0.85 }),
  leather: new MeshStandardMaterial({ color: "#7f2a08", roughness: 0.55 }),
  // Athletes: stylized mannequin tones, ember/steel kit.
  skin: new MeshStandardMaterial({ color: "#c9a27e", roughness: 0.65 }),
  shorts: new MeshStandardMaterial({ color: "#1c1b19", roughness: 0.8 }),
  shoe: new MeshStandardMaterial({ color: "#faf8f4", roughness: 0.6 }),
  steelKit: new MeshStandardMaterial({ color: "#4a5560", roughness: 0.7 }),
} as const;

