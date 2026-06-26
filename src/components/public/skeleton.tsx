export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`ethos-skeleton ${className}`} aria-hidden />;
}

export function SkeletonCard() {
  return (
    <div className="ethos-card flex h-full flex-col p-7">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      <Skeleton className="mt-5 h-6 w-3/4 rounded" />
      <Skeleton className="mt-2 h-6 w-2/3 rounded" />
      <Skeleton className="mt-4 h-3 w-full rounded" />
      <Skeleton className="mt-2 h-3 w-5/6 rounded" />
      <Skeleton className="mt-5 h-4 w-24 rounded" />
    </div>
  );
}
