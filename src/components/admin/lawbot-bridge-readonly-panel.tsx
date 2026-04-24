import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { LawbotBridgeReadonlySummary } from "@/lib/services/lawbot-bridge-readonly-summary-service";

const workflowStatusLabels: Record<string, string> = {
  NEW_INQUIRY: "새 문의",
  TRIAGE_REVIEW: "초기 분류 검토",
  AWAITING_MORE_FACTS: "추가 사실 필요",
  PROFILED: "프로파일 완료",
  PROFILE_REVIEW_REQUIRED: "프로파일 재검토 필요",
  CASE_CARD_CREATED: "사건 카드 생성",
  AWAITING_SOURCE_VERIFICATION: "출처 검증 대기",
  DRAFT_CREATED: "초안 생성",
  MESSAGE_DRAFT_CREATED: "고객 메시지 초안 생성",
  APPROVAL_PENDING: "승인 대기",
  APPROVED: "승인 완료",
  REVISION_REQUESTED: "수정 요청",
  BLOCKED: "차단됨",
  CLOSED: "종결"
};

function signalBadgeClass(status: LawbotBridgeReadonlySummary["executionStatus"]) {
  if (status === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-line-strong bg-surface text-text-strong";
}

function formatJsonValue(value: unknown) {
  if (value === null || value === undefined) {
    return "-";
  }
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).slice(0, 3).join(", ") || "-";
  }
  if (typeof value === "object") {
    return "세부 항목 있음";
  }
  return String(value);
}

function JsonObjectPreview({ value }: { value: Record<string, unknown> | null }) {
  if (!value) {
    return <p className="mt-2 text-sm text-text-muted">없음</p>;
  }

  const entries = Object.entries(value).slice(0, 4);
  if (entries.length === 0) {
    return <p className="mt-2 text-sm text-text-muted">없음</p>;
  }

  return (
    <div className="mt-2 space-y-2">
      {entries.map(([key, entry]) => (
        <div key={key} className="rounded-xl border border-line/80 bg-surface px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">{key}</p>
          <p className="mt-1 text-sm text-text">{formatJsonValue(entry)}</p>
        </div>
      ))}
    </div>
  );
}

function SignalList({
  label,
  items,
  tone = "default"
}: {
  label: string;
  items: string[];
  tone?: "default" | "risk";
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <Badge
              key={`${label}-${item}`}
              className={
                tone === "risk"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-line-strong bg-white text-text-strong"
              }
            >
              {item}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-text-muted">없음</span>
        )}
      </div>
    </div>
  );
}

function SupplementalReferencePanel({
  items
}: {
  items: LawbotBridgeReadonlySummary["reviewSignals"]["reviewerReferencePanel"]["items"];
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">참고자료 후보</p>
        <Badge className="border-amber-200 bg-amber-50 text-amber-800">
          내부 참고자료 후보 / 원문 확인 필요
        </Badge>
      </div>
      <p className="mt-2 text-sm text-text-muted">
        내부 아카이브 참고 후보이며, 법적 권위 근거가 아닙니다. 원문 확인 후 검토 보조용으로만 사용하세요.
      </p>

      {items.length > 0 ? (
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-line/80 bg-white px-3 py-3">
              <p className="text-sm font-semibold text-text-strong">{item.title}</p>

              <div className="mt-2 flex flex-wrap gap-2">
                <Badge className="border-line-strong bg-surface text-text-strong">
                  sourceType: {item.sourceType}
                </Badge>
                <Badge className="border-line-strong bg-surface text-text-strong">
                  trustLevel: {item.trustLevel}
                </Badge>
                <Badge className="border-line-strong bg-surface text-text-strong">
                  referenceLevel: {item.referenceLevel}
                </Badge>
                <Badge
                  className={
                    item.mustVerifyOriginal
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : "border-line-strong bg-surface text-text-strong"
                  }
                >
                  mustVerifyOriginal: {item.mustVerifyOriginal ? "true" : "false"}
                </Badge>
              </div>

              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                  usageLocations
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.usageLocations.length > 0 ? (
                    item.usageLocations.map((location) => (
                      <Badge
                        key={`${item.id}-${location}`}
                        className="border-line-strong bg-surface text-text-strong"
                      >
                        {location}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-text-muted">없음</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-text-muted">표시할 참고자료 후보가 없습니다.</p>
      )}
    </div>
  );
}

export function LawbotBridgeReadonlyPanel({
  summary,
  title = "Lawbot Bridge 실행 요약",
  compact = false
}: {
  summary: LawbotBridgeReadonlySummary | null;
  title?: string;
  compact?: boolean;
}) {
  if (!summary) {
    return (
      <Card muted className="p-5">
        <h3 className="ui-section-title">{title}</h3>
        <p className="mt-2 text-sm text-text-muted">실행 기록이 아직 없습니다.</p>
      </Card>
    );
  }

  const statusLabel = workflowStatusLabels[summary.workflowStatus] ?? summary.workflowStatus;
  const countItems = [
    { label: "Case tasks", value: summary.createdCounts.caseTasks },
    { label: "Source verify", value: summary.createdCounts.sourceVerificationTasks },
    { label: "Document request", value: summary.createdCounts.documentRequestTasks },
    { label: "Document drafts", value: summary.createdCounts.documentDrafts },
    { label: "Message drafts", value: summary.createdCounts.messageDrafts }
  ];

  return (
    <Card muted className={compact ? "p-4" : "p-5"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="ui-section-title">{title}</h3>
          <p className="mt-2 text-sm text-text-muted">{summary.executionSummary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={signalBadgeClass(summary.executionStatus)}>
            {summary.executionStatus === "success"
              ? "실행 성공"
              : summary.executionStatus === "failed"
                ? "실행 실패"
                : "실행 대기"}
          </Badge>
          <Badge className="border-line-strong bg-surface text-text-strong">{statusLabel}</Badge>
          {summary.caseNumber ? (
            <Badge className="border-line-strong bg-surface text-text-strong">사건 {summary.caseNumber}</Badge>
          ) : null}
        </div>
      </div>

      <div className={compact ? "mt-3" : "mt-4"}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">마지막 반영</p>
        <p className="mt-1 text-sm text-text">{formatDateTime(summary.updatedAt)}</p>
      </div>

      <div className={compact ? "mt-4 grid gap-3" : "mt-5 grid gap-4 md:grid-cols-5"}>
        {countItems.map((item) => (
          <div key={item.label} className="rounded-xl border border-line/80 bg-white px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">{item.label}</p>
            <p className="mt-1 text-base font-semibold text-text-strong">{item.value}</p>
          </div>
        ))}
      </div>

      <div className={compact ? "mt-4 space-y-3" : "mt-5 space-y-4"}>
        <SignalList
          label="review required"
          items={summary.reviewSignals.reviewRequired ? ["수동 검토 필수"] : []}
        />
        <SignalList label="must verify" items={summary.reviewSignals.mustVerify} />
        <SignalList label="must verify sources" items={summary.reviewSignals.mustVerifySources} />
        <SignalList label="risk flags" items={summary.reviewSignals.riskFlags} tone="risk" />
      </div>

      <div className={compact ? "mt-4" : "mt-5"}>
        <SupplementalReferencePanel
          items={summary.reviewSignals.reviewerReferencePanel?.items ?? []}
        />
      </div>

      <div className={compact ? "mt-4 grid gap-3" : "mt-5 grid gap-4 xl:grid-cols-2"}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">practitioner guide</p>
          <JsonObjectPreview value={summary.reviewSignals.practitionerGuide} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">case outlook</p>
          <JsonObjectPreview value={summary.reviewSignals.caseOutlook} />
        </div>
      </div>
    </Card>
  );
}
