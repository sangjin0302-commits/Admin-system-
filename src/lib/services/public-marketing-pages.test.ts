import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildServiceIntakeHref,
  buildWebsiteIntakeHref,
  getPublicMarketingService,
  PUBLIC_MARKETING_SAFE_NOTICE,
  PUBLIC_MARKETING_SERVICES
} from "@/lib/services/public-marketing-pages";

const root = process.cwd();

assert.equal(PUBLIC_MARKETING_SERVICES.length, 7);
assert.equal(PUBLIC_MARKETING_SAFE_NOTICE.includes("일반 정보 제공"), true);
assert.equal(PUBLIC_MARKETING_SAFE_NOTICE.includes("공식 기관 확인"), true);
assert.equal(buildWebsiteIntakeHref(), "/intake?source=website&channel=homepage");

const expected = new Map([
  ["visa", "visa"],
  ["corporation", "corporation"],
  ["administrative-appeal", "administrative_appeal"],
  ["fact-contract", "fact_contract"],
  ["permit-license", "permit_license"],
  ["arabic-interpretation", "arabic_interpretation"],
  ["civil-petition", "civil_petition"]
]);

for (const [slug, practiceArea] of expected) {
  const service = getPublicMarketingService(slug);
  assert.ok(service, `Missing service: ${slug}`);
  assert.equal(service.practiceArea, practiceArea);
  assert.equal(service.audience.length > 0, true);
  assert.equal(service.scope.length > 0, true);
  assert.equal(service.preparation.length > 0, true);
  assert.equal(service.process.length > 0, true);
  assert.equal(service.cautions.length > 0, true);

  const href = buildServiceIntakeHref(service);
  assert.equal(href.includes("/intake?"), true);
  assert.equal(href.includes("source=website"), true);
  assert.equal(href.includes("channel=service_page"), true);
  assert.equal(href.includes(`practice_area=${practiceArea}`), true);
}

assert.equal(getPublicMarketingService("missing"), null);

const rootPagePath = join(root, "src/app/page.tsx");
const servicesPagePath = join(root, "src/app/services/page.tsx");
const immigrationPagePath = join(root, "src/app/services/immigration/page.tsx");
const appealPagePath = join(root, "src/app/services/appeal/page.tsx");
const serviceDetailPagePath = join(root, "src/app/services/[slug]/page.tsx");
const intakePageSafePath = join(root, "src/app/intake/page-safe.tsx");
const appShellPath = join(root, "src/components/layout/app-shell-safe.tsx");
const packageJsonPath = join(root, "package.json");

for (const path of [
  rootPagePath,
  servicesPagePath,
  immigrationPagePath,
  appealPagePath,
  serviceDetailPagePath,
  intakePageSafePath,
  appShellPath,
  packageJsonPath
]) {
  assert.equal(existsSync(path), true, `Missing source: ${path}`);
}

const rootSource = readFileSync(rootPagePath, "utf8");
const servicesSource = readFileSync(servicesPagePath, "utf8");
const immigrationSource = readFileSync(immigrationPagePath, "utf8");
const appealSource = readFileSync(appealPagePath, "utf8");
const intakePageSafeSource = readFileSync(intakePageSafePath, "utf8");
const combinedSource = [
  rootSource,
  servicesSource,
  immigrationSource,
  appealSource,
  intakePageSafeSource,
  readFileSync(serviceDetailPagePath, "utf8"),
  readFileSync(join(root, "src/lib/services/public-marketing-pages.ts"), "utf8")
].join("\n");
const publicPageSource = [rootSource, servicesSource, immigrationSource, appealSource, intakePageSafeSource].join("\n");
const packageSource = readFileSync(packageJsonPath, "utf8");

for (const label of ["비자", "법인", "행정심판", "사실조사", "인허가", "아랍어 통번역", "기타 민원"]) {
  assert.equal(combinedSource.includes(label), true, `Missing label: ${label}`);
}

for (const required of [
  "출입국·체류·행정심판 업무를 한 흐름으로 정리합니다.",
  "상담 신청하기",
  "진행상황 조회",
  "전문 분야 보기",
  "주요 업무 영역",
  "출입국·체류",
  "강제퇴거·출국명령·입국금지",
  "정보공개·일반 행정서류",
  "업무 처리 흐름",
  "접수번호로 다음 단계를 확인합니다.",
  "신뢰와 안전 원칙",
  "공식 서식과 제출기관 기준 확인",
  "관리자 검토 후 진행",
  "민감정보 보호 우선",
  "기관 제출은 자동으로 하지 않음",
  "사안별 상담 필요",
  "이런 분에게 필요합니다",
  "지원 범위",
  "준비하면 좋은 자료",
  "진행 절차",
  "유의사항"
]) {
  assert.equal(combinedSource.includes(required), true, `Missing required token: ${required}`);
}

for (const requiredHomePhase2Token of [
  "상담 이후 흐름",
  "상담 신청 후 무엇을 확인하는지 먼저 보여드립니다.",
  "내부적으로 추적하는 항목",
  "출입국, 행정심판, 자료요청, 기한관리 중심의 업무 흐름",
  "신뢰와 준비 기준",
  "먼저 확인하고, 보장처럼 말하지 않습니다.",
  "사안마다 필요한 자료와 절차가 다릅니다.",
  "접수 후 사실관계와 자료를 먼저 확인합니다.",
  "기한과 제출처를 확인합니다.",
  "진행 상황은 내부적으로 관리합니다.",
  "결과를 보장하지 않습니다.",
  "AI가 최종 판단하지 않고 시스템이 기관에 바로 제출하지 않습니다.",
  "자주 묻는 질문",
  "상담 신청 후 바로 진행되나요?",
  "어떤 자료를 준비해야 하나요?",
  "진행상황은 어떻게 확인하나요?",
  "출입국 업무도 상담 가능한가요?",
  "행정심판이나 이의신청도 상담 가능한가요?"
]) {
  assert.equal(rootSource.includes(requiredHomePhase2Token), true, `Missing home phase 2 token: ${requiredHomePhase2Token}`);
}

for (const requiredHomeToken of ["사무소 입구", "접수번호", "자료요청", "기한관리", "서식검토"]) {
  assert.equal(rootSource.includes(requiredHomeToken), true, `Missing home visual token: ${requiredHomeToken}`);
}

for (const requiredHomeLink of ['href: "/services/immigration"', 'href: "/services/appeal"']) {
  assert.equal(rootSource.includes(requiredHomeLink), true, `Missing home vertical link: ${requiredHomeLink}`);
}

for (const requiredServicesToken of [
  "공통 서식·문서 준비",
  "상담 전 확인",
  "상세 분야",
  "대표 상황",
  "사무소 확인",
  "준비 자료",
  "체류기간 연장",
  "거부·불허 처분",
  "정보공개청구",
  "위임장·동의서",
  "상담 진행 절차",
  "1단계",
  "2단계",
  "3단계",
  "4단계",
  "자료 확인 후 필요한 업무 범위를 안내합니다.",
  "업무 분야 FAQ",
  "업무 분야를 정확히 몰라도 신청할 수 있나요?",
  "자료가 부족하면 어떻게 되나요?",
  "기관 제출까지 대신 진행되나요?"
]) {
  assert.equal(servicesSource.includes(requiredServicesToken), true, `Missing services token: ${requiredServicesToken}`);
}

for (const requiredServicesLink of ['href: "/services/immigration"', 'href: "/services/appeal"']) {
  assert.equal(servicesSource.includes(requiredServicesLink), true, `Missing services vertical link: ${requiredServicesLink}`);
}

for (const requiredImmigrationToken of [
  "출입국·체류 업무 안내",
  "체류기간 연장",
  "체류자격 변경",
  "사증·외국인등록 관련 서류 준비",
  "보완 요청 대응",
  "체류기간 만료일",
  "여권",
  "외국인등록증",
  "가족관계·고용·소득·거주 자료",
  "상담 진행 흐름",
  "행정심판·이의신청 보기",
  'href="/services/appeal"',
  'href="/track"'
]) {
  assert.equal(
    immigrationSource.includes(requiredImmigrationToken),
    true,
    `Missing immigration token: ${requiredImmigrationToken}`
  );
}

for (const requiredAppealToken of [
  "행정심판·이의신청·소명 업무 안내",
  "강제퇴거명령",
  "출국명령",
  "입국금지",
  "체류기간 연장 불허",
  "체류자격 변경 불허",
  "처분서 또는 통지서 수령",
  "불복 또는 신청 기한",
  "업무범위와 안전 안내",
  "변호사 업무 가능성 검토가 필요할 수 있습니다.",
  "출입국·체류 업무 보기",
  'href="/services/immigration"',
  'href="/track"'
]) {
  assert.equal(appealSource.includes(requiredAppealToken), true, `Missing appeal token: ${requiredAppealToken}`);
}

for (const requiredIntakeToken of [
  "접수 전 확인",
  "처분일, 통지일, 송달일",
  "체류기간 만료일, 제출기한, 보완기한",
  "접수 후 사안별로 필요한 자료를 안내합니다.",
  "제출기관 기준과 공식 서식"
]) {
  assert.equal(intakePageSafeSource.includes(requiredIntakeToken), true, `Missing intake token: ${requiredIntakeToken}`);
}

for (const forbidden of [
  "100% 허가",
  "확실한 해결",
  "즉시 수임",
  "결과 보장",
  "처분 취소 보장",
  "무조건 가능",
  "최단기간 보장",
  "승소 보장",
  "즉시 해결",
  "확실히 가능",
  "성공률",
  "승소함",
  "보장합니다",
  "자동 해결",
  "자동 제출",
  "AI가 판단",
  "canvas",
  "Three.js",
  "React Three Fiber",
  "react-three",
  "GLB",
  "GLTF",
  "href=\"/admin\"",
  "Administrative Office Intake System",
  "inquiryId",
  "caseId",
  "workflowStatus",
  "bridgeWorkflowStatus",
  "Lawbot",
  "approvalGate",
  "documentDrafts",
  "messageDrafts",
  "communicationLogs",
  "adminNote",
  "client-message-service",
  "run-lawbot-workflow",
  "resend.emails.send",
  "new Resend",
  "dangerouslySetInnerHTML"
]) {
  assert.equal(combinedSource.includes(forbidden), false, `Forbidden token: ${forbidden}`);
}

for (const forbidden of ["prisma", "@/lib/db", "/api/", "fetch(", "POST", "PATCH", "DELETE"]) {
  assert.equal(publicPageSource.includes(forbidden), false, `Forbidden public page token: ${forbidden}`);
}

for (const forbiddenDependency of ["\"three\"", "\"@react-three/fiber\"", "\"@react-three/drei\""]) {
  assert.equal(packageSource.includes(forbiddenDependency), false, `Forbidden dependency: ${forbiddenDependency}`);
}

const appShellSource = readFileSync(appShellPath, "utf8");
assert.match(appShellSource, /pathname === "\/services"/);
assert.match(appShellSource, /pathname\.startsWith\("\/services\/"\)/);

console.log("public marketing pages tests passed");
