/**
 * 민감 admin 라우트 RBAC 가드 잠금.
 *
 * 결제·인증·인프라·설정·발송 등 고위험 admin 뮤테이션 라우트는 반드시
 * requireRole 로 역할 검증을 해야 한다(단일 Basic-auth=SUPER 폴백 외에, 다중
 * 역할 도입 시 STAFF/EXTERNAL 이 SUPER 작업을 못 하도록). 회귀 시 CI 실패.
 *
 * 실행: npx tsx scripts/tests/admin-rbac-guard-check.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "src", "app", "api", "admin");

// 반드시 requireRole 를 호출해야 하는 고위험 라우트(상대경로).
const GUARDED_ROUTES = [
  "credentials/route.ts",
  "sso/route.ts",
  "tenants/route.ts",
  "orgs/route.ts",
  "backup/restore-sim/route.ts",
  "cache/clear/route.ts",
  "scheduled-jobs/run/route.ts",
  "auto-conversion/run/route.ts",
  "campaigns/send/route.ts",
  "push/send/route.ts",
];

const GUARD_RE = /requireRole\s*\(/;

let failed = 0;
for (const rel of GUARDED_ROUTES) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) {
    console.log(`  --  ${rel} (파일 없음, 건너뜀)`);
    continue;
  }
  const src = readFileSync(file, "utf8");
  if (GUARD_RE.test(src)) {
    console.log(`  ok  ${rel}`);
  } else {
    failed++;
    console.error(`  ✕  ${rel} — requireRole 가드 없음(고위험 라우트 무방비)`);
  }
}

if (failed > 0) {
  console.error(`\n[admin-rbac-guard] FAILED ${failed}건 — 고위험 라우트에 requireRole 추가 필요.`);
  process.exit(1);
}
console.log("\n[admin-rbac-guard] OK — 고위험 admin 라우트 RBAC 가드 유지.");
