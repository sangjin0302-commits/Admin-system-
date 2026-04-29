import assert from "node:assert/strict";

import {
  LawbotReviewApprovalError,
  approveLawbotReview
} from "./lawbot-bridge-review-approval-service";

type DraftRow = {
  id: string;
  status: string;
  source: string;
  approvedAt: Date | null;
};

function createFakePrisma(input?: {
  inquiryStatus?: string;
  hasCaseRecord?: boolean;
  documentDrafts?: DraftRow[];
  messageDrafts?: DraftRow[];
}) {
  const state = {
    inquiry: {
      id: "inq_approval",
      bridgeWorkflowStatus: input?.inquiryStatus ?? "APPROVAL_PENDING",
      communicationLogs: JSON.stringify([{ type: "existing_note" }])
    },
    caseRecord: input?.hasCaseRecord === false
      ? null
      : {
          id: "case_approval",
          bridgeWorkflowStatus: "APPROVAL_PENDING"
        },
    documentDrafts: input?.documentDrafts ?? [
      {
        id: "doc_approval",
        status: "APPROVAL_PENDING",
        source: "lawbot_bridge",
        approvedAt: null
      }
    ],
    messageDrafts: input?.messageDrafts ?? [
      {
        id: "msg_approval",
        status: "APPROVAL_PENDING",
        source: "lawbot_bridge",
        approvedAt: null
      }
    ]
  };

  const tx = {
    inquiry: {
      findUnique: async () => state.inquiry,
      update: async (args: { data: { bridgeWorkflowStatus: string; communicationLogs: string } }) => {
        state.inquiry.bridgeWorkflowStatus = args.data.bridgeWorkflowStatus;
        state.inquiry.communicationLogs = args.data.communicationLogs;
        return state.inquiry;
      }
    },
    caseRecord: {
      findFirst: async () => state.caseRecord,
      update: async (args: { data: { bridgeWorkflowStatus: string } }) => {
        if (state.caseRecord) {
          state.caseRecord.bridgeWorkflowStatus = args.data.bridgeWorkflowStatus;
        }
        return state.caseRecord;
      }
    },
    documentDraft: {
      findMany: async () =>
        state.documentDrafts
          .filter((draft) => draft.source === "lawbot_bridge" && draft.status === "APPROVAL_PENDING")
          .map((draft) => ({ id: draft.id })),
      updateMany: async (args: { where: { id: { in: string[] } }; data: { status: string; approvedAt: Date } }) => {
        for (const draft of state.documentDrafts) {
          if (args.where.id.in.includes(draft.id)) {
            draft.status = args.data.status;
            draft.approvedAt = args.data.approvedAt;
          }
        }
        return { count: args.where.id.in.length };
      }
    },
    messageDraft: {
      findMany: async () =>
        state.messageDrafts
          .filter((draft) => draft.source === "lawbot_bridge" && draft.status === "APPROVAL_PENDING")
          .map((draft) => ({ id: draft.id })),
      updateMany: async (args: { where: { id: { in: string[] } }; data: { status: string; approvedAt: Date } }) => {
        for (const draft of state.messageDrafts) {
          if (args.where.id.in.includes(draft.id)) {
            draft.status = args.data.status;
            draft.approvedAt = args.data.approvedAt;
          }
        }
        return { count: args.where.id.in.length };
      }
    }
  };

  return {
    state,
    prismaClient: {
      ...tx,
      $transaction: async <T>(handler: (transactionClient: typeof tx) => Promise<T>) => handler(tx)
    }
  };
}

function createReviewResult() {
  const mojibake = "\u00ec\u00eb\u00ac";
  return {
    inquiryId: "inq_approval",
    caseId: "case_approval",
    caseNumber: "CASE-APPROVAL-001",
    workflowStatus: "APPROVED",
    executionStatus: "success",
    executionSummary: "Approved status recorded. External send/file actions still require manual confirmation.",
    updatedAt: "2026-04-29T10:00:00.000Z",
    reviewRequired: true,
    reviewSignals: {
      reviewRequired: true,
      mustVerify: [mojibake],
      mustVerifyCount: 1,
      mustVerifySources: [mojibake],
      mustVerifySourcesCount: 1,
      riskFlags: [mojibake],
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
          mustVerifySources: [mojibake],
          riskFlags: [mojibake],
          createdAt: "2026-04-29T09:00:00.000Z",
          updatedAt: "2026-04-29T10:00:00.000Z"
        }
      ],
      messageDrafts: [
        {
          id: "msg_approval",
          status: "APPROVED",
          reviewRequired: true,
          mustVerifySources: [mojibake],
          riskFlags: [mojibake],
          createdAt: "2026-04-29T09:10:00.000Z",
          updatedAt: "2026-04-29T10:00:00.000Z"
        }
      ]
    },
    approvalGate: {
      approvalRequired: true,
      externalActionAllowed: false,
      reasonCodes: ["manual_approval_required"]
    }
  };
}

async function approveWithFake(input?: {
  inquiryStatus?: string;
  documentDrafts?: DraftRow[];
  messageDrafts?: DraftRow[];
}) {
  const fake = createFakePrisma(input);
  const approvedAt = new Date("2026-04-29T11:00:00.000Z");
  const result = await approveLawbotReview(
    {
      inquiryId: "inq_approval",
      manualReviewChecked: true,
      sourcesChecked: true,
      riskFlagsChecked: true,
      draftsReviewed: true,
      operatorNote: "Reviewed source checklist and draft metadata.",
      expectedWorkflowStatus: "APPROVAL_PENDING"
    },
    {
      prismaClient: fake.prismaClient as never,
      now: () => approvedAt,
      loadReviewResult: async () => createReviewResult()
    }
  );

  return { fake, result, approvedAt };
}

async function testSuccessfulApproval() {
  const { fake, result, approvedAt } = await approveWithFake();

  assert.equal(fake.state.inquiry.bridgeWorkflowStatus, "APPROVED");
  assert.equal(fake.state.caseRecord?.bridgeWorkflowStatus, "APPROVED");
  assert.equal(fake.state.documentDrafts[0].status, "APPROVED");
  assert.equal(fake.state.messageDrafts[0].status, "APPROVED");
  assert.equal(fake.state.documentDrafts[0].approvedAt?.toISOString(), approvedAt.toISOString());
  assert.equal(fake.state.messageDrafts[0].approvedAt?.toISOString(), approvedAt.toISOString());

  const communicationLogs = JSON.parse(fake.state.inquiry.communicationLogs);
  const auditEntry = communicationLogs.at(-1);
  assert.equal(auditEntry.type, "lawbot_review_approval");
  assert.equal(auditEntry.source, "admin_lawbot_review");
  assert.equal(auditEntry.operatorNote, "Reviewed source checklist and draft metadata.");
  assert.equal(auditEntry.confirmedChecks.manualReviewChecked, true);
  assert.equal(auditEntry.confirmedChecks.sourcesChecked, true);
  assert.equal(auditEntry.confirmedChecks.riskFlagsChecked, true);
  assert.equal(auditEntry.confirmedChecks.draftsReviewed, true);
  assert.equal(auditEntry.previousWorkflowStatus, "APPROVAL_PENDING");
  assert.equal(auditEntry.nextWorkflowStatus, "APPROVED");
  assert.deepEqual(auditEntry.approvedDocumentDraftIds, ["doc_approval"]);
  assert.deepEqual(auditEntry.approvedMessageDraftIds, ["msg_approval"]);
  assert.equal(auditEntry.externalActionAllowed, false);
  assert.equal(auditEntry.timestamp, approvedAt.toISOString());

  assert.equal(result.approvalGate.externalActionAllowed, false);
  assert.equal(result.reviewQueue.documentDrafts[0]?.status, "APPROVED");
  assert.equal(result.reviewQueue.messageDrafts[0]?.status, "APPROVED");

  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes('"mustVerify":'), false);
  assert.equal(serialized.includes('"mustVerifySources":'), false);
  assert.equal(serialized.includes('"riskFlags":'), false);
  assert.equal(/[\u00ec\u00eb\u00ed\u00c2\u0085\uFFFD]/.test(serialized), false);
}

async function testMissingConfirmationFails() {
  const fake = createFakePrisma();
  await assert.rejects(
    () =>
      approveLawbotReview(
        {
          inquiryId: "inq_approval",
          manualReviewChecked: false,
          sourcesChecked: true,
          riskFlagsChecked: true,
          draftsReviewed: true
        },
        {
          prismaClient: fake.prismaClient as never,
          loadReviewResult: async () => createReviewResult()
        }
      ),
    (error: unknown) =>
      error instanceof LawbotReviewApprovalError &&
      error.status === 400 &&
      error.reason === "manualReviewChecked_required"
  );
}

async function testNonPendingWorkflowFails() {
  await assert.rejects(
    () => approveWithFake({ inquiryStatus: "APPROVED" }),
    (error: unknown) =>
      error instanceof LawbotReviewApprovalError &&
      error.status === 409 &&
      error.reason === "workflow_status_conflict"
  );
}

async function testNoPendingDraftsFails() {
  await assert.rejects(
    () =>
      approveWithFake({
        documentDrafts: [
          {
            id: "doc_done",
            status: "APPROVED",
            source: "lawbot_bridge",
            approvedAt: new Date("2026-04-29T08:00:00.000Z")
          }
        ],
        messageDrafts: []
      }),
    (error: unknown) =>
      error instanceof LawbotReviewApprovalError &&
      error.status === 409 &&
      error.reason === "no_approval_pending_drafts"
  );
}

async function run() {
  await testSuccessfulApproval();
  await testMissingConfirmationFails();
  await testNonPendingWorkflowFails();
  await testNoPendingDraftsFails();
  console.log("lawbot-bridge-review-approval-service-test-ok");
}

run();
