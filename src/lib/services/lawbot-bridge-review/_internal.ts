import type { LegalAxisClue } from "./types";

export function dedupeStrings(input: string[]) {
  return [...new Set(input.map((entry) => entry.trim()).filter(Boolean))];
}

export function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return dedupeStrings(value.map((entry) => String(entry ?? "")));
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }
  return fallback;
}

export function normalizeAxis(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "_")
    .replace(/^_+|_+$/g, "") || "general";
}

export function slug(value: string) {
  return normalizeAxis(value).slice(0, 64);
}

export function inferAuthorityBucket(sourceLabel: string) {
  const lower = sourceLabel.toLowerCase();
  if (/(law|act|article|조|법령|시행령|시행규칙)/.test(lower)) {
    return "LEGAL_AUTHORITY";
  }
  if (/(precedent|case|판례|결정례)/.test(lower)) {
    return "PRECEDENT";
  }
  if (/(guideline|policy|manual|지침|가이드|해석례|행정규칙)/.test(lower)) {
    return "ADMIN_GUIDANCE";
  }
  if (/(notice|disposition|receipt|service|통지|처분|송달|접수증|서류)/.test(lower)) {
    return "CASE_DOCUMENT";
  }
  return "REFERENCE_SOURCE";
}

export function parseNamedClue(
  entry: unknown,
  origin: LegalAxisClue["origin"],
  fallbackSeverity: LegalAxisClue["severity"]
): LegalAxisClue | null {
  if (typeof entry === "string") {
    const label = entry.trim();
    if (!label) {
      return null;
    }
    return {
      id: `${origin}:${slug(label)}`,
      axis: normalizeAxis(label),
      label,
      reason: null,
      sourceHint: null,
      articleTitle: null,
      snippet: null,
      matchedAxisTags: [],
      phraseLevelRationale: null,
      severity: fallbackSeverity,
      origin
    };
  }

  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return null;
  }

  const record = entry as Record<string, unknown>;
  const label =
    String(record.label ?? record.axis ?? record.title ?? record.clue ?? "").trim();
  if (!label) {
    return null;
  }
  const axis = String(record.axis ?? label).trim();
  const reason = String(record.reason ?? record.note ?? "").trim();
  const sourceHint = String(
    record.source_hint ?? record.source ?? record.source_label ?? record.source_ref ?? ""
  ).trim();
  const severityRaw = String(record.severity ?? "").toLowerCase();
  const articleTitle = String(
    record.article_title ??
      record.articleTitle ??
      record.title_hint ??
      record.candidate_article_title ??
      ""
  ).trim();
  const snippet = String(
    record.snippet ?? record.excerpt ?? record.candidate_snippet ?? ""
  ).trim();
  const matchedAxisTags = asStringArray(
    record.matched_axis_tags ?? record.axis_tags ?? record.matched_axes
  );
  const phraseLevelRationale = String(
    record.phrase_level_rationale ?? record.rationale_phrase ?? ""
  ).trim();
  const severity: LegalAxisClue["severity"] =
    severityRaw === "high" || severityRaw === "medium" || severityRaw === "low"
      ? severityRaw
      : fallbackSeverity;

  return {
    id: `${origin}:${slug(axis)}:${slug(label)}`,
    axis: normalizeAxis(axis),
    label,
    reason: reason || null,
    sourceHint: sourceHint || null,
    articleTitle: articleTitle || null,
    snippet: snippet || null,
    matchedAxisTags,
    phraseLevelRationale: phraseLevelRationale || null,
    severity,
    origin
  };
}

export function dedupeClues(input: LegalAxisClue[]) {
  const map = new Map<string, LegalAxisClue>();
  for (const item of input) {
    const key = `${item.axis}:${item.label}`;
    if (!map.has(key)) {
      map.set(key, item);
      continue;
    }

    const existing = map.get(key)!;
    const severityOrder = { high: 3, medium: 2, low: 1 };
    if (severityOrder[item.severity] > severityOrder[existing.severity]) {
      map.set(key, item);
    }
  }
  return [...map.values()];
}
