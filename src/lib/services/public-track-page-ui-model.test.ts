import assert from "node:assert/strict";

import {
  buildPublicTrackViewModel,
  formatPublicTrackDateTime,
  isPublicTrackLookupReady,
  normalizePublicTrackCodeInput,
  normalizePublicTrackPhoneLast4Input,
  PUBLIC_TRACK_API_PATH,
  PUBLIC_TRACK_FORBIDDEN_RENDER_TOKENS,
  PUBLIC_TRACK_GENERIC_NOT_FOUND_MESSAGE
} from "@/lib/services/public-track-page-ui-model";

assert.equal(PUBLIC_TRACK_API_PATH, "/api/public/track");
assert.equal(
  PUBLIC_TRACK_GENERIC_NOT_FOUND_MESSAGE,
  "접수 정보를 찾을 수 없습니다. 접수번호와 휴대폰 뒤 4자리를 확인해 주세요."
);

assert.equal(normalizePublicTrackCodeInput(" 20260504-fc-0002-7d "), "20260504-FC-0002-7D");
assert.equal(normalizePublicTrackPhoneLast4Input("010-9999-1234"), "1234");
assert.equal(normalizePublicTrackPhoneLast4Input("12a3b4"), "1234");
assert.equal(isPublicTrackLookupReady({ trackingCode: "20260504-FC-0002-7D", phoneLast4: "1234" }), true);
assert.equal(isPublicTrackLookupReady({ trackingCode: "", phoneLast4: "1234" }), false);
assert.equal(isPublicTrackLookupReady({ trackingCode: "20260504-FC-0002-7D", phoneLast4: "123" }), false);

const safeViewModel = buildPublicTrackViewModel({
  trackingCode: "20260504-FC-0002-7D",
  categoryLabel: "사실조사 및 계약서 작성",
  categoryDetailLabel: null,
  receivedAt: "2026-05-04T13:53:51.051Z",
  lastUpdatedAt: "2026-05-04T13:53:51.671Z",
  customerStatus: "UNDER_REVIEW",
  customerStatusLabel: "담당자 확인 중",
  message: "담당자가 접수 내용을 확인하고 있습니다.",
  documentsRequested: false,
  nextStepLabel: "확인 후 상담 또는 추가 안내를 드릴 예정입니다.",
  inquiryId: "internal-inquiry-id",
  caseId: "internal-case-id",
  workflowStatus: "APPROVED",
  bridgeWorkflowStatus: "APPROVED",
  Lawbot: "hidden",
  approvalGate: { externalActionAllowed: true },
  documentDrafts: [{ body: "hidden" }],
  messageDrafts: [{ body: "hidden" }],
  communicationLogs: [{ summary: "hidden" }],
  adminNote: "hidden"
});

assert.ok(safeViewModel);
assert.equal(safeViewModel.trackingCode, "20260504-FC-0002-7D");
assert.equal(safeViewModel.categoryLabel, "사실조사 및 계약서 작성");
assert.equal(safeViewModel.categoryDetailLabel, null);
assert.equal(safeViewModel.customerStatusLabel, "담당자 확인 중");
assert.equal(safeViewModel.documentsRequested, false);
assert.equal(formatPublicTrackDateTime("not-a-date"), "");

const renderedSafeOutput = JSON.stringify(safeViewModel);
for (const forbidden of PUBLIC_TRACK_FORBIDDEN_RENDER_TOKENS) {
  assert.equal(renderedSafeOutput.includes(forbidden), false);
}
for (const forbidden of [
  "internal-inquiry-id",
  "internal-case-id",
  "APPROVED",
  "externalActionAllowed",
  "hidden"
]) {
  assert.equal(renderedSafeOutput.includes(forbidden), false);
}

assert.equal(
  buildPublicTrackViewModel({
    trackingCode: "20260504-FC-0002-7D",
    categoryLabel: "사실조사 및 계약서 작성",
    receivedAt: "2026-05-04T13:53:51.051Z",
    lastUpdatedAt: "2026-05-04T13:53:51.671Z",
    customerStatusLabel: "APPROVED",
    message: "internal",
    nextStepLabel: "internal"
  }),
  null
);

// 추가 모델 검증(기존 소스 grep 대체) — 민감 내부필드가 어떤 조합으로 들어와도
// 뷰모델 직렬화 결과에 노출되지 않음을 모델 계층에서 직접 확인.
const documentsRequestedModel = buildPublicTrackViewModel({
  trackingCode: "20260504-fc-0009-aa",
  categoryLabel: "인허가",
  categoryDetailLabel: "건축 인허가",
  receivedAt: "2026-05-04T13:53:51.051Z",
  lastUpdatedAt: "2026-05-05T09:00:00.000Z",
  customerStatus: "DOCUMENTS_REQUESTED",
  customerStatusLabel: "추가자료 요청",
  message: "추가 서류가 필요합니다.",
  documentsRequested: true,
  nextStepLabel: "요청 서류를 제출해 주세요.",
  inquiryId: "leak-inquiry",
  caseId: "leak-case",
  workflowStatus: "APPROVED",
  approvalGate: { externalActionAllowed: true },
  adminNote: "leak-note"
});
assert.ok(documentsRequestedModel);
assert.equal(documentsRequestedModel.documentsRequested, true);
assert.equal(documentsRequestedModel.categoryDetailLabel, "건축 인허가");
const documentsRequestedRendered = JSON.stringify(documentsRequestedModel);
for (const forbidden of ["leak-inquiry", "leak-case", "APPROVED", "externalActionAllowed", "leak-note"]) {
  assert.equal(documentsRequestedRendered.includes(forbidden), false);
}

// 입력 정규화 엣지: 공백/대소문자/하이픈 혼합 코드, 문자 섞인 전화번호.
assert.equal(normalizePublicTrackCodeInput("  20260504-fc-0009-aa"), "20260504-FC-0009-AA");
assert.equal(normalizePublicTrackPhoneLast4Input("휴대폰 010 1234 5678"), "5678");
assert.equal(formatPublicTrackDateTime(""), "");

console.log("public track page ui model tests passed");
