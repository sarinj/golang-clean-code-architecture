import { Skeleton } from "@/components/ui/Skeleton";

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading page" className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 max-w-lg" />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-36 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
