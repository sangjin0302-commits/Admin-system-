import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { toPublicInquiryResponse } from "@/app/api/inquiries/route-safe-v3";
import { parseCreateInquiryInput } from "@/lib/validation/inquiry-safe";
import {
  civilPetitionSubtypeValues,
  intakeCategoryLabels,
  intakeCategoryValues
} from "@/types/intake-category";

const basePayload = {
  preferredLocale: "ko",
  clientType: "INDIVIDUAL",
  contactName: "홍길동",
  email: "client@example.com",
  phone: "010-0000-0000",
  title: "비자 상담 요청",
  description: "현재 체류 자격 변경이 필요해서 상담을 요청합니다.",
  requestedOutcome: "진행 가능성 확인",
  declaredUrgency: "HIGH",
  consentToPrivacy: true,
  website: ""
} as const;

assert.equal(intakeCategoryValues.length, 7);
assert.equal(intakeCategoryValues.includes("civil_petition"), true);
assert.equal(intakeCategoryLabels.civil_petition, "기타 민원");
assert.equal(intakeCategoryLabels.arabic_translation, "아랍어 통번역");
for (const subtype of ["자동차 등록", "일반 민원", "고충 민원", "정보 공개"]) {
  assert.equal(civilPetitionSubtypeValues.includes(subtype as never), true);
}
assert.equal(civilPetitionSubtypeValues.length >= 4, true);

assert.throws(
  () => parseCreateInquiryInput(basePayload),
  /업무 분야를 선택해 주세요/,
  "category 없이 public intake submit이 통과하면 안 됩니다."
);

assert.throws(
  () =>
    parseCreateInquiryInput({
      ...basePayload,
      title: "기타 민원 상담 요청",
      category: "civil_petition",
      categoryDetails: {
        targetAgency: "구청"
      }
    }),
  /민원 세부 유형을 선택해 주세요/,
  "기타 민원은 민원 세부 유형 없이 통과하면 안 됩니다."
);

const parsedVisa = parseCreateInquiryInput({
  ...basePayload,
  category: "visa",
  categoryDetails: {
    workType: "변경",
    nationality: "이집트",
    currentVisaStatus: "D-10",
    desiredVisaType: "E-7",
    documentAvailability: "관련 서류 보유"
  }
});

assert.equal(parsedVisa.requestedInquiryType, "FOREIGNER_VISA");
assert.equal(parsedVisa.nationality, "이집트");
assert.equal(parsedVisa.currentStatus, "D-10");
assert.match(parsedVisa.description, /업무 분야/);
assert.match(parsedVisa.description, /비자/);
assert.match(parsedVisa.description, /업무 유형: 변경/);
assert.match(parsedVisa.description, /국적: 이집트/);
assert.match(parsedVisa.description, /현재 체류 자격: D-10/);
assert.match(parsedVisa.description, /희망 체류 자격: E-7/);

const parsedCivilPetition = parseCreateInquiryInput({
  ...basePayload,
  title: "자동차 등록 민원 상담 요청",
  description: "자동차 이전등록과 관련해서 민원 대행 가능성을 확인하고 싶습니다.",
  category: "civil_petition",
  categoryDetails: {
    civilPetitionType: "자동차 등록",
    targetAgency: "차량등록사업소",
    petitionTargetOrCase: "중고차 이전등록",
    currentStage: "서류 확인 전",
    desiredResult: "이전등록 완료",
    vehicleRegistrationType: "이전",
    vehicleOwnerType: "외국인",
    vehicleRegistrationArea: "서울",
    hasVehicleRegistrationCertificate: "예"
  }
});

assert.equal(parsedCivilPetition.requestedInquiryType, "GENERAL_ADMIN_CIVIL");
assert.equal(parsedCivilPetition.targetAgency, "차량등록사업소");
assert.equal(parsedCivilPetition.currentStatus, "서류 확인 전");
assert.match(parsedCivilPetition.description, /기타 민원/);
assert.match(parsedCivilPetition.description, /민원 세부 유형: 자동차 등록/);
assert.match(parsedCivilPetition.description, /차량 구분: 이전/);
assert.match(parsedCivilPetition.description, /차량 소유자 구분: 외국인/);

const parsedArabicInterpretation = parseCreateInquiryInput({
  ...basePayload,
  title: "아랍어 통번역 상담 요청",
  description: "기관 제출과 화상 통역이 함께 필요해서 상담을 요청합니다.",
  category: "arabic_translation",
  categoryDetails: {
    workType: "통역",
    languageDirection: "아랍어 → 한국어",
    documentOrInterpretationField: "출입국 상담",
    interpretationMethod: "화상",
    interpretationScheduleOrDeadline: "다음 주",
    submissionAgencyOrUsePurpose: "출입국사무소 상담",
    hasSensitiveInfo: "있음"
  }
});

assert.equal(parsedArabicInterpretation.requestedInquiryType, "TRANSLATION_NOTARY");
assert.equal(parsedArabicInterpretation.targetAgency, "출입국사무소 상담");
assert.match(parsedArabicInterpretation.description, /아랍어 통번역/);
assert.match(parsedArabicInterpretation.description, /업무 유형: 통역/);
assert.match(parsedArabicInterpretation.description, /통역 방식: 화상/);
assert.match(parsedArabicInterpretation.description, /민감 정보 포함 여부: 있음/);

const publicResponse = toPublicInquiryResponse({} as never);
const publicResponseJson = JSON.stringify(publicResponse);
assert.equal(publicResponse.received, true);
assert.match(publicResponseJson, /접수가 완료되었습니다/);
for (const blocked of ["id", "inquiryId", "caseId", "workflowStatus", "bridgeWorkflowStatus", "lawbot", "Lawbot"]) {
  assert.equal(publicResponseJson.includes(blocked), false, `${blocked} must not be public`);
}

const root = process.cwd();
const middlewareSource = readFileSync(join(root, "middleware.ts"), "utf8");
assert.match(middlewareSource, /pathname\.startsWith\("\/admin"\)/);
assert.match(middlewareSource, /pathname\.startsWith\("\/api\/admin"\)/);
assert.match(middlewareSource, /"\/intake\/:path\*"/);
assert.match(middlewareSource, /"\/api\/inquiries"/);
assert.equal(middlewareSource.includes("ADMIN_INGEST_PATH"), false);
assert.equal(middlewareSource.includes("pathname !=="), false);

const intakeFormSource = readFileSync(
  join(root, "src/components/intake/intake-form-safe-v3.tsx"),
  "utf8"
);
const intakeCategorySource = readFileSync(join(root, "src/types/intake-category.ts"), "utf8");
for (const label of [
  "비자",
  "법인",
  "행정심판",
  "사실조사 및 계약서 작성",
  "인허가",
  "아랍어 통번역",
  "기타 민원",
  "자동차 등록",
  "일반 민원",
  "고충 민원",
  "정보 공개",
  "categoryDetails",
  "업무 분야를 먼저 선택해 주세요."
]) {
  assert.match(`${intakeFormSource}\n${intakeCategorySource}`, new RegExp(label));
}
assert.equal(intakeFormSource.includes("run-lawbot-workflow"), false);
assert.equal(intakeFormSource.includes("client-message-service"), false);
const legacyArabicTranslationLabel = ["기타", "아랍어", "번역"].join(" ");
assert.equal(intakeFormSource.includes(legacyArabicTranslationLabel), false);
assert.equal(intakeCategorySource.includes(legacyArabicTranslationLabel), false);
for (const label of ["업무 유형", "통역 방식", "민감 정보 포함 여부"]) {
  assert.match(intakeCategorySource, new RegExp(label));
}

const routeSource = readFileSync(join(root, "src/app/api/inquiries/route-safe-v3.ts"), "utf8");
assert.equal(routeSource.includes("id: inquiry.id"), false);
assert.equal(routeSource.includes("workflowStatus"), false);
assert.equal(routeSource.includes("updatedBy:"), false);
assert.equal(routeSource.includes("controlSource:"), false);
