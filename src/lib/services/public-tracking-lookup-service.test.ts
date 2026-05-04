import assert from "node:assert/strict";

import {
  buildPublicTrackingLookupDto,
  lookupPublicTrackingStatus,
  normalizePublicTrackingLookupCode,
  normalizePublicTrackingLookupPhoneLast4,
  PUBLIC_TRACKING_NOT_FOUND_MESSAGE,
  validatePublicTrackingLookupInput
} from "@/lib/services/public-tracking-lookup-service";

const forbiddenResponseKeys = [
  "id",
  "inquiryId",
  "caseId",
  "caseRecordId",
  "workflowStatus",
  "bridgeWorkflowStatus",
  "approvalGate",
  "mustVerify",
  "mustVerifySources",
  "riskFlags",
  "documentDrafts",
  "messageDrafts",
  "communicationLogs"
];

const baseInquiry = {
  publicTrackingCode: "20260504-VI-0001-K3",
  publicTrackingPhoneLast4: "1234",
  createdAt: new Date("2026-05-04T00:00:00.000Z"),
  updatedAt: new Date("2026-05-04T01:00:00.000Z"),
  status: "NEW" as const,
  bridgeWorkflowStatus: "NEW_INQUIRY" as const,
  description: "Visa intake summary",
  _count: {
    documentRequestTasks: 0
  }
};

assert.equal(
  normalizePublicTrackingLookupCode(" 20260504-vi-0001-k3 "),
  "20260504-VI-0001-K3"
);
assert.equal(normalizePublicTrackingLookupPhoneLast4("010-1234-5678"), "5678");
assert.equal(normalizePublicTrackingLookupPhoneLast4("12-34"), "1234");
assert.equal(normalizePublicTrackingLookupPhoneLast4("123"), null);

const validInput = validatePublicTrackingLookupInput({
  trackingCode: " 20260504-vi-0001-k3 ",
  phoneLast4: "010-1234-5678"
});
assert.deepEqual(validInput, {
  ok: true,
  trackingCode: "20260504-VI-0001-K3",
  phoneLast4: "5678"
});

assert.equal(validatePublicTrackingLookupInput({ phoneLast4: "1234" }).ok, false);
assert.equal(
  validatePublicTrackingLookupInput({
    trackingCode: "20260504-VI-1-K3",
    phoneLast4: "1234"
  }).ok,
  false
);
assert.equal(
  validatePublicTrackingLookupInput({
    trackingCode: "20260504-VI-0001-K3"
  }).ok,
  false
);

const receivedDto = buildPublicTrackingLookupDto(baseInquiry);
assert.ok(receivedDto);
assert.equal(receivedDto.trackingCode, "20260504-VI-0001-K3");
assert.equal(receivedDto.categoryLabel, "\uBE44\uC790");
assert.equal(receivedDto.customerStatus, "RECEIVED");
assert.equal(receivedDto.customerStatusLabel, "\uC811\uC218 \uC644\uB8CC");
assert.equal(receivedDto.documentsRequested, false);

const inReviewDto = buildPublicTrackingLookupDto({
  ...baseInquiry,
  bridgeWorkflowStatus: "APPROVAL_PENDING"
});
assert.equal(inReviewDto?.customerStatus, "IN_REVIEW");

const documentsRequestedDto = buildPublicTrackingLookupDto({
  ...baseInquiry,
  _count: {
    documentRequestTasks: 1
  }
});
assert.equal(documentsRequestedDto?.customerStatus, "DOCUMENTS_REQUESTED");
assert.equal(documentsRequestedDto?.documentsRequested, true);

const completedDto = buildPublicTrackingLookupDto({
  ...baseInquiry,
  status: "CLOSED"
});
assert.equal(completedDto?.customerStatus, "COMPLETED");

const serializedDto = JSON.stringify(receivedDto);
for (const key of forbiddenResponseKeys) {
  assert.equal(
    serializedDto.includes(`"${key}"`),
    false,
    `response must not include ${key}`
  );
}
assert.equal(/mustVerify|mustVerifySources|riskFlags/.test(serializedDto), false);
assert.equal(/[\u00ec\u00eb\u00ed\u00c2\u0085\uFFFD]/.test(serializedDto), false);
assert.equal(serializedDto.includes("Visa intake summary"), false);

async function main() {
  let receivedQuery: unknown = null;
  const lookupDto = await lookupPublicTrackingStatus(
    {
      trackingCode: "20260504-VI-0001-K3",
      phoneLast4: "1234"
    },
    {
      prismaClient: {
        inquiry: {
          async findFirst(args: unknown) {
            receivedQuery = args;
            return baseInquiry;
          }
        }
      }
    }
  );
  assert.equal(lookupDto?.trackingCode, "20260504-VI-0001-K3");
  assert.deepEqual(
    (receivedQuery as { where: Record<string, string> }).where,
    {
      publicTrackingCode: "20260504-VI-0001-K3",
      publicTrackingPhoneLast4: "1234"
    }
  );

  const notFoundDto = await lookupPublicTrackingStatus(
    {
      trackingCode: "20260504-VI-0001-K3",
      phoneLast4: "9999"
    },
    {
      prismaClient: {
        inquiry: {
          async findFirst() {
            return null;
          }
        }
      }
    }
  );
  assert.equal(notFoundDto, null);
  assert.equal(
    PUBLIC_TRACKING_NOT_FOUND_MESSAGE,
    "\uC811\uC218 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC811\uC218\uBC88\uD638\uC640 \uD734\uB300\uD3F0 \uB4A4 4\uC790\uB9AC\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694."
  );
}

main().catch((error) => {
  throw error;
});
