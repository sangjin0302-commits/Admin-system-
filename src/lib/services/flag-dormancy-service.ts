import { FEATURE_REGISTRY, getAllFlags } from "@/lib/services/feature-flags-service";

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export type DormancyResult = {
  dormant: string[];
  duplicateSuspects: { key1: string; key2: string; similarity: number }[];
};

export async function detectDormantFlags(): Promise<DormancyResult> {
  const stored = await getAllFlags();
  const registry = FEATURE_REGISTRY;

  const dormant: string[] = [];
  for (const f of registry) {
    if (!f.default && stored[f.key] === f.default) {
      dormant.push(f.key);
    }
  }

  const duplicateSuspects: DormancyResult["duplicateSuspects"] = [];
  for (let i = 0; i < registry.length; i++) {
    for (let j = i + 1; j < registry.length; j++) {
      const a = registry[i];
      const b = registry[j];
      const dist = levenshtein(a.key, b.key);
      const isSubstring =
        a.key.length > 4 && b.key.length > 4 && (a.key.includes(b.key) || b.key.includes(a.key));
      if (dist < 5 || isSubstring) {
        duplicateSuspects.push({ key1: a.key, key2: b.key, similarity: dist });
      }
    }
  }

  duplicateSuspects.sort((a, b) => a.similarity - b.similarity);

  return { dormant, duplicateSuspects };
}
