import { Skeleton, SkeletonCard } from "@/components/public/skeleton";

export default function BlogLoading() {
  return (
    <div className="overflow-x-clip">
      {/* 히어로 자리 */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-col items-center">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="mt-6 h-12 w-64 rounded sm:w-96" />
            <Skeleton className="mt-6 h-4 w-72 rounded sm:w-[28rem]" />
            <Skeleton className="mt-2 h-4 w-56 rounded sm:w-80" />
          </div>
        </div>
      </section>

      {/* 카드 그리드 자리 (6개) */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
