"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/section";
import { ErrorState } from "@/components/ui/states";

/** Designed error state with retry for every public data-driven page (spec B4). */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Container className="py-24">
      <ErrorState message="We couldn't load this page right now. Please try again." onRetry={reset} />
    </Container>
  );
}
