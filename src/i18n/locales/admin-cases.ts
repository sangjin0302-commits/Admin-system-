import type { LocaleMessages } from "@/i18n/shared";

type AdminCasesKey =
  | "boardKicker"
  | "boardTitle"
  | "boardDescription"
  | "totalCases"
  | "emptyTitle"
  | "emptyDescription"
  | "goInquiries"
  | "tableCase"
  | "tableStatus"
  | "tableNextAction"
  | "tableDueDate"
  | "tablePendingDocs"
  | "tableUpdatedAt"
  | "caseNoMissing"
  | "viewDetail"
  | "invalidIdTitle"
  | "invalidIdDescription"
  | "backToList"
  | "notFoundTitle"
  | "notFoundDescription"
  | "detailKicker"
  | "cardStatus"
  | "cardNextAction"
  | "cardDueDate"
  | "cardUpdatedAt"
  | "statusTransitionTitle"
  | "currentStatusPrefix"
  | "statusNoChange"
  | "statusApply"
  | "statusApplying"
  | "statusAuditPlaceholder"
  | "statusUpdateFailed"
  | "statusUpdateSuccess"
  | "requiredDocPanelTitle"
  | "requiredDocPanelDescription"
  | "checklistCreateTitle"
  | "createNameRequired"
  | "createNamePlaceholder"
  | "createDescriptionPlaceholder"
  | "requiredFlagLabel"
  | "createItem"
  | "creatingItem"
  | "startStarterChecklist"
  | "startingStarterChecklist"
  | "createFailed"
  | "createSuccess"
  | "starterFailed"
  | "starterSuccessPrefix"
  | "starterCreatedCount"
  | "starterSkippedCount"
  | "emptyDocuments"
  | "documentNoStatusChange"
  | "requiredTagRequired"
  | "requiredTagOptional"
  | "documentCurrentStatusPrefix"
  | "documentDueDatePrefix"
  | "rowApply"
  | "rowApplying"
  | "rowAuditPlaceholder"
  | "documentUpdateFailed"
  | "documentUpdateSuccess";

export const adminCasesMessages: LocaleMessages<AdminCasesKey> = {
  ko: {
    boardKicker: "사건 관리",
    boardTitle: "사건 운영",
    boardDescription: "이 보드는 Phase 1에서 사건 중심 운영을 위한 최소 운영 경로입니다.",
    totalCases: "생성 사건",
    emptyTitle: "등록된 사건이 아직 없습니다.",
    emptyDescription: "먼저 문의를 사건으로 전환하세요. 전환된 사건이 이 운영 보드에 표시됩니다.",
    goInquiries: "문의 화면으로 이동",
    tableCase: "사건",
    tableStatus: "상태",
    tableNextAction: "다음 액션",
    tableDueDate: "마감일",
    tablePendingDocs: "미처리 문서",
    tableUpdatedAt: "업데이트",
    caseNoMissing: "사건번호 없음",
    viewDetail: "열기",
    invalidIdTitle: "유효하지 않은 사건 ID입니다.",
    invalidIdDescription: "사건 ID 형식이 올바르지 않습니다.",
    backToList: "사건 목록으로 돌아가기",
    notFoundTitle: "사건을 찾을 수 없습니다.",
    notFoundDescription: "이 사건은 삭제되었거나 오래된 링크일 수 있습니다.",
    detailKicker: "사건 상세",
    cardStatus: "상태",
    cardNextAction: "다음 액션",
    cardDueDate: "마감일",
    cardUpdatedAt: "업데이트",
    statusTransitionTitle: "사건 상태 전이",
    currentStatusPrefix: "현재 상태",
    statusNoChange: "변경할 상태가 없습니다.",
    statusApply: "적용",
    statusApplying: "변경 중...",
    statusAuditPlaceholder: "감사 로그용 사유(선택)",
    statusUpdateFailed: "사건 상태를 변경하지 못했습니다.",
    statusUpdateSuccess: "사건 상태가 변경되었습니다. 최신 상태를 다시 불러옵니다...",
    requiredDocPanelTitle: "필수서류",
    requiredDocPanelDescription: "모든 상태 변경은 결정된 전이 규칙과 감사 이벤트를 거칩니다.",
    checklistCreateTitle: "체크리스트 항목 추가",
    createNameRequired: "필수서류 이름은 반드시 입력해야 합니다.",
    createNamePlaceholder: "서류명",
    createDescriptionPlaceholder: "문서 메모(선택)",
    requiredFlagLabel: "필수 항목",
    createItem: "항목 생성",
    creatingItem: "생성 중...",
    startStarterChecklist: "체크리스트 스타터로 시작",
    startingStarterChecklist: "적용 중...",
    createFailed: "필수서류를 생성하지 못했습니다.",
    createSuccess: "필수서류가 생성되었습니다. 최신 상태를 다시 불러옵니다...",
    starterFailed: "체크리스트 스타터를 실행하지 못했습니다.",
    starterSuccessPrefix: "체크리스트 스타터를 적용했습니다.",
    starterCreatedCount: "생성",
    starterSkippedCount: "기존",
    emptyDocuments:
      "아직 필수서류 항목이 없습니다. 직접 항목을 추가하거나 체크리스트 스타터로 시작하세요.",
    documentNoStatusChange: "변경할 상태가 없습니다.",
    requiredTagRequired: "필수",
    requiredTagOptional: "선택",
    documentCurrentStatusPrefix: "현재 상태",
    documentDueDatePrefix: "마감",
    rowApply: "적용",
    rowApplying: "변경 중...",
    rowAuditPlaceholder: "감사 로그용 사유(선택)",
    documentUpdateFailed: "문서 상태를 변경하지 못했습니다.",
    documentUpdateSuccess: "문서 상태가 변경되었습니다. 최신 상태를 다시 불러옵니다..."
  },
  en: {
    boardKicker: "Case Board",
    boardTitle: "Case Operations",
    boardDescription:
      "This board is the minimum operational path for case-centered handling in Phase 1.",
    totalCases: "Cases",
    emptyTitle: "No case matters yet.",
    emptyDescription:
      "Convert inquiries to case matters first. They will appear here for operational handling.",
    goInquiries: "Go to inquiries",
    tableCase: "Case",
    tableStatus: "Status",
    tableNextAction: "Next action",
    tableDueDate: "Due date",
    tablePendingDocs: "Pending docs",
    tableUpdatedAt: "Updated",
    caseNoMissing: "No case number",
    viewDetail: "Open",
    invalidIdTitle: "Invalid case ID.",
    invalidIdDescription: "The case ID format is not valid.",
    backToList: "Back to case list",
    notFoundTitle: "Case not found.",
    notFoundDescription: "This case may have been removed or linked from an outdated URL.",
    detailKicker: "Case Detail",
    cardStatus: "Status",
    cardNextAction: "Next action",
    cardDueDate: "Due date",
    cardUpdatedAt: "Updated",
    statusTransitionTitle: "Case status transition",
    currentStatusPrefix: "Current status",
    statusNoChange: "No status change to apply.",
    statusApply: "Apply",
    statusApplying: "Updating...",
    statusAuditPlaceholder: "Audit note (optional)",
    statusUpdateFailed: "Failed to update case status.",
    statusUpdateSuccess: "Case status updated. Refreshing latest state...",
    requiredDocPanelTitle: "Required Documents",
    requiredDocPanelDescription:
      "All status transitions go through deterministic rules and audit events.",
    checklistCreateTitle: "Add checklist item",
    createNameRequired: "Document name is required.",
    createNamePlaceholder: "Document name",
    createDescriptionPlaceholder: "Document note (optional)",
    requiredFlagLabel: "Required item",
    createItem: "Create item",
    creatingItem: "Creating...",
    startStarterChecklist: "Start with starter checklist",
    startingStarterChecklist: "Applying...",
    createFailed: "Failed to create required document.",
    createSuccess: "Required document created. Refreshing latest state...",
    starterFailed: "Failed to run starter checklist.",
    starterSuccessPrefix: "Starter checklist applied.",
    starterCreatedCount: "created",
    starterSkippedCount: "existing",
    emptyDocuments:
      "No required documents yet. Add an item manually or start from the starter checklist.",
    documentNoStatusChange: "No status change to apply.",
    requiredTagRequired: "Required",
    requiredTagOptional: "Optional",
    documentCurrentStatusPrefix: "Current status",
    documentDueDatePrefix: "Due",
    rowApply: "Apply",
    rowApplying: "Updating...",
    rowAuditPlaceholder: "Audit note (optional)",
    documentUpdateFailed: "Failed to update document status.",
    documentUpdateSuccess: "Document status updated. Refreshing latest state..."
  }
};
