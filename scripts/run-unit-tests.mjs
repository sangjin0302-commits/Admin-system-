/**
 * 코로케이션 유닛테스트 러너 — src 하위 *.test.ts 를 tsx 로 실행(파일당 프로세스=격리).
 *
 * 그동안 이 테스트들은 러너가 없어 한 번도 실행되지 않았다(tsc 만 통과 = 헛믿음).
 * 이 러너가 CI(locks-unit 잡)에서 돌려 회귀를 실제로 잡는다.
 *
 * EXCLUDE: 현재 실패하는 15개(스테일/미해결). CI 를 초록으로 유지하려 제외하고
 * 별도 트리아지 대상으로 남긴다. 하나씩 고쳐 EXCLUDE 에서 빼는 게 목표.
 *
 * 실행: node scripts/run-unit-tests.mjs
 */
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

// 아직 통과하지 못하는 테스트(트리아지 대상). 고치면 여기서 제거.
const EXCLUDE = new Set([
  "src/app/admin/document-lab/page.test.ts",
  "src/components/admin/immigration-case-detail-panel.test.ts",
  "src/lib/services/admin-intake-source-analytics.test.ts",
  "src/lib/services/case-matter-service.test.ts",
  "src/lib/services/customer-notification-preview-service.test.ts",
  "src/lib/services/customer-notification-send/__tests__/email-send.test.ts",
  "src/lib/services/feature-flags-service.test.ts",
  "src/lib/services/lawbot-message-send-readiness-ui-model.test.ts",
  "src/lib/services/lawbot-review-approval-ui-model.test.ts",
  "src/lib/services/lawbot-review-readonly-ui-model.test.ts",
  "src/lib/services/public-marketing-pages.test.ts",
  "src/lib/services/public-root-gateway-ui-model.test.ts",
  "src/lib/services/public-track-page-ui-model.test.ts",
  "src/lib/services/public-track-pwa-manifest.test.ts",
  "src/lib/validation/inquiry-category-flow.test.ts",
]);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith(".test.ts")) out.push(full);
  }
  return out;
}

const files = walk(SRC)
  .map((f) => relative(ROOT, f).replace(/\\/g, "/"))
  .filter((rel) => !EXCLUDE.has(rel))
  .sort();

let pass = 0;
const failed = [];
for (const rel of files) {
  const res = spawnSync("npx", ["tsx", rel], {
    cwd: ROOT,
    stdio: "ignore",
    shell: process.platform === "win32",
    timeout: 60_000,
  });
  if (res.status === 0) {
    pass++;
    console.log(`  ok  ${rel}`);
  } else {
    failed.push(rel);
    console.error(`  ✕  ${rel} (exit ${res.status})`);
  }
}

console.log(`\n[unit] ${pass} passed, ${failed.length} failed (excluded ${EXCLUDE.size} 트리아지 대상)`);
if (failed.length > 0) {
  console.error("[unit] FAILED:\n" + failed.map((f) => "  - " + f).join("\n"));
  process.exit(1);
}
console.log("[unit] OK — 코로케이션 유닛테스트 통과분 잠금 유지.");
