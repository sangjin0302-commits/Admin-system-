import { Card } from "@/components/ui/card";

export function InquiryDashboardSummary({
  totalCount,
  urgentCount,
  waitingCount,
  assignedCount
}: {
  totalCount: number;
  urgentCount: number;
  waitingCount: number;
  assignedCount: number;
}) {
  const items = [
    { label: "전체 문의", value: totalCount },
    { label: "긴급 검토", value: urgentCount },
    { label: "상담 필요", value: waitingCount },
    { label: "담당자 지정", value: assignedCount }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} muted className="p-5">
          <p className="ui-kicker">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold text-text-strong">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
