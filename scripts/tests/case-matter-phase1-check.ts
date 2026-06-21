import assert from "node:assert/strict";

import type { CaseMatterStatus, RequiredDocumentStatus } from "@generated/prisma-client/client";

import { prisma } from "../../src/lib/prisma/client";
import {
  CaseMatterConcurrentUpdateError,
  CaseMatterStatusGuardError,
  RequiredDocumentCreateError,
  RequiredDocumentConcurrentUpdateError,
  RequiredDocumentStatusGuardError,
  createRequiredDocument,
  startRequiredDocumentChecklist,
  updateCaseMatterStatus,
  updateRequiredDocumentStatus
} from "../../src/lib/services/case-matter-service";

function uniqueToken(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createCaseMatter(status: CaseMatterStatus = "INTAKE_REVIEW") {
  return prisma.caseMatter.create({
    data: {
      title: uniqueToken("CaseMatter-Phase1"),
      matterType: "phase1_test",
      status
    }
  });
}

async function createRequiredDocumentRow(caseId: string, status: RequiredDocumentStatus = "NEEDED") {
  return prisma.requiredDocument.create({
    data: {
      caseId,
      name: uniqueToken("RequiredDocument"),
      status,
      required: true
    }
  });
}

async function cleanupCaseMatter(caseId: string) {
  try {
    await prisma.caseMatter.delete({ where: { id: caseId } });
  } catch {
    // best-effort cleanup for checks
  }
}

async function checkCaseMatterValidTransition() {
  const caseMatter = await createCaseMatter("INTAKE_REVIEW");
  try {
    const result = await updateCaseMatterStatus({
      caseMatterId: caseMatter.id,
      status: "CONSULTING",
      actorName: "test-runner",
      statusChangeNote: "valid transition check",
      expectedUpdatedAt: caseMatter.updatedAt.toISOString()
    });
    assert.equal(result.status, "CONSULTING");

    const events = await prisma.caseEvent.findMany({
      where: { caseId: caseMatter.id, eventType: "CASE_STATUS_CHANGED" }
    });
    assert.equal(events.length, 1);
  } finally {
    await cleanupCaseMatter(caseMatter.id);
  }
}

async function checkCaseMatterInvalidTransition() {
  const caseMatter = await createCaseMatter("INTAKE_REVIEW");
  try {
    await assert.rejects(
      () =>
        updateCaseMatterStatus({
          caseMatterId: caseMatter.id,
          status: "SUBMITTED",
          expectedUpdatedAt: caseMatter.updatedAt.toISOString()
        }),
      (error) => {
        assert.ok(error instanceof CaseMatterStatusGuardError);
        return true;
      }
    );
  } finally {
    await cleanupCaseMatter(caseMatter.id);
  }
}

async function checkCaseMatterConcurrencyGuard() {
  const caseMatter = await createCaseMatter("INTAKE_REVIEW");
  const staleExpected = new Date(caseMatter.updatedAt.getTime() - 1000).toISOString();
  try {
    await assert.rejects(
      () =>
        updateCaseMatterStatus({
          caseMatterId: caseMatter.id,
          status: "CONSULTING",
          expectedUpdatedAt: staleExpected
        }),
      (error) => {
        assert.ok(error instanceof CaseMatterConcurrentUpdateError);
        return true;
      }
    );
  } finally {
    await cleanupCaseMatter(caseMatter.id);
  }
}

async function checkRequiredDocumentValidTransition() {
  const caseMatter = await createCaseMatter("DOCUMENT_COLLECTING");
  const document = await createRequiredDocumentRow(caseMatter.id, "NEEDED");
  try {
    const result = await updateRequiredDocumentStatus({
      caseMatterId: caseMatter.id,
      requiredDocumentId: document.id,
      status: "REQUESTED",
      actorName: "test-runner",
      statusChangeNote: "requesting docs",
      expectedUpdatedAt: document.updatedAt.toISOString()
    });

    const updatedDocument = result.requiredDocuments.find((item) => item.id === document.id);
    assert.equal(updatedDocument?.status, "REQUESTED");

    const events = await prisma.caseEvent.findMany({
      where: { caseId: caseMatter.id, eventType: "REQUIRED_DOCUMENT_STATUS_CHANGED" }
    });
    assert.equal(events.length, 1);
  } finally {
    await cleanupCaseMatter(caseMatter.id);
  }
}

async function checkRequiredDocumentInvalidTransition() {
  const caseMatter = await createCaseMatter("DOCUMENT_COLLECTING");
  const document = await createRequiredDocumentRow(caseMatter.id, "NEEDED");
  try {
    await assert.rejects(
      () =>
        updateRequiredDocumentStatus({
          caseMatterId: caseMatter.id,
          requiredDocumentId: document.id,
          status: "APPROVED",
          expectedUpdatedAt: document.updatedAt.toISOString()
        }),
      (error) => {
        assert.ok(error instanceof RequiredDocumentStatusGuardError);
        return true;
      }
    );
  } finally {
    await cleanupCaseMatter(caseMatter.id);
  }
}

async function checkRequiredDocumentConcurrencyGuard() {
  const caseMatter = await createCaseMatter("DOCUMENT_COLLECTING");
  const document = await createRequiredDocumentRow(caseMatter.id, "NEEDED");
  const staleExpected = new Date(document.updatedAt.getTime() - 1000).toISOString();
  try {
    await assert.rejects(
      () =>
        updateRequiredDocumentStatus({
          caseMatterId: caseMatter.id,
          requiredDocumentId: document.id,
          status: "REQUESTED",
          expectedUpdatedAt: staleExpected
        }),
      (error) => {
        assert.ok(error instanceof RequiredDocumentConcurrentUpdateError);
        return true;
      }
    );
  } finally {
    await cleanupCaseMatter(caseMatter.id);
  }
}

async function checkRequiredDocumentCreateAndDuplicateGuard() {
  const caseMatter = await createCaseMatter("DOCUMENT_COLLECTING");
  const name = uniqueToken("Checklist-Item");
  try {
    const result = await createRequiredDocument({
      caseMatterId: caseMatter.id,
      name,
      expectedCaseUpdatedAt: caseMatter.updatedAt.toISOString()
    });
    const createdItem = result.requiredDocuments.find((item) => item.name === name);
    assert.ok(createdItem, "created required document should be present");

    await assert.rejects(
      () =>
        createRequiredDocument({
          caseMatterId: caseMatter.id,
          name,
          expectedCaseUpdatedAt: caseMatter.updatedAt.toISOString()
        }),
      (error) => {
        assert.ok(error instanceof RequiredDocumentCreateError);
        assert.equal(error.code, "REQUIRED_DOCUMENT_DUPLICATE");
        return true;
      }
    );
  } finally {
    await cleanupCaseMatter(caseMatter.id);
  }
}

async function checkRequiredDocumentChecklistStarter() {
  const caseMatter = await createCaseMatter("DOCUMENT_COLLECTING");
  try {
    const first = await startRequiredDocumentChecklist({
      caseMatterId: caseMatter.id,
      expectedCaseUpdatedAt: caseMatter.updatedAt.toISOString()
    });
    assert.ok(first.createdCount > 0, "starter should create initial checklist items");

    const latest = await prisma.caseMatter.findUnique({
      where: { id: caseMatter.id },
      select: { updatedAt: true }
    });
    assert.ok(latest, "case matter should still exist after starter");

    const second = await startRequiredDocumentChecklist({
      caseMatterId: caseMatter.id,
      expectedCaseUpdatedAt: latest.updatedAt.toISOString()
    });
    assert.equal(second.createdCount, 0);
    assert.ok(second.skippedCount > 0, "starter should skip existing checklist items");
  } finally {
    await cleanupCaseMatter(caseMatter.id);
  }
}

type CheckItem = {
  name: string;
  run: () => Promise<void>;
};

const checks: CheckItem[] = [
  {
    name: "CaseMatter valid transition succeeds and logs event",
    run: checkCaseMatterValidTransition
  },
  {
    name: "CaseMatter invalid transition fails",
    run: checkCaseMatterInvalidTransition
  },
  {
    name: "CaseMatter optimistic concurrency mismatch fails",
    run: checkCaseMatterConcurrencyGuard
  },
  {
    name: "RequiredDocument valid transition succeeds and logs event",
    run: checkRequiredDocumentValidTransition
  },
  {
    name: "RequiredDocument invalid transition fails",
    run: checkRequiredDocumentInvalidTransition
  },
  {
    name: "RequiredDocument optimistic concurrency mismatch fails",
    run: checkRequiredDocumentConcurrencyGuard
  },
  {
    name: "RequiredDocument create succeeds and duplicate create fails",
    run: checkRequiredDocumentCreateAndDuplicateGuard
  },
  {
    name: "RequiredDocument checklist starter creates then skips existing items",
    run: checkRequiredDocumentChecklistStarter
  }
];

async function run() {
  const failures: string[] = [];

  for (const check of checks) {
    try {
      await check.run();
      console.log(`[PASS] ${check.name}`);
    } catch (error) {
      failures.push(check.name);
      console.error(`[FAIL] ${check.name}`);
      console.error(error);
    }
  }

  await prisma.$disconnect();

  if (failures.length > 0) {
    throw new Error(`Phase 1 checks failed (${failures.length}): ${failures.join(", ")}`);
  }

  console.log(`[OK] All Phase 1 checks passed (${checks.length}/${checks.length}).`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
