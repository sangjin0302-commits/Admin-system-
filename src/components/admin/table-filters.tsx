"use client";

type FilterOption = {
  value: string;
  label: string;
};

type FilterDefinition = {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
};

type TableFiltersProps = {
  filters: FilterDefinition[];
  onChange: (values: Record<string, string>) => void;
};

export function TableFilters({ filters, onChange }: TableFiltersProps) {
  function handleChange(key: string, newValue: string) {
    const current: Record<string, string> = {};
    for (const f of filters) {
      current[f.key] = f.key === key ? newValue : f.value;
    }
    onChange(current);
  }

  function handleReset() {
    const reset: Record<string, string> = {};
    for (const f of filters) {
      reset[f.key] = "";
    }
    onChange(reset);
  }

  const hasActiveFilter = filters.some((f) => f.value !== "");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={filter.value}
          onChange={(e) => handleChange(filter.key, e.target.value)}
          className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-text-strong focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">{filter.label} 전체</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
      {hasActiveFilter && (
        <button
          type="button"
          onClick={handleReset}
          className="h-9 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
        >
          초기화
        </button>
      )}
    </div>
  );
}

export type { FilterDefinition, FilterOption };
