import {
  getRequiredDocumentTemplatesForMatterType,
  isImmigrationMatterType
} from "@/lib/immigration";

export type RequiredDocumentStarterTemplate = {
  name: string;
  description?: string | null;
  required: boolean;
};

export type RequiredDocumentStarterExistingItem = {
  name: string;
  status?: string | null;
};

function normalizeDocumentName(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

function normalizeDocumentNameKey(value: string) {
  return normalizeDocumentName(value).toLocaleLowerCase("en-US");
}

function toStarterTemplate(template: {
  id: string;
  labelKo: string;
  descriptionKo: string;
  required: boolean;
}): RequiredDocumentStarterTemplate {
  const name = normalizeDocumentName(template.labelKo || template.id);
  return {
    name,
    description: template.descriptionKo.trim() || null,
    required: template.required
  };
}

export function getRequiredDocumentChecklistStarterTemplates(matterType: string): RequiredDocumentStarterTemplate[] {
  const trimmedMatterType = matterType.trim();
  if (isImmigrationMatterType(trimmedMatterType)) {
    return getRequiredDocumentTemplatesForMatterType(trimmedMatterType).map(toStarterTemplate);
  }

  const normalized = trimmedMatterType.toLocaleLowerCase("en-US");
  if (normalized.includes("immigration")) {
    return [
      { name: "Applicant identity document", required: true },
      { name: "Current stay status evidence", required: true },
      { name: "Application supporting statement", required: true }
    ];
  }

  if (normalized.includes("nonprofit")) {
    return [
      { name: "Founding resolution", required: true },
      { name: "Bylaws draft", required: true },
      { name: "Officer roster", required: true }
    ];
  }

  return [
    { name: "Applicant identity document", required: true },
    { name: "Core application form draft", required: true },
    { name: "Supporting evidence packet", required: true }
  ];
}

export function buildRequiredDocumentChecklistStarterPlan(
  matterType: string,
  existingDocuments: readonly RequiredDocumentStarterExistingItem[]
) {
  const templates = getRequiredDocumentChecklistStarterTemplates(matterType);
  const existingNameKeys = new Set(
    existingDocuments
      .filter((item) => item.status !== "NOT_APPLICABLE")
      .map((item) => normalizeDocumentNameKey(item.name))
  );
  const toCreate = templates.filter((item) => !existingNameKeys.has(normalizeDocumentNameKey(item.name)));

  return {
    templates,
    toCreate,
    createdCount: toCreate.length,
    skippedCount: templates.length - toCreate.length
  };
}
