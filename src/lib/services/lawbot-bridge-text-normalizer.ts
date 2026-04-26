const HANGUL_PATTERN = /[\uac00-\ud7a3]/;
const LATIN1_SUSPECT_PATTERN = /[\u00c0-\u00ff]/g;
const REPLACEMENT_CHAR_PATTERN = /\uFFFD/;
const REPLACEMENT_CHAR_GLOBAL_PATTERN = /\uFFFD+/g;
const COMMON_MOJIBAKE_PREFIX_PATTERN = /[\u00c3\u00c2\u00ec\u00eb]/;
const WHITESPACE_SPLIT_PATTERN = /(\s+)/;
const MAX_REPAIR_PASSES = 2;

function countLatin1Suspects(value: string) {
  const matches = value.match(LATIN1_SUSPECT_PATTERN);
  return matches ? matches.length : 0;
}

function shouldAttemptRepair(value: string) {
  if (!value) {
    return false;
  }

  const suspectCount = countLatin1Suspects(value);
  if (suspectCount >= 2) {
    return true;
  }

  return (
    REPLACEMENT_CHAR_PATTERN.test(value) ||
    COMMON_MOJIBAKE_PREFIX_PATTERN.test(value)
  );
}

function repairOnce(value: string) {
  try {
    return Buffer.from(value, "latin1").toString("utf8");
  } catch {
    return value;
  }
}

function shouldAcceptRepair(original: string, repaired: string) {
  if (!repaired || repaired === original) {
    return false;
  }

  if (REPLACEMENT_CHAR_PATTERN.test(repaired)) {
    const sanitized = repaired.replace(REPLACEMENT_CHAR_GLOBAL_PATTERN, "").trim();
    if (!sanitized || !HANGUL_PATTERN.test(sanitized)) {
      return false;
    }
    return countLatin1Suspects(sanitized) < countLatin1Suspects(original);
  }

  if (HANGUL_PATTERN.test(repaired)) {
    return true;
  }

  return countLatin1Suspects(repaired) < countLatin1Suspects(original);
}

function normalizeBridgeToken(token: string) {
  const trimmedToken = token.trim();
  if (!trimmedToken || !shouldAttemptRepair(trimmedToken)) {
    return token;
  }

  let current = trimmedToken;
  for (let pass = 0; pass < MAX_REPAIR_PASSES; pass += 1) {
    const repaired = repairOnce(current).trim();
    if (!shouldAcceptRepair(current, repaired)) {
      break;
    }
    current = repaired.replace(REPLACEMENT_CHAR_GLOBAL_PATTERN, "").trim();
    if (!shouldAttemptRepair(current)) {
      break;
    }
  }

  if (
    shouldAttemptRepair(current) &&
    !HANGUL_PATTERN.test(current) &&
    (COMMON_MOJIBAKE_PREFIX_PATTERN.test(current) ||
      countLatin1Suspects(current) >= 3)
  ) {
    return "";
  }

  return current;
}

export function normalizeBridgeText(value: string) {
  const trimmed = value.trim();
  if (!trimmed || !shouldAttemptRepair(trimmed)) {
    return trimmed;
  }

  const segments = trimmed.split(WHITESPACE_SPLIT_PATTERN);
  if (segments.length === 1) {
    return normalizeBridgeToken(trimmed);
  }

  return segments
    .map((segment) => {
      if (!segment || /^\s+$/.test(segment)) {
        return segment;
      }
      return normalizeBridgeToken(segment);
    })
    .join("")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function normalizeBridgeStringArray(values: string[]) {
  return values
    .map((value) => normalizeBridgeText(value))
    .filter((value) => value.length > 0);
}

export function normalizeBridgeTextDeep<T>(input: T): T {
  if (typeof input === "string") {
    return normalizeBridgeText(input) as T;
  }

  if (Array.isArray(input)) {
    return input.map((entry) => normalizeBridgeTextDeep(entry)) as T;
  }

  if (input && typeof input === "object") {
    const entries = Object.entries(input as Record<string, unknown>).map(
      ([key, value]) => [key, normalizeBridgeTextDeep(value)]
    );
    return Object.fromEntries(entries) as T;
  }

  return input;
}
