import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getLawbotMessageSendReadiness } from "./lawbot-message-send-readiness-service";

const FORBIDDEN_MOJIBAKE_CHAR_PATTERN = /[\u00ec\u00eb\u00ed\u00c2\u0085\uFFFD]/;

type FakeInput = {
  inquiryStatus?: string;
  caseStatus?: string;
  email?: string | null;
  phone?: string | null;
  latestContactChannel?: string | null;
  drafts?: Array<{
    id?: string;
    status?: string;
    reviewRequired?: boolean;
    messageKind?: string;
    subject?: string;
    bodyText?: string;
    mustVerify?: string[];
    mustVerifySources?: string[];
    riskFlags?: string[];
  }>;
};

function createFakePrisma(input: FakeInput = {}) {
  const inquiry = {
    id: "inq_send_ready",
    bridgeWorkflowStatus: input.inquiryStatus ?? "APPROVED",
    email: input.email === undefined ? "client@example.test" : input.email,
    phone: input.phone === undefined ? null : input.phone,
    latestContactChannel:
      input.latestContactChannel === undefined ? "email" : input.latestContactChannel
  };

  const caseRecord = {
    id: "case_send_ready",
    caseNumber: "CASE-SEND-READY-001",
    bridgeWorkflowStatus: input.caseStatus ?? "APPROVED"
  };

  const drafts = input.drafts ?? [
    {
      id: "msg_ready",
      status: "APPROVED",
      reviewRequired: false,
      messageKind: "email",
      subject: "Safe subject",
      bodyText: "raw message body must not leak",
      mustVerify: ["raw must verify"],
      mustVerifySources: ["raw source"],
      riskFlags: ["raw risk"]
    }
  ];

  return {
    inquiry: {
      findUnique: async () => inquiry
    },
    caseRecord: {
      findFirst: async () => caseRecord
    },
    messageDraft: {
      findMany: async () =>
        drafts
          .filter((draft) => draft.status !== "DRAFT_CREATED")
          .map((draft, index) => ({
            id: draft.id ?? `msg_${index + 1}`,
            status: draft.status ?? "APPROVED",
            reviewRequired: draft.reviewRequired ?? false,
            messageKind: draft.messageKind ?? "email",
            subject: draft.subject ?? "Safe subject",
            bodyText: draft.bodyText,
            mustVerify: draft.mustVerify,
            mustVerifySources: draft.mustVerifySources,
            riskFlags: draft.riskFlags,
            createdAt: new Date("2026-05-03T10:00:00.000Z"),
            updatedAt: new Date("2026-05-03T10:05:00.000Z")
          }))
    }
  };
}

async function getResult(input: FakeInput = {}) {
  const result = await getLawbotMessageSendReadiness("inq_send_ready", {
    prismaClient: createFakePrisma(input) as never
  });
  assert.ok(result);
  return result;
}

function assertSafeSerialized(value: unknown) {
  const serialized = JSON.stringify(value);
  assert.equal(serialized.includes('"mustVerify":'), false);
  assert.equal(serialized.includes('"mustVerifySources":'), false);
  assert.equal(serialized.includes('"riskFlags":'), false);
  assert.equal(serialized.includes("raw message body must not leak"), false);
  assert.equal(serialized.includes("raw must verify"), false);
  assert.equal(serialized.includes("raw source"), false);
  assert.equal(serialized.includes("raw risk"), false);
  assert.equal(FORBIDDEN_MOJIBAKE_CHAR_PATTERN.test(serialized), false);
}

async function testNotApproved() {
  const result = await getResult({ inquiryStatus: "APPROVAL_PENDING" });

  assert.equal(result.sendReadiness.status, "NOT_APPROVED");
  assert.equal(result.sendReadiness.ready, false);
  assert.equal(result.sendReadiness.dryRunOnly, true);
  assert.equal(result.sendReadiness.externalActionAllowed, false);
  assert.deepEqual(result.messageDrafts, []);
  assertSafeSerialized(result);
}

async function testNoApprovedMessageDrafts() {
  const result = await getResult({ drafts: [] });

  assert.equal(result.sendReadiness.status, "NO_APPROVED_MESSAGE_DRAFTS");
  assert.equal(result.sendReadiness.ready, false);
  assert.equal(result.sendReadiness.externalActionAllowed, false);
  assert.ok(result.sendReadiness.reasonCodes.includes("NO_APPROVED_MESSAGE_DRAFTS"));
  assertSafeSerialized(result);
}

async function testReviewRequiredStillTrue() {
  const result = await getResult({
    drafts: [{ id: "msg_review", reviewRequired: true }]
  });

  assert.equal(result.sendReadiness.status, "REVIEW_REQUIRED_STILL_TRUE");
  assert.equal(result.sendReadiness.ready, false);
  assert.equal(result.messageDrafts[0]?.readinessStatus, "REVIEW_REQUIRED_STILL_TRUE");
  assert.ok(result.messageDrafts[0]?.reasonCodes.includes("REVIEW_REQUIRED_STILL_TRUE"));
  assert.equal(result.sendReadiness.externalActionAllowed, false);
  assertSafeSerialized(result);
}

async function testMissingRecipientAndChannel() {
  const result = await getResult({
    email: "",
    phone: null,
    latestContactChannel: "",
    drafts: [{ id: "msg_missing", messageKind: "", subject: "Safe subject" }]
  });

  assert.equal(result.sendReadiness.status, "MISSING_RECIPIENT");
  assert.equal(result.sendReadiness.ready, false);
  assert.ok(result.sendReadiness.reasonCodes.includes("MISSING_RECIPIENT"));
  assert.ok(result.sendReadiness.reasonCodes.includes("MISSING_CHANNEL"));
  assert.ok(result.sendReadiness.reasonCodes.includes("MISSING_MESSAGE_METADATA"));
  assertSafeSerialized(result);
}

async function testDryRunReadyStillNoExternalAction() {
  const result = await getResult();

  assert.equal(result.sendReadiness.status, "DRY_RUN_READY");
  assert.equal(result.sendReadiness.ready, true);
  assert.equal(result.sendReadiness.dryRunOnly, true);
  assert.equal(result.sendReadiness.externalActionAllowed, false);
  assert.equal(result.messageDrafts[0]?.readinessStatus, "DRY_RUN_READY");
  assert.deepEqual(result.messageDrafts[0]?.reasonCodes, ["DRY_RUN_READY"]);
  assertSafeSerialized(result);
}

function testRouteGuardrails() {
  const routeSource = readFileSync(
    join(
      process.cwd(),
      "src/app/api/admin/inquiries/[id]/lawbot-review/message-send-readiness/route.ts"
    ),
    "utf8"
  );
  const serviceSource = readFileSync(
    join(process.cwd(), "src/lib/services/lawbot-message-send-readiness-service.ts"),
    "utf8"
  );
  const combinedSource = `${routeSource}\n${serviceSource}`;

  const forbiddenFragments = [
    "dispatchInitialClientMessage",
    "clientMessageAdapters",
    "sendInitialMessage",
    "emailAdapter",
    "smsAdapter",
    "alimtalk",
    "externalActionAllowed: " + "true",
    "run-lawbot-" + "workflow",
    "POST("
  ];

  for (const fragment of forbiddenFragments) {
    assert.equal(combinedSource.includes(fragment), false, `Forbidden fragment found: ${fragment}`);
  }
}

async function run() {
  await testNotApproved();
  await testNoApprovedMessageDrafts();
  await testReviewRequiredStillTrue();
  await testMissingRecipientAndChannel();
  await testDryRunReadyStillNoExternalAction();
  testRouteGuardrails();
  console.log("lawbot-message-send-readiness-service-test-ok");
}

run();
