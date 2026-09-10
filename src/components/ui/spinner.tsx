import { cn } from "@/lib/utils";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn("inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent", className)}>
      <span className="sr-only">{label}</span>
    </span>
  );
}
