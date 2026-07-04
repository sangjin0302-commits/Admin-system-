/**
 * 서면 초안 텍스트 → docx 바이너리 변환.
 *
 * docx npm 패키지 사용. 미설치 시 throw (API 라우트에서 잡아 대체 응답).
 */

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

export interface DocxExportInput {
  draftText: string;
  documentType: string;
  title?: string;
  metadata?: Record<string, string>;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  opinion: "의견서",
  appeal: "행정심판청구서",
  objection: "이의신청서",
  petition: "청원서"
};

/**
 * 텍스트 초안을 Word 문서 바이너리로 변환.
 * 빈 줄 = 문단 구분. 첫 줄은 제목으로 간주.
 */
export async function exportDraftToDocx(input: DocxExportInput): Promise<Buffer> {
  const label = DOCUMENT_TYPE_LABELS[input.documentType] ?? input.documentType;
  const title = input.title?.trim() || label;

  const rawLines = input.draftText.split(/\r?\n/);
  const paragraphs: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: title, bold: true, size: 32 })]
    }),
    new Paragraph({ children: [new TextRun({ text: "" })] })
  ];

  if (input.metadata) {
    for (const [key, value] of Object.entries(input.metadata)) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${key}: `, bold: true }),
            new TextRun({ text: value })
          ]
        })
      );
    }
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
  }

  for (const line of rawLines) {
    if (line.trim() === "") {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
      continue;
    }
    // 섹션 헤딩 감지 (# 로 시작하거나 [] 로 감싼 경우)
    const isHeading =
      /^#{1,3}\s+/.test(line) || /^\[.+\]$/.test(line.trim()) || /^제\s?\d+\s?조/.test(line);
    if (isHeading) {
      const clean = line.replace(/^#{1,3}\s+/, "").trim();
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: clean, bold: true, size: 26 })]
        })
      );
    } else {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: line })] }));
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }]
  });

  return await Packer.toBuffer(doc);
}
