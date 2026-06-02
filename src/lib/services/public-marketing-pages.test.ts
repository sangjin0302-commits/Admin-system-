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
const serviceDetailPagePath = join(root, "src/app/services/[slug]/page.tsx");
const appShellPath = join(root, "src/components/layout/app-shell-safe.tsx");
const packageJsonPath = join(root, "package.json");

for (const path of [rootPagePath, servicesPagePath, serviceDetailPagePath, appShellPath, packageJsonPath]) {
  assert.equal(existsSync(path), true, `Missing source: ${path}`);
}

const rootSource = readFileSync(rootPagePath, "utf8");
const servicesSource = readFileSync(servicesPagePath, "utf8");
const combinedSource = [
  rootSource,
  servicesSource,
  readFileSync(serviceDetailPagePath, "utf8"),
  readFileSync(join(root, "src/lib/services/public-marketing-pages.ts"), "utf8")
].join("\n");
const publicPageSource = [rootSource, servicesSource].join("\n");
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

for (const requiredHomeToken of ["사무소 입구", "접수번호", "자료요청", "기한관리", "서식검토"]) {
  assert.equal(rootSource.includes(requiredHomeToken), true, `Missing home visual token: ${requiredHomeToken}`);
}

for (const requiredServicesToken of ["공통 서식·문서 준비", "상담 전 확인", "상세 분야"]) {
  assert.equal(servicesSource.includes(requiredServicesToken), true, `Missing services token: ${requiredServicesToken}`);
}

for (const forbidden of [
  "100% 허가",
  "확실한 해결",
  "즉시 수임",
  "결과 보장",
  "무조건 가능",
  "최단기간 보장",
  "승소 보장",
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
