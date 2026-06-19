import { asBoolean, asRecord, asStringArray, dedupeStrings } from "./_internal";
import type { BridgeReviewSignalInput, SupplementalReferenceCandidate } from "./types";

function normalizeSupplementalReferenceCandidate(
  entry: unknown
): SupplementalReferenceCandidate | null {
  const record = asRecord(entry);
  if (!record) {
    return null;
  }

  const title = String(record.title ?? "").trim();
  if (!title) {
    return null;
  }

  const sourceType = String(record.source_type ?? record.sourceType ?? "internal_archive").trim();
  const trustLevel = String(record.trust_level ?? record.trustLevel ?? "unknown").trim() || "unknown";
  const referenceLevel = String(
    record.reference_level ?? record.referenceLevel ?? "candidate"
  ).trim() || "candidate";
  const usageLocations = dedupeStrings(
    asStringArray(record.usage_locations ?? record.usageLocations)
  );
  const mustVerifyOriginal = asBoolean(
    record.must_verify_original ?? record.mustVerifyOriginal,
    true
  );

  return {
    title,
    sourceType: sourceType || "internal_archive",
    mustVerifyOriginal,
    trustLevel,
    usageLocations,
    referenceLevel
  };
}

export function normalizeSupplementalReferenceCandidates(input: BridgeReviewSignalInput) {
  const direct = Array.isArray(input.supplementalReferenceCandidates)
    ? input.supplementalReferenceCandidates
    : [];
  const guideRecord = asRecord(input.practitionerGuide);
  const outlookRecord = asRecord(input.caseOutlook);
  const guideCandidates = Array.isArray(
    guideRecord?.supplemental_reference_candidates
  )
    ? (guideRecord?.supplemental_reference_candidates as unknown[])
    : [];
  const outlookCandidates = Array.isArray(
    outlookRecord?.supplemental_reference_candidates
  )
    ? (outlookRecord?.supplemental_reference_candidates as unknown[])
    : [];

  const normalized = [...direct, ...guideCandidates, ...outlookCandidates]
    .map((entry) => normalizeSupplementalReferenceCandidate(entry))
    .filter((entry): entry is SupplementalReferenceCandidate => Boolean(entry));

  const deduped = new Map<string, SupplementalReferenceCandidate>();
  for (const item of normalized) {
    const key = `${item.title}|${item.referenceLevel}|${item.sourceType}`;
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  }
  return [...deduped.values()];
}

export function normalizeMatchedSubtypeKeys(input: BridgeReviewSignalInput) {
  const direct = dedupeStrings(input.matchedSubtypeKeys ?? []);
  if (direct.length > 0) {
    return direct;
  }

  const guideKeys = asStringArray(
    (input.practitionerGuide as Record<string, unknown> | null | undefined)?.matched_subtype_keys
  );
  if (guideKeys.length > 0) {
    return guideKeys;
  }

  return asStringArray(
    (input.caseOutlook as Record<string, unknown> | null | undefined)?.matched_subtype_keys
  );
}
