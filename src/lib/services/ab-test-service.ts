import { prisma } from "@/lib/prisma/client";

export type ABTest = {
  key: string;
  name: string;
  variants: string[];
  weights?: number[];
  active: boolean;
};

const EXPERIMENTS_KEY = "ab_experiments";
const PAUSED_KEY = "ab_experiments_paused";

export type ABMetric = {
  testKey: string;
  variant: string;
  event: "view" | "conversion";
  sessionId: string;
};

const MAX_METRICS = 5000;

const tests = new Map<string, ABTest>();
const metrics: ABMetric[] = [];

export function defineTest(test: ABTest): void {
  tests.set(test.key, test);
}

export function listTests(): ABTest[] {
  return Array.from(tests.values());
}

export function getTest(testKey: string): ABTest | undefined {
  return tests.get(testKey);
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getVariant(testKey: string, sessionId: string): string {
  const test = tests.get(testKey);
  if (!test || !test.active || test.variants.length === 0) {
    return test?.variants[0] ?? "control";
  }
  const weights =
    test.weights && test.weights.length === test.variants.length
      ? test.weights
      : test.variants.map(() => 1);
  const total = weights.reduce((s, w) => s + w, 0);
  const h = hashString(`${sessionId}:${testKey}`);
  const point = (h % 10000) / 10000 * total;
  let acc = 0;
  for (let i = 0; i < test.variants.length; i++) {
    acc += weights[i];
    if (point < acc) return test.variants[i];
  }
  return test.variants[test.variants.length - 1];
}

export function recordMetric(metric: ABMetric): void {
  metrics.push(metric);
  if (metrics.length > MAX_METRICS) {
    metrics.splice(0, metrics.length - MAX_METRICS);
  }
}

export function getTestResults(testKey: string): {
  variants: { name: string; views: number; conversions: number; rate: number }[];
  winner?: string;
} {
  const test = tests.get(testKey);
  if (!test) return { variants: [] };
  const variants = test.variants.map((name) => {
    const relevant = metrics.filter((m) => m.testKey === testKey && m.variant === name);
    const views = relevant.filter((m) => m.event === "view").length;
    const conversions = relevant.filter((m) => m.event === "conversion").length;
    const rate = views > 0 ? conversions / views : 0;
    return { name, views, conversions, rate };
  });
  let winner: string | undefined;
  const eligible = variants.filter((v) => v.views >= 10);
  if (eligible.length > 0) {
    winner = eligible.reduce((a, b) => (b.rate > a.rate ? b : a)).name;
  }
  return { variants, winner };
}

/** SiteSetting `ab_experiments`에 저장된 사용자 정의 실험을 defineTest로 하이드레이션 */
export async function loadExperimentsFromSetting(): Promise<void> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: EXPERIMENTS_KEY } });
    if (row?.value) {
      const parsed = JSON.parse(row.value) as unknown;
      if (Array.isArray(parsed)) {
        for (const raw of parsed) {
          if (!raw || typeof raw !== "object") continue;
          const t = raw as Partial<ABTest>;
          if (
            typeof t.key === "string" &&
            typeof t.name === "string" &&
            Array.isArray(t.variants) &&
            t.variants.every((v) => typeof v === "string")
          ) {
            defineTest({
              key: t.key,
              name: t.name,
              variants: t.variants,
              weights: Array.isArray(t.weights) ? t.weights.map(Number) : undefined,
              active: t.active !== false,
            });
          }
        }
      }
    }
    const pausedRow = await prisma.siteSetting.findUnique({ where: { key: PAUSED_KEY } });
    if (pausedRow?.value) {
      const paused = JSON.parse(pausedRow.value) as unknown;
      if (Array.isArray(paused)) {
        for (const k of paused) {
          if (typeof k === "string") {
            const t = tests.get(k);
            if (t) t.active = false;
          }
        }
      }
    }
  } catch {
    // best-effort
  }
}

async function readPausedSet(): Promise<Set<string>> {
  const row = await prisma.siteSetting.findUnique({ where: { key: PAUSED_KEY } });
  if (!row?.value) return new Set();
  try {
    const parsed = JSON.parse(row.value);
    return new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : []);
  } catch {
    return new Set();
  }
}

async function readExperimentList(): Promise<ABTest[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: EXPERIMENTS_KEY } });
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as ABTest[]) : [];
  } catch {
    return [];
  }
}

/** 실험 일시정지/재개 — SiteSetting `ab_experiments_paused` 배열 + 인메모리 반영 */
export async function setExperimentPaused(key: string, paused: boolean): Promise<void> {
  const set = await readPausedSet();
  if (paused) set.add(key);
  else set.delete(key);
  const value = JSON.stringify(Array.from(set));
  await prisma.siteSetting.upsert({
    where: { key: PAUSED_KEY },
    create: { key: PAUSED_KEY, value },
    update: { value },
  });
  const t = tests.get(key);
  if (t) t.active = !paused;
}

/** 신규 실험 저장 — SiteSetting `ab_experiments` 배열 upsert + defineTest */
export async function saveExperiment(test: ABTest): Promise<void> {
  if (!test.key || !test.name || !Array.isArray(test.variants) || test.variants.length < 2) {
    throw new Error("실험은 key/name과 2개 이상 variant가 필요합니다");
  }
  const list = await readExperimentList();
  const idx = list.findIndex((t) => t.key === test.key);
  if (idx >= 0) list[idx] = test;
  else list.push(test);
  const value = JSON.stringify(list);
  await prisma.siteSetting.upsert({
    where: { key: EXPERIMENTS_KEY },
    create: { key: EXPERIMENTS_KEY, value },
    update: { value },
  });
  defineTest(test);
}

// Pre-register default tests
defineTest({
  key: "hero-cta",
  name: "Hero CTA Style",
  variants: ["primary", "minimal"],
  active: true,
});
defineTest({
  key: "pricing-display",
  name: "Pricing Display Style",
  variants: ["table", "cards"],
  active: true,
});
