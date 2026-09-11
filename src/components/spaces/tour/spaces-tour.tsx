"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { activeZone } from "./camera-path";
import type { TourQuality } from "./scene";

/** Heavy Three.js bundle: code-split and loaded only on this page, only when WebGL is usable (spec C1). */
const TourScene = dynamic(() => import("./scene"), { ssr: false, loading: () => null });

export interface TourZone {
  slug: string;
  name: string;
  tagline: string;
  description: string;
}

type Capability = "pending" | "none" | TourQuality;

function detectCapability(): Capability {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "none";
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return "none";
  } catch {
    return "none";
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const small = window.matchMedia("(max-width: 767px)").matches;
  if (cores <= 2 || memory <= 2) return "none";
  return small || cores <= 4 || memory <= 4 ? "low" : "high";
}

/**
 * Scroll-driven 3D tour (spec A10). The readable HTML list of spaces is
 * rendered by the page regardless; this component only enhances it where the
 * device can handle real-time 3D.
 */
export function SpacesTour({ zones }: { zones: TourZone[] }) {
  const [capability, setCapability] = React.useState<Capability>("pending");
  const [current, setCurrent] = React.useState(-1);
  const container = React.useRef<HTMLElement>(null);
  const progress = React.useRef(0);

  React.useEffect(() => setCapability(detectCapability()), []);

  React.useEffect(() => {
    if (capability === "pending" || capability === "none" || !container.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const trigger = ScrollTrigger.create({
      trigger: container.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progress.current = self.progress;
        setCurrent(activeZone(self.progress, zones.length));
      },
    });
    return () => trigger.kill();
  }, [capability, zones.length]);

  if (capability === "none") return null;

  return (
    // Visual enhancement only: the accessible, crawlable version of this content is the list rendered below it.
    <section aria-hidden="true" ref={container} className="relative" style={{ height: `${(zones.length + 2) * 100}svh` }}>
      <div className="sticky top-0 h-svh overflow-hidden">
        {capability !== "pending" && <TourScene zones={zones} progress={progress} quality={capability} />}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_120%,transparent_40%,rgba(18,17,16,0.85))]" />

        {/* Progress rail */}
        <ol className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:flex">
          {zones.map((z, i) => (
            <li key={z.slug} className="flex items-center justify-end gap-3">
              <span className={cn("text-xs uppercase tracking-widest transition-opacity duration-300", current === i ? "text-bone-50 opacity-100" : "opacity-0")}>{z.name.split(" /")[0]}</span>
              <span className={cn("block h-8 w-1 rounded-full transition-colors duration-300", current === i ? "bg-ember-400" : "bg-bone-50/20")} />
            </li>
          ))}
        </ol>
      </div>

      {/* Scroll-synced copy, one screen per stop, laid over the sticky canvas */}
      <div className="absolute inset-0">
        <div className="flex h-svh items-end pb-16 sm:items-center sm:pb-0">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="max-w-lg rounded-3xl border border-bone-50/10 bg-ink-900/70 p-7 backdrop-blur-md">
              <p className="font-display text-xs tracking-[0.3em] text-ember-400">FORGE · THE BUILDING</p>
              <p className="mt-3 font-display text-5xl font-semibold uppercase leading-none text-bone-50">Walk the floor</p>
              <p className="mt-3 text-bone-200">Scroll to move through all six spaces — every one built and equipped for a single discipline.</p>
              <p className="mt-5 flex items-center gap-2 text-sm text-ink-300">
                <ArrowDown className="size-4 animate-bounce" aria-hidden /> Scroll to begin
              </p>
            </div>
          </div>
        </div>
        {zones.map((z, i) => (
          <div key={z.slug} className="flex h-svh items-end pb-16 sm:items-center sm:pb-0">
            <div className={cn("mx-auto flex w-full max-w-7xl px-5 sm:px-8", i % 2 ? "justify-end" : "justify-start")}>
              <article
                className={cn(
                  "max-w-md rounded-3xl border bg-ink-900/75 p-7 backdrop-blur-md transition-[opacity,transform,border-color] duration-500",
                  current === i ? "translate-y-0 border-ember-400/40 opacity-100" : "translate-y-4 border-bone-50/10 opacity-60",
                )}
              >
                <p className="font-display text-xs tracking-[0.3em] text-ember-400">SPACE 0{i + 1}</p>
                <p className="mt-2 font-display text-4xl font-semibold uppercase leading-none text-bone-50">{z.name}</p>
                <p className="mt-2 text-bone-100">{z.tagline}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-300">{z.description}</p>
                <Link href={`/spaces/${z.slug}`} tabIndex={-1} className="group mt-5 inline-flex items-center gap-2 text-sm font-medium text-ember-300 hover:text-ember-100">
                  Explore the {z.name.split(" /")[0]} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </article>
            </div>
          </div>
        ))}
        <div className="h-svh" />
      </div>
    </section>
  );
}
