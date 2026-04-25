import assert from "node:assert/strict";

import {
  mapCustomerMessageDraftResponseToWorkflow,
  mapDocumentDraftResponseToWorkflow,
  mapIntakeAnalyzeResponseToWorkflow,
  mapIntakeProfileResponseToWorkflow
} from "./lawbot-bridge-workflow-mapping-service";

function run() {
  const analyze = mapIntakeAnalyzeResponseToWorkflow(
    { inquiryId: "inq_1" },
    {
      review_required: true,
      must_verify: ["confirm identity"],
      risk_flags: ["timing_risk"],
      practitioner_guide: { why_it_matters: ["deadline matters"] },
      case_outlook: {
        key_decision_factors: ["service date"],
        missing_case_facts: ["disposition notice"]
      }
    }
  );

  assert.equal(analyze.inquiryUpdate.bridgeWorkflowStatus, "TRIAGE_REVIEW");
  assert.equal(analyze.caseTasks.length, 3);
  assert.equal(analyze.sourceVerificationTasks.length, 0);
  assert.equal(analyze.approvalPending, false);

  const profile = mapIntakeProfileResponseToWorkflow(
    { inquiryId: "inq_1", caseId: "case_1" },
    {
      review_required: true,
      must_verify: ["confirm filing timeline"],
      must_verify_sources: ["disposition notice"],
      risk_flags: ["service_gap"],
      practitioner_guide: { common_mistake: ["overstating facts"] },
      case_outlook: {
        key_decision_factors: ["service route"],
        missing_case_facts: ["proof of receipt"]
      },
      domain_pack: {
        required_documents: ["disposition notice", "proof of service"],
        review_checkpoints: ["check filing deadline"]
      }
    }
  );

  assert.equal(profile.inquiryUpdate.bridgeWorkflowStatus, "AWAITING_SOURCE_VERIFICATION");
  assert.equal(profile.caseUpdate?.bridgeWorkflowStatus, "AWAITING_SOURCE_VERIFICATION");
  assert.equal(profile.caseCreateSuggested, false);
  assert.equal(profile.sourceVerificationTasks.length, 1);
  assert.equal(profile.sourceVerificationTasks[0]?.authorityBucket, "CASE_DOCUMENT");
  assert.equal(profile.documentRequestTasks.length, 2);
  assert.equal(profile.caseTasks.length, 4);

  const documentDraft = mapDocumentDraftResponseToWorkflow(
    { inquiryId: "inq_1", caseId: "case_1" },
    {
      draft_type: "admin_appeal",
      draft: {
        document_type: "admin_appeal",
        sections: { claim_purposes: ["revoke disposition"] }
      },
      review_required: true,
      must_verify: ["confirm service date"],
      must_verify_sources: ["disposition notice"],
      risk_flags: ["timing_risk"],
      practitioner_guide: { what_to_check_first: ["service date"] },
      case_outlook: { missing_case_facts: ["receipt evidence"] }
    }
  );

  assert.equal(documentDraft.approvalPending, true);
  assert.equal(documentDraft.inquiryUpdate.bridgeWorkflowStatus, "APPROVAL_PENDING");
  assert.equal(documentDraft.documentDraft?.status, "APPROVAL_PENDING");
  assert.equal(documentDraft.sourceVerificationTasks.length, 1);
  assert.equal(documentDraft.documentDraft?.practitionerGuide !== null, true);

  const messageDraft = mapCustomerMessageDraftResponseToWorkflow(
    { inquiryId: "inq_1", caseId: "case_1" },
    {
      message_kind: "followup_request",
      draft: {
        subject: "Need more documents",
        body: ["Please send the notice.", "We will review after receipt."]
      },
      review_required: true,
      must_verify: ["confirm service date"],
      must_verify_sources: ["disposition notice"],
      risk_flags: ["timing_risk"],
      practitioner_guide: { what_not_to_state_confidently: ["final outcome"] },
      case_outlook: { key_decision_factors: ["receipt route"] }
    }
  );

  assert.equal(messageDraft.approvalPending, true);
  assert.equal(messageDraft.messageDraft?.status, "APPROVAL_PENDING");
  assert.equal(messageDraft.messageDraft?.subject, "Need more documents");
  assert.equal(
    messageDraft.messageDraft?.bodyText,
    "Please send the notice.\nWe will review after receipt."
  );
  assert.equal(messageDraft.sourceVerificationTasks.length, 1);

  const draftRequiresSourceVerification = mapDocumentDraftResponseToWorkflow(
    { inquiryId: "inq_3", caseId: "case_3" },
    {
      draft_type: "admin_appeal",
      draft: {
        document_type: "admin_appeal"
      },
      review_required: false,
      must_verify_sources: ["service ledger"],
      risk_flags: ["service_gap"]
    }
  );

  assert.equal(draftRequiresSourceVerification.approvalPending, true);
  assert.equal(
    draftRequiresSourceVerification.inquiryUpdate.bridgeWorkflowStatus,
    "APPROVAL_PENDING"
  );
  assert.equal(draftRequiresSourceVerification.documentDraft?.status, "APPROVAL_PENDING");

  const richProfile = mapIntakeProfileResponseToWorkflow(
    { inquiryId: "inq_2", caseId: "case_2" },
    {
      review_required: true,
      must_verify_sources: ["disposition notice"],
      risk_flags: ["timing_risk"],
      matched_subtype_keys: ["licensing_refusal"],
      practitioner_guide: {
        candidate_only_clues: [
          {
            axis: "refusal_notice_proof",
            label: "refusal notice phrase match",
            article_title: "Immigration Act Article 23",
            snippet: "Documents must show clear receipt route.",
            matched_axis_tags: ["service_route", "receipt_proof"],
            phrase_level_rationale: "matched phrase: notice of refusal delivered",
            source_hint: "refusal notice copy"
          }
        ],
        subtype_axis_clues: [
          {
            axis: "licensing_consistency",
            label: "licensing consistency check",
            reason: "licensing subtype requires consistency validation",
            source_hint: "licensing checklist"
          }
        ],
        legal_axis_clues: [
          {
            axis: "service_timeline",
            label: "service ledger consistency",
            reason: "service timeline must be traceable",
            source_hint: "service ledger"
          }
        ]
      },
      case_outlook: {
        subtype_specific: {
          admin_appeal: [
            {
              axis: "admin_appeal_deadline",
              label: "admin appeal deadline window",
              reason: "deadline window must be validated",
              source_hint: "deadline notice"
            }
          ]
        },
        key_decision_factors: ["filing deadline"]
      }
    }
  );

  assert.equal(richProfile.sourceVerificationTasks.length, 5);
  const extraSourceTask = richProfile.sourceVerificationTasks.find(
    (task) => task.sourceLabel === "service ledger"
  );
  assert.equal(extraSourceTask?.authorityBucket, "CASE_DOCUMENT");
  assert.equal(
    extraSourceTask?.notes?.includes("service timeline must be traceable"),
    true
  );
  assert.equal(
    extraSourceTask?.notes?.includes("Subtype route: licensing_refusal"),
    true
  );
  const subtypeSourceTask = richProfile.sourceVerificationTasks.find(
    (task) => task.sourceLabel === "licensing checklist"
  );
  assert.equal(subtypeSourceTask?.authorityBucket, "REFERENCE_SOURCE");
  const candidateSourceTask = richProfile.sourceVerificationTasks.find(
    (task) => task.sourceLabel === "refusal notice copy"
  );
  assert.equal(candidateSourceTask?.authorityBucket, "CASE_DOCUMENT");
  assert.equal(
    candidateSourceTask?.notes?.includes("Article hints: Immigration Act Article 23"),
    true
  );
  assert.equal(
    candidateSourceTask?.notes?.includes("Phrase rationale: matched phrase: notice of refusal delivered"),
    true
  );

  const corporateProfile = mapIntakeProfileResponseToWorkflow(
    { inquiryId: "inq_corp", caseId: "case_corp" },
    {
      review_required: true,
      must_verify_sources: ["shareholder registry"],
      risk_flags: ["family_track_mismatch"],
      matched_subtype_keys: ["corporate_setup_for_profit_track"],
      supplemental_reference_candidates: [
        {
          title: "Notion archive / prior corporate setup",
          source_type: "internal_archive",
          must_verify_original: true,
          trust_level: "medium",
          usage_locations: ["reviewer_panel", "operator_assist"],
          reference_level: "supplemental"
        }
      ],
      practitioner_guide: {
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
        }
      },
      case_outlook: {
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
        ]
      }
    }
  );

  const corporateSources = corporateProfile.sourceVerificationTasks.map((task) => task.sourceLabel);
  assert.equal(corporateSources.includes("shareholder registry"), true);
  assert.equal(corporateSources.includes("capital statement"), true);
  assert.equal(corporateSources.includes("sector permit notice"), true);
  assert.equal(corporateSources.includes("sector filing checklist"), true);
  assert.equal(corporateSources.includes("approval notice"), true);
  assert.equal(corporateSources.includes("founding purpose statement"), true);
  assert.equal(corporateSources.includes("Notion archive / prior corporate setup"), true);

  const corporateApprovalSource = corporateProfile.sourceVerificationTasks.find(
    (task) => task.sourceLabel === "approval notice"
  );
  assert.equal(
    corporateApprovalSource?.notes?.includes("Article hints: Commercial Act Article 172"),
    true
  );
  assert.equal(
    corporateApprovalSource?.notes?.includes("Phrase rationale: matched phrase: prior approval required"),
    true
  );
  assert.equal(
    corporateApprovalSource?.notes?.includes("Subtype route: corporate_setup_for_profit_track"),
    true
  );
  const supplementalSource = corporateProfile.sourceVerificationTasks.find(
    (task) => task.sourceLabel === "Notion archive / prior corporate setup"
  );
  assert.equal(supplementalSource?.authorityBucket, "INTERNAL_ARCHIVE_REFERENCE");
  assert.equal(
    supplementalSource?.notes?.includes("Internal archive (internal_archive)"),
    true
  );
  assert.equal(supplementalSource?.notes?.includes("trust=medium"), true);

  console.log("lawbot-bridge-workflow-mapping-test-ok");
}

run();
