/**
 * Anthropic 게이트웨이 잠금.
 *
 * 목표: 예산 킬스위치/지출집계가 항상 걸리도록 **모든 Anthropic 호출이 단일
 * 게이트웨이를 경유**하게 강제한다. 새 서비스가 api.anthropic.com 을 직접 fetch 하면
 * 예산 가드를 우회하므로, 게이트웨이 파일 외의 직접 호출을 목록으로 못박아 회귀를 잡는다.
 *
 * 신규 서비스를 게이트웨이로 이관하면 ALLOWLIST 에서 제거(목표: 0).
 * 새 직접호출을 추가하려면 반드시 게이트웨이를 쓰거나, 불가피하면 사유와 함께
 * ALLOWLIST 에 등록 — 그래야 리뷰에서 드러난다.
 *
 * 실행: npx tsx scripts/tests/anthropic-gateway-lock-check.ts
 */
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import assert from "node:assert/strict";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const ANTHROPIC_HOST = "api.anthropic.com/v1/messages";
const GATEWAY_REL = "src/lib/services/anthropic-gateway.ts";

// 아직 게이트웨이로 이관 안 된 직접 호출(트리아지). 이관하면 여기서 제거.
// admin 대화형/저빈도 서비스가 다수 — 무인 크론(비용 리스크 큰 것)부터 이관 중.
const ALLOWLIST = new Set<string>([
  "src/app/api/public/ai-chat/route.ts",
  "src/app/api/public/ai-intake-screen/route.ts",
  "src/lib/services/rag-chatbot-service.ts",
  "src/lib/services/case-acceptance-advisor.ts",
  "src/lib/services/case-outcome-predictor.ts",
  "src/lib/services/ai-standby-service.ts",
  "src/lib/services/ai-decision-tree-service.ts",
  "src/lib/services/full-auto-case-service.ts",
  "src/lib/services/case-strategy-brainstorm-service.ts",
  "src/lib/services/document-dictation-service.ts",
  "src/lib/services/marketing-tts-helper.ts",
  "src/lib/services/case-copilot-service.ts",
  "src/lib/services/precedent-vector-search.ts",
  "src/lib/services/message-intake-bot.ts",
  "src/lib/services/voice-command-service.ts",
  "src/lib/services/vip-concierge-bot.ts",
  "src/lib/services/needs-prediction-service.ts",
  "src/lib/services/sentiment-analysis-service.ts",
  "src/lib/services/profile-enrichment-service.ts",
  "src/lib/services/realtime-interpreter-service.ts",
  "src/lib/services/live-transcription-service.ts",
  "src/lib/services/scheduling-bot-service.ts",
  "src/lib/services/pr-syndication-service.ts",
  "src/lib/services/checklist-generator-service.ts",
  "src/lib/services/supplement-response-bot.ts",
  "src/lib/services/persona-analysis-service.ts",
  "src/lib/services/consultation-script-generator.ts",
  "src/lib/services/document-ocr-service.ts",
  "src/lib/services/case-story-generator.ts",
  "src/lib/services/fee-estimator-service.ts",
  "src/lib/services/vision-analysis-service.ts",
  "src/lib/services/ai-classification-service.ts",
  "src/lib/services/computer-use-service.ts",
  "src/lib/services/stt-service.ts",
  "src/lib/services/document-draft-generator-service.ts",
  "src/lib/services/evidence-trust-scorer.ts",
  "src/lib/services/live-emotion-analyzer.ts",
  "src/lib/services/text-ab-comparator.ts",
]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith(".ts") || name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

const directCallers: string[] = [];
for (const abs of walk(SRC)) {
  const rel = relative(ROOT, abs).replace(/\\/g, "/");
  if (rel === GATEWAY_REL) continue;
  if (rel.endsWith(".test.ts") || rel.endsWith(".test.tsx")) continue;
  const src = readFileSync(abs, "utf8");
  if (src.includes(ANTHROPIC_HOST)) directCallers.push(rel);
}

// 1) allowlist 에 없는 신규 직접호출 = 게이트웨이 우회 → 실패.
const unexpected = directCallers.filter((f) => !ALLOWLIST.has(f));
assert.deepEqual(
  unexpected,
  [],
  `게이트웨이 우회(직접 Anthropic 호출) 발견 — callAnthropicMessages 사용 or ALLOWLIST 등록:\n${unexpected.join("\n")}`,
);

// 2) allowlist 중 이미 이관/삭제된 항목은 목록에서 빼도록 강제(썩은 allowlist 방지).
const stale = [...ALLOWLIST].filter((f) => !directCallers.includes(f));
assert.deepEqual(
  stale,
  [],
  `ALLOWLIST 에 남았지만 더는 직접호출 안 하는 항목 — 제거 필요:\n${stale.join("\n")}`,
);

// 3) 게이트웨이 자신은 예산 가드 + 지출 집계를 반드시 포함.
const gatewaySrc = readFileSync(join(ROOT, GATEWAY_REL), "utf8");
assert.ok(gatewaySrc.includes("isAiAllowed"), "게이트웨이가 isAiAllowed 가드를 호출해야 함");
assert.ok(gatewaySrc.includes("recordAiSpend"), "게이트웨이가 recordAiSpend 로 지출을 집계해야 함");

// 4) smart-ai-client 는 직접 fetch 하지 말고 게이트웨이 경유.
const smartSrc = readFileSync(join(ROOT, "src/lib/services/smart-ai-client.ts"), "utf8");
assert.ok(
  smartSrc.includes("callAnthropicMessages"),
  "smart-ai-client 는 게이트웨이(callAnthropicMessages)를 경유해야 함",
);
assert.equal(
  smartSrc.includes(ANTHROPIC_HOST),
  false,
  "smart-ai-client 가 Anthropic 을 직접 호출하면 안 됨(게이트웨이 경유)",
);

console.log(
  `anthropic gateway lock: 직접호출 ${directCallers.length}건 전부 allowlist 관리(우회 0), 게이트웨이 가드 확인`,
);
