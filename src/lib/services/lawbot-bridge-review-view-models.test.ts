import assert from "node:assert/strict";

import { buildBridgeReviewViewModels } from "./lawbot-bridge-review-view-models.ts";

function run() {
  const result = buildBridgeReviewViewModels({
    reviewRequired: true,
    mustVerify: ["confirm filing deadline"],
    mustVerifySources: ["disposition notice"],
    riskFlags: ["timing_risk"],
    matchedSubtypeKeys: ["admin_appeal_refusal"],
    practitionerGuide: {
      what_to_check_first: ["service date"],
      what_not_to_state_confidently: ["final win probability"],
      subtype_axis_clues: [
        {
          axis: "licensing_procedural_fit",
          label: "licensing procedural fit",
          reason: "licensing subtype requires stricter procedural fit check",
          source_hint: "licensing review memo",
          severity: "high"
        }
      ],
      candidate_only_clues: [
        {
          axis: "refusal_notice_proof",
          label: "refusal notice phrase match",
          article_title: "Immigration Act Article 23",
          snippet: "Documents must show clear receipt route.",
          matched_axis_tags: ["service_route", "receipt_proof"],
          phrase_level_rationale: "matched phrase: notice of refusal delivered",
          source_hint: "refusal notice copy",
          severity: "high"
        }
      ],
      legal_axis_clues: [
        {
          axis: "filing_timeline",
          label: "filing timeline consistency",
          reason: "timeline mismatch can block filing",
          source_hint: "service ledger",
          severity: "high"
        }
      ]
    },
    caseOutlook: {
      subtype_specific: {
        admin_appeal: [
          {
            axis: "admin_appeal_deadline",
            label: "admin appeal filing window",
            reason: "deadline breach blocks filing",
            source_hint: "appeal deadline notice",
            severity: "high"
          }
        ]
      },
      key_decision_factors: ["proof of receipt"],
      missing_case_facts: ["service route evidence"]
    }
  });

  assert.equal(result.reviewerAttentionPanel.reviewRequired, true);
  assert.equal(result.reviewerAttentionPanel.items.length > 0, true);
  assert.equal(result.reviewerPatternReviewPanel.items.length > 0, true);
  assert.equal(result.operatorAssistPanel.items.length > 0, true);
  assert.equal(result.legalAxisClues.length >= 3, true);
  assert.equal(result.sourceVerificationChecklist.totalRequired > 0, true);
  assert.equal(result.approvalWorkflowGate.canProceedWithoutApproval, false);
  assert.equal(result.approvalWorkflowGate.blockerCodes.includes("review_required"), true);
  assert.equal(
    result.approvalWorkflowGate.blockerCodes.includes("must_verify_sources_pending"),
    true
  );

  const hasTimelineAxis = result.legalAxisClues.some(
    (entry) => entry.axis === "filing_timeline"
  );
  assert.equal(hasTimelineAxis, true);
  const hasSubtypeAxis = result.legalAxisClues.some(
    (entry) => entry.axis === "licensing_procedural_fit"
  );
  assert.equal(hasSubtypeAxis, true);
  const hasMatchedSubtypeOrigin = result.legalAxisClues.some(
    (entry) =>
      entry.origin === "matched_subtype_keys" &&
      entry.label === "admin_appeal_refusal"
  );
  assert.equal(hasMatchedSubtypeOrigin, true);
  const candidateOnlyClue = result.legalAxisClues.find(
    (entry) => entry.label === "refusal notice phrase match"
  );
  assert.equal(candidateOnlyClue?.articleTitle, "Immigration Act Article 23");
  assert.equal(
    candidateOnlyClue?.phraseLevelRationale,
    "matched phrase: notice of refusal delivered"
  );
  assert.deepEqual(candidateOnlyClue?.matchedAxisTags, ["service_route", "receipt_proof"]);

  const hasDerivedSourceDescriptor = result.sourceVerificationDescriptors.some(
    (entry) => entry.sourceLabel === "service ledger"
  );
  assert.equal(hasDerivedSourceDescriptor, true);
  const hasSubtypeDerivedSource = result.sourceVerificationDescriptors.some(
    (entry) => entry.sourceLabel === "licensing review memo"
  );
  assert.equal(hasSubtypeDerivedSource, true);
  const candidateSourceDescriptor = result.sourceVerificationDescriptors.find(
    (entry) => entry.sourceLabel === "refusal notice copy"
  );
  assert.equal(candidateSourceDescriptor?.articleTitle, "Immigration Act Article 23");
  assert.equal(candidateSourceDescriptor?.snippet, "Documents must show clear receipt route.");

  const dispositionDescriptor = result.sourceVerificationDescriptors.find(
    (entry) => entry.sourceLabel === "disposition notice"
  );
  assert.equal(dispositionDescriptor?.authorityBucket, "CASE_DOCUMENT");
  assert.equal(
    dispositionDescriptor?.notes?.includes("Subtype route: admin_appeal_refusal"),
    true
  );

  const corporate = buildBridgeReviewViewModels({
    reviewRequired: true,
    mustVerifySources: ["shareholder registry"],
    riskFlags: ["family_track_mismatch"],
    matchedSubtypeKeys: ["corporate_setup_for_profit_track"],
    supplementalReferenceCandidates: [
      {
        title: "Notion archive / prior filing package",
        source_type: "internal_archive",
        must_verify_original: true,
        trust_level: "medium",
        usage_locations: ["reviewer_panel", "operator_assist"],
        reference_level: "supplemental"
      }
    ],
    practitionerGuide: {
      for_profit_track: [
        {
          axis: "capital_readiness",
          label: "for-profit capital readiness",
          reason: "for-profit setup needs capital readiness check",
          source_hint: "capital statement",
          severity: "high"
        }
      ],
      sector_track: [
        {
          axis: "regulated_sector_permit",
          label: "regulated sector permit prerequisite",
          reason: "regulated sector route requires permit-first check",
          source_hint: "sector permit notice",
          severity: "high"
        }
      ],
      approval_prerequisite_track: {
        candidate_only_clues: [
          {
            axis: "approval_sequence",
            label: "approval sequence phrase match",
            article_title: "Commercial Act Article 172",
            snippet: "Prior approval may be required for selected setup routes.",
            matched_axis_tags: ["approval_order", "family_route"],
            phrase_level_rationale: "matched phrase: prior approval required",
            source_hint: "approval notice",
            severity: "high"
          }
        ]
      },
      next_actions: ["confirm for-profit/nonprofit route"]
    },
    caseOutlook: {
      corporate_family_clues: [
        {
          axis: "nonprofit_boundary",
          label: "nonprofit boundary check",
          reason: "nonprofit-family docs differ from for-profit route",
          source_hint: "founding purpose statement",
          severity: "high"
        }
      ],
      surfaced_sector_clues: [
        {
          axis: "sector_document_alignment",
          label: "sector document alignment check",
          reason: "sector-specific forms must align with family route",
          source_hint: "sector filing checklist",
          severity: "high"
        }
      ],
      subtype_specific: {
        corporate_setup: [
          {
            axis: "cooperative_alignment",
            label: "cooperative/public-interest distinction",
            source_hint: "cooperative charter"
          }
        ]
      }
    }
  });

  const corporateCandidate = corporate.legalAxisClues.find(
    (entry) => entry.label === "approval sequence phrase match"
  );
  assert.equal(corporateCandidate?.articleTitle, "Commercial Act Article 172");
  assert.equal(
    corporateCandidate?.phraseLevelRationale,
    "matched phrase: prior approval required"
  );
  assert.deepEqual(corporateCandidate?.matchedAxisTags, ["approval_order", "family_route"]);

  const hasCorporateTrackAssist = corporate.operatorAssistPanel.items.some((entry) =>
    entry.action.includes("Follow corporate track: for_profit_track")
  );
  assert.equal(hasCorporateTrackAssist, true);
  const hasSectorTrackAssist = corporate.operatorAssistPanel.items.some((entry) =>
    entry.action.includes("Follow sector track: sector_track")
  );
  assert.equal(hasSectorTrackAssist, true);

  const hasCapitalSource = corporate.sourceVerificationDescriptors.some(
    (entry) => entry.sourceLabel === "capital statement"
  );
  assert.equal(hasCapitalSource, true);
  const hasSectorPermitSource = corporate.sourceVerificationDescriptors.some(
    (entry) => entry.sourceLabel === "sector permit notice"
  );
  assert.equal(hasSectorPermitSource, true);
  const hasApprovalSource = corporate.sourceVerificationDescriptors.some(
    (entry) => entry.sourceLabel === "approval notice"
  );
  assert.equal(hasApprovalSource, true);
  const hasSectorFilingSource = corporate.sourceVerificationDescriptors.some(
    (entry) => entry.sourceLabel === "sector filing checklist"
  );
  assert.equal(hasSectorFilingSource, true);
  const hasCorporatePattern = corporate.reviewerPatternReviewPanel.items.some(
    (entry) =>
      entry.axis === "capital_readiness" ||
      entry.axis === "approval_sequence" ||
      entry.axis === "regulated_sector_permit"
  );
  assert.equal(hasCorporatePattern, true);
  assert.equal(
    corporate.approvalWorkflowGate.blockerCodes.includes("must_verify_sources_pending"),
    true
  );
  assert.equal(corporate.supplementalReferenceCandidates.length, 1);
  assert.equal(corporate.reviewerReferencePanel.items.length, 1);
  assert.equal(
    corporate.reviewerReferencePanel.items[0]?.title,
    "Notion archive / prior filing package"
  );
  assert.equal(corporate.reviewerReferencePanel.items[0]?.sourceType, "internal_archive");
  assert.equal(corporate.reviewerReferencePanel.items[0]?.mustVerifyOriginal, true);
  assert.equal(corporate.reviewerReferencePanel.items[0]?.trustLevel, "medium");
  assert.deepEqual(corporate.reviewerReferencePanel.items[0]?.usageLocations, [
    "reviewer_panel",
    "operator_assist"
  ]);
  assert.equal(corporate.reviewerReferencePanel.items[0]?.referenceLevel, "supplemental");
  assert.equal(
    corporate.operatorAssistPanel.items.some((entry) =>
      entry.action.includes("Check archive reference: Notion archive / prior filing package")
    ),
    true
  );
  const archiveChecklistItem = corporate.sourceVerificationChecklist.items.find(
    (entry) => entry.sourceLabel === "Notion archive / prior filing package"
  );
  assert.equal(archiveChecklistItem?.authorityBucket, "INTERNAL_ARCHIVE_REFERENCE");
  assert.equal(archiveChecklistItem?.sourceType, "internal_archive");
  assert.equal(archiveChecklistItem?.mustVerifyOriginal, true);
  assert.equal(archiveChecklistItem?.trustLevel, "medium");
  assert.deepEqual(archiveChecklistItem?.usageLocations, [
    "reviewer_panel",
    "operator_assist"
  ]);
  assert.equal(archiveChecklistItem?.referenceLevel, "supplemental");
  const supplementalNotMixedAsAxis = corporate.legalAxisClues.every(
    (entry) => entry.label !== "Notion archive / prior filing package"
  );
  assert.equal(supplementalNotMixedAsAxis, true);

  console.log("lawbot-bridge-review-view-models-test-ok");
}

run();
