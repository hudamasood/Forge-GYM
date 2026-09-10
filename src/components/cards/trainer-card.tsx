import Link from "next/link";
import { Monogram } from "@/components/brand/art";
import { Badge } from "@/components/ui/badge";

export interface TrainerCardData {
  slug: string;
  name: string;
  specialty: string;
  yearsExperience: number;
  primaryAccessObject: { name: string };
}

export function TrainerCard({ trainer, headingLevel = "h3" }: { trainer: TrainerCardData; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-bone-50/8 bg-ink-800/80 transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-forge)] focus-within:border-ember-400/50 hover:-translate-y-1 hover:border-bone-50/15 hover:shadow-warm-lg">
      <Monogram name={trainer.name} className="aspect-[4/5] transition-transform duration-500 group-hover:scale-[1.03]" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-ink-950 via-ink-950/85 to-transparent p-6 pt-16">
        <Badge tone="ember" className="self-start">
          {trainer.primaryAccessObject.name}
        </Badge>
        <Heading className="font-display text-2xl font-semibold text-bone-50">
          <Link href={`/trainers/${trainer.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {trainer.name}
          </Link>
        </Heading>
        <p className="text-sm text-bone-200">
          {trainer.specialty} · {trainer.yearsExperience} yrs
        </p>
      </div>
    </article>
  );
}
