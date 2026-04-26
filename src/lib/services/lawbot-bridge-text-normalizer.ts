const HANGUL_PATTERN = /[\uac00-\ud7a3]/g;
const HANGUL_CHAR_PATTERN = /[\uac00-\ud7a3]/;
const REPLACEMENT_CHAR_PATTERN = /\uFFFD/g;
const LATIN1_SUSPECT_PATTERN = /[\u00c0-\u00ff]/g;
const WINDOWS1252_CONTROL_PATTERN = /[\u0080-\u009f]/g;
const NON_PRINTABLE_CONTROL_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g;
const COMMON_MOJIBAKE_PREFIX_PATTERN = /[ìëíÂÃ]/;
const WHITESPACE_SPLIT_PATTERN = /(\s+)/;
const MAX_REPAIR_PASSES = 3;

const WINDOWS1252_UNICODE_TO_BYTE: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f
};

function countMatches(value: string, pattern: RegExp) {
  const matches = value.match(pattern);
  return matches ? matches.length : 0;
}

function countHangul(value: string) {
  return countMatches(value, HANGUL_PATTERN);
}

function countReplacementChars(value: string) {
  return countMatches(value, REPLACEMENT_CHAR_PATTERN);
}

function countSuspects(value: string) {
  return (
    countMatches(value, LATIN1_SUSPECT_PATTERN) +
    countMatches(value, WINDOWS1252_CONTROL_PATTERN)
  );
}

function sanitizeDecodedText(value: string) {
  return value
    .replace(REPLACEMENT_CHAR_PATTERN, "")
    .replace(NON_PRINTABLE_CONTROL_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function shouldAttemptRepair(value: string) {
  if (!value) {
    return false;
  }

  if (countMatches(value, WINDOWS1252_CONTROL_PATTERN) > 0) {
    return true;
  }

  return (
    COMMON_MOJIBAKE_PREFIX_PATTERN.test(value) ||
    countSuspects(value) >= 2 ||
    countReplacementChars(value) > 0
  );
}

export function hasBridgeMojibake(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (countReplacementChars(trimmed) > 0) {
    return true;
  }

  if (countMatches(trimmed, WINDOWS1252_CONTROL_PATTERN) > 0) {
    return true;
  }

  const tokens = trimmed.split(/\s+/);
  return tokens.some((token) => {
    if (!token) {
      return false;
    }
    if (HANGUL_CHAR_PATTERN.test(token)) {
      return false;
    }
    return COMMON_MOJIBAKE_PREFIX_PATTERN.test(token) || countSuspects(token) >= 2;
  });
}

function scoreDecodedQuality(value: string) {
  return (
    countHangul(value) * 6 -
    countSuspects(value) * 2 -
    countReplacementChars(value) * 8
  );
}

function unicodeCharToWindows1252Byte(char: string) {
  const codePoint = char.codePointAt(0);
  if (codePoint === undefined) {
    return null;
  }

  if (codePoint >= 0x00 && codePoint <= 0xff) {
    return codePoint;
  }

  return WINDOWS1252_UNICODE_TO_BYTE[codePoint] ?? null;
}

function reconstructWindows1252Bytes(value: string) {
  const bytes: number[] = [];
  for (const char of value) {
    const byte = unicodeCharToWindows1252Byte(char);
    if (byte === null) {
      return null;
    }
    bytes.push(byte);
  }
  return Buffer.from(bytes);
}

function decodeCandidateUtf8(value: string) {
  const byteBuffer = reconstructWindows1252Bytes(value);
  if (!byteBuffer) {
    return null;
  }
  return byteBuffer.toString("utf8");
}

function normalizeBridgeToken(token: string) {
  const trimmedToken = token.trim();
  if (!trimmedToken || !shouldAttemptRepair(trimmedToken)) {
    return token;
  }

  let current = trimmedToken;
  for (let pass = 0; pass < MAX_REPAIR_PASSES; pass += 1) {
    const decoded = decodeCandidateUtf8(current);
    if (!decoded || decoded === current) {
      break;
    }

    const decodedTrimmed = sanitizeDecodedText(decoded);
    if (!decodedTrimmed) {
      break;
    }

    const currentScore = scoreDecodedQuality(current);
    const decodedScore = scoreDecodedQuality(decodedTrimmed);
    if (decodedScore <= currentScore) {
      break;
    }

    current = decodedTrimmed;
    if (!shouldAttemptRepair(current)) {
      break;
    }
  }

  // Never erase meaningful unrecoverable content; preserve original token as fallback.
  const bestCandidate = sanitizeDecodedText(current);
  if (bestCandidate) {
    return bestCandidate;
  }

  const sanitizedOriginal = sanitizeDecodedText(trimmedToken);
  if (sanitizedOriginal) {
    return sanitizedOriginal;
  }

  if (countMatches(trimmedToken, NON_PRINTABLE_CONTROL_PATTERN) > 0) {
    return "";
  }

  return trimmedToken;
}

export function normalizeBridgeText(value: string) {
  const trimmed = value.trim();
  if (!trimmed || !shouldAttemptRepair(trimmed)) {
    return trimmed;
  }

  const segments = trimmed.split(WHITESPACE_SPLIT_PATTERN);
  if (segments.length === 1) {
    return normalizeBridgeToken(trimmed).trim();
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
  return values.map((value) => normalizeBridgeText(value));
}

export function normalizeBridgeTextWithFallback(value: string, fallback: string) {
  const normalized = normalizeBridgeText(value);
  if (!normalized) {
    return fallback;
  }

  if (hasBridgeMojibake(normalized)) {
    return fallback;
  }

  return normalized;
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
