export type IntakeCategoryDetailRow = {
  label: string;
  value: string;
};

export type IntakeCategoryDetailSummary = {
  categoryLabel: string | null;
  subtypeLabel: string | null;
  consultationMethod: string | null;
  preferredLanguage: string | null;
  documentAvailability: string | null;
  detailRows: IntakeCategoryDetailRow[];
  cleanedDescription: string;
};

const CATEGORY_MARKER = "[업무 분야]";
const DETAIL_MARKER = "[분야별 세부사항]";
const RESERVED_LABELS = new Set([
  "민원 세부 유형",
  "희망 상담 방식",
  "희망 언어",
  "관련 서류 보유 여부"
]);

function cleanText(value: string | null | undefined) {
  const cleaned = (value ?? "").replace(/\u0000/g, "").replace(/\uFFFD/g, "").trim();
  if (!cleaned || cleaned === "undefined" || cleaned === "null") return null;
  return cleaned;
}

function parseDetailLine(line: string): IntakeCategoryDetailRow | null {
  const normalized = line.trim().replace(/^- /, "");
  const separatorIndex = normalized.indexOf(":");
  if (separatorIndex < 1) return null;

  const label = cleanText(normalized.slice(0, separatorIndex));
  const value = cleanText(normalized.slice(separatorIndex + 1));
  if (!label || !value) return null;

  return { label, value };
}

function splitCategoryBlock(description: string) {
  const categoryIndex = description.indexOf(CATEGORY_MARKER);
  if (categoryIndex < 0) {
    return {
      body: description,
      block: ""
    };
  }

  return {
    body: description.slice(0, categoryIndex).trim(),
    block: description.slice(categoryIndex).trim()
  };
}

export function buildIntakeCategoryDetailSummary(description: string): IntakeCategoryDetailSummary {
  const { body, block } = splitCategoryBlock(description);
  const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const categoryMarkerIndex = lines.findIndex((line) => line === CATEGORY_MARKER);
  const detailMarkerIndex = lines.findIndex((line) => line === DETAIL_MARKER);
  const categoryLabel =
    categoryMarkerIndex >= 0 ? cleanText(lines[categoryMarkerIndex + 1]) : null;
  const detailLines =
    detailMarkerIndex >= 0 ? lines.slice(detailMarkerIndex + 1) : [];
  const rows = detailLines.map(parseDetailLine).filter((row): row is IntakeCategoryDetailRow => Boolean(row));

  const subtypeLabel = rows.find((row) => row.label === "민원 세부 유형")?.value ?? null;
  const consultationMethod = rows.find((row) => row.label === "희망 상담 방식")?.value ?? null;
  const preferredLanguage = rows.find((row) => row.label === "희망 언어")?.value ?? null;
  const documentAvailability = rows.find((row) => row.label === "관련 서류 보유 여부")?.value ?? null;

  return {
    categoryLabel,
    subtypeLabel,
    consultationMethod,
    preferredLanguage,
    documentAvailability,
    detailRows: rows.filter((row) => !RESERVED_LABELS.has(row.label)),
    cleanedDescription: body || description.trim()
  };
}
