import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function LedgerLoading() {
  return (
    <div className="space-y-6">
      <div className="ui-card p-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-8 w-56" />
      </div>
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-md" />
        ))}
      </div>
      <TableSkeleton rows={10} />
    </div>
  );
}
