import { Bike, Dumbbell, Flower2, Music, Package, Pill, Shirt, Swords, Weight, FileText, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Art-directed placeholder imagery. Real photography arrives via Cloudinary
 * once the client supplies it; until then every card renders a branded,
 * deterministic composition instead of a broken or stock image.
 */

export const OBJECT_ICONS: Record<string, LucideIcon> = {
  "gym-floor": Dumbbell,
  "yoga-studio": Flower2,
  "zumba-studio": Music,
  "spin-studio": Bike,
  "boxing-zone": Swords,
  "crossfit-zone": Weight,
};

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  SUPPLEMENTS: Pill,
  MERCHANDISE: Shirt,
  EQUIPMENT: Package,
  DIGITAL: FileText,
};

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return Math.abs(h);
}

export function ObjectIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = OBJECT_ICONS[slug] ?? Dumbbell;
  return <Icon className={className} aria-hidden />;
}

export function ArtPanel({
  seed,
  label,
  icon: Icon,
  className,
  intensity = 1,
}: {
  seed: string;
  label?: string;
  icon?: LucideIcon;
  className?: string;
  intensity?: number;
}) {
  const h = hash(seed);
  const angle = 20 + (h % 50);
  const glowX = 20 + (h % 60);
  const glowY = 15 + ((h >> 3) % 50);
  const id = `art-${h.toString(36)}`;

  return (
    <div className={cn("relative isolate overflow-hidden bg-ink-950", className)} aria-hidden>
      <svg className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 300">
        <defs>
          <radialGradient id={`${id}-glow`} cx={`${glowX}%`} cy={`${glowY}%`} r="75%">
            <stop offset="0" stopColor="#dd5a22" stopOpacity={0.55 * intensity} />
            <stop offset="0.45" stopColor="#7f2a08" stopOpacity={0.25 * intensity} />
            <stop offset="1" stopColor="#121110" stopOpacity="0" />
          </radialGradient>
          <pattern id={`${id}-lines`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
            <line x1="0" y1="0" x2="0" y2="14" stroke="#faf8f4" strokeOpacity="0.05" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill="#1c1b19" />
        <rect width="400" height="300" fill={`url(#${id}-glow)`} />
        <rect width="400" height="300" fill={`url(#${id}-lines)`} />
        <path d={`M0 ${220 + (h % 40)} L400 ${160 + (h % 60)} L400 300 L0 300 Z`} fill="#121110" fillOpacity="0.55" />
      </svg>
      {Icon && <Icon className="absolute -bottom-6 -right-6 size-40 text-bone-50/[0.06]" strokeWidth={1} />}
      {Icon && (
        <span className="absolute left-5 top-5 grid size-11 place-items-center rounded-xl border border-bone-50/10 bg-ink-900/60 text-ember-300 backdrop-blur">
          <Icon className="size-5" />
        </span>
      )}
      {label && (
        <span className="absolute bottom-4 left-5 font-display text-5xl font-semibold uppercase leading-none tracking-tight text-bone-50/10">{label}</span>
      )}
    </div>
  );
}

export function Monogram({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const h = hash(name);
  return (
    <div className={cn("relative isolate overflow-hidden bg-ink-950", className)} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 90% at ${30 + (h % 40)}% 10%, rgba(221,90,34,0.45), rgba(127,42,8,0.18) 45%, transparent 70%), linear-gradient(180deg, #252421, #121110)`,
        }}
      />
      <span className="absolute inset-x-0 bottom-[-0.12em] text-center font-display text-[9rem] font-bold leading-none text-bone-50/[0.08]">{initials}</span>
      <span className="absolute left-1/2 top-[42%] grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-bone-50/15 bg-ink-800/70 font-display text-3xl font-semibold tracking-wider text-bone-50 backdrop-blur">
        {initials}
      </span>
    </div>
  );
}
