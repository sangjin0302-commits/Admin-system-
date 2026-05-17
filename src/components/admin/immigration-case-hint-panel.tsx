import { Card } from "@/components/ui/card";
import {
  buildImmigrationDocumentDraftReadinessListForCase,
  getDocumentDraftTemplatesForMatterType,
  getImmigrationDeadlineFieldsForMatterType,
  getImmigrationMatterTypeDefinition,
  getRequiredDocumentTemplatesForMatterType,
  getSafetyGuardrailsForMatterType,
  type ImmigrationDocumentDraftCaseData,
  type ImmigrationDocumentDraftCaseReadiness,
  type ImmigrationMatterCategory
} from "@/lib/immigration";

type ImmigrationCaseHintPanelProps = {
  matterType: string;
  caseData?: ImmigrationDocumentDraftCaseData;
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

const readinessStatusLabels: Record<ImmigrationDocumentDraftCaseReadiness["status"], string> = {
  ready: "준비 가능",
  missing_required_inputs: "필수 입력 부족",
  blocked_by_scope_review: "업무범위 검토 필요",
  blocked_by_official_form_check: "공식 서식 확인 필요",
  unknown_template: "확인 필요"
};

function buildReadinessByTemplateId(readinessList: ImmigrationDocumentDraftCaseReadiness[]) {
  return Object.fromEntries(readinessList.map((readiness) => [readiness.templateId, readiness]));
}

export function buildImmigrationCaseHintPanelModel(
  matterType: string,
  caseData: ImmigrationDocumentDraftCaseData = {}
) {
  const definition = getImmigrationMatterTypeDefinition(matterType);
  if (!definition) return null;

  const deadlineDefinitions = getImmigrationDeadlineFieldsForMatterType(matterType);
  const draftCandidates = getDocumentDraftTemplatesForMatterType(matterType);
  const draftReadiness = buildImmigrationDocumentDraftReadinessListForCase(matterType, caseData);

  return {
    definition,
    categoryLabel: categoryLabels[definition.category],
    deadlines: deadlineDefinitions,
    requiredDocuments: getRequiredDocumentTemplatesForMatterType(matterType),
    draftCandidates,
    draftReadinessByTemplateId: buildReadinessByTemplateId(draftReadiness),
    safetyGuardrails: getSafetyGuardrailsForMatterType(matterType),
    safetyNotice:
      "실제 기한은 처분서 원문, 송달일, 관할기관 기준으로 반드시 수동 확인하세요.",
    deadlineInputNotice:
      "이 섹션은 입력 준비용 힌트이며, 아직 기한 값을 저장하지 않습니다.",
    checklistNotice:
      "이 목록은 참고용입니다. 실제 필수자료 생성은 별도 checklist 생성 기능에서 처리합니다.",
    draftNotice:
      "이 섹션은 문서 생성 실행이 아니라, 향후 초안 preview를 위한 준비 상태입니다. 고객 발송 또는 기관 제출 실행은 하지 않습니다.",
    highRiskDraftNotice:
      "행정심판 청구서·집행정지 신청서 등 고위험 문서는 업무범위와 공식 서식 확인 후에만 다룹니다."
  };
}

export function ImmigrationCaseHintPanel({ matterType, caseData }: ImmigrationCaseHintPanelProps) {
  const model = buildImmigrationCaseHintPanelModel(matterType, caseData);
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-text-strong">{deadline.labelKo}</span>
                  {deadline.isCritical ? <span className="ui-badge">필수</span> : null}
                  {deadline.recommendedCaseMatterDueDateCandidate ? <span className="ui-badge">dueDate 후보</span> : null}
                </div>
                <p className="text-text-muted">{deadline.descriptionKo}</p>
                <p className="text-xs text-text-muted">기준: {deadline.sourceHintKo}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 rounded-md border border-line bg-surface px-3 py-2 text-xs font-medium text-text-strong">
            {model.safetyNotice}
          </p>
          <p className="mt-2 rounded-md border border-line bg-surface px-3 py-2 text-xs font-medium text-text-strong">
            {model.deadlineInputNotice}
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
          {model.draftCandidates.map((candidate) => {
            const readiness = model.draftReadinessByTemplateId[candidate.id];
            const missingFields = readiness?.missingRequiredFields ?? [];

            return (
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
                  {candidate.riskLevel === "high" ? <span className="ui-badge">고위험 문서</span> : null}
                  {candidate.adminOnlyPreview ? <span className="ui-badge">관리자 초안</span> : null}
                  {candidate.noAutomaticSubmission ? <span className="ui-badge">기관 제출 실행 없음</span> : null}
                </div>
                <p className="mt-1 text-text-muted">{candidate.descriptionKo}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-strong">
                  <span className="ui-badge">필수 입력값 {candidate.requiredInputFields.length}개</span>
                  {candidate.optionalInputFields.length > 0 ? (
                    <span className="ui-badge">선택 입력값 {candidate.optionalInputFields.length}개</span>
                  ) : null}
                  {candidate.requiresScopeReview ? <span className="ui-badge">업무범위 검토 필요</span> : null}
                  {candidate.requiresOfficialFormCheck ? <span className="ui-badge">공식 서식 확인 필요</span> : null}
                </div>
                {readiness ? (
                  <div className="mt-3 rounded-md border border-line bg-surface px-3 py-2 text-xs text-text">
                    <p className="font-semibold text-text-strong">
                      준비 상태: {readinessStatusLabels[readiness.status]}
                    </p>
                    {missingFields.length > 0 ? (
                      <p className="mt-1 text-text-muted">
                        부족한 입력값:{" "}
                        {missingFields.map((field) => `${field.labelKo} (${field.sourceGroup})`).join(", ")}
                      </p>
                    ) : null}
                    {readiness.warnings.length > 0 ? (
                      <p className="mt-1 text-text-muted">{readiness.warnings.join(" ")}</p>
                    ) : null}
                    <p className="mt-1 font-medium text-text-strong">
                      문서 생성/내보내기는 아직 지원하지 않습니다.
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="mt-3 space-y-2">
          <p className="rounded-md border border-line bg-surface px-3 py-2 text-xs font-medium text-text-strong">
            {model.draftNotice}
          </p>
          <p className="rounded-md border border-line bg-surface px-3 py-2 text-xs font-medium text-text-strong">
            {model.highRiskDraftNotice}
          </p>
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
