import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { detailRiskToneClass, type DetailRiskHighlight } from "@/lib/services/inquiry-detail-view-helpers";
import type { InquiryStatus, LanguageCode, UrgencyLevel } from "@/types/inquiry";

type AnalysisHubSignal = {
  title: string;
  status: string;
  description: string;
  accents: string[];
};

type CrossAnalysisSummary = {
  headline: string;
  summary: string;
  points: string[];
};

type MockMarketAnalyzeSignal = {
  status: string;
  summary: string;
  metrics: { label: string; value: string }[];
  highlights: string[];
};

type ExternalInsightSlot = {
  title: string;
  status: string;
  description: string;
  placeholders: string[];
};

export function InquiryDetailHeaderCard(input: {
  status: InquiryStatus;
  urgency: UrgencyLevel;
  language: LanguageCode;
  statusLabel: string;
  urgencyLabel: string;
  inquiryTypeLabel: string;
  languageLabel: string;
  title: string;
  generatedSummary: string;
  inquiryReceiptCode: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  contactName: string;
  email: string;
  phone?: string | null;
  clientTypeLabel: string;
  isCorporateRequest: boolean;
  sidePanel: ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="status" status={input.status}>{input.statusLabel}</Badge>
            <Badge tone="urgency" urgency={input.urgency}>{input.urgencyLabel}</Badge>
            <Badge>{input.inquiryTypeLabel}</Badge>
            <Badge tone="language" language={input.language}>{input.languageLabel}</Badge>
          </div>
          <h2 className="mt-4 ui-page-title">{input.title}</h2>
          <p className="mt-3 max-w-3xl text-sm text-text">{input.generatedSummary}</p>
          <div className="mt-4 grid gap-2 text-sm text-text-muted sm:grid-cols-2 xl:grid-cols-3">
            <p className="truncate whitespace-nowrap">접수번호: {input.inquiryReceiptCode}</p>
            <p className="truncate whitespace-nowrap">접수일: {input.createdAtLabel}</p>
            <p className="truncate whitespace-nowrap">업데이트: {input.updatedAtLabel}</p>
            <p className="truncate whitespace-nowrap">이름: {input.contactName}</p>
            <p className="truncate whitespace-nowrap">이메일: {input.email}</p>
            <p className="truncate whitespace-nowrap">연락처: {input.phone || "-"}</p>
            <p className="truncate whitespace-nowrap">의뢰 형태: {input.clientTypeLabel}</p>
            <p className="truncate whitespace-nowrap">기업 의뢰 여부: {input.isCorporateRequest ? "예" : "아니오"}</p>
          </div>
        </div>
        <div className="w-full max-w-md">{input.sidePanel}</div>
      </div>
    </Card>
  );
}

export function InquiryDetailQuickNav() {
  return (
    <Card className="sticky top-3 z-20 border-line-strong bg-white/95 p-4 shadow-panel backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="상세 화면 빠른 이동" className="flex flex-wrap items-center gap-2">
          <span className="ui-kicker mr-1">빠른 이동</span>
          <a href="#detail-risk-board" className="ui-analysis-chip">
            리스크 보드
          </a>
          <a href="#detail-core-ops" className="ui-analysis-chip">
            운영/상태
          </a>
          <a href="#detail-evidence" className="ui-analysis-chip">
            문의 원문
          </a>
          <a href="#detail-communication" className="ui-analysis-chip">
            커뮤니케이션
          </a>
          <a href="#detail-lawbot" className="ui-analysis-chip">
            Lawbot
          </a>
          <a href="#detail-quote" className="ui-analysis-chip">
            견적 워크스페이스
          </a>
        </nav>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/inquiries"
            className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-border-strong hover:bg-surface-muted"
          >
            문의 목록
          </Link>
          <a
            href="#communication-center"
            className="inline-flex items-center justify-center rounded-full border border-primary bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-[#143d5d]"
          >
            문안/연락 바로가기
          </a>
        </div>
      </div>
    </Card>
  );
}

export function InquiryDetailRiskBoard(input: {
  detailRiskHighlights: DetailRiskHighlight[];
  detailImmediateActions: string[];
}) {
  return (
    <div id="detail-risk-board" className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="p-6">
        <p className="ui-kicker">Risk Board</p>
        <h3 className="mt-2 ui-section-title">핵심 리스크 신호</h3>
        <p className="mt-2 text-sm text-text-muted">
          실수 위험이 큰 항목을 먼저 보여주고, 바로 후속 액션으로 연결할 수 있도록 정리했습니다.
        </p>
        {input.detailRiskHighlights.length > 0 ? (
          <div className="mt-5 space-y-3">
            {input.detailRiskHighlights.map((item) => (
              <Card key={`${item.title}-${item.description}`} muted className={`border p-4 ${detailRiskToneClass(item.tone)}`}>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-2 text-sm">{item.description}</p>
              </Card>
            ))}
          </div>
        ) : (
          <Card muted className="mt-5 p-4">
            <p className="text-sm text-text-muted">현재 감지된 고위험 리스크 신호는 없습니다.</p>
          </Card>
        )}
      </Card>

      <Card className="p-6">
        <p className="ui-kicker">Immediate Actions</p>
        <h3 className="mt-2 ui-section-title">즉시 조치 체크리스트</h3>
        <p className="mt-2 text-sm text-text-muted">
          담당자가 바로 실행할 수 있는 단계로만 추려 우선 순서대로 제시합니다.
        </p>
        <ul className="mt-5 list-decimal space-y-2 pl-5 text-sm text-text">
          {input.detailImmediateActions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function InquiryDetailAnalysisHub(input: {
  analysisHubSignals: AnalysisHubSignal[];
  crossAnalysisSummary: CrossAnalysisSummary;
  mockMarketAnalyzeSignal: MockMarketAnalyzeSignal;
  externalInsightSlots: ExternalInsightSlot[];
}) {
  return (
    <Card className="ui-analysis-hero p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <p className="ui-kicker">Analysis Hub</p>
          <h3 className="mt-3 ui-section-title">System, Lawbot, Market Analyze를 위한 멀티엔진 사건 허브</h3>
          <p className="mt-3 text-sm text-text">
            현재 화면은 고객 사건을 중심으로 `system` 운영 판단, `Lawbot` 법률 분석, 이후 연결될 `market-analyze`
            인사이트까지 같은 허브 안에서 읽히도록 설계되어 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="ui-analysis-chip">고객 사건 중심</span>
          <span className="ui-analysis-chip">Lawbot 연동 준비</span>
          <span className="ui-analysis-chip">Market Analyze 슬롯 확보</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        {input.analysisHubSignals.map((signal) => (
          <div key={signal.title} className="ui-analysis-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-text-strong">{signal.title}</p>
              <span className="rounded-full border border-line-strong bg-white/85 px-3 py-1 text-[11px] font-semibold text-text-muted">
                {signal.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-text-muted">{signal.description}</p>
            <div className="mt-4 space-y-2">
              {signal.accents.map((item) => (
                <div key={`${signal.title}-${item}`} className="rounded-2xl border border-line/80 bg-white/80 px-3 py-2 text-sm text-text">
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="ui-analysis-summary p-5">
          <p className="ui-kicker">Cross Analysis</p>
          <p className="mt-3 text-lg font-semibold text-text-strong">{input.crossAnalysisSummary.headline}</p>
          <p className="mt-3 text-sm text-text">{input.crossAnalysisSummary.summary}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {input.crossAnalysisSummary.points.map((item) => (
              <div key={item} className="rounded-2xl border border-line/80 bg-white/80 px-3 py-3 text-sm text-text">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="ui-analysis-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-text-strong">Mock Market Analyze</p>
              <span className="rounded-full border border-line-strong bg-white/85 px-3 py-1 text-[11px] font-semibold text-text-muted">
                {input.mockMarketAnalyzeSignal.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-text-muted">{input.mockMarketAnalyzeSignal.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {input.mockMarketAnalyzeSignal.metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-line/80 bg-white/80 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">{metric.label}</p>
                  <p className="mt-2 text-sm font-semibold text-text-strong">{metric.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {input.mockMarketAnalyzeSignal.highlights.map((item) => (
                <div key={item} className="rounded-2xl border border-line/80 bg-white/80 px-3 py-2 text-sm text-text">
                  {item}
                </div>
              ))}
            </div>
          </div>

          {input.externalInsightSlots.map((slot) => (
            <div key={slot.title} className="ui-insight-slot p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-text-strong">{slot.title}</p>
                <span className="rounded-full border border-line-strong bg-white/80 px-3 py-1 text-[11px] font-semibold text-text-muted">
                  {slot.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-text-muted">{slot.description}</p>
              <div className="mt-4 space-y-2">
                {slot.placeholders.map((item) => (
                  <div key={`${slot.title}-${item}`} className="rounded-2xl border border-dashed border-line-strong bg-white/75 px-3 py-2 text-sm text-text-muted">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
