import { generateCaseNumber } from "@/lib/case-utils/case-number";
import { prisma } from "@/lib/prisma/client";

import type {
  BridgeWorkflowPersistencePort,
  WorkflowInquiryRecord,
  WorkflowCaseRecord
} from "./lawbot-bridge-case-workflow-service";
import type {
  BridgeWorkflowPersistence,
  CaseTaskInput,
  DocumentDraftInput,
  DocumentRequestTaskInput,
  MessageDraftInput,
  SourceVerificationTaskInput
} from "./lawbot-bridge-workflow-mapping-service";

type PrismaLike = typeof prisma;

function toInquiryRecord(record: Awaited<ReturnType<PrismaLike["inquiry"]["findUnique"]>>): WorkflowInquiryRecord | null {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    contactName: record.contactName,
    title: record.title,
    description: record.description,
    email: record.email,
    phone: record.phone,
    nationality: record.nationality,
    currentStatus: record.currentStatus,
    requestedOutcome: record.requestedOutcome,
    targetAgency: record.targetAgency,
    generatedSummary: record.generatedSummary,
    classificationReason: record.classificationReason,
    recommendedNextStep: record.recommendedNextStep,
    bridgeWorkflowStatus: record.bridgeWorkflowStatus,
    bridgeReviewRequired: record.bridgeReviewRequired,
    bridgeMustVerify: record.bridgeMustVerify,
    bridgeMustVerifySources: record.bridgeMustVerifySources,
    bridgeRiskFlags: record.bridgeRiskFlags,
    bridgePractitionerGuide: record.bridgePractitionerGuide,
    bridgeCaseOutlook: record.bridgeCaseOutlook
  };
}

function toCaseRecord(
  record: Awaited<ReturnType<PrismaLike["caseRecord"]["findFirst"]>>
): WorkflowCaseRecord | null {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    inquiryId: record.inquiryId,
    caseNumber: record.caseNumber,
    bridgeWorkflowStatus: record.bridgeWorkflowStatus,
    bridgeReviewRequired: record.bridgeReviewRequired,
    bridgeMustVerify: record.bridgeMustVerify,
    bridgeMustVerifySources: record.bridgeMustVerifySources,
    bridgeRiskFlags: record.bridgeRiskFlags,
    bridgePractitionerGuide: record.bridgePractitionerGuide,
    bridgeCaseOutlook: record.bridgeCaseOutlook
  };
}

function workflowUpdateData(update: BridgeWorkflowPersistence) {
  return {
    bridgeWorkflowStatus: update.bridgeWorkflowStatus,
    bridgeReviewRequired: update.bridgeReviewRequired,
    bridgeMustVerify: update.bridgeMustVerify,
    bridgeMustVerifySources: update.bridgeMustVerifySources,
    bridgeRiskFlags: update.bridgeRiskFlags,
    bridgePractitionerGuide: update.bridgePractitionerGuide,
    bridgeCaseOutlook: update.bridgeCaseOutlook
  };
}

async function createCaseTasks(prismaClient: PrismaLike, tasks: CaseTaskInput[]) {
  for (const task of tasks) {
    await prismaClient.caseTask.create({
      data: {
        inquiryId: task.inquiryId,
        // Bridge-generated workflow tasks are inquiry-scoped.
        // CaseTask.caseId points to CaseMatter, not CaseRecord, so keep it empty.
        caseId: undefined,
        title: task.title,
        details: task.details,
        taskType: task.taskType,
        status: task.status,
        reviewRequired: task.reviewRequired,
        mustVerify: task.mustVerify,
        riskFlags: task.riskFlags,
        source: task.source
      }
    });
  }
}

async function createSourceVerificationTasks(
  prismaClient: PrismaLike,
  tasks: (SourceVerificationTaskInput & {
    documentDraftId?: string;
    messageDraftId?: string;
  })[]
) {
  for (const task of tasks) {
    await prismaClient.sourceVerificationTask.create({
      data: {
        inquiryId: task.inquiryId,
        caseId: task.caseId,
        documentDraftId: task.documentDraftId,
        messageDraftId: task.messageDraftId,
        title: task.title,
        authorityBucket: task.authorityBucket,
        sourceLabel: task.sourceLabel,
        sourceCitation: task.sourceCitation,
        notes: task.notes,
        status: task.status,
        reviewRequired: task.reviewRequired,
        mustVerify: task.mustVerify,
        riskFlags: task.riskFlags,
        source: task.source
      }
    });
  }
}

async function createDocumentRequestTasks(
  prismaClient: PrismaLike,
  tasks: DocumentRequestTaskInput[]
) {
  for (const task of tasks) {
    await prismaClient.documentRequestTask.create({
      data: {
        inquiryId: task.inquiryId,
        caseId: task.caseId,
        title: task.title,
        documentLabel: task.documentLabel,
        notes: task.notes,
        status: task.status,
        reviewRequired: task.reviewRequired,
        mustVerify: task.mustVerify,
        riskFlags: task.riskFlags,
        source: task.source
      }
    });
  }
}

export function createLawbotBridgeWorkflowPrismaPersistence(
  prismaClient: PrismaLike = prisma
): BridgeWorkflowPersistencePort {
  return {
    async getInquiryById(inquiryId) {
      const record = await prismaClient.inquiry.findUnique({
        where: { id: inquiryId }
      });
      return toInquiryRecord(record);
    },
    async getCaseByInquiryId(inquiryId) {
      const record = await prismaClient.caseRecord.findFirst({
        where: { inquiryId },
        orderBy: { createdAt: "desc" }
      });
      return toCaseRecord(record);
    },
    async updateInquiryWorkflow(inquiryId, update) {
      await prismaClient.inquiry.update({
        where: { id: inquiryId },
        data: workflowUpdateData(update)
      });
    },
    async createCaseForInquiry({ inquiry, workflow }) {
      const caseNumber = await generateCaseNumber();
      const record = await prismaClient.caseRecord.create({
        data: {
          inquiryId: inquiry.id,
          caseNumber,
          ...workflowUpdateData(workflow)
        }
      });
      return toCaseRecord(record)!;
    },
    async updateCaseWorkflow(caseId, update) {
      await prismaClient.caseRecord.update({
        where: { id: caseId },
        data: workflowUpdateData(update)
      });
    },
    async createCaseTasks(tasks) {
      await createCaseTasks(prismaClient, tasks);
    },
    async createSourceVerificationTasks(tasks) {
      await createSourceVerificationTasks(prismaClient, tasks);
    },
    async createDocumentRequestTasks(tasks) {
      await createDocumentRequestTasks(prismaClient, tasks);
    },
    async createDocumentDraft(draft) {
      const record = await prismaClient.documentDraft.create({
        data: {
          inquiryId: draft.inquiryId,
          caseId: draft.caseId,
          draftType: draft.draftType,
          title: draft.title,
          bodyJson: draft.bodyJson,
          status: draft.status,
          reviewRequired: draft.reviewRequired,
          mustVerify: draft.mustVerify,
          mustVerifySources: draft.mustVerifySources,
          riskFlags: draft.riskFlags,
          practitionerGuide: draft.practitionerGuide,
          caseOutlook: draft.caseOutlook,
          source: draft.source
        }
      });
      return { id: record.id };
    },
    async createMessageDraft(draft) {
      const record = await prismaClient.messageDraft.create({
        data: {
          inquiryId: draft.inquiryId,
          caseId: draft.caseId,
          messageKind: draft.messageKind,
          subject: draft.subject,
          bodyText: draft.bodyText,
          status: draft.status,
          reviewRequired: draft.reviewRequired,
          mustVerify: draft.mustVerify,
          mustVerifySources: draft.mustVerifySources,
          riskFlags: draft.riskFlags,
          practitionerGuide: draft.practitionerGuide,
          caseOutlook: draft.caseOutlook,
          source: draft.source
        }
      });
      return { id: record.id };
    },
    async getBridgeReviewQueueSnapshot(inquiryId) {
      const [documentDrafts, messageDrafts, approvalPendingDocumentDrafts, approvalPendingMessageDrafts] =
        await Promise.all([
          prismaClient.documentDraft.count({
            where: { inquiryId, source: "lawbot_bridge" }
          }),
          prismaClient.messageDraft.count({
            where: { inquiryId, source: "lawbot_bridge" }
          }),
          prismaClient.documentDraft.count({
            where: { inquiryId, source: "lawbot_bridge", status: "APPROVAL_PENDING" }
          }),
          prismaClient.messageDraft.count({
            where: { inquiryId, source: "lawbot_bridge", status: "APPROVAL_PENDING" }
          })
        ]);

      return {
        totalDrafts: documentDrafts + messageDrafts,
        approvalPendingDrafts:
          approvalPendingDocumentDrafts + approvalPendingMessageDrafts
      };
    }
  };
}
