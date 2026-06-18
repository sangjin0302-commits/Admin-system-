import { Skeleton, ChartSkeleton } from "@/components/ui/skeleton";

export default function MonitoringLoading() {
  return (
    <div className="space-y-6">
      <div className="ui-card p-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-8 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="ui-card space-y-3 p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <ChartSkeleton />
    </div>
  );
}
