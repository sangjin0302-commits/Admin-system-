import { Card } from "@/components/ui/card";

type CompareField = {
  label: string;
  previous: string;
  current: string;
  changed: boolean;
};

type LawbotSnapshotCompareProps = {
  headline: string;
  description: string;
  fields: CompareField[];
};

export function LawbotSnapshotCompare({
  headline,
  description,
  fields
}: LawbotSnapshotCompareProps) {
  const changedCount = fields.filter((field) => field.changed).length;

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="ui-kicker">Snapshot Compare</p>
          <h3 className="mt-2 ui-section-title">{headline}</h3>
          <p className="mt-2 text-sm text-text-muted">{description}</p>
        </div>
        <div className="rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-semibold text-text-strong">
          변경 {changedCount}건
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {fields.map((field) => (
          <Card
            key={field.label}
            muted
            className={`p-4 ${field.changed ? "border-amber-200 bg-amber-50/60" : ""}`}
          >
            <p className="text-sm font-semibold text-text-strong">{field.label}</p>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">이전 저장값</p>
                <p className="mt-1 text-text">{field.previous}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">현재 비교값</p>
                <p className="mt-1 text-text">{field.current}</p>
              </div>
            </div>
            <p className={`mt-3 text-xs font-semibold ${field.changed ? "text-amber-700" : "text-emerald-700"}`}>
              {field.changed ? "변경 감지" : "변경 없음"}
            </p>
          </Card>
        ))}
      </div>
    </Card>
  );
}
