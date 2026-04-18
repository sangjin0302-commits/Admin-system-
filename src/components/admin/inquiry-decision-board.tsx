"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { NotionReferenceRecommendations } from "@/lib/integrations/notion";
import type { InquiryCaseAnalysis } from "@/lib/services/case-analysis-service";
import type { LawbotCaseAnalysisResult } from "@/lib/services/lawbot-case-analysis-service";

type InquiryDecisionBoardProps = {
  analysis: InquiryCaseAnalysis;
  lawbotAnalysis: LawbotCaseAnalysisResult;
  references: NotionReferenceRecommendations;
  qualificationScore: number;
};

export function InquiryDecisionBoard({
  analysis,
  lawbotAnalysis,
  references,
  qualificationScore,
}: InquiryDecisionBoardProps) {
  const lawbotLaws =
    lawbotAnalysis.status === "available" ? lawbotAnalysis.data.applicable_laws.slice(0, 3) : [];
  const lawbotPrecedents =
    lawbotAnalysis.status === "available" ? lawbotAnalysis.data.related_precedents?.slice(0, 2) ?? [] : [];
  const lawbotInterpretations =
    lawbotAnalysis.status === "available" ? lawbotAnalysis.data.related_interpretations?.slice(0, 2) ?? [] : [];

  const immediateChecklist = [
    ...analysis.immediateActions,
    ...analysis.missingFacts.slice(0, 3),
    ...(lawbotAnalysis.status === "available" ? lawbotAnalysis.data.followup_facts.slice(0, 2) : []),
  ].filter((item, index, list) => Boolean(item) && list.indexOf(item) === index);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="ui-section-title">사건 판단 보드</h3>
          <p className="mt-2 text-sm text-text-muted">
            사건 접수 직후 바로 확인해야 할 판단 근거, 법령/판례/해석례, 다음 실행 순서를 한 번에 모아봅니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{analysis.strengthLabel}</Badge>
          <Badge>{`해결 가능성 ${analysis.resolutionProbabilityPercent}/100`}</Badge>
          <Badge>{`수임 적합도 ${qualificationScore}/100`}</Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <MetricCard label="사건 강도" value={analysis.strengthLabel} note={`${analysis.strengthScore}점 기준`} />
        <MetricCard label="해결 전망" value={analysis.resolutionOutlook} note={analysis.confidenceNote} />
        <MetricCard
          label="즉시 권장 경로"
          value={analysis.recommendedAction}
          note="자료 요청, 상담 연결, 견적 진행 중 우선 경로"
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card muted className="p-5">
          <p className="ui-kicker">바로 확인할 체크리스트</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text">
            {immediateChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
        <Card muted className="p-5">
          <p className="ui-kicker">참고 자원 연결 상태</p>
          <div className="mt-3 space-y-2 text-sm text-text">
            <p>내부 참고자료: {references.materials.length}건</p>
            <p>참고 홈페이지: {references.websites.length}건</p>
            <p>Lawbot 법령 요약: {lawbotLaws.length}건</p>
            <p>Lawbot 참고 판례: {lawbotPrecedents.length}건</p>
            <p>Lawbot 참고 해석례: {lawbotInterpretations.length}건</p>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <CompactList
          title="우선 검토 법령"
          emptyMessage="추가 법령 추천이 아직 없습니다."
          items={lawbotLaws.map((item) => `${item.law}: ${item.summary}`)}
        />
        <CompactList
          title="우선 참고 판례"
          emptyMessage="표시할 참고 판례가 없습니다."
          items={lawbotPrecedents.map((item) => `${item.case_name} (${item.case_number})`)}
        />
        <CompactList
          title="우선 참고 해석례"
          emptyMessage="표시할 참고 해석례가 없습니다."
          items={lawbotInterpretations.map((item) => `${item.title}${item.number ? ` (${item.number})` : ""}`)}
        />
      </div>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{label}</p>
      <p className="mt-3 text-lg font-semibold text-text-strong">{value}</p>
      <p className="mt-2 text-sm text-text-muted">{note}</p>
    </Card>
  );
}

function CompactList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: string[];
  emptyMessage: string;
}) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text">
          {items.map((item) => (
            <li key={`${title}-${item}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-text-muted">{emptyMessage}</p>
      )}
    </Card>
  );
}

