import { prisma } from "@/lib/prisma/client";
import { getInquiryClassifier } from "@/lib/classification";
import {
  generateInquirySummary,
  generatePreparationGuidance,
  generateReceiptMessage
} from "@/lib/generation/templates";
import { parseCreateInquiryInput } from "@/lib/validation/inquiry-safe";
import { integrationRegistry } from "@/services/integrations";
import type { InquiryStatus } from "@/types/inquiry";

export async function createInquiry(payload: unknown) {
  const input = parseCreateInquiryInput(payload);
  const classifier = getInquiryClassifier();

  const classification = classifier.classify({
    clientType: input.clientType,
    contactName: input.contactName,
    email: input.email,
    organizationName: input.organizationName,
    title: input.title,
    description: input.description,
    nationality: input.nationality,
    currentStatus: input.currentStatus,
    documentCountry: input.documentCountry,
    targetAgency: input.targetAgency,
    dueDate: input.dueDate,
    preferredLanguage: input.preferredLanguage
  });

  const generatedSummary = generateInquirySummary({
    inquiryType: classification.inquiryType,
    preferredLanguage: input.preferredLanguage,
    title: input.title,
    description: input.description,
    urgencyLevel: classification.urgencyLevel,
    qualificationScore: classification.qualificationScore
  });

  const created = await prisma.inquiry.create({
    data: {
      contactName: input.contactName,
      organizationName: input.organizationName,
      email: input.email,
      phone: input.phone,
      preferredLanguage: input.preferredLanguage,
      clientType: input.clientType,
      title: input.title,
      description: input.description,
      nationality: input.nationality,
      currentStatus: input.currentStatus,
      documentCountry: input.documentCountry,
      targetAgency: input.targetAgency,
      dueDate: input.dueDate,
      wantsCallback: input.wantsCallback,
      consentToPrivacy: input.consentToPrivacy,
      inquiryType: classification.inquiryType,
      urgencyLevel: classification.urgencyLevel,
      classificationConfidence: classification.confidence,
      qualificationScore: classification.qualificationScore,
      classificationReason: classification.classificationReason,
      recommendedNextStep: classification.recommendedNextStep,
      serviceTags: JSON.stringify(classification.serviceTags),
      generatedSummary,
      generatedGuidance: "",
      generatedReceiptMessage: ""
    }
  });

  const guidance = generatePreparationGuidance({
    inquiryType: classification.inquiryType,
    locale: input.preferredLocale,
    urgencyLevel: classification.urgencyLevel,
    dueDate: input.dueDate
  });

  const receiptMessage = generateReceiptMessage({
    inquiryId: created.id,
    inquiryType: classification.inquiryType,
    urgencyLevel: classification.urgencyLevel,
    preferredLanguage: input.preferredLanguage,
    contactName: input.contactName
  });

  const updated = await prisma.inquiry.update({
    where: { id: created.id },
    data: {
      generatedGuidance: guidance,
      generatedReceiptMessage: receiptMessage
    }
  });

  await Promise.allSettled(
    integrationRegistry.map((integration) =>
      integration.afterInquiryCreated({
        inquiryId: updated.id,
        summary: updated.generatedSummary,
        inquiryType: updated.inquiryType,
        urgencyLevel: updated.urgencyLevel
      })
    )
  );

  return updated;
}

export async function listInquiries(status?: InquiryStatus) {
  return prisma.inquiry.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ createdAt: "desc" }]
  });
}

export async function getInquiryById(id: string) {
  return prisma.inquiry.findUnique({
    where: { id }
  });
}

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  return prisma.inquiry.update({
    where: { id },
    data: { status }
  });
}
