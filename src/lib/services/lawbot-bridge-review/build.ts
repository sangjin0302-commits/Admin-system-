import { dedupeClues, dedupeStrings, parseNamedClue } from "./_internal";
import {
  normalizeMatchedSubtypeKeys,
  normalizeSupplementalReferenceCandidates
} from "./normalizers";
import {
  buildSubtypeMatchClues,
  extractCandidateOnlyClues,
  extractCluesFromCaseOutlook,
  extractCluesFromPractitionerGuide,
  extractCorporateFamilyClues,
  extractCorporateSectorClues,
  extractSubtypeSpecificClues
} from "./clue-extractors";
import {
  buildOperatorAssistPanel,
  buildReviewerAttentionPanel,
  buildReviewerPatternReviewPanel,
  buildReviewerReferencePanel
} from "./panels";
import {
  buildSourceVerificationChecklist,
  buildSourceVerificationDescriptors
} from "./source-verification";
import { buildApprovalWorkflowGate } from "./approval-gate";
import type {
  BridgeReviewSignalInput,
  BridgeReviewViewModels,
  LegalAxisClue
} from "./types";

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
