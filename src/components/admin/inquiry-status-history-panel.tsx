import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

export type InquiryStatusHistoryItem = {
  id: string;
  createdAt: string;
  previousStatusLabel: string;
  nextStatusLabel: string;
  reason: string | null;
  source: string | null;
};

const sourceLabels: Record<string, string> = {
  management_form: "관리 폼",
  status_panel: "상태 패널",
  automation: "자동 액션",
  api: "API",
  unknown: "기타"
};

export function InquiryStatusHistoryPanel({
  items
}: {
  items: InquiryStatusHistoryItem[];
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-2">
        <p className="ui-kicker">Status History</p>
        <h3 className="ui-section-title">상태 변경 이력</h3>
        <p className="text-sm text-text-muted">누가 어떤 경로로 상태를 변경했는지 최근 이력을 확인합니다.</p>
      </div>

      <div className="mt-5 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <Card key={item.id} muted className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{item.previousStatusLabel}</Badge>
                  <span className="text-xs text-text-muted">→</span>
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{item.nextStatusLabel}</Badge>
                </div>
                <p className="text-xs text-text-muted">{formatDateTime(item.createdAt)}</p>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-text sm:grid-cols-2">
                <p>변경 사유: {item.reason || "-"}</p>
                <p>변경 출처: {item.source ? (sourceLabels[item.source] ?? item.source) : "-"}</p>
              </div>
            </Card>
          ))
        ) : (
          <Card muted className="p-4">
            <p className="text-sm text-text-muted">아직 기록된 상태 변경 이력이 없습니다.</p>
          </Card>
        )}
      </div>
    </Card>
  );
}

