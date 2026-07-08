export function DashboardLoadingSkeleton({ variant = "table" }: { variant?: "table" | "stats" | "list" }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="ethos-skeleton h-3 w-24 rounded" />
        <div className="ethos-skeleton h-8 w-64 rounded" />
        <div className="ethos-skeleton h-4 w-96 rounded" />
      </div>

      {variant !== "list" && (
        <div className="grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-gold/20 bg-surface p-5">
              <div className="ethos-skeleton h-3 w-20 rounded" />
              <div className="ethos-skeleton mt-3 h-8 w-16 rounded" />
            </div>
          ))}
        </div>
      )}

      {variant === "table" && (
        <div className="rounded-lg border border-gold/20 bg-surface p-5">
          <div className="ethos-skeleton h-4 w-32 rounded" />
          <div className="mt-4 space-y-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="ethos-skeleton h-5 w-16 rounded" />
                <div className="ethos-skeleton h-5 flex-1 rounded" />
                <div className="ethos-skeleton h-5 w-24 rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "list" && (
        <div className="rounded-lg border border-gold/20 bg-surface p-5">
          <div className="ethos-skeleton h-4 w-32 rounded" />
          <ul className="mt-4 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="ethos-skeleton h-6 w-12 shrink-0 rounded" />
                <div className="ethos-skeleton h-5 flex-1 rounded" />
                <div className="ethos-skeleton h-4 w-20 rounded" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
