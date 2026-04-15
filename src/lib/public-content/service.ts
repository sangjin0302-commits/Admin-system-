import { prisma } from "@/lib/prisma/client";

import {
  defaultPublicIntakeContent,
  PUBLIC_CONTENT_SETTINGS_ID,
  type EditableIntakeContent,
  type PublicIntakeContent
} from "./defaults";

type PartialEditableIntakeContent = Partial<EditableIntakeContent>;
type StoredPublicIntakeContent = Partial<Record<keyof PublicIntakeContent, PartialEditableIntakeContent>>;

function sanitizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const next = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
  return next.length > 0 ? next : fallback;
}

function mergeLocaleContent(
  base: EditableIntakeContent,
  override?: PartialEditableIntakeContent
): EditableIntakeContent {
  if (!override) return base;

  return {
    heroTitle:
      typeof override.heroTitle === "string" && override.heroTitle.trim()
        ? override.heroTitle.trim()
        : base.heroTitle,
    heroDescription:
      typeof override.heroDescription === "string" && override.heroDescription.trim()
        ? override.heroDescription.trim()
        : base.heroDescription,
    primaryAreas: sanitizeStringArray(override.primaryAreas, base.primaryAreas),
    additionalGuidance: sanitizeStringArray(override.additionalGuidance, base.additionalGuidance),
    intakePageTitle:
      typeof override.intakePageTitle === "string" && override.intakePageTitle.trim()
        ? override.intakePageTitle.trim()
        : base.intakePageTitle,
    intakePageDescription:
      typeof override.intakePageDescription === "string" && override.intakePageDescription.trim()
        ? override.intakePageDescription.trim()
        : base.intakePageDescription,
    intakeInfoTitle:
      typeof override.intakeInfoTitle === "string" && override.intakeInfoTitle.trim()
        ? override.intakeInfoTitle.trim()
        : base.intakeInfoTitle,
    intakeInfoItems: sanitizeStringArray(override.intakeInfoItems, base.intakeInfoItems)
  };
}

function parseStoredContent(rawJson: string | null | undefined): StoredPublicIntakeContent {
  if (!rawJson) return {};

  try {
    const parsed = JSON.parse(rawJson) as StoredPublicIntakeContent;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function getPublicIntakeContent(): Promise<PublicIntakeContent> {
  try {
    const settings = await prisma.publicContentSettings.findUnique({
      where: { id: PUBLIC_CONTENT_SETTINGS_ID }
    });

    const stored = parseStoredContent(settings?.intakeContentJson);

    return {
      ko: mergeLocaleContent(defaultPublicIntakeContent.ko, stored.ko),
      en: mergeLocaleContent(defaultPublicIntakeContent.en, stored.en)
    };
  } catch {
    return defaultPublicIntakeContent;
  }
}

export async function savePublicIntakeContent(content: PublicIntakeContent) {
  return prisma.publicContentSettings.upsert({
    where: { id: PUBLIC_CONTENT_SETTINGS_ID },
    update: {
      intakeContentJson: JSON.stringify(content)
    },
    create: {
      id: PUBLIC_CONTENT_SETTINGS_ID,
      intakeContentJson: JSON.stringify(content)
    }
  });
}
