"use client";

import { ErrorState } from "@/components/ui/states";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState message="We couldn't load your account right now." onRetry={reset} />;
}
