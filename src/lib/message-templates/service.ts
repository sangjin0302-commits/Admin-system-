import {
  commonRecommendedDocuments,
  inquiryTypeCautions,
  inquiryTypeDocuments,
  localeTemplates
} from "@/lib/message-templates/catalog";
import type { BuildMessageInput, ClientMessagePreview } from "@/lib/message-templates/types";
import {
  inquiryTypeLabels,
  toLocale,
  type Locale
} from "@/types/inquiry";

function buildPreviewForLocale(input: BuildMessageInput, locale: Locale): ClientMessagePreview {
  const template = localeTemplates[locale];
  const typeLabel = inquiryTypeLabels[input.inquiryType][locale];
  const recommendedDocuments =
    input.recommendedDocumentsOverride && input.recommendedDocumentsOverride.length > 0
      ? input.recommendedDocumentsOverride
      : [
          ...commonRecommendedDocuments[locale],
          ...inquiryTypeDocuments[input.inquiryType][locale]
        ];
  const caution = inquiryTypeCautions[input.inquiryType][locale];

  const sections = [
    {
      heading: template.sections.thanks,
      body: template.lines.thanks(input.contactName, input.inquiryId)
    },
    {
      heading: template.sections.classification,
      body: template.lines.classification(typeLabel)
    },
    {
      heading: template.sections.documents,
      body: recommendedDocuments.map((document, index) => `${index + 1}. ${document}`).join("\n")
    },
    {
      heading: template.sections.nextStep,
      body: template.lines.nextStep(input.recommendedNextStep)
    },
    {
      heading: template.sections.caution,
      body: template.lines.caution(caution)
    }
  ];

  return {
    locale,
    subject: template.subject(typeLabel),
    recommendedDocuments,
    caution,
    nextStep: input.recommendedNextStep,
    sections,
    fullText: sections.map((section) => `${section.heading}\n${section.body}`).join("\n\n")
  };
}

export function buildMessagePreview(input: BuildMessageInput) {
  return buildPreviewForLocale(input, toLocale(input.preferredLanguage));
}

export function buildMessagePreviewSet(input: BuildMessageInput) {
  return {
    ko: buildPreviewForLocale(input, "ko"),
    en: buildPreviewForLocale(input, "en")
  };
}

export function generatePreparationGuidance(input: BuildMessageInput) {
  return buildMessagePreview(input).sections[2]?.body ?? "";
}

export function generateReceiptMessage(input: BuildMessageInput) {
  const preview = buildMessagePreview(input);
  return [preview.sections[0]?.body, preview.sections[1]?.body, preview.sections[3]?.body]
    .filter(Boolean)
    .join(" ");
}
