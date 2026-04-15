import { prisma } from "@/lib/prisma/client";
import { PUBLIC_CONTENT_SETTINGS_ID } from "@/lib/public-content/defaults";

import { defaultOperationsSettings, type OperationsSettings } from "./defaults";

type PartialOperationsSettings = Partial<OperationsSettings>;

function mergeOperationsSettings(override?: PartialOperationsSettings): OperationsSettings {
  if (!override) return defaultOperationsSettings;

  return {
    consultationIntro:
      typeof override.consultationIntro === "string" && override.consultationIntro.trim()
        ? override.consultationIntro.trim()
        : defaultOperationsSettings.consultationIntro,
    priorityConsultationGuide:
      typeof override.priorityConsultationGuide === "string" && override.priorityConsultationGuide.trim()
        ? override.priorityConsultationGuide.trim()
        : defaultOperationsSettings.priorityConsultationGuide,
    paidDiagnosisGuide:
      typeof override.paidDiagnosisGuide === "string" && override.paidDiagnosisGuide.trim()
        ? override.paidDiagnosisGuide.trim()
        : defaultOperationsSettings.paidDiagnosisGuide,
    docsReviewGuide:
      typeof override.docsReviewGuide === "string" && override.docsReviewGuide.trim()
        ? override.docsReviewGuide.trim()
        : defaultOperationsSettings.docsReviewGuide,
    declineGuide:
      typeof override.declineGuide === "string" && override.declineGuide.trim()
        ? override.declineGuide.trim()
        : defaultOperationsSettings.declineGuide,
    consultationLinkLabel:
      typeof override.consultationLinkLabel === "string" && override.consultationLinkLabel.trim()
        ? override.consultationLinkLabel.trim()
        : defaultOperationsSettings.consultationLinkLabel,
    consultationLinkUrl:
      typeof override.consultationLinkUrl === "string" ? override.consultationLinkUrl.trim() : defaultOperationsSettings.consultationLinkUrl,
    contractGuide:
      typeof override.contractGuide === "string" && override.contractGuide.trim()
        ? override.contractGuide.trim()
        : defaultOperationsSettings.contractGuide,
    paymentGuide:
      typeof override.paymentGuide === "string" && override.paymentGuide.trim()
        ? override.paymentGuide.trim()
        : defaultOperationsSettings.paymentGuide,
    paymentMethodLabel:
      typeof override.paymentMethodLabel === "string" && override.paymentMethodLabel.trim()
        ? override.paymentMethodLabel.trim()
        : defaultOperationsSettings.paymentMethodLabel,
    paymentLinkUrl:
      typeof override.paymentLinkUrl === "string" ? override.paymentLinkUrl.trim() : defaultOperationsSettings.paymentLinkUrl,
    bankTransferGuide:
      typeof override.bankTransferGuide === "string" && override.bankTransferGuide.trim()
        ? override.bankTransferGuide.trim()
        : defaultOperationsSettings.bankTransferGuide,
    internalRoutingNote:
      typeof override.internalRoutingNote === "string" && override.internalRoutingNote.trim()
        ? override.internalRoutingNote.trim()
        : defaultOperationsSettings.internalRoutingNote
  };
}

function parseStoredSettings(rawJson: string | null | undefined): PartialOperationsSettings {
  if (!rawJson) return {};

  try {
    const parsed = JSON.parse(rawJson) as PartialOperationsSettings;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function getOperationsSettings(): Promise<OperationsSettings> {
  try {
    const settings = await prisma.publicContentSettings.findUnique({
      where: { id: PUBLIC_CONTENT_SETTINGS_ID }
    });

    return mergeOperationsSettings(parseStoredSettings(settings?.operationsSettingsJson));
  } catch {
    return defaultOperationsSettings;
  }
}

export async function saveOperationsSettings(settings: OperationsSettings) {
  return prisma.publicContentSettings.upsert({
    where: { id: PUBLIC_CONTENT_SETTINGS_ID },
    update: {
      operationsSettingsJson: JSON.stringify(settings)
    },
    create: {
      id: PUBLIC_CONTENT_SETTINGS_ID,
      operationsSettingsJson: JSON.stringify(settings)
    }
  });
}
