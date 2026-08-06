/**
 * AI 응답 품질 자동 회귀 테스트.
 *
 * - 테스트 스위트: SiteSetting `ai.regression.suite` — RegressionTest[]
 * - 실행 이력: SiteSetting `ai.regression.history` — 최근 60회
 * - 판정: Claude Haiku 로 기대 개념 포함 여부 판단.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { callAnthropicMessages } from "@/lib/services/anthropic-gateway";

const SUITE_KEY = "ai.regression.suite";
const HISTORY_KEY = "ai.regression.history";
const MAX_HISTORY = 60;

export type RegressionTest = {
  id: string;
  service: string;
  input: string;
  expectedKeywords: string[];
  expectedTone?: string;
  minScore: number; // 0..1
};

export type RegressionResult = {
  testId: string;
  service: string;
  pass: boolean;
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  actualOutput?: string;
  judgeReason?: string;
  error?: string;
};

export type RegressionRun = {
  id: string;
  ranAt: string;
  pass: number;
  fail: number;
  passRate: number;
  results: RegressionResult[];
};

function newId(prefix = "reg"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row?.value) return fallback;
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: json },
    update: { value: json },
  });
}

export async function getSuite(): Promise<RegressionTest[]> {
  const list = await readJson<RegressionTest[]>(SUITE_KEY, []);
  return Array.isArray(list) ? list : [];
}

export async function saveSuite(tests: RegressionTest[]): Promise<void> {
  await writeJson(SUITE_KEY, tests);
}

export async function upsertTest(test: RegressionTest): Promise<void> {
  const suite = await getSuite();
  const idx = suite.findIndex((t) => t.id === test.id);
  if (idx >= 0) suite[idx] = test;
  else suite.push({ ...test, id: test.id || newId("t") });
  await saveSuite(suite);
}

export async function removeTest(id: string): Promise<void> {
  const suite = await getSuite();
  await saveSuite(suite.filter((t) => t.id !== id));
}

export async function getHistory(): Promise<RegressionRun[]> {
  const list = await readJson<RegressionRun[]>(HISTORY_KEY, []);
  return Array.isArray(list) ? list : [];
}

async function pushHistory(run: RegressionRun): Promise<void> {
  const list = await getHistory();
  list.push(run);
  await writeJson(HISTORY_KEY, list.slice(-MAX_HISTORY));
}

/** 서비스별 실제 응답 생성 어댑터 (경량 스텁 — 실 서비스 등록 시 확장). */
async function invokeService(service: string, input: string): Promise<string> {
  // 실제 서비스 라우팅이 없으면 입력을 그대로 반환하여 기대 키워드 검증만 수행.
  // 확장 지점: 여기서 service 이름에 따라 실제 AI 함수 호출.
  return `[${service}] ${input}`;
}

/** Haiku 로 응답이 기대 개념을 담고 있는지 판단. 실패 시 키워드 매칭으로 폴백. */
async function judgeWithHaiku(
  output: string,
  test: RegressionTest
): Promise<{ score: number; reason: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const matched = test.expectedKeywords.filter((kw) =>
    output.toLowerCase().includes(kw.toLowerCase())
  );
  const keywordScore = test.expectedKeywords.length
    ? matched.length / test.expectedKeywords.length
    : 1;
  if (!apiKey) return { score: keywordScore, reason: "키워드 매칭 (API 키 없음)" };

  try {
    const prompt = `Evaluate whether the AI response contains the expected concepts.

Expected keywords/concepts: ${test.expectedKeywords.join(", ")}
${test.expectedTone ? `Expected tone: ${test.expectedTone}` : ""}

AI response:
${output}

Respond ONLY with JSON: {"score":0.0-1.0,"reason":"한국어 간단 설명"}`;

    const r = await callAnthropicMessages({
      model: "claude-haiku-4-5-20251001",
      maxTokens: 150,
      prompt,
    });
    const text: string = r.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { score: keywordScore, reason: "판정기 응답 파싱 실패" };
    const parsed = JSON.parse(match[0]) as { score?: number; reason?: string };
    const s = typeof parsed.score === "number" ? Math.max(0, Math.min(1, parsed.score)) : keywordScore;
    return { score: s, reason: parsed.reason ?? "" };
  } catch (err) {
    logger.warn("[ai-regression] Haiku 판정 실패", { err: String(err) });
    return { score: keywordScore, reason: "키워드 매칭 폴백" };
  }
}

export async function runRegressionSuite(): Promise<RegressionRun> {
  const suite = await getSuite();
  const results: RegressionResult[] = [];
  for (const test of suite) {
    try {
      const output = await invokeService(test.service, test.input);
      const judged = await judgeWithHaiku(output, test);
      const matched = test.expectedKeywords.filter((kw) =>
        output.toLowerCase().includes(kw.toLowerCase())
      );
      const missing = test.expectedKeywords.filter((kw) => !matched.includes(kw));
      results.push({
        testId: test.id,
        service: test.service,
        pass: judged.score >= test.minScore,
        score: judged.score,
        matchedKeywords: matched,
        missingKeywords: missing,
        actualOutput: output.slice(0, 500),
        judgeReason: judged.reason,
      });
    } catch (err) {
      results.push({
        testId: test.id,
        service: test.service,
        pass: false,
        score: 0,
        matchedKeywords: [],
        missingKeywords: test.expectedKeywords,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  const pass = results.filter((r) => r.pass).length;
  const fail = results.length - pass;
  const run: RegressionRun = {
    id: newId("run"),
    ranAt: new Date().toISOString(),
    pass,
    fail,
    passRate: results.length ? pass / results.length : 1,
    results,
  };
  await pushHistory(run);
  return run;
}
