import { Skeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-6">
      <Skeleton className="h-12 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
