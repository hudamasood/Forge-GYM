"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  tone: Tone;
  title: string;
  description?: string;
}

const ToastContext = React.createContext<{ toast: (t: Omit<ToastItem, "id">) => void } | null>(null);

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info } as const;
const TONES = {
  success: "border-success-light/40 [&_svg]:text-success-light",
  error: "border-error-light/40 [&_svg]:text-error-light",
  info: "border-steel-400/40 [&_svg]:text-steel-300",
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const nextId = React.useRef(0);

  const dismiss = React.useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), []);
  const toast = React.useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = ++nextId.current;
      setItems((all) => [...all.slice(-3), { ...t, id }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2">
        {items.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className={cn("pointer-events-auto flex animate-fade-up items-start gap-3 rounded-xl border bg-ink-800 p-4 shadow-warm-lg", TONES[t.tone])}
            >
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
              <div className="flex-1">
                <p className="text-sm font-semibold text-bone-50">{t.title}</p>
                {t.description && <p className="mt-0.5 text-sm text-ink-300">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="rounded p-1 text-ink-300 hover:text-bone-50" aria-label="Dismiss notification">
                <X className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx.toast;
}
