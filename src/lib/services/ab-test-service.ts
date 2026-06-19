export type ABTest = {
  key: string;
  name: string;
  variants: string[];
  weights?: number[];
  active: boolean;
};

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
