import Link from "next/link";
import { ArrowUpRight, Clock, Flame, Users } from "lucide-react";
import { ArtPanel, OBJECT_ICONS } from "@/components/brand/art";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/cards/badges";
import type { Difficulty } from "@/server/domain/types";

export interface ClassCardData {
  slug: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  durationMinutes: number;
  estCalories: number;
  defaultCapacity: number;
  accessObject: { slug: string; name: string };
}

export function ClassCard({ gymClass, headingLevel = "h3" }: { gymClass: ClassCardData; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-bone-50/8 bg-ink-800/80 transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-forge)] focus-within:border-ember-400/50 hover:-translate-y-1 hover:border-bone-50/15 hover:shadow-warm-lg">
      <ArtPanel seed={gymClass.slug} icon={OBJECT_ICONS[gymClass.accessObject.slug]} className="aspect-[16/9] transition-transform duration-500 group-hover:scale-[1.03]" />
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="steel">{gymClass.accessObject.name}</Badge>
          <DifficultyBadge difficulty={gymClass.difficulty} />
        </div>
        <Heading className="font-display text-2xl font-semibold text-bone-50">
          <Link href={`/classes/${gymClass.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {gymClass.name}
          </Link>
        </Heading>
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-300">{gymClass.description}</p>
        <dl className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-3 text-sm text-bone-200">
          <div className="flex items-center gap-1.5">
            <Clock className="size-4 text-ember-400" aria-hidden />
            <dt className="sr-only">Duration</dt>
            <dd>{gymClass.durationMinutes} min</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="size-4 text-ember-400" aria-hidden />
            <dt className="sr-only">Estimated calories</dt>
            <dd>~{gymClass.estCalories} kcal</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="size-4 text-ember-400" aria-hidden />
            <dt className="sr-only">Capacity</dt>
            <dd>{gymClass.defaultCapacity} spots</dd>
          </div>
        </dl>
      </div>
      <ArrowUpRight className="absolute right-5 top-5 size-5 text-bone-50 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
    </article>
  );
}
