import { EXPERIMENTS } from "./ab-config";
import { parseAbCookie } from "./ab-cookie";

function pickVariant(variants: string[], weights?: number[]): string {
  if (!weights || weights.length !== variants.length) {
    return variants[Math.floor(Math.random() * variants.length)];
  }
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < variants.length; i++) {
    r -= weights[i];
    if (r <= 0) return variants[i];
  }
  return variants[variants.length - 1];
}

export function getVariant(
  experimentId: string,
  cookieValue: string | null | undefined
): string {
  const assignments = parseAbCookie(cookieValue);
  if (assignments[experimentId]) return assignments[experimentId];

  const experiment = EXPERIMENTS[experimentId];
  if (!experiment) return "control";

  return pickVariant(experiment.variants, experiment.weights);
}
