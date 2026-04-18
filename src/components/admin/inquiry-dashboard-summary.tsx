import Link from "next/link";

import { Card } from "@/components/ui/card";

type ActionItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "urgent" | "deadline" | "quote" | "docs" | "consult";
};

export type InquiryDashboardSummaryProps = {
  totalCount: number;
  todayActionCount: number;
  nextThreeDaysCount: number;
  quotePendingCount: number;
  docsPendingCount: number;
  consultationNeededCount: number;
  responsePendingCount: number;
  nextContactCount: number;
  checklistCoverageCount: number;
  checklistAvgPercent: number;
  checklistLowReadinessCount: number;
  actionItems: ActionItem[];
};

export function InquiryDashboardSummary({
  totalCount,
  todayActionCount,
  nextThreeDaysCount,
  quotePendingCount,
  docsPendingCount,
  consultationNeededCount,
  responsePendingCount,
  nextContactCount,
  checklistCoverageCount,
  checklistAvgPercent,
  checklistLowReadinessCount,
  actionItems
}: InquiryDashboardSummaryProps) {
  const items = [
    { label: "전체 접수", value: totalCount, hint: "누적 문의 및 사건 후보" },
    { label: "오늘 우선 처리", value: todayActionCount, hint: "긴급·당일 확인이 필요한 건" },
    { label: "3일 내 마감", value: nextThreeDaysCount, hint: "기한 임박 일정" },
    { label: "견적 대기", value: quotePendingCount, hint: "견적 작성·발송이 필요한 건" },
    { label: "자료 확인 필요", value: docsPendingCount, hint: "기본 서류 미보유 또는 확인 필요" },
    { label: "상담 필요", value: consultationNeededCount, hint: "상담 연결 또는 후속 응답 필요" },
    { label: "응답 대기", value: responsePendingCount, hint: "고객 답변이나 자료 회신을 기다리는 건" },
    { label: "다음 연락 예정", value: nextContactCount, hint: "3일 내 다시 연락해야 하는 건" },
    { label: "체크리스트 적용", value: checklistCoverageCount, hint: "즉시 조치 체크가 가능한 건" },
    { label: "평균 준비도", value: checklistAvgPercent, hint: "실행 체크리스트 평균 완료율(%)" },
    { label: "준비도 낮음", value: checklistLowReadinessCount, hint: "완료율 40% 이하 사건" }
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-11">
        {items.map((item) => (
          <Card key={item.label} muted className="p-5">
            <p className="ui-kicker">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-text-strong">{item.value}</p>
            <p className="mt-2 text-xs text-text-muted">{item.hint}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="ui-kicker">오늘의 액션 센터</p>
            <h3 className="mt-1 text-lg font-semibold text-text-strong">바로 확인할 항목</h3>
          </div>
          <p className="text-sm text-text-muted">지금 바로 열어봐야 하는 건만 추려서 보여줍니다.</p>
        </div>
        {actionItems.length > 0 ? (
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {actionItems.map((item) => (
              <Link key={item.id} href={item.href}>
                <Card muted className="p-4 transition hover:border-border-strong hover:bg-surface-muted">
                  <div className="flex items-center gap-2">
                    <span className={toneClassName(item.tone)} />
                    <p className="text-sm font-semibold text-text-strong">{item.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-text-muted">{item.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card muted className="mt-4 p-4">
            <p className="text-sm text-text-muted">지금 바로 처리할 항목은 없습니다. 신규 접수나 일정 변경이 생기면 이 영역에 우선 표시됩니다.</p>
          </Card>
        )}
      </Card>
    </div>
  );
}

function toneClassName(tone: ActionItem["tone"]) {
  if (tone === "urgent") return "h-2.5 w-2.5 rounded-full bg-danger";
  if (tone === "deadline") return "h-2.5 w-2.5 rounded-full bg-warning";
  if (tone === "quote") return "h-2.5 w-2.5 rounded-full bg-info";
  if (tone === "docs") return "h-2.5 w-2.5 rounded-full bg-accent";
  return "h-2.5 w-2.5 rounded-full bg-success";
}
