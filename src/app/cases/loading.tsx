import { SkeletonCard } from "@/components/public/skeleton";

export default function CasesLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="ethos-skeleton mx-auto h-8 w-48 rounded" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
