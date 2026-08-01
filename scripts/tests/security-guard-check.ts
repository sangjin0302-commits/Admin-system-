/**
 * 보안 회귀 잠금 검사.
 *
 * 감사에서 고친 보안 항목이 되돌아가면 CI 실패로 차단한다.
 * (문자열 스캔 — 런타임 없이 소스에서 안전 패턴 존재를 강제.)
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const fails: string[] = [];

function read(rel: string): string {
  try {
    return readFileSync(join(ROOT, rel), "utf8");
  } catch {
    fails.push(`파일 없음: ${rel}`);
    return "";
  }
}

function must(rel: string, needle: string | RegExp, label: string) {
  const src = read(rel);
  const ok = typeof needle === "string" ? src.includes(needle) : needle.test(src);
  if (!ok) fails.push(`${label} — ${rel}`);
}

function mustNot(rel: string, needle: string, label: string) {
  if (read(rel).includes(needle)) fails.push(`${label} — ${rel}`);
}

// 1) Modusign 웹훅 fail-closed (시크릿 없으면 거부)
must("src/lib/services/e-signature-service.ts", "fail-closed", "웹훅 fail-closed 주석 사라짐");
mustNot(
  "src/lib/services/e-signature-service.ts",
  "미설정 — 시그니처 검증 건너뜀",
  "웹훅이 다시 fail-open(검증 건너뜀)으로 되돌아감"
);

// 2) 관리자 알림메일 PII 이스케이프
must("src/lib/services/email-notification-service.ts", "function esc", "메일 이스케이프 헬퍼 사라짐");
must("src/lib/services/email-notification-service.ts", "esc(inquiry.message)", "메일 message 이스케이프 사라짐");

// 3) JSON-LD < 이스케이프 (script 탈출 방지)
must("src/components/seo/json-ld.tsx", "u003c", "JSON-LD < 이스케이프 사라짐");

// 4) PII export 라우트 RBAC
for (const rel of [
  "src/app/api/admin/cases/export/route.ts",
  "src/app/api/admin/cases/export-xlsx/route.ts",
  "src/app/api/admin/cases/export-sheets/route.ts"
]) {
  must(rel, "requireRole", "PII export RBAC 가드 사라짐");
}

// 5) 마케팅 메일 수신거부 (정보통신망법)
must("src/lib/services/email-service.ts", "무료 수신거부", "마케팅 메일 수신거부 링크 사라짐");
must("src/lib/services/email-service.ts", "List-Unsubscribe", "List-Unsubscribe 헤더 사라짐");

if (fails.length > 0) {
  console.error("[security-guard] 보안 회귀 감지:");
  for (const f of fails) console.error("  - " + f);
  process.exit(1);
}
console.log("[security-guard] OK — 보안 고정 항목 유지(웹훅 fail-closed·메일 이스케이프·JSON-LD·export RBAC·수신거부).");
