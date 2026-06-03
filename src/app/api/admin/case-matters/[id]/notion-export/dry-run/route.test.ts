import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type FakeCaseMatter = {
  id: string;
  caseNo: string | null;
  title: string;
  matterType: string;
  status: string;
  dueDate: Date | null;
  assignedTo: string | null;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
  inquiry: {
    publicTrackingCode: string | null;
  } | null;
  internalMemo?: string;
  communicationLogs?: string;
  phone?: string;
  email?: string;
};

let findUniqueCalls: Array<{
  where: { id: string };
  select: Record<string, unknown>;
}> = [];
let caseMatterById = new Map<string, FakeCaseMatter>();

(globalThis as { prisma?: unknown }).prisma = {
  caseMatter: {
    findUnique: async (args: { where: { id: string }; select: Record<string, unknown> }) => {
      findUniqueCalls.push(args);
      return caseMatterById.get(args.where.id) ?? null;
    }
  }
};

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
const { POST } = await import("./route");

function makeCase(overrides: Partial<FakeCaseMatter> = {}): FakeCaseMatter {
  return {
    id: "qa_case_1",
    caseNo: "QA-NON_CUSTOMER-001",
    title: "QA NON_CUSTOMER Notion dry-run case",
    matterType: "immigration",
    status: "DOCUMENT_COLLECTING",
    dueDate: new Date("2026-06-30T00:00:00.000Z"),
    assignedTo: "Admin",
    summary: "Safe summary only.",
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-02T00:00:00.000Z"),
    inquiry: {
      publicTrackingCode: "TRK-QA-001"
    },
    ...overrides
  };
}

function request(body: unknown) {
  return new Request("http://localhost/api/admin/case-matters/qa_case_1/notion-export/dry-run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

async function callPost(caseMatterId: string, body: unknown) {
  return POST(request(body), {
    params: Promise.resolve({ id: caseMatterId })
  });
}

function reset(cases: FakeCaseMatter[] = []) {
  findUniqueCalls = [];
  caseMatterById = new Map(cases.map((item) => [item.id, item]));
}

reset([makeCase()]);
const successResponse = await callPost("qa_case_1", {
  destination: "notion.case_management",
  dryRun: true
});
assert.equal(successResponse.status, 200);
const successBody = await successResponse.json();
assert.equal(successBody.ok, true);
assert.equal(successBody.dryRun, true);
assert.equal(successBody.wouldWrite, false);
assert.equal(successBody.destination, "notion.case_management");
assert.equal(successBody.entityType, "case_matter");
assert.equal(successBody.idempotencyKeyHashPresent, true);
assert.deepEqual(successBody.forbiddenFieldCheck, {
  ok: true,
  blockedKeys: []
});
assert.equal(Array.isArray(successBody.exportedFieldKeys), true);
assert.equal(successBody.exportedFieldKeys.includes("caseNo"), true);
assert.equal(successBody.exportedFieldKeys.includes("title"), true);
assert.equal(successBody.exportedFieldKeys.includes("status"), true);
assert.equal(successBody.exportedFieldKeys.includes("dueDate"), true);
assert.equal(JSON.stringify(successBody).includes("Safe summary only."), false);
assert.equal(JSON.stringify(successBody).includes("QA NON_CUSTOMER Notion dry-run case"), false);
assert.equal(JSON.stringify(successBody).includes("TRK-QA-001"), false);

assert.equal(findUniqueCalls.length, 1);
assert.deepEqual(Object.keys(findUniqueCalls[0]?.select ?? {}).sort(), [
  "assignedTo",
  "caseNo",
  "createdAt",
  "dueDate",
  "id",
  "inquiry",
  "matterType",
  "status",
  "summary",
  "title",
  "updatedAt"
]);
assert.equal("internalMemo" in findUniqueCalls[0]!.select, false);
assert.equal("communicationLogs" in findUniqueCalls[0]!.select, false);
assert.equal("accountingMemo" in findUniqueCalls[0]!.select, false);
assert.equal("parties" in findUniqueCalls[0]!.select, false);

reset([makeCase({ id: "qa_case_2" })]);
const includeUrlResponse = await callPost("qa_case_2", {
  destination: "notion.case_management",
  dryRun: true,
  includeAdminUrl: true
});
assert.equal(includeUrlResponse.status, 200);
const includeUrlBody = await includeUrlResponse.json();
assert.equal(includeUrlBody.exportedFieldKeys.includes("adminCaseUrl"), true);
assert.equal(JSON.stringify(includeUrlBody).includes("/admin/cases/qa_case_2"), false);

reset([makeCase()]);
const invalidDestinationResponse = await callPost("qa_case_1", {
  destination: "notion.customer_management",
  dryRun: true
});
assert.equal(invalidDestinationResponse.status, 400);
const invalidDestinationBody = await invalidDestinationResponse.json();
assert.equal(invalidDestinationBody.ok, false);
assert.equal(invalidDestinationBody.dryRun, true);
assert.equal(invalidDestinationBody.wouldWrite, false);
assert.equal(invalidDestinationBody.errorCode, "INVALID_REQUEST");

reset([makeCase()]);
const falseDryRunResponse = await callPost("qa_case_1", {
  destination: "notion.case_management",
  dryRun: false
});
assert.equal(falseDryRunResponse.status, 400);
assert.equal((await falseDryRunResponse.json()).errorCode, "INVALID_REQUEST");

reset([makeCase()]);
const unknownFieldResponse = await callPost("qa_case_1", {
  destination: "notion.case_management",
  dryRun: true,
  fields: {
    title: "client must not provide payload"
  }
});
assert.equal(unknownFieldResponse.status, 400);
assert.equal((await unknownFieldResponse.json()).errorCode, "INVALID_REQUEST");

reset();
const missingResponse = await callPost("missing_case", {
  destination: "notion.case_management",
  dryRun: true
});
assert.equal(missingResponse.status, 404);
assert.equal((await missingResponse.json()).errorCode, "CASE_NOT_FOUND");

reset([makeCase({ id: "real_case", caseNo: "MAT-20260602-001", title: "Real customer-looking case" })]);
const unsafeCaseResponse = await callPost("real_case", {
  destination: "notion.case_management",
  dryRun: true
});
assert.equal(unsafeCaseResponse.status, 403);
const unsafeCaseBody = await unsafeCaseResponse.json();
assert.equal(unsafeCaseBody.errorCode, "CASE_NOT_SAFE_FOR_EXPORT");

const invalidJsonResponse = await POST(
  new Request("http://localhost/api/admin/case-matters/qa_case_1/notion-export/dry-run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: "{"
  }),
  {
    params: Promise.resolve({ id: "qa_case_1" })
  }
);
assert.equal(invalidJsonResponse.status, 400);
assert.equal((await invalidJsonResponse.json()).errorCode, "INVALID_JSON_BODY");

const invalidIdResponse = await callPost("bad id", {
  destination: "notion.case_management",
  dryRun: true
});
assert.equal(invalidIdResponse.status, 400);
assert.equal((await invalidIdResponse.json()).errorCode, "INVALID_CASE_MATTER_ID");

for (const body of [
  successBody,
  includeUrlBody,
  invalidDestinationBody,
  unsafeCaseBody
]) {
  const serialized = JSON.stringify(body);
  for (const forbidden of [
    "internalMemo",
    "communicationLogs",
    "phone",
    "email",
    "authorization",
    "token",
    "rawPayload",
    "Notion token"
  ]) {
    assert.equal(serialized.includes(forbidden), false, `response should not expose ${forbidden}`);
  }
}

const routeSource = readFileSync(
  join(
    process.cwd(),
    "src/app/api/admin/case-matters/[id]/notion-export/dry-run/route.ts"
  ),
  "utf8"
);
assert.equal(routeSource.includes("@notionhq/client"), false);
assert.equal(routeSource.includes("fetch("), false);
assert.equal(routeSource.includes("process.env"), false);
assert.equal(routeSource.includes("create("), false);
assert.equal(routeSource.includes("update("), false);
assert.doesNotMatch(routeSource, /internalMemo|communicationLogs|phone|email|feeAmount|paidAmount|paymentMemo/);

console.log("notion export dry-run route tests passed");
}
