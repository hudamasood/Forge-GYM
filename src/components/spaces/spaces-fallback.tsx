import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArtPanel, OBJECT_ICONS } from "@/components/brand/art";
import { Photo } from "@/components/brand/photo";
import { spaceImage } from "@/lib/imagery";
import type { AccessObjectWithSpace } from "@/server/domain/types";

/**
 * The Spaces tour as real, readable HTML: every space with its description
 * and equipment. It is what crawlers index, what no-WebGL / low-end devices
 * see, and what renders before the 3D scene loads (spec C1).
 */
export function SpacesFallback({ objects }: { objects: AccessObjectWithSpace[] }) {
  return (
    <ol className="flex flex-col gap-6">
      {objects.map((obj, i) => (
        <li key={obj.slug} id={`space-${obj.slug}`} className="grid overflow-hidden rounded-3xl border border-bone-50/8 bg-ink-800/50 lg:grid-cols-2">
          <div className={i % 2 ? "relative min-h-64 lg:order-2 lg:min-h-96" : "relative min-h-64 lg:min-h-96"}>
            <Photo
              image={spaceImage(obj.slug, obj.heroImageUrl)}
              sizes="(min-width: 1024px) 50vw, 100vw"
              decorative
              className="absolute inset-0"
              fallback={<ArtPanel seed={obj.slug} icon={OBJECT_ICONS[obj.slug]} label={`0${i + 1}`} className="absolute inset-0" />}
            />
            <span aria-hidden className="absolute bottom-4 left-6 font-display text-7xl font-semibold leading-none text-bone-50/25">
              0{i + 1}
            </span>
          </div>
          <div className="flex flex-col gap-4 p-8 sm:p-10">
            <p className="font-display text-sm tracking-[0.3em] text-ember-400">SPACE 0{i + 1}</p>
            <h2 className="text-4xl font-semibold text-bone-50">{obj.name}</h2>
            <p className="text-lg text-bone-100">{obj.tagline}</p>
            <p className="leading-relaxed text-ink-300">{obj.description}</p>
            {obj.space && obj.space.equipmentList.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label={`${obj.name} equipment`}>
                {obj.space.equipmentList.map((e) => (
                  <li key={e} className="rounded-full border border-bone-50/10 px-3 py-1 text-xs text-bone-200">
                    {e}
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/spaces/${obj.slug}`} className="group mt-auto inline-flex items-center gap-2 self-start font-medium text-ember-300 hover:text-ember-100">
              Explore the {obj.name} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </li>
      ))}
    </ol>
  );
}
