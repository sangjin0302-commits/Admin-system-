import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { LawbotReviewApprovalError } from "./lawbot-bridge-review-approval-service";
import { handleApproveLawbotReviewRequest } from "./lawbot-bridge-review-approval-action";

const FORBIDDEN_MOJIBAKE_CHAR_PATTERN = /[\u00ec\u00eb\u00ed\u00c2\u0085\uFFFD]/;

function createRequest(body: unknown) {
  return new Request("https://admin.example.test/api/admin/inquiries/inq_approval/lawbot-review/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

function createSafeResult() {
  return {
    inquiryId: "inq_approval",
    caseId: "case_approval",
    caseNumber: "CASE-APPROVAL-001",
    workflowStatus: "APPROVED",
    executionStatus: "success",
    executionSummary: "Approval recorded. External execution remains disabled.",
    updatedAt: "2026-04-29T11:00:00.000Z",
    reviewRequired: true,
    reviewSignals: {
      reviewRequired: true,
      mustVerifyCount: 1,
      mustVerifySourcesCount: 1,
      riskFlagsCount: 1,
      sourceVerificationChecklist: {
        totalRequired: 1
      }
    },
    reviewQueue: {
      totalDrafts: 2,
      approvalPendingDrafts: 0,
      documentDrafts: [
        {
          id: "doc_approval",
          status: "APPROVED",
          reviewRequired: true,
          createdAt: "2026-04-29T10:00:00.000Z",
          updatedAt: "2026-04-29T11:00:00.000Z"
        }
      ],
      messageDrafts: [
        {
          id: "msg_approval",
          status: "APPROVED",
          reviewRequired: true,
          createdAt: "2026-04-29T10:05:00.000Z",
          updatedAt: "2026-04-29T11:00:00.000Z"
        }
      ]
    },
    approvalGate: {
      approvalRequired: true as const,
      externalActionAllowed: false as const,
      reasonCodes: ["manual_approval_required"]
    }
  };
}

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

async function testSuccess() {
  let receivedInput: unknown = null;
  const response = await handleApproveLawbotReviewRequest(
    createRequest({
      manualReviewChecked: true,
      sourcesChecked: true,
      riskFlagsChecked: true,
      draftsReviewed: true,
      operatorNote: "Reviewed the approval checklist."
    }),
    "inq_approval",
    {
      approve: async (input) => {
        receivedInput = input;
        return createSafeResult();
      }
    }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(receivedInput, {
    inquiryId: "inq_approval",
    manualReviewChecked: true,
    sourcesChecked: true,
    riskFlagsChecked: true,
    draftsReviewed: true,
    operatorNote: "Reviewed the approval checklist.",
    expectedWorkflowStatus: "APPROVAL_PENDING"
  });

  const payload = await readJson(response);
  assert.equal(payload.ok, true);
  const serialized = JSON.stringify(payload);
  assert.equal(serialized.includes('"mustVerify":'), false);
  assert.equal(serialized.includes('"mustVerifySources":'), false);
  assert.equal(serialized.includes('"riskFlags":'), false);
  assert.equal(FORBIDDEN_MOJIBAKE_CHAR_PATTERN.test(serialized), false);

  const result = payload.result as ReturnType<typeof createSafeResult>;
  assert.equal(result.workflowStatus, "APPROVED");
  assert.equal(result.approvalGate.externalActionAllowed, false);
  assert.equal(result.reviewQueue.documentDrafts[0]?.status, "APPROVED");
  assert.equal(result.reviewQueue.messageDrafts[0]?.status, "APPROVED");
}

async function testValidationFailure() {
  const response = await handleApproveLawbotReviewRequest(
    createRequest({
      manualReviewChecked: false,
      sourcesChecked: true,
      riskFlagsChecked: true,
      draftsReviewed: true
    }),
    "inq_approval",
    {
      approve: async () => createSafeResult()
    }
  );

  const payload = await readJson(response);
  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.equal(payload.code, "VALIDATION_ERROR");
}

async function testConflictMapping() {
  const response = await handleApproveLawbotReviewRequest(
    createRequest({
      manualReviewChecked: true,
      sourcesChecked: true,
      riskFlagsChecked: true,
      draftsReviewed: true
    }),
    "inq_approval",
    {
      approve: async () => {
        throw new LawbotReviewApprovalError({
          status: 409,
          code: "LAWBOT_REVIEW_WORKFLOW_STATUS_CONFLICT",
          reason: "workflow_status_conflict",
          message: "Lawbot review is not pending approval."
        });
      }
    }
  );

  const payload = await readJson(response);
  assert.equal(response.status, 409);
  assert.equal(payload.ok, false);
  assert.equal(payload.code, "LAWBOT_REVIEW_WORKFLOW_STATUS_CONFLICT");
  assert.equal(payload.reason, "workflow_status_conflict");
}

function testRouteGuardrails() {
  const routeSource = readFileSync(
    join(process.cwd(), "src/app/api/admin/inquiries/[id]/lawbot-review/approve/route.ts"),
    "utf8"
  );
  const actionSource = readFileSync(
    join(process.cwd(), "src/lib/services/lawbot-bridge-review-approval-action.ts"),
    "utf8"
  );
  const combinedSource = `${routeSource}\n${actionSource}`;
  const forbiddenFragments = [
    "run-lawbot-" + "workflow",
    "externalActionAllowed: " + "true",
    "se" + "nd",
    "sub" + "mit"
  ];

  for (const fragment of forbiddenFragments) {
    assert.equal(combinedSource.includes(fragment), false, `Forbidden fragment found: ${fragment}`);
  }
}

async function run() {
  await testSuccess();
  await testValidationFailure();
  await testConflictMapping();
  testRouteGuardrails();
  console.log("lawbot-bridge-review-approval-action-test-ok");
}

run();
