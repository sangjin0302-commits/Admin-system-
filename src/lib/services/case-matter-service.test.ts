import assert from "node:assert/strict";

import {
  createCaseTaskSchema,
  createSupplementRequestSchema,
  updateCaseTaskSchema,
  updateCaseAccountingMemoSchema,
  updateRequiredDocumentMetadataSchema,
  updateSupplementRequestSchema
} from "@/lib/validation/case-matter";
import {
  buildRequiredDocumentChecklistStarterPlan,
  getRequiredDocumentChecklistStarterTemplates
} from "@/lib/services/required-document-checklist-starter";

// 이 테스트는 Zod 스키마와 starter-plan 순수함수를 직접 import 해 검증한다.
// (예전엔 case-matter-service.ts / 라우트 / 패널 소스를 readFileSync 로 grep 했으나,
//  서비스가 barrel `export * from "./case-matter"` 로 리팩터되며 grep 이 전부 stale.
//  UI/소스 문자열 대신 실제 로직을 호출해 검증하도록 재작성.)

// ── 필수서류 메타데이터 스키마 ─────────────────────────
const parsed = updateRequiredDocumentMetadataSchema.parse({
  name: "  Updated passport copy  ",
  description: "",
  required: false,
  dueDate: "",
  actorName: "QA",
  expectedUpdatedAt: "2026-05-12T00:00:00.000Z",
  expectedCaseUpdatedAt: "2026-05-12T00:00:00.000Z"
});

assert.equal(parsed.name, "Updated passport copy");
assert.equal(parsed.description, "");
assert.equal(parsed.required, false);
assert.equal(parsed.dueDate, "");

assert.throws(() =>
  updateRequiredDocumentMetadataSchema.parse({
    name: "",
    required: true
  })
);

assert.throws(() =>
  updateRequiredDocumentMetadataSchema.parse({
    name: "Valid document",
    required: true,
    dueDate: "not-a-date"
  })
);

// ── starter 체크리스트 템플릿 ──────────────────────────
const deportationStarterTemplates = getRequiredDocumentChecklistStarterTemplates("deportation_order_appeal");
const deportationStarterNames = deportationStarterTemplates.map((template) => template.name);
assert.ok(deportationStarterNames.includes("강제퇴거명령서"));
assert.ok(deportationStarterNames.includes("송달일 확인 자료"));
assert.ok(deportationStarterNames.includes("정상참작 자료"));
assert.ok(deportationStarterNames.includes("행정심판 청구서 초안 자료"));
assert.ok(deportationStarterTemplates.some((template) => template.description?.includes("강제퇴거명령")));

const visaStarterTemplates = getRequiredDocumentChecklistStarterTemplates("visa_issuance_support");
const visaStarterNames = visaStarterTemplates.map((template) => template.name);
assert.ok(visaStarterNames.includes("여권"));
assert.ok(visaStarterNames.includes("초청/입국 목적 증빙"));
assert.ok(visaStarterNames.includes("소득/납세 자료"));

const genericStarterTemplates = getRequiredDocumentChecklistStarterTemplates("case_card_qa");
assert.deepEqual(
  genericStarterTemplates.map((template) => template.name),
  ["Applicant identity document", "Core application form draft", "Supporting evidence packet"]
);

const starterPlan = buildRequiredDocumentChecklistStarterPlan("deportation_order_appeal", [
  { name: " 강제퇴거명령서 ", status: "NEEDED" },
  { name: "송달일   확인 자료", status: "NOT_APPLICABLE" }
]);
assert.equal(starterPlan.templates.length, deportationStarterTemplates.length);
assert.equal(starterPlan.skippedCount, 1);
assert.equal(starterPlan.createdCount, deportationStarterTemplates.length - 1);
assert.equal(starterPlan.toCreate.some((template) => template.name === "강제퇴거명령서"), false);
assert.equal(starterPlan.toCreate.some((template) => template.name === "송달일 확인 자료"), true);

// starter 템플릿에 개인식별정보/과장광고가 섞이지 않음을 데이터 계층에서 직접 검증.
const starterText = JSON.stringify({
  deportationStarterTemplates,
  visaStarterTemplates,
  genericStarterTemplates
});
assert.doesNotMatch(starterText, /여권번호|외국인등록번호|alien registration number|passport number/i);
assert.doesNotMatch(starterText, /결과 보장|100% 허가|자동 제출|automatic submission|guaranteed result/i);

// ── 업무 태스크 스키마 ─────────────────────────────────
const parsedTaskCreate = createCaseTaskSchema.parse({
  title: "  Prepare evidence packet  ",
  details: "",
  description: "",
  priority: "HIGH",
  dueDate: "",
  assignedTo: "QA",
  expectedCaseUpdatedAt: "2026-05-12T00:00:00.000Z"
});

assert.equal(parsedTaskCreate.title, "Prepare evidence packet");
assert.equal(parsedTaskCreate.status, "TODO");
assert.equal(parsedTaskCreate.priority, "HIGH");
assert.equal(parsedTaskCreate.dueDate, "");

assert.throws(() =>
  createCaseTaskSchema.parse({
    title: "",
    dueDate: "2026-05-12"
  })
);

assert.throws(() =>
  createCaseTaskSchema.parse({
    title: "Valid task",
    dueDate: "not-a-date"
  })
);

const parsedTaskMetadata = updateCaseTaskSchema.parse({
  mode: "metadata",
  title: "Updated task",
  details: "",
  description: "",
  priority: "URGENT",
  dueDate: null,
  assignedTo: "",
  expectedUpdatedAt: "2026-05-12T00:00:00.000Z"
});
assert.equal(parsedTaskMetadata.mode, "metadata");
assert.equal(parsedTaskMetadata.priority, "URGENT");

const parsedTaskStatus = updateCaseTaskSchema.parse({
  mode: "status",
  status: "DONE",
  statusChangeNote: "Complete",
  expectedUpdatedAt: "2026-05-12T00:00:00.000Z"
});
assert.equal(parsedTaskStatus.mode, "status");
assert.equal(parsedTaskStatus.status, "DONE");

assert.throws(() =>
  updateCaseTaskSchema.parse({
    mode: "status",
    status: "NOT_VALID"
  })
);

// ── 보완 요청 스키마 ───────────────────────────────────
const parsedSupplementCreate = createSupplementRequestSchema.parse({
  title: "  기관 보완 요청  ",
  description: "",
  receivedAt: "2026-05-12",
  dueDate: "",
  requestedDocsJson: "여권 사본",
  responseNote: "",
  expectedCaseUpdatedAt: "2026-05-12T00:00:00.000Z"
});
assert.equal(parsedSupplementCreate.title, "기관 보완 요청");
assert.equal(parsedSupplementCreate.dueDate, "");

assert.throws(() =>
  createSupplementRequestSchema.parse({
    title: "",
    receivedAt: "2026-05-12"
  })
);

assert.throws(() =>
  createSupplementRequestSchema.parse({
    title: "Valid supplement request",
    dueDate: "not-a-date"
  })
);

const parsedSupplementMetadata = updateSupplementRequestSchema.parse({
  mode: "metadata",
  title: "Updated supplement request",
  description: "",
  receivedAt: "2026-05-12",
  dueDate: null,
  requestedDocsJson: "",
  responseNote: "",
  expectedUpdatedAt: "2026-05-12T00:00:00.000Z"
});
assert.equal(parsedSupplementMetadata.mode, "metadata");

const parsedSupplementStatus = updateSupplementRequestSchema.parse({
  mode: "status",
  status: "RESPONDED",
  statusChangeNote: "Complete",
  responseNote: "Response sent manually",
  respondedAt: "2026-05-13",
  expectedUpdatedAt: "2026-05-12T00:00:00.000Z"
});
assert.equal(parsedSupplementStatus.mode, "status");
assert.equal(parsedSupplementStatus.status, "RESPONDED");

assert.throws(() =>
  updateSupplementRequestSchema.parse({
    mode: "status",
    status: "NOT_VALID"
  })
);

// ── 수임관리 회계 메모 스키마 ──────────────────────────
const parsedAccounting = updateCaseAccountingMemoSchema.parse({
  feeAmount: "120000",
  feeStatus: "CONFIRMED",
  paymentStatus: "PARTIAL",
  paidAmount: "60000",
  paidAt: "2026-05-13",
  paymentMemo: "",
  invoiceMemo: "",
  ledgerMemo: "  ledger memo  ",
  expectedUpdatedAt: "2026-05-12T00:00:00.000Z",
  expectedCaseUpdatedAt: "2026-05-12T00:00:00.000Z"
});
assert.equal(parsedAccounting.feeAmount, 120000);
assert.equal(parsedAccounting.paidAmount, 60000);
assert.equal(parsedAccounting.ledgerMemo, "ledger memo");

assert.throws(() =>
  updateCaseAccountingMemoSchema.parse({
    feeAmount: -1,
    feeStatus: "CONFIRMED",
    paymentStatus: "UNPAID"
  })
);

assert.throws(() =>
  updateCaseAccountingMemoSchema.parse({
    paidAmount: -1,
    feeStatus: "CONFIRMED",
    paymentStatus: "UNPAID"
  })
);

assert.throws(() =>
  updateCaseAccountingMemoSchema.parse({
    feeStatus: "CONFIRMED",
    paymentStatus: "UNPAID",
    paidAt: "not-a-date"
  })
);

assert.throws(() =>
  updateCaseAccountingMemoSchema.parse({
    feeStatus: "NOT_VALID",
    paymentStatus: "UNPAID"
  })
);

console.log("case matter service metadata tests passed");
