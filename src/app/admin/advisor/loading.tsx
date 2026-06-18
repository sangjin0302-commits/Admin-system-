import { Skeleton } from "@/components/ui/skeleton";

export default function AdvisorLoading() {
  return (
    <div className="space-y-6">
      <div className="ui-card p-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-8 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="ui-card space-y-3 p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
