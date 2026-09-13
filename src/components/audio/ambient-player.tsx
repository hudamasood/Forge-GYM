"use client";

import * as React from "react";
import { Pause, Play, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The FORGE lobby soundtrack. Browsers block audio until the visitor acts,
 * so nothing plays until the button is pressed; the choice is remembered
 * and resumed on the next interaction. Lives in the site layout, so the
 * music carries on across client-side navigations. Tracks: Mixkit Stock
 * Music Free License (public/audio/CREDITS.md).
 */
const PLAYLIST = [
  { src: "/audio/autofahren.m4a", title: "Autofahren", artist: "Mauro Urbina" },
  { src: "/audio/close-the-lights.m4a", title: "Close the Lights", artist: "Michael Ramir C." },
  { src: "/audio/house-one.m4a", title: "House One", artist: "Francisco Alvear" },
] as const;

const STORAGE_KEY = "forge:ambient";
const VOLUME = 0.35;
const FADE_MS = 1200;

function readPref() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function writePref(on: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Storage can be blocked (private mode); the player still works for this visit.
  }
}

export function AmbientPlayer() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const fadeRef = React.useRef<number | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [track, setTrack] = React.useState(0);
  const current = PLAYLIST[track];

  // A timer rather than requestAnimationFrame: rAF is suspended in hidden tabs, which would stall a fade-out mid-way.
  const fadeTo = React.useCallback((target: number, done?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeRef.current) window.clearInterval(fadeRef.current);
    const from = audio.volume;
    const start = performance.now();
    fadeRef.current = window.setInterval(() => {
      const t = Math.min((performance.now() - start) / FADE_MS, 1);
      audio.volume = from + (target - from) * t;
      if (t < 1) return;
      window.clearInterval(fadeRef.current!);
      fadeRef.current = null;
      done?.();
    }, 30);
  }, []);

  const play = React.useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0;
    try {
      await audio.play();
      setPlaying(true);
      writePref(true);
      fadeTo(VOLUME);
    } catch {
      setPlaying(false);
    }
  }, [fadeTo]);

  const pause = React.useCallback(() => {
    setPlaying(false);
    writePref(false);
    fadeTo(0, () => audioRef.current?.pause());
  }, [fadeTo]);

  const next = () => setTrack((i) => (i + 1) % PLAYLIST.length);

  // Returning visitors who left the music on get it back on their first interaction.
  React.useEffect(() => {
    if (!readPref()) return;
    const events = ["pointerdown", "keydown"] as const;
    const stop = () => events.forEach((e) => window.removeEventListener(e, resume));
    function resume(event: Event) {
      // Interactions with the player itself are handled by its own buttons.
      if (rootRef.current?.contains(event.target as Node)) return stop();
      stop();
      void play();
    }
    events.forEach((e) => window.addEventListener(e, resume));
    return stop;
  }, [play]);

  // A track change (skip or natural end) keeps playing if we were playing.
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playing) return;
    audio.volume = VOLUME;
    void audio.play().catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]);

  React.useEffect(() => () => {
    if (fadeRef.current) window.clearInterval(fadeRef.current);
  }, []);

  return (
    <div ref={rootRef} className="fixed bottom-4 left-4 z-[55] print:hidden">
      <audio ref={audioRef} src={current.src} preload="none" onEnded={next} />
      <div
        className={cn(
          "group flex items-center gap-1 rounded-full border border-bone-50/10 bg-ink-950/75 p-1 text-bone-100 shadow-warm-lg backdrop-blur-md transition-[border-color] duration-300",
          playing && "border-ember-400/35",
        )}
      >
        <button
          type="button"
          onClick={() => (playing ? pause() : void play())}
          aria-pressed={playing}
          aria-label={playing ? "Pause ambient music" : "Play ambient music"}
          className="relative grid size-10 place-items-center rounded-full bg-bone-50/5 transition-colors hover:bg-ember-500/25 focus-visible:outline-offset-2"
        >
          {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4 translate-x-px" aria-hidden />}
        </button>

        <div className="flex items-center gap-3 overflow-hidden pr-1">
          <span aria-hidden className="flex h-4 items-end gap-[3px] pl-1">
            {[0, 1, 2, 3].map((bar) => (
              <span
                key={bar}
                className={cn("h-full w-[3px] origin-bottom rounded-full bg-ember-400", playing ? "animate-eq" : "scale-y-[0.3] opacity-60")}
                style={playing ? { animationDelay: `${bar * -0.27}s`, animationDuration: `${0.9 + bar * 0.15}s` } : undefined}
              />
            ))}
          </span>
          <span className="hidden max-w-0 flex-col overflow-hidden whitespace-nowrap leading-tight opacity-0 transition-[max-width,opacity] duration-500 ease-[var(--ease-forge)] group-focus-within:max-w-48 group-focus-within:opacity-100 group-hover:max-w-48 group-hover:opacity-100 sm:flex">
            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-ember-300">{playing ? "Now playing" : "FORGE sound"}</span>
            <span className="truncate text-xs text-bone-100">
              {current.title} · {current.artist}
            </span>
          </span>
        </div>

        {playing && (
          <button
            type="button"
            onClick={next}
            aria-label={`Next track (now playing ${current.title})`}
            className="grid size-8 place-items-center rounded-full text-bone-200 transition-colors hover:bg-bone-50/10 hover:text-bone-50"
          >
            <SkipForward className="size-3.5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
