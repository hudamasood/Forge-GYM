"use client";

import { ErrorState } from "@/components/ui/states";

export default function TrainerError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState message="We couldn't load the trainer portal right now." onRetry={reset} />;
}
