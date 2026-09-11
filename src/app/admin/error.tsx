"use client";

import { ErrorState } from "@/components/ui/states";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState message="We couldn't load this admin page right now." onRetry={reset} />;
}
