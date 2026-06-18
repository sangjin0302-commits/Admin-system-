import { StatSkeleton, ChartSkeleton } from "@/components/ui/skeleton";

export default function StatsLoading() {
  return (
    <div className="space-y-6">
      <div className="ui-card p-6">
        <div className="h-3 w-16 animate-pulse rounded bg-surface-muted" />
        <div className="mt-3 h-8 w-48 animate-pulse rounded bg-surface-muted" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-surface-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
      <ChartSkeleton />
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  );
}
