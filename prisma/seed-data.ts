/**
 * PLACEHOLDER SEED CONTENT — fabricated, explicitly authorized (spec A8).
 * None of this is real. Replace wholesale once real business data exists.
 * Prices are in USD cents.
 */

export const accessObjects = [
  {
    slug: "gym-floor",
    name: "Gym Floor",
    tagline: "Iron, cardio and open conditioning.",
    description:
      "Our main training floor: calibrated plates, competition racks, a full cardio zone and an open functional area for conditioning work.",
    equipment: ["Competition squat racks", "Calibrated plates", "Dumbbells 2–60 kg", "Cable stations", "Treadmills", "Air bikes", "Rowers", "Turf lane"],
  },
  {
    slug: "yoga-studio",
    name: "Yoga Studio",
    tagline: "Breath, balance and mobility.",
    description: "A dedicated, warm-lit mat studio for vinyasa, restorative practice and mat pilates — separate from our dance studio.",
    equipment: ["Cork mats", "Bolsters", "Blocks and straps", "Wall ropes", "Infrared heating panels"],
  },
  {
    slug: "zumba-studio",
    name: "Zumba Studio",
    tagline: "Dance-driven cardio with a sound system to match.",
    description: "A sprung-floor dance studio built for Zumba and aerobic dance formats, with a concert-grade sound system and mirrored walls.",
    equipment: ["Sprung floor", "Mirrored walls", "Concert sound system", "Stage lighting"],
  },
  {
    slug: "spin-studio",
    name: "Spin Studio",
    tagline: "Rhythm, resistance and a wall of light.",
    description: "An indoor cycling studio with power-metered bikes and an immersive light rig synced to every ride.",
    equipment: ["Power-metered bikes", "Leaderboard screen", "Immersive light rig", "Surround sound"],
  },
  {
    slug: "boxing-zone",
    name: "Boxing / Combat Zone",
    tagline: "Bags, pads and a full-size ring.",
    description: "A combat zone with heavy bags, speed bags, pad-work lanes and a full-size boxing ring for technical sparring.",
    equipment: ["Full-size boxing ring", "Heavy bags", "Speed bags", "Double-end bags", "Pad-work lanes"],
  },
  {
    slug: "crossfit-zone",
    name: "CrossFit / Functional Zone",
    tagline: "Rigs, rowers and relentless programming.",
    description: "Open functional space with a 12-station rig, rowers, sleds and a daily programmed workout board.",
    equipment: ["12-station rig", "Olympic lifting platforms", "Rowers", "Ski ergs", "Sleds", "Kettlebells", "Wall balls"],
  },
] as const;

export type AccessObjectSlug = (typeof accessObjects)[number]["slug"];

export const trainers = [
  {
    slug: "marcus-reyes",
    name: "Marcus Reyes",
    accessObject: "gym-floor",
    specialty: "Strength & hypertrophy",
    bio: "Marcus coached powerlifters for a decade before joining FORGE. He builds programs around progressive overload, clean technique and patience.",
    certifications: ["NSCA-CSCS", "USA Powerlifting Coach"],
    yearsExperience: 11,
  },
  {
    slug: "elena-cruz",
    name: "Elena Cruz",
    accessObject: "yoga-studio",
    specialty: "Vinyasa & mobility",
    bio: "Elena blends flowing vinyasa with mobility work for lifters. Her classes are demanding, precise and always finish with real stillness.",
    certifications: ["RYT-500", "FRC Mobility Specialist"],
    yearsExperience: 9,
  },
  {
    slug: "sofia-alvarez",
    name: "Sofia Alvarez",
    accessObject: "zumba-studio",
    specialty: "Dance fitness",
    bio: "A former professional dancer, Sofia turns high-energy choreography into a full-body workout that never feels like one.",
    certifications: ["Zumba Licensed Instructor", "ACE Group Fitness"],
    yearsExperience: 7,
  },
  {
    slug: "jordan-blake",
    name: "Jordan Blake",
    accessObject: "spin-studio",
    specialty: "Indoor cycling & endurance",
    bio: "Jordan rides to the beat and trains to the numbers. Expect power zones, climbs and playlists you will want afterwards.",
    certifications: ["Schwinn Certified", "USA Cycling Level 2"],
    yearsExperience: 8,
  },
  {
    slug: "andre-okafor",
    name: "Andre Okafor",
    accessObject: "boxing-zone",
    specialty: "Boxing technique & conditioning",
    bio: "Andre fought amateur for eight years. He teaches footwork and defense first — the power follows.",
    certifications: ["USA Boxing Coach", "NASM-CPT"],
    yearsExperience: 12,
  },
  {
    slug: "kai-nakamura",
    name: "Kai Nakamura",
    accessObject: "crossfit-zone",
    specialty: "Functional fitness & Olympic lifting",
    bio: "Kai programs the daily workout and coaches the barbell. Scalable for day one, relentless for year five.",
    certifications: ["CF-L3", "USAW Level 1"],
    yearsExperience: 10,
  },
] as const;

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";

export const classes: {
  slug: string;
  name: string;
  accessObject: AccessObjectSlug;
  trainer: string;
  difficulty: Difficulty;
  durationMinutes: number;
  estCalories: number;
  defaultCapacity: number;
  description: string;
  benefits: string[];
  /** ISO weekday (1 = Monday) and local hour the class runs. */
  slots: { weekday: number; hour: number; minute?: number }[];
}[] = [
  {
    slug: "forge-strength",
    name: "Forge Strength",
    accessObject: "gym-floor",
    trainer: "marcus-reyes",
    difficulty: "INTERMEDIATE",
    durationMinutes: 60,
    estCalories: 450,
    defaultCapacity: 12,
    description: "Coached barbell strength in small groups: squat, press, deadlift and the accessories that make them move.",
    benefits: ["Build raw strength", "Master barbell technique", "Structured progression"],
    slots: [
      { weekday: 1, hour: 6 },
      { weekday: 3, hour: 18 },
      { weekday: 5, hour: 7 },
    ],
  },
  {
    slug: "hiit-conditioning",
    name: "HIIT Conditioning",
    accessObject: "gym-floor",
    trainer: "marcus-reyes",
    difficulty: "ALL_LEVELS",
    durationMinutes: 45,
    estCalories: 550,
    defaultCapacity: 16,
    description: "Intervals on air bikes, rowers and the turf lane. Short, hard, scalable.",
    benefits: ["Boost conditioning", "Burn serious calories", "Scales to any level"],
    slots: [
      { weekday: 2, hour: 7 },
      { weekday: 4, hour: 19 },
      { weekday: 6, hour: 9 },
    ],
  },
  {
    slug: "vinyasa-flow",
    name: "Vinyasa Flow",
    accessObject: "yoga-studio",
    trainer: "elena-cruz",
    difficulty: "ALL_LEVELS",
    durationMinutes: 60,
    estCalories: 300,
    defaultCapacity: 20,
    description: "A breath-led flow that builds heat, strength and balance, finishing with a long, quiet savasana.",
    benefits: ["Improve flexibility", "Build core strength", "Reduce stress"],
    slots: [
      { weekday: 1, hour: 7 },
      { weekday: 3, hour: 7 },
      { weekday: 6, hour: 10 },
    ],
  },
  {
    slug: "restorative-yoga",
    name: "Restorative Yoga",
    accessObject: "yoga-studio",
    trainer: "elena-cruz",
    difficulty: "BEGINNER",
    durationMinutes: 60,
    estCalories: 150,
    defaultCapacity: 18,
    description: "Long, supported holds with bolsters and blocks. The recovery session your training has been missing.",
    benefits: ["Speed recovery", "Down-regulate stress", "Gentle mobility"],
    slots: [
      { weekday: 2, hour: 20 },
      { weekday: 7, hour: 17 },
    ],
  },
  {
    slug: "mat-pilates",
    name: "Mat Pilates",
    accessObject: "yoga-studio",
    trainer: "elena-cruz",
    difficulty: "INTERMEDIATE",
    durationMinutes: 50,
    estCalories: 280,
    defaultCapacity: 18,
    description: "Precise, controlled mat work for a stronger core, better posture and resilient hips.",
    benefits: ["Deep core strength", "Better posture", "Joint resilience"],
    slots: [
      { weekday: 4, hour: 12 },
      { weekday: 6, hour: 11, minute: 30 },
    ],
  },
  {
    slug: "zumba-fiesta",
    name: "Zumba Fiesta",
    accessObject: "zumba-studio",
    trainer: "sofia-alvarez",
    difficulty: "ALL_LEVELS",
    durationMinutes: 55,
    estCalories: 500,
    defaultCapacity: 25,
    description: "Latin rhythms, big energy and choreography anyone can follow. You will sweat and you will smile.",
    benefits: ["Fun cardio", "Coordination", "Community energy"],
    slots: [
      { weekday: 1, hour: 18 },
      { weekday: 3, hour: 19 },
      { weekday: 6, hour: 12 },
    ],
  },
  {
    slug: "dance-cardio",
    name: "Dance Cardio",
    accessObject: "zumba-studio",
    trainer: "sofia-alvarez",
    difficulty: "INTERMEDIATE",
    durationMinutes: 45,
    estCalories: 450,
    defaultCapacity: 22,
    description: "Aerobic dance intervals set to current hits, with a strength finisher.",
    benefits: ["Cardio endurance", "Lower-body strength", "Rhythm"],
    slots: [
      { weekday: 2, hour: 18 },
      { weekday: 5, hour: 18 },
    ],
  },
  {
    slug: "rhythm-ride",
    name: "Rhythm Ride",
    accessObject: "spin-studio",
    trainer: "jordan-blake",
    difficulty: "ALL_LEVELS",
    durationMinutes: 45,
    estCalories: 500,
    defaultCapacity: 24,
    description: "A beat-matched ride under the light rig — climbs, sprints and choreography on the bike.",
    benefits: ["Cardio fitness", "Low-impact", "Immersive experience"],
    slots: [
      { weekday: 1, hour: 19 },
      { weekday: 4, hour: 7 },
      { weekday: 7, hour: 10 },
    ],
  },
  {
    slug: "power-intervals",
    name: "Power Intervals",
    accessObject: "spin-studio",
    trainer: "jordan-blake",
    difficulty: "ADVANCED",
    durationMinutes: 50,
    estCalories: 600,
    defaultCapacity: 20,
    description: "Zone-based intervals on power-metered bikes. Data-driven, leaderboard-optional, genuinely hard.",
    benefits: ["Raise FTP", "Train with data", "Mental toughness"],
    slots: [
      { weekday: 3, hour: 6 },
      { weekday: 5, hour: 19 },
    ],
  },
  {
    slug: "boxing-fundamentals",
    name: "Boxing Fundamentals",
    accessObject: "boxing-zone",
    trainer: "andre-okafor",
    difficulty: "BEGINNER",
    durationMinutes: 60,
    estCalories: 550,
    defaultCapacity: 14,
    description: "Stance, footwork, the jab-cross and basic defense. Pads and bag rounds, no sparring.",
    benefits: ["Real technique", "Full-body conditioning", "Confidence"],
    slots: [
      { weekday: 2, hour: 19 },
      { weekday: 6, hour: 13 },
    ],
  },
  {
    slug: "fight-conditioning",
    name: "Fight Conditioning",
    accessObject: "boxing-zone",
    trainer: "andre-okafor",
    difficulty: "ADVANCED",
    durationMinutes: 60,
    estCalories: 700,
    defaultCapacity: 12,
    description: "Fighter-style rounds: bag work, pad combinations, sprawls and core. Brings the heat.",
    benefits: ["Elite conditioning", "Combination fluency", "Power endurance"],
    slots: [
      { weekday: 4, hour: 18 },
      { weekday: 7, hour: 11 },
    ],
  },
  {
    slug: "wod",
    name: "WOD",
    accessObject: "crossfit-zone",
    trainer: "kai-nakamura",
    difficulty: "ALL_LEVELS",
    durationMinutes: 60,
    estCalories: 650,
    defaultCapacity: 16,
    description: "The daily programmed workout: warm-up, skill or strength, then the WOD. Every movement scaled for you.",
    benefits: ["Varied functional fitness", "Coached scaling", "Team energy"],
    slots: [
      { weekday: 1, hour: 17 },
      { weekday: 2, hour: 6 },
      { weekday: 3, hour: 17 },
      { weekday: 5, hour: 6 },
    ],
  },
  {
    slug: "olympic-lifting",
    name: "Olympic Lifting",
    accessObject: "crossfit-zone",
    trainer: "kai-nakamura",
    difficulty: "INTERMEDIATE",
    durationMinutes: 75,
    estCalories: 400,
    defaultCapacity: 10,
    description: "Snatch and clean & jerk technique on the platforms, with complexes and positional strength work.",
    benefits: ["Explosive power", "Technical mastery", "Mobility under load"],
    slots: [
      { weekday: 4, hour: 17 },
      { weekday: 6, hour: 8 },
    ],
  },
];

export const membershipPlans: {
  slug: string;
  name: string;
  type: "SINGLE_OBJECT" | "ALL_ACCESS";
  accessObject: AccessObjectSlug | null;
  priceMonthly: number;
  priceAnnual: number;
  benefits: string[];
}[] = [
  {
    slug: "gym-floor-access",
    name: "Gym Floor Access",
    type: "SINGLE_OBJECT",
    accessObject: "gym-floor",
    priceMonthly: 4900,
    priceAnnual: 49000,
    benefits: ["Unlimited Gym Floor access", "Strength & HIIT classes", "Locker room access"],
  },
  {
    slug: "yoga-unlimited",
    name: "Yoga Unlimited",
    type: "SINGLE_OBJECT",
    accessObject: "yoga-studio",
    priceMonthly: 3900,
    priceAnnual: 39000,
    benefits: ["Unlimited Yoga Studio classes", "Vinyasa, restorative & mat pilates", "Mat and props provided"],
  },
  {
    slug: "zumba-unlimited",
    name: "Zumba Unlimited",
    type: "SINGLE_OBJECT",
    accessObject: "zumba-studio",
    priceMonthly: 3500,
    priceAnnual: 35000,
    benefits: ["Unlimited Zumba Studio classes", "Zumba & dance cardio", "Locker room access"],
  },
  {
    slug: "spin-unlimited",
    name: "Spin Unlimited",
    type: "SINGLE_OBJECT",
    accessObject: "spin-studio",
    priceMonthly: 3900,
    priceAnnual: 39000,
    benefits: ["Unlimited Spin Studio rides", "Power-metered bikes", "Ride performance history"],
  },
  {
    slug: "boxing-unlimited",
    name: "Boxing Unlimited",
    type: "SINGLE_OBJECT",
    accessObject: "boxing-zone",
    priceMonthly: 4500,
    priceAnnual: 45000,
    benefits: ["Unlimited Combat Zone classes", "Open bag time", "Wraps on your first visit"],
  },
  {
    slug: "crossfit-unlimited",
    name: "CrossFit Unlimited",
    type: "SINGLE_OBJECT",
    accessObject: "crossfit-zone",
    priceMonthly: 5900,
    priceAnnual: 59000,
    benefits: ["Unlimited WOD & lifting classes", "Open gym hours", "Monthly benchmark testing"],
  },
  {
    slug: "premium-all-access",
    name: "Premium All-Access",
    type: "ALL_ACCESS",
    accessObject: null,
    priceMonthly: 9900,
    priceAnnual: 99000,
    benefits: ["All six Access Objects", "Every class, every studio", "Priority booking", "Two guest passes a month"],
  },
];

type ProductCategory = "SUPPLEMENTS" | "MERCHANDISE" | "EQUIPMENT" | "DIGITAL";

export const products: {
  slug: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  description: string;
}[] = [
  { slug: "whey-protein-isolate", name: "Whey Protein Isolate", category: "SUPPLEMENTS", price: 5499, stock: 40, description: "25 g of fast-absorbing protein per scoop, 2 lb tub. Chocolate or vanilla." },
  { slug: "creatine-monohydrate", name: "Creatine Monohydrate", category: "SUPPLEMENTS", price: 2999, stock: 60, description: "Micronized, unflavored creatine monohydrate. 5 g per serving, 60 servings." },
  { slug: "pre-workout-ignite", name: "Ignite Pre-Workout", category: "SUPPLEMENTS", price: 3999, stock: 35, description: "Clean caffeine, beta-alanine and citrulline for sessions that need a spark." },
  { slug: "electrolyte-mix", name: "Electrolyte Mix", category: "SUPPLEMENTS", price: 2499, stock: 50, description: "Sugar-free hydration with sodium, potassium and magnesium. 30 stick packs." },
  { slug: "forge-tee-ember", name: "FORGE Tee — Ember", category: "MERCHANDISE", price: 3200, stock: 80, description: "Heavyweight cotton tee with the ember FORGE mark. Relaxed fit." },
  { slug: "forge-hoodie", name: "FORGE Heavyweight Hoodie", category: "MERCHANDISE", price: 6800, stock: 30, description: "450 gsm brushed fleece in warm ink black with tonal embroidery." },
  { slug: "forge-shaker", name: "FORGE Steel Shaker", category: "MERCHANDISE", price: 2400, stock: 70, description: "Insulated stainless-steel shaker, 24 oz, with a leak-proof lid." },
  { slug: "forge-cap", name: "FORGE Training Cap", category: "MERCHANDISE", price: 2800, stock: 45, description: "Lightweight six-panel cap with a moisture-wicking sweatband." },
  { slug: "forge-gym-bag", name: "FORGE Duffel", category: "MERCHANDISE", price: 7900, stock: 20, description: "Water-resistant 40 L duffel with a ventilated shoe compartment." },
  { slug: "lifting-belt", name: "Leather Lifting Belt", category: "EQUIPMENT", price: 8900, stock: 15, description: "10 mm vegetable-tanned leather belt with a single-prong buckle." },
  { slug: "wrist-wraps", name: "Wrist Wraps", category: "EQUIPMENT", price: 1999, stock: 55, description: "Stiff 18-inch wraps for pressing support." },
  { slug: "boxing-gloves-14oz", name: "Boxing Gloves 14 oz", category: "EQUIPMENT", price: 6900, stock: 25, description: "Premium synthetic leather gloves with multi-layer foam. Built for bag and pads." },
  { slug: "resistance-band-set", name: "Resistance Band Set", category: "EQUIPMENT", price: 3499, stock: 40, description: "Five looped latex bands from light to extra heavy, with a carry pouch." },
  { slug: "yoga-mat-cork", name: "Cork Yoga Mat", category: "EQUIPMENT", price: 7400, stock: 18, description: "Natural cork surface over a TPE base. Grips better the more you sweat." },
  { slug: "12-week-strength-program", name: "12-Week Strength Program (PDF)", category: "DIGITAL", price: 2900, stock: 9999, description: "Marcus Reyes' progressive strength template with video links. Digital download." },
  { slug: "mobility-guide", name: "Mobility for Lifters Guide (PDF)", category: "DIGITAL", price: 1900, stock: 9999, description: "Elena Cruz's daily mobility routines for hips, shoulders and spine. Digital download." },
];
