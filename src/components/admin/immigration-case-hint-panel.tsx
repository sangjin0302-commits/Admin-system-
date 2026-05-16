import { Card } from "@/components/ui/card";
import {
  getDraftCandidatesForMatterType,
  getImmigrationMatterTypeDefinition,
  getRequiredDocumentTemplatesForMatterType,
  getSafetyGuardrailsForMatterType,
  immigrationDeadlineFieldDefinitions,
  type ImmigrationMatterCategory
} from "@/lib/immigration";

type ImmigrationCaseHintPanelProps = {
  matterType: string;
};

const categoryLabels: Record<ImmigrationMatterCategory, string> = {
  immigration_appeal: "행정심판/불복",
  immigration_stay: "체류 관리",
  immigration_compliance: "출입국 준수/소명",
  immigration_document_support: "출입국 서류 지원"
};

const riskLabels = {
  low: "낮음",
  medium: "중간",
  high: "높음"
} as const;

const severityLabels = {
  info: "확인",
  warn: "주의",
  critical: "필수"
} as const;

export function buildImmigrationCaseHintPanelModel(matterType: string) {
  const definition = getImmigrationMatterTypeDefinition(matterType);
  if (!definition) return null;

  const deadlineDefinitions = definition.deadlinePriority
    .map((field) => immigrationDeadlineFieldDefinitions.find((item) => item.field === field))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    definition,
    categoryLabel: categoryLabels[definition.category],
    deadlines: deadlineDefinitions,
    requiredDocuments: getRequiredDocumentTemplatesForMatterType(matterType),
    draftCandidates: getDraftCandidatesForMatterType(matterType),
    safetyGuardrails: getSafetyGuardrailsForMatterType(matterType),
    safetyNotice:
      "실제 기한은 처분서 원문, 송달일, 관할기관 기준으로 반드시 수동 확인하세요.",
    checklistNotice:
      "이 목록은 참고용입니다. 실제 필수자료 생성은 별도 checklist 생성 기능에서 처리합니다.",
    draftNotice:
      "문서 자동작성은 관리자 전용 초안 preview부터 시작하며, 고객 발송/기관 제출 자동화는 하지 않습니다."
  };
}

export function ImmigrationCaseHintPanel({ matterType }: ImmigrationCaseHintPanelProps) {
  const model = buildImmigrationCaseHintPanelModel(matterType);
  if (!model) return null;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="ui-kicker">Immigration appeal hints</p>
          <h3 className="text-lg font-semibold text-text-strong">출입국·행정심판 업무 힌트</h3>
          <p className="mt-1 text-sm text-text-muted">
            CaseMatter 유형에 맞춘 read-only 참고 정보입니다. 자료 생성, 문서 생성, 제출은 수행하지 않습니다.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm">
          <p className="text-xs text-text-muted">분류</p>
          <p className="font-semibold text-text-strong">{model.categoryLabel}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-surface-muted p-3">
          <h4 className="text-sm font-semibold text-text-strong">사건유형</h4>
          <dl className="mt-2 grid gap-2 text-sm">
            <div>
              <dt className="text-xs text-text-muted">유형</dt>
              <dd className="font-semibold text-text-strong">{model.definition.labelKo}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">주요 기관</dt>
              <dd className="text-text">{model.definition.typicalAgency}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">설명</dt>
              <dd className="text-text">{model.definition.descriptionKo}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-line bg-surface-muted p-3">
          <h4 className="text-sm font-semibold text-text-strong">기한 확인</h4>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-text">
            {model.deadlines.map((deadline) => (
              <li key={deadline.field}>
                <span className="font-medium text-text-strong">{deadline.labelKo}</span>
                <span className="text-text-muted"> - {deadline.descriptionKo}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 rounded-md border border-line bg-surface px-3 py-2 text-xs font-medium text-text-strong">
            {model.safetyNotice}
          </p>
        </section>
      </div>

      <section className="mt-4 rounded-lg border border-line bg-surface-muted p-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h4 className="text-sm font-semibold text-text-strong">권장 자료 checklist</h4>
          <p className="text-xs text-text-muted">{model.checklistNotice}</p>
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {model.requiredDocuments.map((document) => (
            <div key={document.id} className="rounded-md border border-line bg-surface p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-text-strong">{document.labelKo}</p>
                {document.required ? <span className="ui-badge">필수</span> : <span className="ui-badge">권장</span>}
                {document.sensitive ? <span className="ui-badge">민감</span> : null}
              </div>
              <p className="mt-1 text-text-muted">{document.descriptionKo}</p>
              {document.securityNoteKo ? (
                <p className="mt-2 text-xs font-medium text-text-strong">{document.securityNoteKo}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-line bg-surface-muted p-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h4 className="text-sm font-semibold text-text-strong">문서 초안 후보</h4>
          <p className="text-xs text-text-muted">{model.draftNotice}</p>
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {model.draftCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className={`rounded-md border p-3 text-sm ${
                candidate.riskLevel === "high"
                  ? "border-amber-300 bg-amber-50"
                  : "border-line bg-surface"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-text-strong">{candidate.labelKo}</p>
                <span className="ui-badge">위험도 {riskLabels[candidate.riskLevel]}</span>
                {candidate.adminOnlyPreview ? <span className="ui-badge">관리자 초안</span> : null}
              </div>
              <p className="mt-1 text-text-muted">{candidate.descriptionKo}</p>
              <p className="mt-2 text-xs text-text-strong">
                업무범위 검토: {candidate.requiresScopeReview ? "필요" : "보통"} / 공식서식 확인:{" "}
                {candidate.requiresOfficialFormCheck ? "필요" : "보통"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-line bg-surface-muted p-3">
        <h4 className="text-sm font-semibold text-text-strong">안전장치</h4>
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {model.safetyGuardrails.map((guardrail) => (
            <div key={guardrail.id} className="rounded-md border border-line bg-surface p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-text-strong">{guardrail.labelKo}</p>
                <span className="ui-badge">{severityLabels[guardrail.severity]}</span>
              </div>
              <p className="mt-1 text-text-muted">{guardrail.descriptionKo}</p>
            </div>
          ))}
        </div>
      </section>
    </Card>
  );
}
