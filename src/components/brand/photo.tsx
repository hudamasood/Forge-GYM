import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SiteImage } from "@/lib/imagery";

/**
 * A cover-cropped photograph with the FORGE grade: slightly desaturated,
 * a touch more contrast and an ink vignette so shots from different
 * photographers sit together on the dark UI. Renders `fallback` (the
 * branded ArtPanel/Monogram) when there is no photo for the record.
 */
export function Photo({
  image,
  sizes,
  className,
  imgClassName,
  priority,
  decorative,
  grade = true,
  fallback,
}: {
  image: SiteImage | null;
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  /** Next to a visible title the photo adds no information — hide it from screen readers. */
  decorative?: boolean;
  grade?: boolean;
  fallback?: React.ReactNode;
}) {
  if (!image) return <>{fallback ?? null}</>;
  return (
    <div className={cn("relative isolate overflow-hidden bg-ink-950", className)} aria-hidden={decorative || undefined}>
      <Image
        src={image.src}
        alt={decorative ? "" : image.alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={80}
        className={cn("object-cover", grade && "[filter:saturate(0.88)_contrast(1.06)]", imgClassName)}
      />
      {grade && <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_55%,rgba(18,17,16,0.55))]" />}
    </div>
  );
}
