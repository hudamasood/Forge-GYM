import { Container } from "@/components/layout/section";
import { CardSkeleton, Skeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <Container className="flex flex-col gap-10 py-20">
      <Skeleton className="h-16 w-2/3 max-w-xl" />
      <div role="status" aria-label="Loading products" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <CardSkeleton key={i} variant="product" />
        ))}
      </div>
    </Container>
  );
}
