function getEnvInt(name: string, defaultValue: number, min: number, max: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return defaultValue;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(max, Math.max(min, parsed));
}

export const INTAKE_DEDUP_WINDOW_MS = getEnvInt(
  "PUBLIC_INTAKE_DEDUP_WINDOW_MS",
  120_000,
  10_000,
  60 * 60 * 1000
);

type InflightInquiryCreateMap = Map<string, Promise<unknown>>;
type InquiryServiceGlobal = typeof globalThis & {
  __inquiryCreateInflight?: InflightInquiryCreateMap;
};

export function getInflightInquiryCreateMap() {
  const state = globalThis as InquiryServiceGlobal;
  if (!state.__inquiryCreateInflight) {
    state.__inquiryCreateInflight = new Map();
  }
  return state.__inquiryCreateInflight;
}

export function buildIntakeDedupKey(input: { email: string; title: string; description: string }) {
  return [
    input.email.trim().toLowerCase(),
    input.title.trim().toLowerCase(),
    input.description.trim().toLowerCase()
  ].join("|");
}
