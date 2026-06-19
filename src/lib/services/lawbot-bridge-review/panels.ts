import { asStringArray, dedupeStrings } from "./_internal";
import {
  extractCorporateSectorTrackNames,
  extractCorporateTrackNames
} from "./clue-extractors";
import type {
  JsonObject,
  LegalAxisClue,
  OperatorAssistItem,
  OperatorAssistPanelViewModel,
  ReviewerAttentionItem,
  ReviewerAttentionPanelViewModel,
  ReviewerPatternReviewItem,
  ReviewerPatternReviewPanelViewModel,
  ReviewerReferencePanelViewModel,
  SupplementalReferenceCandidate
} from "./types";
import { slug } from "./_internal";

export function buildReviewerAttentionPanel(input: {
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

export function buildOperatorAssistPanel(input: {
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

export function buildReviewerPatternReviewPanel(input: {
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

export function buildReviewerReferencePanel(input: {
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
