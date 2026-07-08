import { Skeleton, SkeletonCard } from "@/components/public/skeleton";

export default function ServicesLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <Skeleton className="mx-auto h-8 w-48 rounded" />
      <Skeleton className="mx-auto mt-3 h-4 w-72 rounded" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
