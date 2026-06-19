import { asStringArray, parseNamedClue } from "./_internal";
import type { JsonObject, LegalAxisClue } from "./types";

export function extractCluesFromPractitionerGuide(value: JsonObject | null | undefined) {
  if (!value) {
    return [];
  }

  const bucketKeys = [
    "legal_axis_clues",
    "priority_legal_axes",
    "legal_axes",
    "axis_clues",
    "focus_axes"
  ];

  const fromBuckets = bucketKeys.flatMap((key) =>
    asStringArray((value as Record<string, unknown>)[key]).map((entry) =>
      parseNamedClue(entry, "practitioner_guide", "medium")
    )
  );

  const fromObjects = Object.entries(value)
    .filter(([, entry]) => Array.isArray(entry))
    .flatMap(([, entry]) =>
      (entry as unknown[]).map((item) =>
        parseNamedClue(item, "practitioner_guide", "medium")
      )
    );

  return [...fromBuckets, ...fromObjects].filter(
    (entry): entry is LegalAxisClue => Boolean(entry)
  );
}

export function extractCluesFromCaseOutlook(value: JsonObject | null | undefined) {
  if (!value) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const factors = asStringArray(record.key_decision_factors).map((item) =>
    parseNamedClue(
      { axis: "key_decision_factor", label: item, severity: "high" },
      "case_outlook",
      "high"
    )
  );
  const missingFacts = asStringArray(record.missing_case_facts).map((item) =>
    parseNamedClue(
      { axis: "missing_case_fact", label: item, severity: "high" },
      "case_outlook",
      "high"
    )
  );
  const legalAxes = asStringArray(record.legal_axis_clues).map((item) =>
    parseNamedClue(item, "case_outlook", "medium")
  );

  return [...factors, ...missingFacts, ...legalAxes].filter(
    (entry): entry is LegalAxisClue => Boolean(entry)
  );
}

export function extractSubtypeSpecificClues(
  value: JsonObject | null | undefined,
  origin: LegalAxisClue["origin"],
  fallbackSeverity: LegalAxisClue["severity"]
) {
  if (!value) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const directKeys = [
    "subtype_axis_clues",
    "subtype_clues",
    "licensing_axis_clues",
    "admin_appeal_axis_clues"
  ];

  const collectEntries = (entry: unknown): LegalAxisClue[] => {
    if (Array.isArray(entry)) {
      return entry
        .map((item) => parseNamedClue(item, origin, fallbackSeverity))
        .filter((item): item is LegalAxisClue => Boolean(item));
    }

    if (entry && typeof entry === "object") {
      return Object.values(entry as Record<string, unknown>).flatMap((nested) =>
        collectEntries(nested)
      );
    }

    const single = parseNamedClue(entry, origin, fallbackSeverity);
    return single ? [single] : [];
  };

  const fromDirectKeys = directKeys.flatMap((key) => collectEntries(record[key]));

  const fromSubtypeSpecific = collectEntries(record.subtype_specific);

  return [...fromDirectKeys, ...fromSubtypeSpecific].filter(
    (entry): entry is LegalAxisClue => Boolean(entry)
  );
}

export function extractCorporateFamilyClues(
  value: JsonObject | null | undefined,
  origin: LegalAxisClue["origin"],
  fallbackSeverity: LegalAxisClue["severity"]
) {
  if (!value) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const corporateTrackKeys = [
    "for_profit_track",
    "nonprofit_track",
    "approval_prerequisite_track",
    "cooperative_track",
    "public_interest_track",
    "small_for_profit_track",
    "corporate_family_clues",
    "corporate_setup_clues",
    "subtype_family_clues",
    "surfaced_family_clues",
    "surfaced_corporate_family_clues"
  ];

  const collectEntries = (entry: unknown): LegalAxisClue[] => {
    if (Array.isArray(entry)) {
      return entry
        .map((item) => parseNamedClue(item, origin, fallbackSeverity))
        .filter((item): item is LegalAxisClue => Boolean(item));
    }

    if (entry && typeof entry === "object") {
      return Object.values(entry as Record<string, unknown>).flatMap((nested) =>
        collectEntries(nested)
      );
    }

    const single = parseNamedClue(entry, origin, fallbackSeverity);
    return single ? [single] : [];
  };

  const fromTrackKeys = corporateTrackKeys.flatMap((key) => collectEntries(record[key]));

  return fromTrackKeys.filter((entry): entry is LegalAxisClue => Boolean(entry));
}

export function extractCorporateSectorClues(
  value: JsonObject | null | undefined,
  origin: LegalAxisClue["origin"],
  fallbackSeverity: LegalAxisClue["severity"]
) {
  if (!value) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const sectorTrackKeys = [
    "sector_track",
    "regulated_sector_track",
    "unregulated_sector_track",
    "permit_required_sector_track",
    "industry_sector_track",
    "corporate_sector_clues",
    "sector_clues",
    "sector_axis_clues",
    "sector_track_clues",
    "surfaced_sector_clues",
    "sector_specific_clues"
  ];

  const collectEntries = (entry: unknown): LegalAxisClue[] => {
    if (Array.isArray(entry)) {
      return entry
        .map((item) => parseNamedClue(item, origin, fallbackSeverity))
        .filter((item): item is LegalAxisClue => Boolean(item));
    }

    if (entry && typeof entry === "object") {
      return Object.values(entry as Record<string, unknown>).flatMap((nested) =>
        collectEntries(nested)
      );
    }

    const single = parseNamedClue(entry, origin, fallbackSeverity);
    return single ? [single] : [];
  };

  const fromTrackKeys = sectorTrackKeys.flatMap((key) => collectEntries(record[key]));

  return fromTrackKeys.filter((entry): entry is LegalAxisClue => Boolean(entry));
}

export function extractCorporateTrackNames(value: JsonObject | null | undefined) {
  if (!value) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const tracks: Array<{ key: string; label: string }> = [
    { key: "for_profit_track", label: "for_profit_track" },
    { key: "nonprofit_track", label: "nonprofit_track" },
    { key: "approval_prerequisite_track", label: "approval_prerequisite_track" },
    { key: "cooperative_track", label: "cooperative_track" },
    { key: "public_interest_track", label: "public_interest_track" },
    { key: "small_for_profit_track", label: "small_for_profit_track" }
  ];

  const hasValue = (entry: unknown) => {
    if (!entry) {
      return false;
    }
    if (Array.isArray(entry)) {
      return entry.length > 0;
    }
    if (typeof entry === "object") {
      return Object.keys(entry as Record<string, unknown>).length > 0;
    }
    if (typeof entry === "string") {
      return entry.trim().length > 0;
    }
    return false;
  };

  return tracks
    .filter((track) => hasValue(record[track.key]))
    .map((track) => track.label);
}

export function extractCorporateSectorTrackNames(value: JsonObject | null | undefined) {
  if (!value) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const tracks: Array<{ key: string; label: string }> = [
    { key: "sector_track", label: "sector_track" },
    { key: "regulated_sector_track", label: "regulated_sector_track" },
    { key: "unregulated_sector_track", label: "unregulated_sector_track" },
    { key: "permit_required_sector_track", label: "permit_required_sector_track" },
    { key: "industry_sector_track", label: "industry_sector_track" }
  ];

  const hasValue = (entry: unknown) => {
    if (!entry) {
      return false;
    }
    if (Array.isArray(entry)) {
      return entry.length > 0;
    }
    if (typeof entry === "object") {
      return Object.keys(entry as Record<string, unknown>).length > 0;
    }
    if (typeof entry === "string") {
      return entry.trim().length > 0;
    }
    return false;
  };

  return tracks
    .filter((track) => hasValue(record[track.key]))
    .map((track) => track.label);
}

export function extractCandidateOnlyClues(
  value: JsonObject | null | undefined,
  origin: LegalAxisClue["origin"],
  fallbackSeverity: LegalAxisClue["severity"]
) {
  if (!value) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const candidateKeys = [
    "candidate_only_clues",
    "candidate_article_hints",
    "article_hints",
    "surface_candidates",
    "surfaced_clues"
  ];

  const collect = (entry: unknown): LegalAxisClue[] => {
    if (Array.isArray(entry)) {
      return entry
        .map((item) => parseNamedClue(item, origin, fallbackSeverity))
        .filter((item): item is LegalAxisClue => Boolean(item));
    }
    if (entry && typeof entry === "object") {
      return Object.values(entry as Record<string, unknown>).flatMap((nested) =>
        collect(nested)
      );
    }
    const one = parseNamedClue(entry, origin, fallbackSeverity);
    return one ? [one] : [];
  };

  return candidateKeys.flatMap((key) => collect(record[key]));
}

export function buildSubtypeMatchClues(matchedSubtypeKeys: string[]) {
  return matchedSubtypeKeys
    .map((entry) =>
      parseNamedClue(
        {
          axis: "matched_subtype",
          label: entry,
          reason: "Subtype signal matched by Lawbot compact response.",
          severity: "high"
        },
        "matched_subtype_keys",
        "high"
      )
    )
    .filter((item): item is LegalAxisClue => Boolean(item));
}
