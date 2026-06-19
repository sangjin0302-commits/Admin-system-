import { dedupeStrings, inferAuthorityBucket, slug } from "./_internal";
import type {
  LegalAxisClue,
  SourceVerificationChecklistItem,
  SourceVerificationChecklistViewModel,
  SourceVerificationDescriptor,
  SupplementalReferenceCandidate
} from "./types";

export function buildSourceVerificationDescriptors(input: {
  mustVerifySources: string[];
  legalAxisClues: LegalAxisClue[];
  riskFlags: string[];
  matchedSubtypeKeys: string[];
  supplementalReferenceCandidates: SupplementalReferenceCandidate[];
}) {
  const descriptors: SourceVerificationDescriptor[] = [];

  for (const sourceLabel of input.mustVerifySources) {
    const relatedClues = input.legalAxisClues.filter(
      (entry) =>
        entry.sourceHint?.toLowerCase().includes(sourceLabel.toLowerCase()) ||
        entry.label.toLowerCase().includes(sourceLabel.toLowerCase())
    );
    const clueLabels = relatedClues.slice(0, 3).map((entry) => entry.label);
    const articleTitles = relatedClues
      .map((entry) => entry.articleTitle)
      .filter((entry): entry is string => Boolean(entry))
      .slice(0, 2);
    const phraseRationales = relatedClues
      .map((entry) => entry.phraseLevelRationale)
      .filter((entry): entry is string => Boolean(entry))
      .slice(0, 2);
    const notes = [
      clueLabels.length > 0 ? `Related axis clues: ${clueLabels.join(", ")}` : null,
      articleTitles.length > 0 ? `Article hints: ${articleTitles.join(", ")}` : null,
      phraseRationales.length > 0 ? `Phrase rationale: ${phraseRationales.join(" | ")}` : null,
      input.riskFlags.length > 0 ? `Risk flags: ${input.riskFlags.slice(0, 3).join(", ")}` : null,
      input.matchedSubtypeKeys.length > 0
        ? `Subtype route: ${input.matchedSubtypeKeys.slice(0, 2).join(", ")}`
        : null
    ]
      .filter(Boolean)
      .join(" / ");

    descriptors.push({
      sourceLabel,
      authorityBucket: inferAuthorityBucket(sourceLabel),
      sourceCitation: relatedClues.find((entry) => entry.sourceHint)?.sourceHint ?? null,
      notes: notes || null,
      articleTitle: relatedClues.find((entry) => entry.articleTitle)?.articleTitle ?? null,
      snippet: relatedClues.find((entry) => entry.snippet)?.snippet ?? null,
      matchedAxisTags: dedupeStrings(
        relatedClues.flatMap((entry) => entry.matchedAxisTags).slice(0, 8)
      ),
      phraseLevelRationale:
        relatedClues.find((entry) => entry.phraseLevelRationale)?.phraseLevelRationale ?? null,
      sourceType: null,
      mustVerifyOriginal: null,
      trustLevel: null,
      usageLocations: [],
      referenceLevel: null
    });
  }

  const additionalFromClue = input.legalAxisClues
    .filter((entry) => entry.sourceHint && !input.mustVerifySources.includes(entry.sourceHint))
    .slice(0, 10)
    .map((entry) => ({
      sourceLabel: entry.sourceHint!,
      authorityBucket: inferAuthorityBucket(entry.sourceHint!),
      sourceCitation: entry.sourceHint,
      articleTitle: entry.articleTitle,
      snippet: entry.snippet,
      matchedAxisTags: entry.matchedAxisTags,
      phraseLevelRationale: entry.phraseLevelRationale,
      notes: [
        entry.reason ?? `Derived from legal axis clue: ${entry.label}`,
        entry.articleTitle ? `Article hints: ${entry.articleTitle}` : null,
        entry.phraseLevelRationale ? `Phrase rationale: ${entry.phraseLevelRationale}` : null,
        input.matchedSubtypeKeys.length > 0
          ? `Subtype route: ${input.matchedSubtypeKeys.slice(0, 2).join(", ")}`
          : null
      ]
        .filter(Boolean)
        .join(" / "),
      sourceType: null,
      mustVerifyOriginal: null,
      trustLevel: null,
      usageLocations: [],
      referenceLevel: null
    }));
  const supplementalDescriptors = input.supplementalReferenceCandidates.map((entry) => ({
    sourceLabel: entry.title,
    authorityBucket: "INTERNAL_ARCHIVE_REFERENCE",
    sourceCitation: null,
    notes: [
      `Internal archive (${entry.sourceType})`,
      `trust=${entry.trustLevel}`,
      `reference=${entry.referenceLevel}`,
      entry.usageLocations.length > 0 ? `usage=${entry.usageLocations.join(", ")}` : null,
      entry.mustVerifyOriginal ? "must verify original" : null
    ]
      .filter(Boolean)
      .join(" / "),
    articleTitle: null,
    snippet: null,
    matchedAxisTags: [],
    phraseLevelRationale: null,
    sourceType: entry.sourceType,
    mustVerifyOriginal: entry.mustVerifyOriginal,
    trustLevel: entry.trustLevel,
    usageLocations: entry.usageLocations,
    referenceLevel: entry.referenceLevel
  }));

  return [...descriptors, ...additionalFromClue, ...supplementalDescriptors];
}

export function buildSourceVerificationChecklist(input: {
  sourceVerificationDescriptors: SourceVerificationDescriptor[];
}): SourceVerificationChecklistViewModel {
  const items: SourceVerificationChecklistItem[] = input.sourceVerificationDescriptors.map(
    (entry) => ({
      id: `source:${slug(entry.sourceLabel)}`,
      sourceLabel: entry.sourceLabel,
      authorityBucket: entry.authorityBucket,
      sourceCitation: entry.sourceCitation,
      notes: entry.notes,
      articleTitle: entry.articleTitle,
      snippet: entry.snippet,
      matchedAxisTags: entry.matchedAxisTags,
      phraseLevelRationale: entry.phraseLevelRationale,
      sourceType: entry.sourceType,
      mustVerifyOriginal: entry.mustVerifyOriginal,
      trustLevel: entry.trustLevel,
      usageLocations: entry.usageLocations,
      referenceLevel: entry.referenceLevel,
      required: true,
      reviewRequired: true
    })
  );

  return {
    headline: "Verify all required sources before approval.",
    items,
    totalRequired: items.length
  };
}
