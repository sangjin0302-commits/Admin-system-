type JsonObject = Record<string, unknown>;

export type SupplementalReferenceCandidate = {
  title: string;
  sourceType: string;
  mustVerifyOriginal: boolean;
  trustLevel: string;
  usageLocations: string[];
  referenceLevel: string;
};

export type BridgeReviewSignalInput = {
  reviewRequired?: boolean;
  mustVerify?: string[];
  mustVerifySources?: string[];
  riskFlags?: string[];
  matchedSubtypeKeys?: string[];
  supplementalReferenceCandidates?: unknown[];
  practitionerGuide?: JsonObject | null;
  caseOutlook?: JsonObject | null;
};

export type LegalAxisClue = {
  id: string;
  axis: string;
  label: string;
  reason: string | null;
  sourceHint: string | null;
  articleTitle: string | null;
  snippet: string | null;
  matchedAxisTags: string[];
  phraseLevelRationale: string | null;
  severity: "high" | "medium" | "low";
  origin:
    | "must_verify_sources"
    | "risk_flags"
    | "practitioner_guide"
    | "case_outlook"
    | "matched_subtype_keys";
};

export type ReviewerAttentionItem = {
  label: string;
  reason: string;
  severity: "high" | "medium" | "low";
  origin: string;
};

export type ReviewerAttentionPanelViewModel = {
  reviewRequired: boolean;
  headline: string;
  items: ReviewerAttentionItem[];
};

export type OperatorAssistItem = {
  action: string;
  detail: string | null;
  origin: string;
};

export type OperatorAssistPanelViewModel = {
  headline: string;
  items: OperatorAssistItem[];
};

export type ReviewerReferenceItem = SupplementalReferenceCandidate & {
  id: string;
  reviewHint: string;
};

export type ReviewerReferencePanelViewModel = {
  headline: string;
  items: ReviewerReferenceItem[];
};

export type SourceVerificationDescriptor = {
  sourceLabel: string;
  authorityBucket: string;
  sourceCitation: string | null;
  notes: string | null;
  articleTitle: string | null;
  snippet: string | null;
  matchedAxisTags: string[];
  phraseLevelRationale: string | null;
  sourceType: string | null;
  mustVerifyOriginal: boolean | null;
  trustLevel: string | null;
  usageLocations: string[];
  referenceLevel: string | null;
};

export type SourceVerificationChecklistItem = {
  id: string;
  sourceLabel: string;
  authorityBucket: string;
  sourceCitation: string | null;
  notes: string | null;
  articleTitle: string | null;
  snippet: string | null;
  matchedAxisTags: string[];
  phraseLevelRationale: string | null;
  sourceType: string | null;
  mustVerifyOriginal: boolean | null;
  trustLevel: string | null;
  usageLocations: string[];
  referenceLevel: string | null;
  required: true;
  reviewRequired: true;
};

export type SourceVerificationChecklistViewModel = {
  headline: string;
  items: SourceVerificationChecklistItem[];
  totalRequired: number;
};

export type ReviewerPatternReviewItem = {
  axis: string;
  clueCount: number;
  highestSeverity: "high" | "medium" | "low";
  sampleLabels: string[];
};

export type ReviewerPatternReviewPanelViewModel = {
  headline: string;
  items: ReviewerPatternReviewItem[];
};

export type ApprovalWorkflowGateBlockerCode =
  | "review_required"
  | "must_verify_pending"
  | "must_verify_sources_pending";

export type ApprovalWorkflowGateViewModel = {
  canProceedWithoutApproval: boolean;
  requiresManualReview: boolean;
  blockerCodes: ApprovalWorkflowGateBlockerCode[];
  cautionRiskFlags: string[];
  summary: string;
};

export type BridgeReviewViewModels = {
  legalAxisClues: LegalAxisClue[];
  reviewerAttentionPanel: ReviewerAttentionPanelViewModel;
  reviewerPatternReviewPanel: ReviewerPatternReviewPanelViewModel;
  operatorAssistPanel: OperatorAssistPanelViewModel;
  reviewerReferencePanel: ReviewerReferencePanelViewModel;
  supplementalReferenceCandidates: SupplementalReferenceCandidate[];
  sourceVerificationDescriptors: SourceVerificationDescriptor[];
  sourceVerificationChecklist: SourceVerificationChecklistViewModel;
  approvalWorkflowGate: ApprovalWorkflowGateViewModel;
};

function dedupeStrings(input: string[]) {
  return [...new Set(input.map((entry) => entry.trim()).filter(Boolean))];
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return dedupeStrings(value.map((entry) => String(entry ?? "")));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asBoolean(value: unknown, fallback = false) {
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

function normalizeSupplementalReferenceCandidates(input: BridgeReviewSignalInput) {
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

function normalizeMatchedSubtypeKeys(input: BridgeReviewSignalInput) {
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

function normalizeAxis(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\uac00-\ud7a3]+/g, "_")
    .replace(/^_+|_+$/g, "") || "general";
}

function slug(value: string) {
  return normalizeAxis(value).slice(0, 64);
}

function inferAuthorityBucket(sourceLabel: string) {
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

function parseNamedClue(
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

function extractCluesFromPractitionerGuide(value: JsonObject | null | undefined) {
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

function extractCluesFromCaseOutlook(value: JsonObject | null | undefined) {
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

function extractSubtypeSpecificClues(
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

function extractCorporateFamilyClues(
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

function extractCorporateSectorClues(
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

function extractCorporateTrackNames(value: JsonObject | null | undefined) {
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

function extractCorporateSectorTrackNames(value: JsonObject | null | undefined) {
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

function extractCandidateOnlyClues(
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

function buildSubtypeMatchClues(matchedSubtypeKeys: string[]) {
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

function dedupeClues(input: LegalAxisClue[]) {
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

function buildReviewerAttentionPanel(input: {
  reviewRequired: boolean;
  mustVerify: string[];
  mustVerifySources: string[];
  riskFlags: string[];
  matchedSubtypeKeys: string[];
  legalAxisClues: LegalAxisClue[];
}): ReviewerAttentionPanelViewModel {
  const items: ReviewerAttentionItem[] = [
    ...input.mustVerify.map((entry) => ({
      label: entry,
      reason: "Bridge marked this as must-verify before decision.",
      severity: "high" as const,
      origin: "must_verify"
    })),
    ...input.mustVerifySources.map((entry) => ({
      label: entry,
      reason: "Source verification is required before approval.",
      severity: "high" as const,
      origin: "must_verify_sources"
    })),
    ...input.riskFlags.map((entry) => ({
      label: entry,
      reason: "Risk flag raised by bridge compact response.",
      severity: "medium" as const,
      origin: "risk_flags"
    })),
    ...input.matchedSubtypeKeys.map((entry) => ({
      label: entry,
      reason: "Subtype-specific review route is suggested by Lawbot compact response.",
      severity: "high" as const,
      origin: "matched_subtype_keys"
    })),
    ...input.legalAxisClues.slice(0, 8).map((entry) => ({
      label: entry.label,
      reason:
        entry.phraseLevelRationale ??
        entry.reason ??
        `Axis clue from ${entry.origin}.`,
      severity: entry.severity,
      origin: entry.origin
    }))
  ];

  const severityOrder = { high: 3, medium: 2, low: 1 };
  items.sort((left, right) => severityOrder[right.severity] - severityOrder[left.severity]);

  const headline = input.reviewRequired
    ? "Manual review is required before any external action."
    : "Review is recommended before moving to external output.";

  return {
    reviewRequired: input.reviewRequired,
    headline,
    items: items.slice(0, 12)
  };
}

function buildOperatorAssistPanel(input: {
  practitionerGuide: JsonObject | null | undefined;
  caseOutlook: JsonObject | null | undefined;
  mustVerify: string[];
  mustVerifySources: string[];
  matchedSubtypeKeys: string[];
  legalAxisClues: LegalAxisClue[];
  supplementalReferenceCandidates: SupplementalReferenceCandidate[];
}): OperatorAssistPanelViewModel {
  const guide = input.practitionerGuide ?? {};
  const checkFirst = asStringArray((guide as Record<string, unknown>).what_to_check_first);
  const avoidClaims = asStringArray(
    (guide as Record<string, unknown>).what_not_to_state_confidently
  );
  const commonMistakes = asStringArray((guide as Record<string, unknown>).common_mistake);
  const nextActions = asStringArray((guide as Record<string, unknown>).next_actions);
  const corporateTrackNames = dedupeStrings([
    ...extractCorporateTrackNames(input.practitionerGuide),
    ...extractCorporateTrackNames(input.caseOutlook)
  ]);
  const sectorTrackNames = dedupeStrings([
    ...extractCorporateSectorTrackNames(input.practitionerGuide),
    ...extractCorporateSectorTrackNames(input.caseOutlook)
  ]);

  const items: OperatorAssistItem[] = [
    ...checkFirst.map((entry) => ({
      action: entry,
      detail: "Check first according to practitioner guide.",
      origin: "practitioner_guide.what_to_check_first"
    })),
    ...nextActions.map((entry) => ({
      action: entry,
      detail: "Bridge suggested next action.",
      origin: "practitioner_guide.next_actions"
    })),
    ...input.mustVerify.map((entry) => ({
      action: entry,
      detail: "Must verify before approval.",
      origin: "must_verify"
    })),
    ...input.mustVerifySources.map((entry) => ({
      action: `Verify source: ${entry}`,
      detail: "Source verification is required.",
      origin: "must_verify_sources"
    })),
    ...input.matchedSubtypeKeys.map((entry) => ({
      action: `Confirm subtype route: ${entry}`,
      detail: "Use subtype-specific checklist before approval.",
      origin: "matched_subtype_keys"
    })),
    ...input.supplementalReferenceCandidates.map((entry) => ({
      action: `Check archive reference: ${entry.title}`,
      detail: [
        `trust=${entry.trustLevel}`,
        `reference=${entry.referenceLevel}`,
        entry.usageLocations.length > 0 ? `usage=${entry.usageLocations.join(",")}` : null,
        entry.mustVerifyOriginal ? "verify original required" : null
      ]
        .filter(Boolean)
        .join(" / "),
      origin: "supplemental_reference_candidates"
    })),
    ...corporateTrackNames.map((track) => ({
      action: `Follow corporate track: ${track}`,
      detail: "Corporate family route should stay consistent across checklist and drafts.",
      origin: "corporate_family_track"
    })),
    ...sectorTrackNames.map((track) => ({
      action: `Follow sector track: ${track}`,
      detail: "Sector route should stay consistent across checklist and prerequisite checks.",
      origin: "corporate_sector_track"
    })),
    ...avoidClaims.map((entry) => ({
      action: `Avoid over-claim: ${entry}`,
      detail: "Keep customer message assist-only and non-final.",
      origin: "practitioner_guide.what_not_to_state_confidently"
    })),
    ...commonMistakes.map((entry) => ({
      action: `Avoid mistake: ${entry}`,
      detail: "Reviewer-facing caution from practitioner guide.",
      origin: "practitioner_guide.common_mistake"
    })),
    ...input.legalAxisClues.slice(0, 6).map((entry) => ({
      action: `Check axis: ${entry.label}`,
      detail: [
        entry.phraseLevelRationale ?? entry.reason,
        entry.articleTitle ? `Article: ${entry.articleTitle}` : null,
        entry.snippet ? `Snippet: ${entry.snippet}` : null
      ]
        .filter(Boolean)
        .join(" / ") || null,
      origin: `axis:${entry.origin}`
    }))
  ];

  return {
    headline: "Operator assist suggestions from bridge compact response.",
    items: dedupeStrings(items.map((entry) => `${entry.origin}|${entry.action}`)).map((key) => {
      const [origin, action] = key.split("|");
      const found = items.find((entry) => entry.origin === origin && entry.action === action);
      return found!;
    }).slice(0, 14)
  };
}

function buildSourceVerificationDescriptors(input: {
  mustVerifySources: string[];
  legalAxisClues: LegalAxisClue[];
  riskFlags: string[];
  matchedSubtypeKeys: string[];
  supplementalReferenceCandidates: SupplementalReferenceCandidate[];
}) {
  const descriptors: SourceVerificationDescriptor[] = [];

  for (const sourceLabel of input.mustVerifySources) {
    const relatedClues = input.legalAxisClues.filter(
      (entry) =>
        entry.sourceHint?.toLowerCase().includes(sourceLabel.toLowerCase()) ||
        entry.label.toLowerCase().includes(sourceLabel.toLowerCase())
    );
    const clueLabels = relatedClues.slice(0, 3).map((entry) => entry.label);
    const articleTitles = relatedClues
      .map((entry) => entry.articleTitle)
      .filter((entry): entry is string => Boolean(entry))
      .slice(0, 2);
    const phraseRationales = relatedClues
      .map((entry) => entry.phraseLevelRationale)
      .filter((entry): entry is string => Boolean(entry))
      .slice(0, 2);
    const notes = [
      clueLabels.length > 0 ? `Related axis clues: ${clueLabels.join(", ")}` : null,
      articleTitles.length > 0 ? `Article hints: ${articleTitles.join(", ")}` : null,
      phraseRationales.length > 0 ? `Phrase rationale: ${phraseRationales.join(" | ")}` : null,
      input.riskFlags.length > 0 ? `Risk flags: ${input.riskFlags.slice(0, 3).join(", ")}` : null,
      input.matchedSubtypeKeys.length > 0
        ? `Subtype route: ${input.matchedSubtypeKeys.slice(0, 2).join(", ")}`
        : null
    ]
      .filter(Boolean)
      .join(" / ");

    descriptors.push({
      sourceLabel,
      authorityBucket: inferAuthorityBucket(sourceLabel),
      sourceCitation: relatedClues.find((entry) => entry.sourceHint)?.sourceHint ?? null,
      notes: notes || null,
      articleTitle: relatedClues.find((entry) => entry.articleTitle)?.articleTitle ?? null,
      snippet: relatedClues.find((entry) => entry.snippet)?.snippet ?? null,
      matchedAxisTags: dedupeStrings(
        relatedClues.flatMap((entry) => entry.matchedAxisTags).slice(0, 8)
      ),
      phraseLevelRationale:
        relatedClues.find((entry) => entry.phraseLevelRationale)?.phraseLevelRationale ?? null,
      sourceType: null,
      mustVerifyOriginal: null,
      trustLevel: null,
      usageLocations: [],
      referenceLevel: null
    });
  }

  const additionalFromClue = input.legalAxisClues
    .filter((entry) => entry.sourceHint && !input.mustVerifySources.includes(entry.sourceHint))
    .slice(0, 10)
    .map((entry) => ({
      sourceLabel: entry.sourceHint!,
      authorityBucket: inferAuthorityBucket(entry.sourceHint!),
      sourceCitation: entry.sourceHint,
      articleTitle: entry.articleTitle,
      snippet: entry.snippet,
      matchedAxisTags: entry.matchedAxisTags,
      phraseLevelRationale: entry.phraseLevelRationale,
      notes: [
        entry.reason ?? `Derived from legal axis clue: ${entry.label}`,
        entry.articleTitle ? `Article hints: ${entry.articleTitle}` : null,
        entry.phraseLevelRationale ? `Phrase rationale: ${entry.phraseLevelRationale}` : null,
        input.matchedSubtypeKeys.length > 0
          ? `Subtype route: ${input.matchedSubtypeKeys.slice(0, 2).join(", ")}`
          : null
      ]
        .filter(Boolean)
        .join(" / "),
      sourceType: null,
      mustVerifyOriginal: null,
      trustLevel: null,
      usageLocations: [],
      referenceLevel: null
    }));
  const supplementalDescriptors = input.supplementalReferenceCandidates.map((entry) => ({
    sourceLabel: entry.title,
    authorityBucket: "INTERNAL_ARCHIVE_REFERENCE",
    sourceCitation: null,
    notes: [
      `Internal archive (${entry.sourceType})`,
      `trust=${entry.trustLevel}`,
      `reference=${entry.referenceLevel}`,
      entry.usageLocations.length > 0 ? `usage=${entry.usageLocations.join(", ")}` : null,
      entry.mustVerifyOriginal ? "must verify original" : null
    ]
      .filter(Boolean)
      .join(" / "),
    articleTitle: null,
    snippet: null,
    matchedAxisTags: [],
    phraseLevelRationale: null,
    sourceType: entry.sourceType,
    mustVerifyOriginal: entry.mustVerifyOriginal,
    trustLevel: entry.trustLevel,
    usageLocations: entry.usageLocations,
    referenceLevel: entry.referenceLevel
  }));

  return [...descriptors, ...additionalFromClue, ...supplementalDescriptors];
}

function buildSourceVerificationChecklist(input: {
  sourceVerificationDescriptors: SourceVerificationDescriptor[];
}): SourceVerificationChecklistViewModel {
  const items: SourceVerificationChecklistItem[] = input.sourceVerificationDescriptors.map(
    (entry) => ({
      id: `source:${slug(entry.sourceLabel)}`,
      sourceLabel: entry.sourceLabel,
      authorityBucket: entry.authorityBucket,
      sourceCitation: entry.sourceCitation,
      notes: entry.notes,
      articleTitle: entry.articleTitle,
      snippet: entry.snippet,
      matchedAxisTags: entry.matchedAxisTags,
      phraseLevelRationale: entry.phraseLevelRationale,
      sourceType: entry.sourceType,
      mustVerifyOriginal: entry.mustVerifyOriginal,
      trustLevel: entry.trustLevel,
      usageLocations: entry.usageLocations,
      referenceLevel: entry.referenceLevel,
      required: true,
      reviewRequired: true
    })
  );

  return {
    headline: "Verify all required sources before approval.",
    items,
    totalRequired: items.length
  };
}

function buildReviewerPatternReviewPanel(input: {
  legalAxisClues: LegalAxisClue[];
}): ReviewerPatternReviewPanelViewModel {
  const grouped = new Map<string, LegalAxisClue[]>();
  for (const clue of input.legalAxisClues) {
    const bucket = grouped.get(clue.axis) ?? [];
    bucket.push(clue);
    grouped.set(clue.axis, bucket);
  }

  const severityRank = { high: 3, medium: 2, low: 1 };
  const items: ReviewerPatternReviewItem[] = [...grouped.entries()]
    .map(([axis, clues]) => {
      const highestSeverity = clues
        .map((entry) => entry.severity)
        .sort((left, right) => severityRank[right] - severityRank[left])[0] ?? "low";
      return {
        axis,
        clueCount: clues.length,
        highestSeverity,
        sampleLabels: clues.slice(0, 3).map((entry) => entry.label)
      };
    })
    .sort((left, right) => {
      if (left.highestSeverity !== right.highestSeverity) {
        return severityRank[right.highestSeverity] - severityRank[left.highestSeverity];
      }
      return right.clueCount - left.clueCount;
    })
    .slice(0, 8);

  return {
    headline: "Pattern-level review focus from legal axis clues.",
    items
  };
}

function buildReviewerReferencePanel(input: {
  supplementalReferenceCandidates: SupplementalReferenceCandidate[];
}): ReviewerReferencePanelViewModel {
  return {
    headline: "Internal archive references (supplemental, non-authoritative).",
    items: input.supplementalReferenceCandidates.map((entry) => ({
      id: `supplemental:${slug(entry.title)}:${slug(entry.referenceLevel)}`,
      ...entry,
      reviewHint: entry.mustVerifyOriginal
        ? "Verify original archive row before using this reference."
        : "Archive reference can assist reviewer context."
    }))
  };
}

function buildApprovalWorkflowGate(input: {
  reviewRequired: boolean;
  mustVerify: string[];
  mustVerifySources: string[];
  riskFlags: string[];
}): ApprovalWorkflowGateViewModel {
  const blockerCodes: ApprovalWorkflowGateBlockerCode[] = [];
  if (input.reviewRequired) {
    blockerCodes.push("review_required");
  }
  if (input.mustVerify.length > 0) {
    blockerCodes.push("must_verify_pending");
  }
  if (input.mustVerifySources.length > 0) {
    blockerCodes.push("must_verify_sources_pending");
  }

  const canProceedWithoutApproval = blockerCodes.length === 0;
  const requiresManualReview = !canProceedWithoutApproval || input.riskFlags.length > 0;

  let summary = "No blocker from bridge review signals.";
  if (!canProceedWithoutApproval) {
    summary = "Approval gate blocked by bridge review signals.";
  } else if (input.riskFlags.length > 0) {
    summary = "No hard blocker, but risk flags require reviewer attention.";
  }

  return {
    canProceedWithoutApproval,
    requiresManualReview,
    blockerCodes,
    cautionRiskFlags: input.riskFlags,
    summary
  };
}

export function buildBridgeReviewViewModels(
  input: BridgeReviewSignalInput
): BridgeReviewViewModels {
  const mustVerify = dedupeStrings(input.mustVerify ?? []);
  const mustVerifySources = dedupeStrings(input.mustVerifySources ?? []);
  const riskFlags = dedupeStrings(input.riskFlags ?? []);
  const matchedSubtypeKeys = normalizeMatchedSubtypeKeys(input);
  const supplementalReferenceCandidates = normalizeSupplementalReferenceCandidates(input);

  const riskClues = riskFlags
    .map((entry) =>
      parseNamedClue(
        { axis: "risk_flag", label: entry, reason: "Risk flag from bridge compact response." },
        "risk_flags",
        "medium"
      )
    )
    .filter((entry): entry is LegalAxisClue => Boolean(entry));

  const sourceClues = mustVerifySources
    .map((entry) =>
      parseNamedClue(
        {
          axis: "source_verification",
          label: entry,
          reason: "Source verification required by bridge response.",
          source_hint: entry,
          severity: "high"
        },
        "must_verify_sources",
        "high"
      )
    )
    .filter((entry): entry is LegalAxisClue => Boolean(entry));

  const legalAxisClues = dedupeClues([
    ...sourceClues,
    ...riskClues,
    ...buildSubtypeMatchClues(matchedSubtypeKeys),
    ...extractCluesFromPractitionerGuide(input.practitionerGuide),
    ...extractCandidateOnlyClues(input.practitionerGuide, "practitioner_guide", "medium"),
    ...extractSubtypeSpecificClues(input.practitionerGuide, "practitioner_guide", "medium"),
    ...extractCorporateFamilyClues(input.practitionerGuide, "practitioner_guide", "high"),
    ...extractCorporateSectorClues(input.practitionerGuide, "practitioner_guide", "high"),
    ...extractCluesFromCaseOutlook(input.caseOutlook),
    ...extractCandidateOnlyClues(input.caseOutlook, "case_outlook", "high"),
    ...extractSubtypeSpecificClues(input.caseOutlook, "case_outlook", "high"),
    ...extractCorporateFamilyClues(input.caseOutlook, "case_outlook", "high"),
    ...extractCorporateSectorClues(input.caseOutlook, "case_outlook", "high")
  ]);

  const sourceVerificationDescriptors = buildSourceVerificationDescriptors({
    mustVerifySources,
    legalAxisClues,
    riskFlags,
    matchedSubtypeKeys,
    supplementalReferenceCandidates
  });

  const sourceVerificationChecklist = buildSourceVerificationChecklist({
    sourceVerificationDescriptors
  });

  const approvalWorkflowGate = buildApprovalWorkflowGate({
    reviewRequired: Boolean(input.reviewRequired),
    mustVerify,
    mustVerifySources,
    riskFlags
  });

  return {
    legalAxisClues,
    reviewerAttentionPanel: buildReviewerAttentionPanel({
      reviewRequired: Boolean(input.reviewRequired),
      mustVerify,
      mustVerifySources,
      riskFlags,
      matchedSubtypeKeys,
      legalAxisClues
    }),
    operatorAssistPanel: buildOperatorAssistPanel({
      practitionerGuide: input.practitionerGuide,
      caseOutlook: input.caseOutlook,
      mustVerify,
      mustVerifySources,
      matchedSubtypeKeys,
      legalAxisClues,
      supplementalReferenceCandidates
    }),
    reviewerReferencePanel: buildReviewerReferencePanel({
      supplementalReferenceCandidates
    }),
    supplementalReferenceCandidates,
    reviewerPatternReviewPanel: buildReviewerPatternReviewPanel({
      legalAxisClues
    }),
    sourceVerificationDescriptors,
    sourceVerificationChecklist,
    approvalWorkflowGate
  };
}
