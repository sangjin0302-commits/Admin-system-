import { Skeleton } from "@/components/public/skeleton";

export default function GazetteLoading() {
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

      {/* 목록 자리 (8행) */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:gap-5">
                <div className="flex shrink-0 gap-2 sm:w-40 sm:flex-col">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="mt-2 h-3 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
