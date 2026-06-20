// PII masking utilities for Korean and international personal data.

export const PII_PATTERNS = {
  rrn: /\d{6}-?[1-4]\d{6}/g,
  alien: /\d{6}-?[5-8]\d{6}/g,
  passport: /[A-Z]\d{8}/g,
  phone: /01[0-9]-?\d{3,4}-?\d{4}/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  creditCard: /\d{4}-?\d{4}-?\d{4}-?\d{4}/g,
} as const;

export type PiiType = keyof typeof PII_PATTERNS;

const PII_FIELD_NAMES = ["name", "phone", "email", "ssn", "passport", "address"];

function maskValue(match: string, keepLast?: number): string {
  if (!keepLast || keepLast <= 0) return "***";
  const digits = match.replace(/\D/g, "");
  if (digits.length <= keepLast) return "***";
  const tail = digits.slice(-keepLast);
  return `***${tail}`;
}

export function maskPII(text: string, options?: { keepLast?: number }): string {
  if (!text) return text;
  let result = text;
  for (const pattern of Object.values(PII_PATTERNS)) {
    result = result.replace(new RegExp(pattern.source, pattern.flags), (m) =>
      maskValue(m, options?.keepLast),
    );
  }
  return result;
}

export function detectPII(text: string): { type: string; matches: string[] }[] {
  const out: { type: string; matches: string[] }[] = [];
  if (!text) return out;
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const re = new RegExp(pattern.source, pattern.flags);
    const matches = text.match(re);
    if (matches && matches.length > 0) {
      out.push({ type, matches: Array.from(new Set(matches)) });
    }
  }
  return out;
}

function isPiiFieldName(key: string, allowList?: string[]): boolean {
  const lower = key.toLowerCase();
  const candidates = allowList && allowList.length > 0 ? allowList : PII_FIELD_NAMES;
  return candidates.some((c) => lower.includes(c.toLowerCase()));
}

export function maskObject<T>(obj: T, fields?: string[]): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return maskPII(obj) as unknown as T;
  if (Array.isArray(obj)) {
    return obj.map((v) => maskObject(v, fields)) as unknown as T;
  }
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (isPiiFieldName(key, fields)) {
        if (typeof value === "string") {
          out[key] = "***";
        } else {
          out[key] = maskObject(value, fields);
        }
      } else if (typeof value === "string") {
        out[key] = maskPII(value);
      } else {
        out[key] = maskObject(value, fields);
      }
    }
    return out as T;
  }
  return obj;
}
