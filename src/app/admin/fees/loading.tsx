import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function FeesLoading() {
  return (
    <div className="space-y-6">
      <div className="ui-card p-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-8 w-36" />
      </div>
      <TableSkeleton rows={6} />
    </div>
  );
}
