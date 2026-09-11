import { Container } from "@/components/layout/section";
import { GridSkeleton, Skeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <Container className="flex flex-col gap-10 py-20">
      <Skeleton className="h-16 w-2/3 max-w-xl" />
      <GridSkeleton variant="trainer" />
    </Container>
  );
}
