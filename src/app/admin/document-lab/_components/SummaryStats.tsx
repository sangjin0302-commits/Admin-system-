import { Card } from "@/components/ui/card";
import type { DocumentTemplateOfficialSourceStatus } from "@/lib/document-templates";

type ReadinessSummary = {
  totalTemplates: number;
  readyCandidateCount: number;
  sourceNeededCount: number;
  conversionTestNeededCount: number;
  manualOnlyCount: number;
};

export function SummaryStats({
  readinessSummary,
  officialSourceStatusSummary
}: {
  readinessSummary: ReadinessSummary;
  officialSourceStatusSummary: Record<DocumentTemplateOfficialSourceStatus, number>;
}) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">전체 목록</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{readinessSummary.totalTemplates}</p>
          <p className="mt-1 text-xs text-text-muted">등록된 후보 서식</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">준비 후보</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{readinessSummary.readyCandidateCount}</p>
          <p className="mt-1 text-xs text-text-muted">준비 후보</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">원본 필요</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{readinessSummary.sourceNeededCount}</p>
          <p className="mt-1 text-xs text-text-muted">원본 필요</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">변환 테스트</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">
            {readinessSummary.conversionTestNeededCount}
          </p>
          <p className="mt-1 text-xs text-text-muted">변환 테스트 필요</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">수동 작성</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{readinessSummary.manualOnlyCount}</p>
          <p className="mt-1 text-xs text-text-muted">수동 작성 유지</p>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">공식 출처 확인</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{officialSourceStatusSummary.verified}</p>
          <p className="mt-1 text-xs text-text-muted">공식 출처 확인</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">출처 검토</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{officialSourceStatusSummary.needs_review}</p>
          <p className="mt-1 text-xs text-text-muted">최신성 확인 필요</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">출처 대기</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{officialSourceStatusSummary.pending}</p>
          <p className="mt-1 text-xs text-text-muted">공식 출처 미확인</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">수동 작성</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{officialSourceStatusSummary.manual_only}</p>
          <p className="mt-1 text-xs text-text-muted">수동 작성 유지</p>
        </Card>
      </div>
    </>
  );
}
