/**
 * Art-directed photography for the public site. Files live in
 * public/images (Unsplash License — photographer credits in
 * public/images/CREDITS.md). A URL stored on the record itself (admin
 * uploads via Cloudinary) always wins over the bundled photo; anything that
 * next/image cannot load is ignored so a bad URL can never break a page.
 */

export interface SiteImage {
  src: string;
  alt: string;
}

const ALLOWED_REMOTE = ["https://res.cloudinary.com/"];

function usable(url: string | null | undefined): url is string {
  if (!url) return false;
  return url.startsWith("/") || ALLOWED_REMOTE.some((prefix) => url.startsWith(prefix));
}

function pick(bundled: SiteImage | undefined, override: string | null | undefined): SiteImage | null {
  if (usable(override)) return { src: override, alt: bundled?.alt ?? "" };
  return bundled ?? null;
}

const img = (src: string, alt: string): SiteImage => ({ src: `/images/${src}.jpg`, alt });

export const SITE_IMAGES = {
  hero: img("site/hero", "The FORGE main floor after dark — rows of dumbbells and benches under black steel and spotlights"),
  membership: img("site/membership", "A private training suite framed in light, with treadmills and a dumbbell rack"),
  cta: img("site/cta", "A loaded dumbbell resting on a textured black floor"),
  auth: img("site/auth", "A row of leather heavy bags hanging above a herringbone timber floor"),
} as const;

const SPACES: Record<string, SiteImage> = {
  "gym-floor": img("spaces/gym-floor", "The Gym Floor — benches and dumbbell racks in front of a mirrored wall"),
  "yoga-studio": img("spaces/yoga-studio", "The Yoga Studio — a calm, warm-lit room with mats, blocks and floor-to-ceiling windows"),
  "zumba-studio": img("spaces/zumba-studio", "The Zumba Studio — a dancer in a pool of light with projected city lights on every wall"),
  "spin-studio": img("spaces/spin-studio", "The Spin Studio — an indoor bike in front of a wall of light"),
  "boxing-zone": img("spaces/boxing-zone", "The Combat Zone — a full-size boxing ring and leather bags on a timber floor"),
  "crossfit-zone": img("spaces/crossfit-zone", "The Functional Zone — a steel rig, turf sprint lane and slam balls"),
};

const CLASSES: Record<string, SiteImage> = {
  "forge-strength": img("classes/forge-strength", "An athlete gripping a loaded barbell for a deadlift"),
  "hiit-conditioning": img("classes/hiit-conditioning", "An athlete between rounds of battle ropes"),
  "vinyasa-flow": img("classes/vinyasa-flow", "Upward-facing dog in a quiet, lamp-lit studio"),
  "restorative-yoga": img("classes/restorative-yoga", "A seated meditation, rim-lit against darkness"),
  "mat-pilates": img("classes/mat-pilates", "A Pilates side-plank on a reformer in a sand-toned studio"),
  "zumba-fiesta": img("classes/zumba-fiesta", "A dancer mid-move under red stage light"),
  "dance-cardio": img("classes/dance-cardio", "A dancer under a single spotlight"),
  "rhythm-ride": img("classes/rhythm-ride", "A rider on an indoor bike, lit through haze"),
  "power-intervals": img("classes/power-intervals", "An athlete pushing a hard interval on a studio bike"),
  "boxing-fundamentals": img("classes/boxing-fundamentals", "A boxer holding guard in a dark gym"),
  "fight-conditioning": img("classes/fight-conditioning", "A fighter driving a knee into a heavy bag in golden light"),
  wod: img("classes/wod", "A kettlebell get-up in the functional zone"),
  "olympic-lifting": img("classes/olympic-lifting", "A lifter setting up under a barbell"),
};

const TRAINERS: Record<string, SiteImage> = {
  "marcus-reyes": img("trainers/marcus-reyes", "Coach Marcus Reyes curling a barbell on the gym floor"),
  "elena-cruz": img("trainers/elena-cruz", "Coach Elena Cruz in a deep squat in the studio"),
  "sofia-alvarez": img("trainers/sofia-alvarez", "Coach Sofia Alvarez on the gym floor"),
  "jordan-blake": img("trainers/jordan-blake", "Coach Jordan Blake by the dumbbell racks"),
  "andre-okafor": img("trainers/andre-okafor", "Coach Andre Okafor in gold boxing gloves, holding guard"),
  "kai-nakamura": img("trainers/kai-nakamura", "Coach Kai Nakamura loading a bumper plate"),
};

const PRODUCTS: Record<string, SiteImage> = {
  "whey-protein-isolate": img("products/whey-protein-isolate", "A tub of whey protein isolate with a full scoop"),
  "creatine-monohydrate": img("products/creatine-monohydrate", "Micronized creatine powder and scoop on black"),
  "pre-workout-ignite": img("products/pre-workout-ignite", "A tub of pre-workout beside a mixed shaker"),
  "electrolyte-mix": img("products/electrolyte-mix", "Electrolyte powder dissolving into a glass of water"),
  "forge-tee-ember": img("products/forge-tee-ember", "The heavyweight black FORGE tee"),
  "forge-hoodie": img("products/forge-hoodie", "The FORGE heavyweight hoodie in ink black"),
  "forge-shaker": img("products/forge-shaker", "A shaker bottle on a dark counter"),
  "forge-cap": img("products/forge-cap", "A black six-panel training cap on a windowsill"),
  "forge-gym-bag": img("products/forge-gym-bag", "A black 40 L duffel on a marble table"),
  "lifting-belt": img("products/lifting-belt", "A vegetable-tanned leather lifting belt"),
  "wrist-wraps": img("products/wrist-wraps", "An athlete fastening a wrist wrap"),
  "boxing-gloves-14oz": img("products/boxing-gloves-14oz", "Black 14 oz boxing gloves resting on a gym mat"),
  "resistance-band-set": img("products/resistance-band-set", "Looped resistance bands on a training bag"),
  "yoga-mat-cork": img("products/yoga-mat-cork", "Rolled yoga mats standing in soft window light"),
  "12-week-strength-program": img("products/12-week-strength-program", "An athlete preparing to deadlift a loaded barbell"),
  "mobility-guide": img("products/mobility-guide", "A seated forward fold on a cork mat"),
};

export const spaceImage = (slug: string, override?: string | null) => pick(SPACES[slug], override);
export const classImage = (slug: string, override?: string | null) => pick(CLASSES[slug], override);
export const trainerImage = (slug: string, override?: string | null) => pick(TRAINERS[slug], override);
export const productImage = (slug: string, overrides?: readonly string[] | null) => pick(PRODUCTS[slug], overrides?.[0]);
